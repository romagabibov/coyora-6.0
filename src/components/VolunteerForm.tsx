import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { addDoc, collection, serverTimestamp, doc, setDoc, getDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, auth, storage } from '../firebase';
import { Toast } from './Toast';
import { FormField, useSiteStore } from '../store';
import { useNavigate } from 'react-router-dom';
import { generateApplicationKeywords } from '../utils/search';

const SmartTranslatedText = ({ text, lang, isRequired }: { text: string, lang: string, isRequired?: boolean }) => {
   const [tText, setTText] = useState(text);
   
   useEffect(() => {
     if (!text) return;
     const targetLang = lang === 'en' ? 'english' : (lang === 'ru' ? 'russian' : (lang === 'az' ? 'azerbaijani' : 'english'));
     
     const cacheKey = `trans_${targetLang}_${text}`;
     const cached = sessionStorage.getItem(cacheKey);
     if (cached) {
       setTText(cached);
       return;
     }

     fetch('/api/translate', {
       method: 'POST',
       headers: { 'Content-Type': 'application/json' },
       body: JSON.stringify({ text, targetLang })
     })
     .then(r => r.json())
     .then(d => {
        if (d.translation) {
           setTText(d.translation);
           sessionStorage.setItem(cacheKey, d.translation);
        }
     })
     .catch(e => console.error(e));
   }, [text, lang]);

   return (
     <>
        {tText} {isRequired ? <span className="text-[#fe0000]">*</span> : <span className="text-[var(--color-muted)] text-[10px] ml-2 font-normal uppercase tracking-widest leading-none align-middle">(Optional)</span>}
     </>
   );
};

const compressImage = async (file: File): Promise<File> => {
  if (!file.type.startsWith('image/')) return file;
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;
      const MAX = 1600;
      if (width > height && width > MAX) {
        height *= MAX / width;
        width = MAX;
      } else if (height > MAX) {
        width *= MAX / height;
        height = MAX;
      }
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return resolve(file);
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob((blob) => {
        if (!blob) return resolve(file);
        resolve(new File([blob], file.name, { type: 'image/jpeg' }));
      }, 'image/jpeg', 0.82);
    };
    img.onerror = () => resolve(file);
    img.src = url;
  });
};

interface VolunteerFormProps {
  eventId: string;
  eventName: string;
  type: string;
  fields?: FormField[];
  onSuccess: () => void;
  lang: string;
  translate: (key: string | undefined) => string;
}

