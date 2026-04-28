import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { auth, db, storage } from './firebase';
import { signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Download, X, User as UserIcon, Mail, Phone, Calendar, Briefcase, GraduationCap, Award, FileText, ChevronRight, Edit2, LogOut, CheckCircle, Clock, Globe, ArrowLeft, ArrowRight, Shield, Star, Zap } from 'lucide-react';
import { useSiteStore } from './store';
import { OpportunityModal } from './components/OpportunityModal';

interface CertificateTemplate {
  id: string;
  formId: string;
  templateUrl: string;
  namePos: { x: number; y: number };
  fontSize: number;
  color: string;
}

interface UserProfile {
  name: string;
  surname: string;
  dateOfBirth: string;
  age: string;
  university: string;
  phone: string;
  email: string;
  fieldOfActivity: string;
  pastEvents: string;
  languages?: string;
  isBanned?: boolean;
  isDisabled?: boolean;
  participatedEvents?: { eventId: string; eventName: string; date: string; }[];
}

export const Cabinet = () => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [pendingApps, setPendingApps] = useState<any[]>([]);
  const [finalizedApps, setFinalizedApps] = useState<any[]>([]);
  const [templates, setTemplates] = useState<CertificateTemplate[]>([]);
  const [selectedCertificate, setSelectedCertificate] = useState<{app: any; template: CertificateTemplate} | null>(null);
  const [activeModalType, setActiveModalType] = useState<'volunteer' | 'vacancy' | 'internship' | null>(null);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const navigate = useNavigate();
  const { translations, formSchemas, lang, setLang } = useSiteStore();
  const t = translations[lang] || translations['en'];

  const translate = (key: string | undefined) => {
    if (!key) return '';
    return t[key] || t[key.trim()] || t[key.toLowerCase().replace(/\s+/g, '_')] || key;
  };

  const langs = ['en', 'ru', 'az'] as const;

  useEffect(() => {
    // Initial sync of language with system language
    if (typeof navigator !== 'undefined') {
      const l = navigator.language.toLowerCase();
      if (l.startsWith('ru') && lang !== 'ru') setLang('ru');
      else if (l.startsWith('az') && lang !== 'az') setLang('az');
      else if (l.startsWith('en') && lang !== 'en') setLang('en');
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const docRef = doc(db, 'users', currentUser.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data() as UserProfile & { lastActiveAt?: any };
          if (data.isBanned || data.isDisabled) {
            await signOut(auth);
            setUser(null);
            alert(t.banned_message || 'Your account has been deactivated or banned.');
            return;
          }
          setProfile(data);
          // Track activity
          await setDoc(docRef, { lastActiveAt: serverTimestamp() }, { merge: true });
        } else {
          setIsEditing(true); // brand new user
          setShowWelcomeModal(true);
          // Initialize tracking
          await setDoc(docRef, { 
            email: currentUser.email,
            createdAt: serverTimestamp(),
            lastActiveAt: serverTimestamp() 
          });
        }
        
        // Fetch pending and finalized apps
        try {
          const q = query(collection(db, 'volunteerApplications'), where('userId', '==', currentUser.uid));
          const appSnaps = await getDocs(q);
          const apps = appSnaps.docs.map(d => ({ id: d.id, ...d.data() }));
          // Filter to only show pending/applied, we already show participated in the profile
          setPendingApps(apps.filter((a: any) => a.status === 'applied' || a.status === 'missed'));
          setFinalizedApps(apps.filter((a: any) => a.status === 'finalized'));

          // Load certificate templates if any are finalized
          if (apps.some((a: any) => a.status === 'finalized')) {
             const tq = query(collection(db, 'certificates'));
             const tSnap = await getDocs(tq);
             setTemplates(tSnap.docs.map(d => ({ id: d.id, ...d.data() } as CertificateTemplate)));
          }
        } catch (e) {
          console.error("Failed to load apps or certificates", e);
        }
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    try {
      await signInWithPopup(auth, provider);
    } catch (error: any) {
      if (error.code === 'auth/cancelled-popup-request' || error.code === 'auth/popup-closed-by-user') {
        console.log('Login cancelled by user.');
      } else {
        console.error(error);
      }
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    setProfile(null);
  };
  
  const calculateAge = (dob: string) => {
    if (!dob) return '';
    const birthDate = new Date(dob);
    const today = new Date();
    let ageCalc = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      ageCalc--;
    }
    return ageCalc.toString();
  };

  const handleSaveProfile = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) return;
    setIsSaving(true);
    const formData = new FormData(e.currentTarget);
    let dob = formData.get('dateOfBirth') as string;
    
    if (dob.includes('.')) {
      const parts = dob.split('.');
      if (parts.length === 3) {
        dob = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
      }
    }
    
    const newProfile = {
      name: formData.get('name') as string,
      surname: formData.get('surname') as string,
      dateOfBirth: dob,
      age: calculateAge(dob),
      university: formData.get('university') as string,
      phone: formData.get('phone') as string,
      email: formData.get('email') as string,
      fieldOfActivity: formData.get('fieldOfActivity') as string,
      languages: formData.get('languages') as string,
      pastEvents: formData.get('pastEvents') as string,
      participatedEvents: profile?.participatedEvents || [],
    };

    if (profile) {
      const changes: Record<string, {old: string, new: string}> = {};
      if (profile.name !== newProfile.name) changes.name = { old: profile.name || '', new: newProfile.name || '' };
      if (profile.surname !== newProfile.surname) changes.surname = { old: profile.surname || '', new: newProfile.surname || '' };
      
      if (Object.keys(changes).length > 0) {
        try {
          const { addDoc, collection, serverTimestamp } = await import('firebase/firestore');
          await addDoc(collection(db, 'profileLogs'), {
            uid: user.uid,
            email: user.email,
            timestamp: serverTimestamp(),
            changes: changes
          });
        } catch(e) {
          console.error('Failed to log profile change:', e);
        }
      }
    }

    await setDoc(doc(db, 'users', user.uid), newProfile, { merge: true });
    setProfile(newProfile as UserProfile);
    setIsEditing(false);
    setIsSaving(false);
  };

  if (loading) return <div className="p-20 text-center font-mono">Loading...</div>;

  if (!user) {
    return (
      <div className="min-h-screen bg-[var(--color-bg)] flex flex-col pt-32 pb-12 relative overflow-hidden">
        {/* Modern ambient background */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#fe0000]/10 rounded-full blur-[100px] pointer-events-none"></div>
        
        <div className="container mx-auto px-4 md:px-12 flex-1 flex flex-col justify-center max-w-7xl relative z-10">
          <button onClick={() => navigate('/')} className="mb-16 inline-flex items-center gap-2 font-mono text-xs text-[var(--color-muted)] hover:text-[#fe0000] cursor-pointer transition-colors w-min whitespace-nowrap group bg-[var(--color-surface)]/50 backdrop-blur-md px-4 py-2 rounded-full border border-[var(--color-border)]">
            <span className="transform transition-transform group-hover:-translate-x-1">&larr;</span> {translate("BACK TO EXPERIENCE")}
          </button>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-center">
            <div className="relative z-10">
              <h1 className="text-6xl md:text-8xl lg:text-[110px] font-head uppercase leading-none tracking-tighter mb-8 group cursor-default">
                <span className="block transform transition-transform duration-500 group-hover:translate-x-4">{translate("Enter")}</span>
                <span className="text-transparent relative inline-block transform transition-transform duration-500 group-hover:translate-x-8" style={{ WebkitTextStroke: '2px var(--color-text)' }}>
                  {translate("Cabinet")}
                </span>
              </h1>
              <p className="font-mono text-sm md:text-base text-[var(--color-muted)] max-w-md leading-relaxed">
                {translate("Manage your profile, track your event participation, and quickly apply for new opportunities.")}
              </p>
            </div>
            
            <div className="relative group perspective-1000">
               <div className="bg-[var(--color-surface)]/80 backdrop-blur-2xl border border-white/10 rounded-3xl p-10 md:p-14 relative shadow-[0_8px_32px_rgba(0,0,0,0.1)] transition-transform duration-500 hover:-translate-y-2">
                 <div className="w-12 h-12 rounded-2xl bg-[#fe0000]/10 flex items-center justify-center mb-8 border border-[#fe0000]/20">
                   <div className="w-2.5 h-2.5 bg-[#fe0000] rounded-full animate-pulse shadow-[0_0_10px_rgba(254,0,0,0.5)]"></div>
                 </div>
                 
                 <h2 className="text-3xl font-head uppercase mb-10 tracking-tighter">
                   {translate("Provide Access")}
                 </h2>
                 
                 <div className="space-y-4 relative z-10 flex flex-col">
                    <button 
                      onClick={handleLogin}
                      className="w-full bg-[#fe0000] text-white px-8 py-4 rounded-xl uppercase tracking-widest font-mono text-xs hover:bg-[#d60000] transition-all shadow-lg shadow-[#fe0000]/20 flex items-center justify-between group/btn"
                    >
                      <span>{translate("Continue with Google")}</span>
                      <span className="transform transition-transform group-hover/btn:translate-x-2">&rarr;</span>
                    </button>
                    <button 
                      onClick={handleLogin}
                      className="w-full border-2 border-[var(--color-border)] text-[var(--color-text)] bg-transparent px-8 py-4 rounded-xl uppercase tracking-widest font-mono text-xs hover:border-[#fe0000] hover:text-[#fe0000] transition-colors flex items-center justify-between group/btn2"
                    >
                      <span>{translate("Create Account")}</span>
                      <span className="transform transition-transform group-hover/btn2:translate-x-2">&rarr;</span>
                    </button>
                 </div>
                 
                 <div className="mt-12 pt-6 border-t border-[var(--color-border)]/50 flex items-center justify-between opacity-60">
                   <p className="font-mono text-[10px] uppercase tracking-widest">{translate("Secure auth loop")}</p>
                   <p className="font-mono text-[10px] uppercase tracking-widest text-[#fe0000]">{translate("System: Active")}</p>
                 </div>
               </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-12 min-h-screen pt-32 relative">
      {/* Top Bar for Language switch */}
      <div className="fixed top-0 left-0 right-0 p-6 z-50 flex justify-end pointer-events-none">
          <div className="pointer-events-auto bg-[var(--color-surface)]/80 backdrop-blur-xl border border-[var(--color-border)] rounded-full p-1 flex gap-1 shadow-sm">
            {langs.map((l) => (
              <button 
                key={l}
                onClick={() => setLang(l)}
                className={`font-mono text-[10px] tracking-widest px-4 py-2 rounded-full uppercase transition-all duration-300 ${lang === l ? 'bg-[#fe0000] text-white shadow-md' : 'text-[var(--color-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-bg)]'}`}
              >
                {l}
              </button>
            ))}
          </div>
      </div>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-16 pb-8 gap-6 pt-8">
        <div>
          <button onClick={() => navigate('/')} className="mb-8 inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-[var(--color-muted)] hover:text-[#fe0000] cursor-pointer transition-all bg-[var(--color-surface)]/80 backdrop-blur-md px-4 py-2 rounded-full border border-[var(--color-border)] group">
             <span className="transform transition-transform group-hover:-translate-x-1">&larr;</span> {translate('Back to Main Portal')}
          </button>
          <div className="flex items-center gap-4 mb-4">
            <span className="bg-black text-white px-3 py-1.5 rounded-full text-[10px] font-mono tracking-widest uppercase">ID: {profile?.email || user.email}</span>
            <span className="w-2.5 h-2.5 rounded-full bg-[#fe0000] animate-pulse"></span>
          </div>
          <h2 className="font-head text-5xl md:text-7xl uppercase tracking-tighter">{translate('My Cabinet')}</h2>
        </div>
        <button onClick={handleLogout} className="font-mono text-[10px] tracking-widest bg-[var(--color-surface)] text-[#fe0000] hover:text-white border border-[#fe0000] hover:bg-[#fe0000] px-6 py-3 rounded-xl uppercase transition-colors shadow-sm">
          {translate('Disconnect Session')}
        </button>
      </div>
      
      {!profile || isEditing ? (
        <form onSubmit={handleSaveProfile} className="max-w-4xl mx-auto bg-[var(--color-surface)] border border-[var(--color-border)] rounded-3xl relative shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden">
          {/* Header */}
          <div className="p-8 md:p-12 border-b border-[var(--color-border)] bg-[var(--color-bg)]/50 backdrop-blur-md">
            <div className="flex items-center gap-6 mb-4">
              <div className="w-16 h-16 bg-[#fe0000]/10 rounded-2xl text-[#fe0000] flex items-center justify-center border border-[#fe0000]/20 shadow-inner">
                <UserIcon size={28} />
              </div>
              <div>
                <h3 className="font-head text-3xl md:text-4xl uppercase tracking-tighter">{translate('Your Details')}</h3>
                <p className="font-mono text-[10px] uppercase tracking-widest text-[var(--color-muted)] mt-1">{translate('Matrix configuration required for deployments.')}</p>
              </div>
            </div>
          </div>
          
          {/* Form Body */}
          <div className="p-8 md:p-12 space-y-12">
            {!profile && (
              <div className="bg-[#fe0000]/10 border border-[#fe0000]/20 p-6 rounded-2xl flex items-start gap-4 shadow-sm animate-pulse-slow">
                 <div className="text-[#fe0000] mt-1 shrink-0"><CheckCircle size={24} /></div>
                 <div>
                    <h4 className="font-bold text-[#fe0000] uppercase tracking-wider mb-2 font-head text-lg md:text-xl">
                      {translate('Step 1: Complete Your Profile') || 'Step 1: Complete Your Profile'}
                    </h4>
                    <p className="text-sm opacity-90 font-mono leading-relaxed">
                      {translate('Before applying to vacancies or internships, you must complete your central profile. Once saved, you will see the active opportunities.') || 'Before applying to vacancies or internships, you must complete your central profile. Once saved, you will see the active opportunities.'}
                    </p>
                 </div>
              </div>
            )}
            
            {/* General Info */}
            <div className="space-y-6">
              <div className="flex items-center gap-2 border-b border-[var(--color-border)] pb-3 mb-6">
                <UserIcon size={14} className="text-[var(--color-muted)]" />
                <h4 className="font-mono text-xs uppercase tracking-widest text-[var(--color-muted)]">{translate('Personal Information')}</h4>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="relative group/input">
                  <label className="block font-mono text-[10px] text-[var(--color-muted)] uppercase tracking-widest mb-3 group-focus-within/input:text-[#fe0000] transition-colors">{translate('Name')} <span className="text-[#fe0000]">*</span></label>
                  <input required name="name" defaultValue={profile?.name || ''} className="w-full bg-[var(--color-bg)] rounded-xl border border-[var(--color-border)] px-4 py-3.5 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-[#fe0000]/20 focus:border-[#fe0000] transition-all hover:border-[var(--color-text)]/50" />
                </div>
                <div className="relative group/input">
                  <label className="block font-mono text-[10px] text-[var(--color-muted)] uppercase tracking-widest mb-3 group-focus-within/input:text-[#fe0000] transition-colors">{translate('Surname')} <span className="text-[#fe0000]">*</span></label>
                  <input required name="surname" defaultValue={profile?.surname || ''} className="w-full bg-[var(--color-bg)] rounded-xl border border-[var(--color-border)] px-4 py-3.5 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-[#fe0000]/20 focus:border-[#fe0000] transition-all hover:border-[var(--color-text)]/50" />
                </div>
                <div className="relative group/input">
                  <label className="block font-mono text-[10px] text-[var(--color-muted)] uppercase tracking-widest mb-3 group-focus-within/input:text-[#fe0000] transition-colors">{translate('Date of Birth')} (DD.MM.YYYY) <span className="text-[#fe0000]">*</span></label>
                  <input required type="text" inputMode="numeric" placeholder="DD.MM.YYYY" name="dateOfBirth" defaultValue={(profile?.dateOfBirth || '').split('-').reverse().join('.')} className="w-full bg-[var(--color-bg)] rounded-xl border border-[var(--color-border)] px-4 py-3.5 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-[#fe0000]/20 focus:border-[#fe0000] transition-all hover:border-[var(--color-text)]/50" onChange={(e) => {
                    let val = e.target.value.replace(/[^\d.]/g, '');
                    // Auto-add dots
                    if (val.length === 2 && !val.includes('.')) val += '.';
                    else if (val.length === 5 && (val.match(/\./g) || []).length === 1) val += '.';
                    e.target.value = val;
                  }} maxLength={10} />
                </div>
              </div>
            </div>

            {/* Contact */}
            <div className="space-y-6">
              <div className="flex items-center gap-2 border-b border-[var(--color-border)] pb-3 mb-6">
                <Phone size={14} className="text-[var(--color-muted)]" />
                <h4 className="font-mono text-xs uppercase tracking-widest text-[var(--color-muted)]">{translate('Contact & Status')}</h4>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="relative group/input">
                  <label className="block font-mono text-[10px] text-[var(--color-muted)] uppercase tracking-widest mb-3 group-focus-within/input:text-[#fe0000] transition-colors">{translate('Email')} <span className="text-[#fe0000]">*</span></label>
                  <input required type="email" name="email" defaultValue={profile?.email || user.email || ''} className="w-full bg-[var(--color-bg)] rounded-xl border border-[var(--color-border)] px-4 py-3.5 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-[#fe0000]/20 focus:border-[#fe0000] transition-all hover:border-[var(--color-text)]/50" />
                </div>
                <div className="relative group/input">
                  <label className="block font-mono text-[10px] text-[var(--color-muted)] uppercase tracking-widest mb-3 group-focus-within/input:text-[#fe0000] transition-colors">{translate('Phone Number')} <span className="text-[#fe0000]">*</span></label>
                  <input required type="tel" name="phone" defaultValue={profile?.phone || ''} className="w-full bg-[var(--color-bg)] rounded-xl border border-[var(--color-border)] px-4 py-3.5 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-[#fe0000]/20 focus:border-[#fe0000] transition-all hover:border-[var(--color-text)]/50" />
                </div>
                <div className="relative group/input">
                  <label className="block font-mono text-[10px] text-[var(--color-muted)] uppercase tracking-widest mb-3 group-focus-within/input:text-[#fe0000] transition-colors">{translate('University / Organization')} <span className="text-[#fe0000]">*</span></label>
                  <input required name="university" defaultValue={profile?.university || ''} className="w-full bg-[var(--color-bg)] rounded-xl border border-[var(--color-border)] px-4 py-3.5 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-[#fe0000]/20 focus:border-[#fe0000] transition-all hover:border-[var(--color-text)]/50" />
                </div>
                <div className="relative group/input">
                  <label className="block font-mono text-[10px] text-[var(--color-muted)] uppercase tracking-widest mb-3 group-focus-within/input:text-[#fe0000] transition-colors">{translate('Field of Activity')} <span className="text-[#fe0000]">*</span></label>
                  <input required name="fieldOfActivity" defaultValue={profile?.fieldOfActivity || ''} className="w-full bg-[var(--color-bg)] rounded-xl border border-[var(--color-border)] px-4 py-3.5 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-[#fe0000]/20 focus:border-[#fe0000] transition-all hover:border-[var(--color-text)]/50" />
                </div>
              </div>
            </div>

            {/* Experience */}
            <div className="space-y-6">
              <div className="flex items-center gap-2 border-b border-[var(--color-border)] pb-3 mb-6">
                <Globe size={14} className="text-[var(--color-muted)]" />
                <h4 className="font-mono text-xs uppercase tracking-widest text-[var(--color-muted)]">{translate('Experience')}</h4>
              </div>
              <div className="relative group/input">
                <label className="block font-mono text-[10px] text-[var(--color-muted)] uppercase tracking-widest mb-3 group-focus-within/input:text-[#fe0000] transition-colors">{translate('Languages Known')} <span className="text-[#fe0000]">*</span></label>
                <input required name="languages" placeholder="e.g. English, Russian, Azerbaijani" defaultValue={profile?.languages || ''} className="w-full bg-[var(--color-bg)] rounded-xl border border-[var(--color-border)] px-4 py-3.5 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-[#fe0000]/20 focus:border-[#fe0000] transition-all hover:border-[var(--color-text)]/50" />
              </div>
              <div className="relative group/input">
                <label className="block font-mono text-[10px] text-[var(--color-muted)] uppercase tracking-widest mb-3 group-focus-within/input:text-[#fe0000] transition-colors">{translate('Past Events')} <span className="text-[#fe0000]">*</span></label>
                <textarea required name="pastEvents" defaultValue={profile?.pastEvents || ''} rows={4} className="w-full bg-[var(--color-bg)] rounded-xl border border-[var(--color-border)] px-4 py-3.5 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-[#fe0000]/20 focus:border-[#fe0000] transition-all hover:border-[var(--color-text)]/50 resize-y whitespace-pre-wrap" />
              </div>
            </div>
          </div>
          
          {/* Footer Actions */}
          <div className="p-8 md:p-12 border-t border-[var(--color-border)] bg-[var(--color-bg)]/50 flex flex-col sm:flex-row gap-4">
            <button type="submit" disabled={isSaving} className="flex-1 bg-[#fe0000] text-white px-8 py-4 rounded-xl uppercase tracking-widest font-mono text-[11px] shadow-lg shadow-[#fe0000]/20 hover:-translate-y-1 hover:shadow-[#fe0000]/40 transition-all flex items-center justify-center gap-3 disabled:opacity-50">
              {isSaving ? (
                <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span> {translate('Processing...')}</>
              ) : (
                <><CheckCircle size={16} /> {translate('Sync Configuration')}</>
              )}
            </button>
            {profile && (
              <button type="button" onClick={() => setIsEditing(false)} disabled={isSaving} className="flex-1 border-2 border-[var(--color-border)] px-8 py-4 rounded-xl uppercase tracking-widest font-mono text-[11px] hover:border-[#fe0000] hover:bg-[#fe0000]/5 hover:text-[#fe0000] transition-colors flex items-center justify-center gap-3 disabled:opacity-50">
                <X size={16} /> {translate('Cancel Update')}
              </button>
            )}
          </div>
        </form>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
          {/* Sidebar / Profile Card */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-[var(--color-surface)] p-8 rounded-3xl border border-[var(--color-border)] relative shadow-lg sticky top-24">
              <div className="absolute top-6 right-6 flex items-center justify-center">
                 <div className="w-2.5 h-2.5 bg-[#fe0000] rounded-full animate-ping"></div>
                 <div className="w-2.5 h-2.5 bg-[#fe0000] rounded-full absolute"></div>
              </div>
              <div className="flex flex-col items-center gap-4 mb-8 pb-8 border-b border-[var(--color-border)] text-center">
                <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-[#fe0000] to-orange-500 text-white flex items-center justify-center text-3xl font-bold font-head uppercase shadow-xl shadow-[#fe0000]/20">
                   {profile.name?.[0] || ''}{profile.surname?.[0] || ''}
                </div>
                <div>
                   <h3 className="font-head text-3xl uppercase tracking-tighter leading-none mb-2">{profile.name} {profile.surname}</h3>
                   <span className="font-mono text-[10px] tracking-widest text-[#fe0000] bg-[#fe0000]/10 px-3 py-1 rounded-full uppercase">{translate('Verified ID')}</span>
                </div>
              </div>
              
              <div className="space-y-6 font-mono text-xs uppercase tracking-wider">
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-[var(--color-bg)] flex items-center justify-center shrink-0">
                    <Calendar size={14} className="text-[var(--color-muted)]" />
                  </div>
                  <div className="pt-1">
                    <span className="text-[var(--color-muted)] text-[9px] block mb-1">{translate('Age / Date of Birth')}</span>
                    <span className="text-sm font-bold">{profile.age}y <span className="opacity-50 text-[10px]">({profile.dateOfBirth ? profile.dateOfBirth.split('-').reverse().join('.') : ''})</span></span>
                  </div>
                </div>
                <div className="flex items-start gap-4 break-all">
                  <div className="w-8 h-8 rounded-full bg-[var(--color-bg)] flex items-center justify-center shrink-0">
                    <Mail size={14} className="text-[var(--color-muted)]" />
                  </div>
                  <div className="pt-1">
                    <span className="text-[var(--color-muted)] text-[9px] block mb-1">{translate('Email / Comms')}</span>
                    <span className="opacity-90">{profile.email || user.email}</span>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-[var(--color-bg)] flex items-center justify-center shrink-0">
                    <Phone size={14} className="text-[var(--color-muted)]" />
                  </div>
                  <div className="pt-1">
                    <span className="text-[var(--color-muted)] text-[9px] block mb-1">{translate('Phone Number')}</span>
                    <span className="opacity-90">{profile.phone}</span>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-[var(--color-bg)] flex items-center justify-center shrink-0">
                    <Briefcase size={14} className="text-[var(--color-muted)]" />
                  </div>
                  <div className="pt-1">
                    <span className="text-[var(--color-muted)] text-[9px] block mb-1">{translate('University / Organization')}</span>
                    <span className="opacity-90 leading-tight">{profile.university}</span>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-[var(--color-bg)] flex items-center justify-center shrink-0">
                    <Star size={14} className="text-[var(--color-muted)]" />
                  </div>
                  <div className="pt-1">
                    <span className="text-[var(--color-muted)] text-[9px] block mb-1">{translate('Field of Activity')}</span>
                    <span className="opacity-90 leading-tight">{profile.fieldOfActivity}</span>
                  </div>
                </div>
              </div>
              
              <button 
                onClick={() => setIsEditing(true)} 
                className="mt-10 font-mono text-[10px] bg-[var(--color-bg)] rounded-xl border border-[var(--color-border)] text-[var(--color-text)] w-full py-4 uppercase tracking-widest hover:border-[#fe0000] hover:text-[#fe0000] transition-colors cursor-pointer group flex justify-center items-center gap-2"
              >
                <Edit2 size={12} className="group-hover:scale-110 transition-transform" />
                <span>{translate('Edit settings')}</span>
              </button>
            </div>
          </div>
          
          {/* Main Content Area */}
          <div className="lg:col-span-8 space-y-16">
            
            {/* Deployments / Opportunities */}
            <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-3xl p-8 md:p-12 relative overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
               <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-[#fe0000]/10 to-transparent rounded-bl-full pointer-events-none opacity-50"></div>
               <h3 className="font-head text-3xl uppercase tracking-tighter mb-3 flex items-center gap-3 relative z-10">
                 <Zap size={28} className="text-[#fe0000]" /> {translate('Active Deployments')}
               </h3>
               <p className="font-mono text-[10px] text-[var(--color-muted)] tracking-widest uppercase mb-10 pb-8 border-b border-[var(--color-border)] max-w-xl relative z-10 leading-relaxed">
                 {translate("Expand your professional matrix by applying for open roles, volunteering opportunities, and internships.")}
               </p>
               
               <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 relative z-10">
                 {[
                   { type: 'volunteer' as const, label: translate('Volunteer'), subtitle: translate('JOIN FORCE'), icon: '🫂' },
                   { type: 'vacancy' as const, label: translate('Vacancy'), subtitle: translate('EMPLOYMENT'), icon: '💼' },
                   { type: 'internship' as const, label: translate('Intern'), subtitle: translate('EDUCATION'), icon: '🎓' }
                 ].map(opp => (
                   <button
                     key={opp.type}
                     onClick={() => setActiveModalType(opp.type)}
                     className="relative flex flex-col items-center justify-center p-8 rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)]/50 backdrop-blur-sm hover:border-[#fe0000]/50 transition-all group cursor-pointer overflow-hidden shadow-sm hover:shadow-xl hover:shadow-[#fe0000]/5 hover:-translate-y-1"
                   >
                     <div className="absolute inset-0 bg-gradient-to-br from-transparent to-[#fe0000]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                     <span className="font-mono text-[9px] text-[#fe0000] bg-[#fe0000]/10 font-bold px-3 py-1 rounded-full uppercase tracking-widest mb-6 absolute top-4 left-4 transition-all">
                        {formSchemas.filter(s => s.category === opp.type).length} {translate('OPEN')}
                     </span>
                     <span className="text-5xl mb-5 opacity-80 group-hover:opacity-100 transition-all transform group-hover:scale-110 duration-500">{opp.icon}</span>
                     <span className="font-head text-xl uppercase tracking-tighter transition-colors relative z-10 group-hover:text-[#fe0000]">{opp.label}</span>
                     <span className="text-[9px] text-[var(--color-muted)] mt-2 uppercase font-mono tracking-widest relative z-10 flex items-center gap-1 group-hover:text-[var(--color-text)] transition-colors">
                        {opp.subtitle} <ChevronRight size={10} className="opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" />
                     </span>
                   </button>
                 ))}
               </div>
            </div>

            {/* My Submissions & Certificates */}
            <div className="space-y-8 relative">
              <h3 className="font-head text-4xl uppercase tracking-tighter flex items-center gap-4">
                 <Shield className="text-[var(--color-muted)]" size={36} />
                 {translate('My Events & Certificates')}
              </h3>
              
              <div className="space-y-4">
                {/* Available Certificates (High priority) */}
                {finalizedApps.map((app) => {
                  const template = templates.find(t => t.formId === app.formId || t.formId === app.eventId);
                  return (
                    <div key={app.id} className="group relative flex flex-col md:flex-row justify-between items-start md:items-center p-8 rounded-2xl border border-[#fe0000]/30 hover:border-[#fe0000] bg-gradient-to-r from-[#fe0000]/10 to-[var(--color-surface)] overflow-hidden transition-all shadow-md hover:shadow-[0_8px_30px_rgba(254,0,0,0.15)]">
                      <div className="relative z-10 mb-6 md:mb-0 max-w-xl">
                        <div className="flex items-center gap-3 mb-3">
                           <div className="w-8 h-8 rounded-full bg-[#fe0000]/20 flex items-center justify-center">
                             <Award size={16} className="text-[#fe0000]" />
                           </div>
                           <span className="font-mono text-[10px] uppercase tracking-widest text-[#fe0000] font-bold">{translate('Achievement Unlocked')}</span>
                        </div>
                        <h4 className="font-head text-2xl md:text-3xl uppercase tracking-tighter leading-tight">{app.eventName}</h4>
                      </div>
                      <button 
                        onClick={() => {
                          if (template) {
                             setSelectedCertificate({ app, template });
                          } else {
                             alert(translate('Certificate design for this event is not ready yet. Please try later.'));
                          }
                        }}
                        className="shrink-0 relative z-10 bg-[#fe0000] text-white px-8 py-4 rounded-xl text-[11px] font-mono uppercase tracking-widest transition-all flex items-center gap-4 shadow-lg shadow-[#fe0000]/30 hover:shadow-[#fe0000]/50 transform hover:-translate-y-1 hover:bg-[#d60000]"
                      >
                         <span>{translate('Claim & Download')}</span>
                         <Download size={16} />
                      </button>
                    </div>
                  );
                })}

                {/* Pending Apps */}
                {pendingApps.filter(a => a.status === 'applied').map((app) => (
                  <div key={app.id} className="relative flex flex-col md:flex-row justify-between items-start md:items-center p-6 md:p-8 rounded-2xl border border-[var(--color-border)] overflow-hidden bg-[var(--color-surface)] hover:border-[#eab308]/50 transition-colors group">
                    <div className="absolute top-0 left-0 w-2 h-full bg-[#eab308]"></div>
                    <div className="mb-4 md:mb-0 ml-4">
                       <h4 className="font-head text-xl md:text-2xl uppercase tracking-tighter group-hover:text-[#eab308] transition-colors">{app.eventName}</h4>
                       <div className="flex items-center gap-2 font-mono text-[10px] text-[var(--color-muted)] mt-2 tracking-widest uppercase">
                          <Clock size={12} className="text-[#eab308]" />
                          <span>{translate('Applied')}: {new Date(app.timestamp?.seconds * 1000).toLocaleDateString()}</span>
                       </div>
                    </div>
                    <div className="border border-[#eab308]/30 rounded-xl text-[#eab308] text-[10px] font-mono tracking-widest px-4 py-2 uppercase whitespace-nowrap bg-[#eab308]/10 flex items-center gap-2">
                      <span className="w-2 h-2 bg-[#eab308] rounded-full animate-pulse"></span>
                      {translate('Processing')}
                    </div>
                  </div>
                ))}
                
                {/* Completed Programs (no certificate) */}
                {profile.participatedEvents && profile.participatedEvents.map((ev, i) => (
                  <div key={i} className="relative flex flex-col md:flex-row justify-between items-start md:items-center p-6 md:p-8 rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)]/50 transition-all opacity-80 hover:opacity-100 hover:shadow-md">
                    <div className="absolute top-0 left-0 w-2 h-full bg-[var(--color-muted)]/30 rounded-l-2xl"></div>
                    <div className="mb-4 md:mb-0 ml-4">
                      <h4 className="font-head text-lg md:text-xl uppercase tracking-tighter">{ev.eventName}</h4>
                      <p className="font-mono text-[9px] text-[var(--color-muted)] mt-2 tracking-widest uppercase flex items-center gap-2">
                         <Calendar size={10} /> {ev.date}
                      </p>
                    </div>
                    <div className="text-[var(--color-muted)] bg-[var(--color-surface)] px-4 py-2 rounded-xl border border-[var(--color-border)] text-[10px] font-mono tracking-widest uppercase whitespace-nowrap flex items-center gap-2">
                      <CheckCircle size={14} />
                      {translate('Concluded')}
                    </div>
                  </div>
                ))}

                {!pendingApps.filter(a => a.status === 'applied').length && finalizedApps.length === 0 && (!profile.participatedEvents || profile.participatedEvents.length === 0) && (
                  <div className="text-center p-16 md:p-24 rounded-3xl border border-dashed border-[var(--color-border)] font-mono flex flex-col items-center justify-center bg-[var(--color-surface)]/50 group hover:border-[#fe0000]/50 transition-colors">
                    <div className="w-20 h-20 rounded-full bg-[var(--color-bg)] border border-[var(--color-border)] flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-[#fe0000]/5 transition-all">
                       <FileText className="text-[var(--color-muted)] group-hover:text-[#fe0000]" size={28} />
                    </div>
                    <p className="text-[11px] uppercase tracking-widest text-[var(--color-muted)] max-w-xs">{translate('No activity registered in subsystem')}</p>
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      )}
      
      <AnimatePresence>
        {activeModalType && (
          <OpportunityModal 
            type={activeModalType} 
            onClose={() => setActiveModalType(null)} 
            lang={lang} 
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedCertificate && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 md:p-8 bg-black/80 backdrop-blur-md" onClick={() => setSelectedCertificate(null)}>
            <motion.div 
               initial={{ opacity: 0, y: 20, scale: 0.95 }}
               animate={{ opacity: 1, y: 0, scale: 1 }}
               exit={{ opacity: 0, y: 20, scale: 0.95 }}
               className="bg-[var(--color-bg)] rounded-3xl border border-[var(--color-border)] w-full max-w-5xl max-h-full relative group shadow-[0_30px_60px_rgba(0,0,0,0.4)] flex flex-col overflow-hidden"
               onClick={e => e.stopPropagation()}
            >
               {/* ... */}
               <div className="sticky top-0 z-50 bg-[var(--color-bg)]/80 backdrop-blur-md border-b border-[var(--color-border)] p-4 md:p-6 flex justify-between items-start md:items-center flex-col md:flex-row gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-[#fe0000]/10 flex items-center justify-center text-[#fe0000]">
                      <Award size={24} />
                    </div>
                    <div>
                      <h3 className="font-head text-2xl md:text-3xl uppercase tracking-tighter">{translate('Verified Achievement')}</h3>
                      <p className="font-mono text-[10px] uppercase tracking-widest text-[var(--color-muted)] mt-1">{translate('Digital signature active.')}</p>
                    </div>
                  </div>
                  <button onClick={() => setSelectedCertificate(null)} className="absolute top-4 right-4 md:static p-2 rounded-full bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-muted)] hover:text-[#fe0000] hover:border-[#fe0000] transition-colors focus:outline-none">
                    <X size={20} />
                  </button>
               </div>
               
               {/* Scrollable Content */}
               <div className="overflow-y-auto flex-1 p-4 md:p-8 flex justify-center items-start bg-[var(--color-surface)]/50">
                 <div className="relative rounded-2xl shadow-xl w-full max-w-full flex justify-center bg-white p-2">
                    <canvas 
                      id="certCanvas"
                      className="max-w-full h-auto rounded-xl border border-gray-200"
                    ></canvas>
                 </div>
               </div>
               
               {/* Fixed Footer */}
               <div className="sticky bottom-0 bg-[var(--color-bg)]/80 backdrop-blur-md flex flex-col md:flex-row w-full gap-4 justify-between items-center border-t border-[var(--color-border)] p-4 md:p-6">
                  <p className="text-[10px] text-[var(--color-muted)] font-mono uppercase tracking-widest text-center md:text-left">{translate('Format: High Resolution PDF')}</p>
                  <button 
                    onClick={async () => {
                       const lastDownloads = selectedCertificate.app.downloadHistory || [];
                       const today = new Date().toISOString().split('T')[0];
                       const hasDownloadedToday = lastDownloads.some((d: string) => d.startsWith(today));
                       
                       if (hasDownloadedToday) {
                         alert(translate('cab_limit'));
                         return;
                       }

                       const canvas = document.getElementById('certCanvas') as HTMLCanvasElement;
                       if (canvas) {
                          const imgData = canvas.toDataURL('image/jpeg', 1.0);
                          const orientation = canvas.width > canvas.height ? 'landscape' : 'portrait';
                          const pdf = new jsPDF({
                            orientation: orientation,
                            unit: 'px',
                            format: [canvas.width, canvas.height]
                          });
                          pdf.addImage(imgData, 'JPEG', 0, 0, canvas.width, canvas.height);
                          pdf.save(`Certificate_${selectedCertificate.app.eventName?.replace(/\s+/g, '_')}_${profile?.name}.pdf`);
                          
                          // Track download
                          try {
                            const { arrayUnion, doc, updateDoc } = await import('firebase/firestore');
                            await updateDoc(doc(db, 'volunteerApplications', selectedCertificate.app.id), {
                              downloadHistory: arrayUnion(new Date().toISOString())
                            });
                          } catch (e) {
                            console.error('Failed to log download tracking', e);
                          }
                       }
                    }}
                    className="w-full md:w-auto bg-[#fe0000] text-white px-8 py-4 rounded-xl font-sans font-medium text-sm shadow-lg shadow-[#fe0000]/20 hover:-translate-y-1 hover:shadow-[#fe0000]/40 transition-all flex justify-center items-center gap-3"
                  >
                     <span className="uppercase tracking-widest font-mono text-[10px]">{translate('Secure Download')}</span>
                     <Download size={16} />
                  </button>
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showWelcomeModal && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div 
               initial={{ opacity: 0, scale: 0.9 }}
               animate={{ opacity: 1, scale: 1 }}
               exit={{ opacity: 0, scale: 0.9 }}
               className="bg-[var(--color-bg)] rounded-3xl border border-[var(--color-border)] w-full max-w-lg p-8 relative flex flex-col items-center text-center shadow-2xl"
            >
               <div className="w-16 h-16 rounded-full bg-[#fe0000]/10 flex items-center justify-center text-[#fe0000] mb-6">
                 <Shield size={32} />
               </div>
               <h2 className="font-head text-3xl uppercase tracking-tighter mb-4">{translate('Step 1: Complete Your Profile')}</h2>
               <p className="font-mono text-sm leading-relaxed text-[var(--color-muted)] mb-8">
                 {translate('Before applying to vacancies or internships, you must complete your central profile. Once saved, you will see the active opportunities.')}
               </p>
               <button 
                 onClick={() => setShowWelcomeModal(false)}
                 className="w-full bg-[#fe0000] text-white py-4 rounded-xl font-sans font-medium text-sm uppercase tracking-widest hover:-translate-y-1 shadow-lg shadow-[#fe0000]/20 transition-all"
               >
                 OK
               </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <CertificateRenderer profile={profile} selectedCertificate={selectedCertificate} />
    </div>
  );
};

import QRCode from 'qrcode';
import { jsPDF } from 'jspdf';

const CertificateRenderer = ({ profile, selectedCertificate }: any) => {
  useEffect(() => {
    if (selectedCertificate) {
      const canvas = document.getElementById('certCanvas') as HTMLCanvasElement;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = selectedCertificate.template.templateUrl;
      img.onload = async () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        
        const pos = selectedCertificate.template.namePos;
        const fontSize = selectedCertificate.template.fontSize || 40;
        const color = selectedCertificate.template.color || '#000000';
        
        ctx.font = `bold ${fontSize}px Montserrat, Arial, sans-serif`;
        ctx.fillStyle = color;
        ctx.textAlign = 'center';
        
        const fullName = `${profile?.name} ${profile?.surname}`;
        ctx.fillText(fullName.toUpperCase(), pos.x, pos.y);

        // Draw QR code if tracking code exists and qrPos is set
        if (selectedCertificate.app.certificateTrackingCode && selectedCertificate.template.qrPos) {
          try {
            const verificationUrl = `${window.location.origin}/verify/${selectedCertificate.app.id}`;
            const qrDataUrl = await QRCode.toDataURL(verificationUrl, { 
              width: selectedCertificate.template.qrPos.size || 150,
              margin: 1
            });
            const qrImg = new Image();
            qrImg.src = qrDataUrl;
            qrImg.onload = () => {
              // Center the QR code at the given coordinates
              const qrSize = selectedCertificate.template.qrPos.size || 150;
              ctx.drawImage(qrImg, selectedCertificate.template.qrPos.x - qrSize/2, selectedCertificate.template.qrPos.y - qrSize/2, qrSize, qrSize);
            };
          } catch (err) {
            console.error('Error generating QR code:', err);
          }
        }
      };
    }
  }, [selectedCertificate, profile]);

  return null;
};