export function VolunteerForm({ eventId, eventName, type, fields, onSuccess, lang, translate }: VolunteerFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [isToastVisible, setIsToastVisible] = useState(false);
  const [toastIsError, setToastIsError] = useState(false);
  const [cabinetProfile, setCabinetProfile] = useState<any>(null);
  const [user, setUser] = useState(auth.currentUser);
  const navigate = useNavigate();
  const { contact } = useSiteStore();

  const [currentStep, setCurrentStep] = useState(0);
  const [formDataState, setFormDataState] = useState<Record<string, any>>({});
  const [validationError, setValidationError] = useState('');
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});

  useEffect(() => {
    const unsub = auth.onAuthStateChanged(async (u) => {
      setUser(u);
      if (u) {
        const snap = await getDoc(doc(db, 'users', u.uid));
        if (snap.exists()) {
          setCabinetProfile(snap.data());
        } else {
          setCabinetProfile(null);
        }
      } else {
        setCabinetProfile(null);
      }
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (fields) {
      const getAutoFillValue = (label: string) => {
        const L = label.toLowerCase();
        
        if (cabinetProfile) {
          if (/фио|fio|full name|fullname|tam ad|имя.*фамилия|name.*surname|ad.*soyad/i.test(L)) return `${cabinetProfile.name || ''} ${cabinetProfile.surname || ''}`.trim() || '';
          if (/имя|name|аты|ad|adınız/i.test(L)) return cabinetProfile.name || '';
          if (/фамилия|surname|тегі|soyad/i.test(L)) return cabinetProfile.surname || '';
          if (/рождени|birth|туған|doğum/i.test(L)) return cabinetProfile.dateOfBirth || cabinetProfile.yearOfBirth || '';
          if (/возраст|age|жас|yaş/i.test(L)) return cabinetProfile.age || '';
          if (/телефон|phone|номер|telefon|nömrə|tel|mobile/i.test(L)) return cabinetProfile.phone || '';
          if (/университет|university|uni|вуз|məktəb|school|universitet|iş|work|company/i.test(L)) return cabinetProfile.university || '';
          if (/сфера|field|направление|sahə|activity|xüsusiyyət/i.test(L)) return cabinetProfile.fieldOfActivity || '';
          if (/опыт|experience|past|təcrübə|events|history/i.test(L)) return cabinetProfile.pastEvents || '';
          if (/язык|language|dil/i.test(L)) return cabinetProfile.languages || '';
        }
        
        if (/почта|email|e-mail|poçt/i.test(L)) return cabinetProfile?.email || user?.email || auth.currentUser?.email || '';
        
        return '';
      };

      setFormDataState(prev => {
        const initialState: Record<string, any> = { ...prev };
        let changed = false;
        
        fields.forEach(f => {
          if (initialState[f.id] === undefined || initialState[f.id] === '') {
            const autofill = getAutoFillValue(f.label);
            if (autofill) {
              initialState[f.id] = autofill;
              changed = true;
            }
          }
        });
        
        return changed ? initialState : prev;
      });
    }
  }, [cabinetProfile, fields, user]);

  const showToast = (msg: string, isError: boolean = false) => {
    setToastMessage(msg);
    setToastIsError(isError);
    setIsToastVisible(true);
  };

  const steps: any[] = [];
  
  if (user && fields) {
    fields.forEach(f => {
      steps.push({
        id: f.id,
        label: f.label,
        required: f.required,
        field: f
      });
    });
  }

  const handleNext = async () => {
    if (validationError === translate('Uploading to Cloud... Please wait')) {
      showToast(translate('Please wait for the file to finish uploading.'));
      return;
    }
    
    setValidationError('');
    
    // Validation
    const currentStepData = steps[currentStep];
    if (currentStepData.field && currentStepData.required) {
      const val = formDataState[currentStepData.id];
      if (!val || (Array.isArray(val) && val.length === 0)) {
        setValidationError(translate('This field is required.'));
        return;
      }
      if (typeof val === 'string' && val.startsWith('uploading_')) {
        setValidationError(translate('Please wait for file to finish uploading.'));
        return;
      }
    }

    if (currentStep < steps.length - 1) {
      setCurrentStep(curr => curr + 1);
    } else {
      // Submit
      setIsSubmitting(true);
      
      let finalFormData: any = {};
      
      steps.forEach(s => {
        if (s.field.type !== 'file') {
          finalFormData[s.label] = formDataState[s.id] !== undefined ? formDataState[s.id] : '';
        }
      });

      try {
        for (const s of steps) {
          if (s.field.type === 'file') {
            const val = formDataState[s.id];
            if (typeof val === 'string' && val.startsWith('http')) {
               finalFormData[s.label] = val;
            } else {
               finalFormData[s.label] = '';
            }
          }
        }

        const docId = `${eventId}_${user!.uid}`;
        const docRef = doc(db, 'volunteerApplications', docId);

        const getMappedKey = (val: string) => {
           for (const [label, value] of Object.entries(finalFormData)) {
             const L = label.toLowerCase();
             if (L.includes(val)) return value;
           }
           return undefined;
        };

        const name = getMappedKey('имя') || getMappedKey('name') || getMappedKey('аты');
        const surname = getMappedKey('фамилия') || getMappedKey('surname') || getMappedKey('тегі');
        const dateOfBirth = getMappedKey('рождени') || getMappedKey('birth') || getMappedKey('туған');
        const age = getMappedKey('возраст') || getMappedKey('age') || getMappedKey('жас');
        const email = getMappedKey('почта') || getMappedKey('email') || getMappedKey('e-mail');
        const phone = getMappedKey('телефон') || getMappedKey('phone') || getMappedKey('номер');
        const university = getMappedKey('университет') || getMappedKey('university') || getMappedKey('вуз');
        const fieldOfActivity = getMappedKey('сфера') || getMappedKey('field') || getMappedKey('направление');
        const pastEvents = getMappedKey('опыт') || getMappedKey('experience') || getMappedKey('past');
        const languages = getMappedKey('язык') || getMappedKey('language') || getMappedKey('dil');

        const candidateData = {
          eventId,
          eventName,
          type,
          userId: user!.uid,
          formData: finalFormData,
          name: name || '',
          surname: surname || '',
          profileName: cabinetProfile?.name || '',
          profileSurname: cabinetProfile?.surname || '',
          email: email || user!.email || '',
          status: 'applied',
          searchKeywords: generateApplicationKeywords({
            name: name || '',
            surname: surname || '',
            email: email || user!.email || '',
            formData: finalFormData
          }),
          timestamp: serverTimestamp()
        };

        const updates: any = {};
        if (name !== undefined) updates.name = name;
        if (surname !== undefined) updates.surname = surname;
        if (dateOfBirth !== undefined) updates.dateOfBirth = dateOfBirth;
        if (age !== undefined) updates.age = age;
        if (email !== undefined) updates.email = email;
        if (phone !== undefined) updates.phone = phone;
        if (university !== undefined) updates.university = university;
        if (fieldOfActivity !== undefined) updates.fieldOfActivity = fieldOfActivity;
        if (pastEvents !== undefined) updates.pastEvents = pastEvents;
        if (languages !== undefined) updates.languages = languages;

        if (Object.keys(updates).length > 0) {
           await setDoc(doc(db, 'users', user!.uid), updates, { merge: true });
        }

        await setDoc(docRef, candidateData);
        showToast(translate("Application submitted successfully!"));
        setTimeout(() => {
          onSuccess();
        }, 2000);
      } catch (error: any) {
        console.error("Submission error:", error);
        const errMsg = error?.message || String(error);
        if (errMsg.includes('Missing or insufficient permissions')) {
          showToast(translate("You have already applied or missing permissions."), true);
        } else {
          showToast(translate("Failed to submit: ") + errMsg, true);
        }
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const renderStepContent = (step: any, index: number) => {
    if (step.id === 'verify_cabinet') {
      return (
        <motion.div 
          key={step.id}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
        >
          <h2 className="text-2xl md:text-3xl font-head uppercase mb-8 leading-tight">
            {step.label}
          </h2>
          {step.content}
        </motion.div>
      );
    }

    const f = step.field;

    return (
      <motion.div 
        key={step.id}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        transition={{ duration: 0.3 }}
      >
        <h2 className="text-2xl md:text-3xl font-head uppercase mb-8 leading-tight">
          <SmartTranslatedText text={f.label.replace(/^\d+\.\s*/, '')} lang={lang} isRequired={f.required} />
        </h2>
        
        <div className="mt-8">
           {f.type === 'textarea' ? (
              <textarea
                value={formDataState[f.id] || ''}
                onChange={e => {
                  setFormDataState({...formDataState, [f.id]: e.target.value});
                  setValidationError('');
                }}
                className={`w-full bg-transparent border p-4 font-mono text-sm outline-none transition-colors resize-none rounded-lg ${validationError ? 'border-[#fe0000]' : 'border-[var(--color-border)] focus:border-[#fe0000]'}`}
                rows={5}
                placeholder={translate('Type your answer...')}
              />
           ) : f.type === 'dropdown' ? (
              <div className="relative">
                <select
                  value={formDataState[f.id] || ''}
                  onChange={e => {
                    setFormDataState({...formDataState, [f.id]: e.target.value});
                    setValidationError('');
                  }}
                  className={`w-full bg-transparent border p-4 font-mono text-sm outline-none transition-colors rounded-lg appearance-none ${validationError ? 'border-[#fe0000]' : 'border-[var(--color-border)] focus:border-[#fe0000]'}`}
                >
                  <option value="" disabled className="bg-[var(--color-bg)]">{translate('Select an option')}</option>
                  {f.options?.map((opt: string) => (
                    <option key={opt} value={opt} className="bg-[var(--color-bg)]">{opt}</option>
                  ))}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--color-muted)]">
                  ▼
                </div>
              </div>
           ) : f.type === 'checkboxes' ? (
              <div className="flex flex-col gap-4">
                {f.options?.map((opt: string) => {
                  const currentArr = formDataState[f.id] || [];
                  const isChecked = currentArr.includes(opt);
                  return (
                    <label key={opt} className={`flex items-center gap-4 cursor-pointer p-4 border rounded-lg transition-colors ${isChecked ? 'border-[#fe0000] bg-[#fe0000]/10' : 'border-[var(--color-border)] hover:border-[#fe0000]/50'} ${validationError && !isChecked ? 'border-[#fe0000]/50' : ''}`}>
                      <input 
                        type="checkbox" 
                        checked={isChecked}
                        onChange={(e) => {
                          setValidationError('');
                          if (e.target.checked) {
                            setFormDataState({...formDataState, [f.id]: [...currentArr, opt]});
                          } else {
                            setFormDataState({...formDataState, [f.id]: currentArr.filter((o: string) => o !== opt)});
                          }
                        }}
                        className="w-5 h-5 accent-[#fe0000] bg-transparent border-[var(--color-border)]" 
                      />
                      <span className="font-mono text-sm">{opt}</span>
                    </label>
                  );
                })}
              </div>
           ) : f.type === 'file' ? (
              <div className="flex flex-col gap-2">
                <input 
                  type="file"
                  accept="image/*,.pdf,.doc,.docx"
                  onChange={async (e) => {
                    const rawFile = e.target.files?.[0];
               if (rawFile) {
                 const file = await compressImage(rawFile);
                 setValidationError(''); // Clear any previous error
                 const tempVal = `uploading_${Date.now()}`;
                 setFormDataState(prev => ({...prev, [f.id]: tempVal})); // Set temporary value to pass required check
                 setUploadProgress(prev => ({...prev, [f.id]: 0}));
                 
                 try {
                    const uploadedUrl = await new Promise<string>(async (resolve, reject) => {
                      try {
                        const sigRes = await fetch('/api/sign-cloudinary', { method: 'POST' });
                        if (!sigRes.ok) {
                           throw new Error('Failed to get upload signature');
                        }
                        const { timestamp, signature, cloudName, apiKey } = await sigRes.json();
                        
                        const formData = new FormData();
                        formData.append('file', file);
                        formData.append('api_key', apiKey);
                        formData.append('timestamp', timestamp.toString());
                        formData.append('signature', signature);
                        // Optional: you can add 'folder' if you updated the signature server.ts

                        const xhr = new XMLHttpRequest();
                        xhr.open('POST', `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`);
                        
                        xhr.upload.onprogress = (e) => {
                          if (e.lengthComputable) {
                            const p = Math.round((e.loaded / e.total) * 100);
                            setUploadProgress(prev => ({...prev, [f.id]: p}));
                          }
                        };

                        xhr.onload = () => {
                          if (xhr.status === 200) {
                            const res = JSON.parse(xhr.responseText);
                            setUploadProgress(prev => ({...prev, [f.id]: 100}));
                            resolve(res.secure_url);
                          } else {
                            reject(new Error(xhr.responseText));
                          }
                        };
                        
                        xhr.onerror = () => reject(new Error('Network error during upload'));
                        xhr.send(formData);
                      } catch (e) {
                        reject(e);
                      }
                    });
                     
                     setFormDataState(prev => ({...prev, [f.id]: uploadedUrl}));
                     setTimeout(() => {
                         setUploadProgress(prev => {
                             const newP = {...prev};
                             delete newP[f.id];
                             return newP;
                         });
                     }, 1000);
                     setValidationError('');
                   } catch (err) {
                     setFormDataState(prev => ({...prev, [f.id]: ''})); // Reset on error
                     setUploadProgress(prev => {
                         const newP = {...prev};
                         delete newP[f.id];
                         return newP;
                     });
                     setValidationError(translate('Upload failed. Try again.'));
                     console.error(err);
                   } finally {
                     e.target.value = ''; // Allow choosing the same file again
                   }
               }
                  }}
                  className={`w-full bg-transparent border p-4 font-mono text-sm outline-none transition-colors rounded-lg ${typeof validationError === 'string' && validationError.includes('failed') ? 'border-[#fe0000]' : 'border-[var(--color-border)] focus:border-[#fe0000]'}`}
                />
                 {typeof uploadProgress[f.id] === 'number' && (
                    <div className="w-full bg-[var(--color-border)] h-1 rounded-full mt-2 overflow-hidden">
                       <div className="bg-[#fe0000] h-full transition-all duration-300" style={{ width: `${uploadProgress[f.id]}%` }}></div>
                    </div>
                 )}
                 {typeof formDataState[f.id] === 'string' && formDataState[f.id].startsWith('http') && typeof uploadProgress[f.id] !== 'number' && (
                   <p className="text-xs text-green-500 font-mono mt-2">
                     {translate('File uploaded successfully:')} <a href={formDataState[f.id]} target="_blank" rel="noreferrer" className="underline">{translate('View File')}</a>
                   </p>
                 )}
              </div>
           ) : (
              <input
                type={f.type === 'phone' || f.type === 'tel' ? 'tel' : f.type === 'email' ? 'email' : f.type === 'url' ? 'url' : f.type === 'number' ? 'number' : 'text'}
                value={formDataState[f.id] || ''}
                onChange={e => {
                  setFormDataState({...formDataState, [f.id]: e.target.value});
                  setValidationError('');
                }}
                className={`w-full bg-transparent border p-4 font-mono text-sm outline-none transition-colors rounded-lg ${validationError ? 'border-[#fe0000]' : 'border-[var(--color-border)] focus:border-[#fe0000]'}`}
                placeholder={translate('Type your answer...')}
              />
           )}
           {validationError && (
             <p className="text-[#fe0000] text-xs font-mono mt-2">{validationError}</p>
           )}
        </div>
      </motion.div>
    );
  };

  const handleLogin = async () => {
    try {
      const { GoogleAuthProvider, signInWithPopup } = await import('firebase/auth');
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (err: any) {
      console.error(err);
      showToast(err.message || 'Login failed', true);
    }
  };

  return (
    <div className="flex flex-col p-6 md:p-12 bg-transparent w-full h-full text-[var(--color-text)]">
      <Toast message={toastMessage} isVisible={isToastVisible} onClose={() => setIsToastVisible(false)} isError={toastIsError} />
      
      {!user ? (
        <div className="m-auto text-center max-w-md border border-[var(--color-border)] bg-[var(--color-surface)] p-8 shadow-2xl rounded-lg">
          <p className="font-mono text-sm mb-8 text-[var(--color-muted)]">
            {translate('You must be logged in to your Cabinet to participate.')}
          </p>
          <button
            onClick={handleLogin}
            className="px-8 py-4 font-mono text-sm uppercase tracking-wider bg-black text-white hover:bg-[#fe0000] border border-transparent shadow-[4px_4px_0_rgba(254,0,0,0.5)] transition-all cursor-pointer rounded-full w-full"
          >
            {translate('Continue with Google')}
          </button>
        </div>
      ) : !cabinetProfile ? (
        <div className="m-auto text-center max-w-md border border-[var(--color-border)] bg-[var(--color-surface)] p-8 shadow-2xl rounded-lg">
          <p className="font-mono text-sm mb-8 text-[#fe0000]">
            {translate('Your profile is incomplete. Please fill out your details in the Cabinet.')}
          </p>
          <button
            onClick={() => navigate('/cabinet')}
            className="px-8 py-4 font-mono text-sm uppercase tracking-wider bg-[#fe0000] text-white hover:bg-white hover:text-black transition-colors rounded-full w-full"
          >
            Complete Profile
          </button>
        </div>
      ) : (
        <div className="w-full max-w-3xl mx-auto flex flex-col h-full">
          {/* Progress Header */}
          <div className="mb-12">
            <div className="flex items-center gap-4 mb-4">
              <span className="font-mono text-xs text-[var(--color-muted)] tracking-widest uppercase">
                Step {currentStep + 1} of {steps.length}
              </span>
              <div className="flex-1 flex gap-2">
                 {steps.map((_, i) => (
                    <div key={i} className={`h-1 flex-1 rounded-full ${i === currentStep ? 'bg-[#fe0000]' : i < currentStep ? 'bg-[#fe0000]/50' : 'bg-[var(--color-border)]'}`} />
                 ))}
              </div>
            </div>
          </div>

          {/* Step Content */}
          <div className="flex-1 w-full flex flex-col relative h-full">
            <div className="flex-1 overflow-y-visible pb-32">
              <AnimatePresence mode="wait">
                {steps.length > 0 && renderStepContent(steps[currentStep], currentStep)}
              </AnimatePresence>
            </div>

            {/* Footer Controls */}
            <div className="mt-auto sticky bottom-0 left-0 right-0 flex justify-between items-center py-6 border-t border-[var(--color-border)] bg-[var(--color-bg)] z-20">
              {currentStep > 0 ? (
                <button 
                  onClick={() => {
                    setValidationError('');
                    setCurrentStep(currentStep - 1);
                  }} 
                  className="px-8 py-3 border border-[var(--color-border)] rounded-full text-xs font-mono uppercase tracking-widest hover:border-[var(--color-text)] transition-colors cursor-pointer bg-[var(--color-bg)]"
                >
                  {translate('Back')}
                </button>
              ) : <div />}
              
              <button 
                onClick={handleNext}
                disabled={isSubmitting}
                className={`px-8 py-3 bg-[#fe0000] text-white rounded-full text-xs font-mono uppercase tracking-widest hover:bg-[#d00000] transition-colors cursor-pointer shadow-[0_0_20px_rgba(254,0,0,0.3)] ${isSubmitting ? 'opacity-50' : ''}`}
              >
                {isSubmitting 
                  ? translate('Submitting...') 
                  : currentStep === steps.length - 1 
                    ? translate('Submit') 
                    : (steps[currentStep]?.field && !steps[currentStep]?.field?.required && (!formDataState[steps[currentStep].id] || formDataState[steps[currentStep].id].length === 0)) 
                      ? translate('Skip') 
                      : translate('Next')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
