import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Settings, X, Plus, Trash2, RefreshCw, Moon, Sun, Download, Share2, Save, Link as LinkIcon, ArrowLeft, ArrowUp, ArrowDown, Shield, Palette, Image as ImageIcon, ShieldCheck, Users, Info, Zap, Languages, Briefcase, FlaskConical, Newspaper, FileText, Inbox, Award, FileClock, Phone, Edit2, Database, Search } from 'lucide-react';
import { useSiteStore, PortfolioData } from './store';
import { db, auth } from './firebase';
import { collection, getDocs, query, orderBy, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, getDoc, setDoc, where, limit, startAfter, deleteField } from 'firebase/firestore';
import { signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged } from 'firebase/auth';
import { handleFirestoreError, OperationType } from './utils/firestoreErrorHandler';
import { generateApplicationKeywords } from './utils/search';
import { Toast } from './components/Toast';
import { EventEditor } from './components/EventEditor';

const deleteCloudinaryUrl = async (url: string) => {
  try {
    if (!url || !url.includes('res.cloudinary.com')) return;
    const res = await fetch('/api/delete-cloudinary', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url })
    });
    if (!res.ok) console.warn('Failed to delete Cloudinary image:', await res.text());
  } catch (err) { console.error('Status Error', err);
    console.error('Error deleting Cloudinary image:', err);
  }
};

const cleanUpCloudinaryImagesForApp = async (appData: any) => {
  if (!appData || !appData.formData) return;
  const urlsToDelete: string[] = [];
  
  Object.values(appData.formData).forEach(val => {
    if (typeof val === 'string' && val.includes('res.cloudinary.com')) {
      urlsToDelete.push(val);
    }
  });

  for (const url of urlsToDelete) {
    await deleteCloudinaryUrl(url);
  }
};

interface AdminPanelProps {
  onClose?: () => void;
}

export default function AdminPanel({ onClose }: AdminPanelProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminRole, setAdminRole] = useState<'superadmin' | 'formadmin' | 'contenteditor' | null>(null);
  const [error, setError] = useState('');
  const [revokeEmail, setRevokeEmail] = useState('');
  const [userCertsToRevoke, setUserCertsToRevoke] = useState<any[]>([]);
  const [findingCerts, setFindingCerts] = useState(false);
  const { theme, setTheme, branding, updateBranding, translations, updateTranslations, aboutData, updateAboutData, portfolioData, updatePortfolio, addProject, removeProject, pressData, updatePress, addPress, removePress, labData, updateLab, addLab, removeLab, contact, updateContact, formSchemas, addFormSchema, updateFormSchema, removeFormSchema, volunteerFormConfig, updateVolunteerFormConfig, vacanciesFormConfig, updateVacanciesFormConfig, internshipsFormConfig, updateInternshipsFormConfig, resetSection, collaboratorsData, updateCollaborators } = useSiteStore();
  const [activeTab, setActiveTab] = useState<'theme' | 'branding' | 'translations' | 'about' | 'portfolio' | 'lab' | 'press' | 'contact' | 'forms' | 'applications' | 'capabilities' | 'collaborators' | 'admins' | 'users' | 'certificates' | 'logs'>('theme');

  const [profileLogs, setProfileLogs] = useState<any[]>([]);
  const [loadingProfileLogs, setLoadingProfileLogs] = useState(false);

  const loadProfileLogs = async () => {
    setLoadingProfileLogs(true);
    try {
        const q = query(collection(db, 'profileLogs'), orderBy('timestamp', 'desc'), limit(100));
        const snap = await getDocs(q);
        const logs: any[] = [];
        snap.forEach(doc => {
            logs.push({ id: doc.id, ...doc.data() });
        });
        setProfileLogs(logs);
    } catch (err) {
        console.error("Failed to load profile logs", err);
    }
    setLoadingProfileLogs(false);
  };
  const [activeAppTab, setActiveAppTab] = useState<'volunteer' | 'internship' | 'vacancy'>('volunteer');
  const [selectedFormForApps, setSelectedFormForApps] = useState<string | null>(null);
  const [selectedApplication, setSelectedApplication] = useState<any>(null);
  const [selectedLang, setSelectedLang] = useState('en');
  const [selectedCategory, setSelectedCategory] = useState<keyof PortfolioData>('fashion');
  const [newTranslationKey, setNewTranslationKey] = useState('');
  const [toastMessage, setToastMessage] = useState('');
  const [isToastVisible, setIsToastVisible] = useState(false);
  const [applications, setApplications] = useState<any[]>([]);
  const [loadingApps, setLoadingApps] = useState(false);
  const [appSearchQuery, setAppSearchQuery] = useState('');
  const [appStatusFilter, setAppStatusFilter] = useState<'applied' | 'approved' | 'rejected' | 'finalized'>('applied');
  const [lastAppDoc, setLastAppDoc] = useState<any>(null);
  const [hasMoreApps, setHasMoreApps] = useState(true);
  const [appsCache, setAppsCache] = useState<Record<string, { apps: any[], lastDoc: any, hasMore: boolean }>>({});
  const [adminsList, setAdminsList] = useState<any[]>([]);
  const [siteUsers, setSiteUsers] = useState<any[]>([]);
  const [usersFilter, setUsersFilter] = useState<'all' | 'banned'>('all');
  const [usersSearchQuery, setUsersSearchQuery] = useState('');
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [selectedSiteUser, setSelectedSiteUser] = useState<any>(null);
  const [certificates, setCertificates] = useState<any[]>([]);
  const [editingCert, setEditingCert] = useState<any>(null);
  const [loadingCertificates, setLoadingCertificates] = useState(false);
  const [showPickerModal, setShowPickerModal] = useState(false);
  const [pickerTarget, setPickerTarget] = useState<'name' | 'qr'>('name');
  const [pickerImageUrl, setPickerImageUrl] = useState("");
  const [pickerPosition, setPickerPosition] = useState({ x: 200, y: 300 });
  const [qrPickerPosition, setQrPickerPosition] = useState({ x: 100, y: 100 });
  const [pickerNaturalSize, setPickerNaturalSize] = useState({ w: 1, h: 1 });
  const [pendingAttendanceEvents, setPendingAttendanceEvents] = useState<any[]>([]);
  const [attendanceCheckEvent, setAttendanceCheckEvent] = useState<any>(null);
  const [attendanceAppList, setAttendanceAppList] = useState<any[]>([]);
  const [attendanceSelectedIds, setAttendanceSelectedIds] = useState<Set<string>>(new Set());
  const [attendanceLoading, setAttendanceLoading] = useState(false);

  const loadAdmins = async () => {
    try {
      const snapshot = await getDocs(collection(db, 'adminRoles'));
      const admins = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setAdminsList(admins);
    } catch (err) {
      console.error("Failed to load admins:", err);
    }
  };

  const [lastUserDoc, setLastUserDoc] = useState<any>(null);
  const [hasMoreUsers, setHasMoreUsers] = useState(true);

  const loadSiteUsers = async (loadMore = false) => {
    setLoadingUsers(true);
    try {
      let q = query(collection(db, 'users'), limit(50));
      if (loadMore && lastUserDoc) {
        q = query(collection(db, 'users'), startAfter(lastUserDoc), limit(50));
      }
      const snapshot = await getDocs(q);
      const fetchedUsers = snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() }));
      
      if (loadMore) {
        setSiteUsers(prev => [...prev, ...fetchedUsers]);
      } else {
        setSiteUsers(fetchedUsers);
      }
      
      if (snapshot.docs.length > 0) {
        setLastUserDoc(snapshot.docs[snapshot.docs.length - 1]);
      }
      setHasMoreUsers(snapshot.docs.length === 50);
    } catch (err) {
      console.error("Failed to load site users:", err);
    }
    setLoadingUsers(false);
  };

  const loadCertificates = async () => {
    setLoadingCertificates(true);
    try {
      const snapshot = await getDocs(collection(db, 'certificates'));
      const certs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setCertificates(certs);
    } catch (err) {
      console.error("Failed to load certificates:", err);
    }
    setLoadingCertificates(false);
  };

  useEffect(() => {
    if (adminRole === 'superadmin') {
      loadAdmins();
    }
    if (activeTab === 'users' && isAdmin) {
      loadSiteUsers();
    }
    if (activeTab === 'certificates' && isAdmin) {
      loadCertificates();
    }
  }, [adminRole, activeTab, isAdmin]);

  // Run auto-cleanup for event photos once per admin session
  useEffect(() => {
    if (!isAdmin || !formSchemas) return;
    
    let isChecking = false;
    const checkAutoCleanup = async () => {
      if (isChecking) return;
      isChecking = true;
      for (const schema of formSchemas) {
        if (schema.autoCleanupDate && !schema.isCleanedUp) {
          const cleanupDate = new Date(schema.autoCleanupDate);
          const threeWeeksAfter = new Date(cleanupDate.getTime() + 21 * 24 * 60 * 60 * 1000);
          
          if (new Date() > threeWeeksAfter) {
            console.log(`Auto-cleaning up photos for event: ${schema.name}`);
            try {
              const q = query(collection(db, 'volunteerApplications'), where('eventId', '==', schema.id));
              const snap = await getDocs(q);
              for (const appDoc of snap.docs) {
                await cleanUpCloudinaryImagesForApp(appDoc.data());
              }
              // Mark as cleaned up in db
              await updateDoc(doc(db, 'formSchemas', schema.id), { isCleanedUp: true });
              // Also update local store optimism
              updateFormSchema(schema.id, { ...schema, isCleanedUp: true });
            } catch (err) {
              console.error('Failed to run auto-cleanup for event', schema.id, err);
            }
          }
        }
      }
    };
    
    checkAutoCleanup();
  }, [isAdmin, formSchemas]);

  const loadApplications = async (formId: string, loadMore = false, searchQuery = '') => {
    if (!formId) return;
    
    const cacheKey = `${formId}_${searchQuery}`;

    // Check cache first if not loading more
    if (!loadMore && appsCache[cacheKey]) {
      setApplications(appsCache[cacheKey].apps);
      setLastAppDoc(appsCache[cacheKey].lastDoc);
      setHasMoreApps(appsCache[cacheKey].hasMore);
      return;
    }

    setLoadingApps(true);
    try {
      let q;
      if (searchQuery) {
         let constraints: any[] = [
            where('eventId', '==', formId), 
            where('searchKeywords', 'array-contains', searchQuery.toLowerCase().trim()),
            limit(30)
         ];
         if (loadMore && lastAppDoc) {
            constraints.splice(2, 0, startAfter(lastAppDoc));
         }
         q = query(collection(db, 'volunteerApplications'), ...constraints);
      } else {
         let constraints: any[] = [
            where('eventId', '==', formId), 
            orderBy('timestamp', 'desc'),
            limit(30)
         ];
         if (loadMore && lastAppDoc) {
            constraints.splice(2, 0, startAfter(lastAppDoc));
         }
         q = query(collection(db, 'volunteerApplications'), ...constraints);
      }

      const snapshot = await getDocs(q);
      const newAppsData = snapshot.docs.map(doc => ({ id: doc.id, ...(doc.data() as any) }));
      
      const newApps = newAppsData.map((app: any) => {
          return {
              ...app,
              name: app.name || app.formData?.name || '',
              surname: app.surname || app.formData?.surname || '',
              email: app.email || app.formData?.email || ''
          };
      });
      
      const lastVisible = snapshot.docs[snapshot.docs.length - 1];
      
      const updatedApps = loadMore ? [...applications, ...newApps] : newApps;
      const hasMore = snapshot.docs.length === 30;

      setApplications(updatedApps);
      setLastAppDoc(lastVisible);
      setHasMoreApps(hasMore);

      // Update cache
      setAppsCache(prev => ({
        ...prev,
        [cacheKey]: { apps: updatedApps, lastDoc: lastVisible, hasMore }
      }));
    } catch (err) {
      console.error("Failed to fetch applications:", err);
    } finally {
      setLoadingApps(false);
    }
  };

  const updateLocalAppStatus = (appId: string, newStatus: string) => {
    setApplications(apps => {
      const updated = apps.map(a => a.id === appId ? { ...a, status: newStatus } : a);
      if (selectedFormForApps) {
        setAppsCache(prev => ({
          ...prev,
          [selectedFormForApps]: {
            ...prev[selectedFormForApps],
            apps: updated
          }
        }));
      }
      return updated;
    });
    if (selectedApplication?.id === appId) {
      setSelectedApplication(prev => prev ? { ...prev, status: newStatus } : null);
    }
  };

  const deleteLocalApp = (appId: string) => {
    setApplications(apps => {
      const updated = apps.filter(a => a.id !== appId);
      if (selectedFormForApps) {
        setAppsCache(prev => ({
          ...prev,
          [selectedFormForApps]: {
            ...prev[selectedFormForApps],
            apps: updated
          }
        }));
      }
      return updated;
    });
    if (selectedApplication?.id === appId) {
      setSelectedApplication(null);
    }
  };

  useEffect(() => {
    let handler: any;
    if (activeTab === 'applications' && isAdmin && selectedFormForApps) {
      handler = setTimeout(() => {
        loadApplications(selectedFormForApps, false, appSearchQuery);
      }, 500); // Debounce search
    } else if (activeTab === 'applications' && isAdmin && !selectedFormForApps) {
      setApplications([]);
    }
    return () => {
      if (handler) clearTimeout(handler);
    };
  }, [activeTab, isAdmin, selectedFormForApps, appSearchQuery]);

  const [downloadLogs, setDownloadLogs] = useState<any[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [lastLogDoc, setLastLogDoc] = useState<any>(null);
  const [hasMoreLogs, setHasMoreLogs] = useState(true);

  const loadDownloadLogs = async (loadMore = false) => {
    setLoadingLogs(true);
    try {
        let q = query(collection(db, 'volunteerApplications'), where('status', '==', 'finalized'), limit(50));
        if (loadMore && lastLogDoc) {
          q = query(collection(db, 'volunteerApplications'), where('status', '==', 'finalized'), startAfter(lastLogDoc), limit(50));
        }
        const snap = await getDocs(q);
        const logs: any[] = [];
        snap.forEach(doc => {
            const data = doc.data();
                    let submitter = '';
                    if (data.name || data.surname) {
                        submitter = `${data.name || ''} ${data.surname || ''}`.trim();
                    } else {
                        const orderedData = getOrderedFormData({...data, id: doc.id});
                        submitter = orderedData.length > 0 ? orderedData[0]?.[1] || data.formData?.name || data.name || 'Unknown Name' : data.formData?.name || data.name || 'Unknown Name';
                    }

                    if (data.downloadHistory && data.downloadHistory.length > 0) {
                        logs.push({
                            id: doc.id,
                            userId: data.userId,
                            eventName: data.eventName,
                            email: data.formData?.email || data.email || 'Unknown Email',
                            name: submitter,
                            history: data.downloadHistory,
                            trackingCode: data.certificateTrackingCode
                        });
                    }
        });
        
        // Flatten and sort by date descending
        const flattenedLogs = logs.map(l => {
            return {
                ...l,
                lastDownload: new Date(Math.max(...l.history.map((d: string) => new Date(d).getTime()))).toISOString()
            }
        }).sort((a,b) => new Date(b.lastDownload).getTime() - new Date(a.lastDownload).getTime());

        if (loadMore) {
          setDownloadLogs(prev => {
            // Keep unique items
            const newArray = [...prev, ...flattenedLogs];
            const unique = newArray.filter((v, i, a) => a.findIndex(t => (t.id === v.id)) === i);
            return unique.sort((a,b) => new Date(b.lastDownload).getTime() - new Date(a.lastDownload).getTime());
          });
        } else {
          setDownloadLogs(flattenedLogs);
        }

        if (snap.docs.length > 0) {
          setLastLogDoc(snap.docs[snap.docs.length - 1]);
        }
        setHasMoreLogs(snap.docs.length === 50);
    } catch (err) {
        console.error("Failed to load logs", err);
    }
    setLoadingLogs(false);
  };

  const showToast = (msg: string, isError: boolean = false) => {
    setToastMessage(msg);
    setIsToastVisible(true);
    setTimeout(() => setIsToastVisible(false), 3000);
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('admin') === 'forms') {
      setIsOpen(true);
      setActiveTab('forms');
    }
  }, []);

  const checkAdminRole = async (email: string | null) => {
    if (!email) return null;
    if (email === 'coyoraofficial@gmail.com') {
      return 'superadmin';
    }
    try {
      const roleDoc = await getDoc(doc(db, 'adminRoles', email));
      if (roleDoc.exists()) {
        return roleDoc.data().role as 'superadmin' | 'formadmin' | 'contenteditor';
      }
    } catch (err) {
      console.error("Error checking role:", err);
    }
    return null;
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user && user.emailVerified) {
        const role = await checkAdminRole(user.email);
        if (role) {
          setAdminRole(role);
          setIsAdmin(true);
          setIsAuthenticated(true);
        } else {
          await signOut(auth);
          setIsAuthenticated(false);
          setIsAdmin(false);
          setAdminRole(null);
          setError('Unauthorized email address.');
        }
      } else {
        setIsAuthenticated(false);
        setIsAdmin(false);
        setAdminRole(null);
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const checkPendingAttendance = async () => {
      if (!isAdmin || !formSchemas || formSchemas.length === 0) return;
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // Find events that are in the past and have an eventDate
      const pastEvents = formSchemas.filter(s => {
        if (s.category !== 'volunteer' && s.category !== 'internship' && s.category !== 'vacancy') return false; // Ensure it's a form with apps
        if (!s.eventDate) return false;
        const d = new Date(s.eventDate);
        return d < today;
      });

      if (pastEvents.length === 0) {
        setPendingAttendanceEvents([]);
        return;
      }

      // Check which past events still have 'approved' applications
      const pendingEvents = [];
      for (const event of pastEvents) {
        try {
          const q = query(
            collection(db, 'volunteerApplications'),
            where('eventId', '==', event.id),
            where('status', '==', 'approved'),
            limit(1) // Only need to check if AT LEAST ONE exists
          );
          const snap = await getDocs(q);
          if (!snap.empty) {
            pendingEvents.push(event);
          }
        } catch (err) {
          console.error("Error checking attendance for event", event.id, err);
        }
      }
      setPendingAttendanceEvents(pendingEvents);
    };

    checkPendingAttendance();
  }, [formSchemas, isAdmin]);

  useEffect(() => {
    const findCerts = async () => {
      if (!revokeEmail || revokeEmail.length < 5) {
        setUserCertsToRevoke([]);
        return;
      }
      setFindingCerts(true);
      try {
        const qUser = query(collection(db, 'users'), where('email', '==', revokeEmail.trim()), limit(1));
        const userSnap = await getDocs(qUser);
        if (userSnap.empty) {
          setUserCertsToRevoke([]);
          setFindingCerts(false);
          return;
        }
        
        const targetUid = userSnap.docs[0].id;
        const qApps = query(collection(db, 'volunteerApplications'), where('userId', '==', targetUid), where('status', '==', 'finalized'));
        const appsSnap = await getDocs(qApps);
        
        setUserCertsToRevoke(appsSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (e) {
        console.error(e);
        setUserCertsToRevoke([]);
      } finally {
        setFindingCerts(false);
      }
    };

    const timeoutId = setTimeout(findCerts, 500);
    return () => clearTimeout(timeoutId);
  }, [revokeEmail]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      const result = await signInWithPopup(auth, provider);
      if (result.user.emailVerified) {
        const role = await checkAdminRole(result.user.email);
        if (role) {
          setAdminRole(role);
          setIsAdmin(true);
          setIsAuthenticated(true);
          setError('');
        } else {
          await signOut(auth);
          setIsAuthenticated(false);
          setIsAdmin(false);
          setAdminRole(null);
          setError('Unauthorized email address.');
        }
      } else {
        await signOut(auth);
        setIsAuthenticated(false);
        setIsAdmin(false);
        setAdminRole(null);
        setError('Email not verified.');
      }
    } catch (err: any) {
      if (err.code === 'auth/cancelled-popup-request' || err.code === 'auth/popup-closed-by-user') {
        console.log('Login cancelled by user.');
      } else {
        console.error("Login error:", err);
        setError(err.message || 'Failed to login');
      }
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    setIsAuthenticated(false);
  };

  const handleAddTranslationKey = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTranslationKey.trim()) {
      const key = newTranslationKey.trim();
      updateTranslations('en', key, newTranslationKey);
      updateTranslations('ru', key, newTranslationKey);
      updateTranslations('az', key, newTranslationKey);
      setNewTranslationKey('');
      showToast('Translation key added');
    }
  };

  const handleAddProject = () => {
    addProject(selectedCategory, { name: 'New Project', images: [] });
  };

  const handleAddFormSchema = async (category: 'volunteer' | 'internship' | 'vacancy') => {
    try {
      await addDoc(collection(db, 'formSchemas'), {
        category,
        name: `New ${category}`,
        date: 'TBD',
        description: '',
        createdAt: serverTimestamp()
      });
    } catch (err) {
      try {
        handleFirestoreError(err, OperationType.CREATE, 'formSchemas');
      } catch (e: any) {
        setError(JSON.parse(e.message).error || `Failed to add ${category}`);
      }
    }
  };

  const handleLocalUpdateFormSchema = (id: string, field: string, value: any) => {
    const schema = formSchemas.find(e => e.id === id);
    if (schema) {
      updateFormSchema(id, { ...schema, [field]: value });
    }
  };

  const handleSaveFormSchema = async (id: string) => {
    try {
      const schema = formSchemas.find(e => e.id === id);
      if (!schema) return;

      const schemaRef = doc(db, 'formSchemas', id);
      const updateData: any = {
        name: schema.name,
        date: schema.date,
        description: schema.description,
        fields: schema.fields || [],
        allowedEmails: schema.allowedEmails || []
      };
      
      if (schema.eventDate !== undefined) updateData.eventDate = schema.eventDate || null;
      if (schema.autoCleanupDate !== undefined) updateData.autoCleanupDate = schema.autoCleanupDate || null;
      if (schema.status !== undefined) updateData.status = schema.status;
      if (schema.isCleanedUp !== undefined) updateData.isCleanedUp = schema.isCleanedUp;

      await updateDoc(schemaRef, updateData);
      showToast('Form saved successfully!');
    } catch (err) {
      try {
        handleFirestoreError(err, OperationType.UPDATE, `formSchemas/${id}`);
      } catch (e: any) {
        setError(JSON.parse(e.message).error || "Failed to update form");
      }
    }
  };

  const handleDeleteFormSchema = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'formSchemas', id));
    } catch (err) {
      try {
        handleFirestoreError(err, OperationType.DELETE, `formSchemas/${id}`);
      } catch (e: any) {
        setError(JSON.parse(e.message).error || "Failed to delete form");
      }
    }
  };

  const handleSaveSection = async (section: string, data: any) => {
    try {
      await setDoc(doc(db, 'settings', 'global'), { [section]: { data } }, { merge: true });
      showToast(`${section.charAt(0).toUpperCase() + section.slice(1)} saved successfully!`);
    } catch (err) {
      console.error(`Failed to save ${section}:`, err);
      setError(`Failed to save ${section}`);
    }
  };

  const handleSaveFormConfig = async () => {
    try {
      await setDoc(doc(db, 'settings', 'global'), { volunteerForm: { data: volunteerFormConfig } }, { merge: true });
      showToast('General Config saved successfully!');
    } catch (err) {
      console.error("Failed to save form config to Firestore:", err);
      setError("Failed to save form config");
    }
  };

  const handleSaveVacanciesFormConfig = async () => {
    try {
      await setDoc(doc(db, 'settings', 'global'), { vacanciesForm: { data: vacanciesFormConfig } }, { merge: true });
      showToast('Vacancies Config saved successfully!');
    } catch (err) {
      console.error("Failed to save vacancies form config to Firestore:", err);
      setError("Failed to save vacancies form config");
    }
  };

  const handleSaveInternshipsFormConfig = async () => {
    try {
      await setDoc(doc(db, 'settings', 'global'), { internshipsForm: { data: internshipsFormConfig } }, { merge: true });
      showToast('Internships Config saved successfully!');
    } catch (err) {
      console.error("Failed to save internships form config to Firestore:", err);
      setError("Failed to save internships form config");
    }
  };

  // ФИКС ТУТ: Собираем ответы по field.label, чтобы порядок был нормальный
  const openAttendanceCheck = async (event: any) => {
    setAttendanceCheckEvent(event);
    setAttendanceLoading(true);
    try {
      const q = query(
        collection(db, 'volunteerApplications'),
        where('eventId', '==', event.id),
        where('status', '==', 'approved')
      );
      const snap = await getDocs(q);
      const newAppsData = snap.docs.map(doc => ({id: doc.id, ...doc.data()}));
      
      const apps = newAppsData.map((app: any) => {
          return {
              ...app,
              name: app.profileName || app.name || '',
              surname: app.profileSurname || app.surname || '',
              email: app.email || ''
          };
      });
      
      setAttendanceAppList(apps);
      setAttendanceSelectedIds(new Set(apps.map(a => a.id))); // all selected by default
    } catch (err) {
      console.error(err);
      showToast('Failed to load apps for attendance');
      setAttendanceCheckEvent(null);
    } finally {
      setAttendanceLoading(false);
    }
  };

  const confirmAttendance = async () => {
    if (!attendanceCheckEvent) return;
    setAttendanceLoading(true);
    try {
      for (const app of attendanceAppList) {
        if (attendanceSelectedIds.has(app.id)) {
           // attended: issue certificate -> status: finalized
           const certificateTrackingCode = Math.random().toString(36).substring(2, 10).toUpperCase();
           await updateDoc(doc(db, 'volunteerApplications', app.id), {
             status: 'finalized',
             certificateTrackingCode
           });
        } else {
           // missed
           await updateDoc(doc(db, 'volunteerApplications', app.id), {
             status: 'missed'
           });
        }
      }
      showToast('Certificates issued successfully!');
      setAttendanceCheckEvent(null);
      setPendingAttendanceEvents(pts => pts.filter(p => p.id !== attendanceCheckEvent.id));
      if (selectedFormForApps === attendanceCheckEvent.id) {
         loadApplications(attendanceCheckEvent.id); // Reload
      }
    } catch (err) {
      console.error(err);
      showToast('Error issuing certificates');
    } finally {
      setAttendanceLoading(false);
    }
  };

  const getOrderedFormData = (app: any) => {
    if (!app || !app.formData) return [];
    
    const schemaId = app.eventId || app.formId;
    const schema = formSchemas.find(s => s.id === schemaId);
    
    const orderedEntries: [string, any][] = [];
    const processedKeys = new Set<string>();

    if (schema && schema.fields) {
      schema.fields.forEach((field: any) => {
        // Try multiple possible ways the key could be saved
        const keyOptions = [field.label, field.question];
        let foundKey = undefined;

        for (const opt of keyOptions) {
          if (opt && app.formData[opt] !== undefined) {
             foundKey = opt;
             break;
          }
        }

        if (foundKey) {
          orderedEntries.push([foundKey, app.formData[foundKey]]);
          processedKeys.add(foundKey);
        } else if (field.label) {
          // It's possible the data isn't there, but we want to show it as empty for order
          // But it's better to just skip if they didn't answer and it wasn't required
        }
      });
    }

    // Add any remaining fields that weren't in the schema
    Object.entries(app.formData).forEach(([key, value]) => {
      if (!processedKeys.has(key)) {
        orderedEntries.push([key, value]);
      }
    });

    return orderedEntries;
  };

  return (
    <>
      <Toast message={toastMessage} isVisible={isToastVisible} onClose={() => setIsToastVisible(false)} />
      <button 
        onClick={() => setIsOpen(true)}
        aria-label="Open Admin Panel"
        className="fixed bottom-6 right-6 w-12 h-12 bg-[#fe0000] text-white rounded-full flex items-center justify-center shadow-lg z-50 hover:scale-110 transition-transform"
      >
        <Settings size={20} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white w-full h-full max-w-none max-h-none rounded-none shadow-2xl overflow-hidden flex flex-col text-black border border-gray-200"
            >
              {!isAuthenticated ? (
                <div className="p-12 flex flex-col items-center justify-center min-h-[400px]">
                  <div className="w-full max-w-xs">
                    <div className="flex justify-between items-center mb-8">
                      <h2 className="text-2xl font-bold font-head uppercase">Admin Login</h2>
                      <button onClick={() => { setIsOpen(false); onClose?.(); }} aria-label="Close Login" className="text-[#6b7280] hover:text-[#fe0000]">
                        <X size={24} />
                      </button>
                    </div>
                    <form onSubmit={handleLogin} className="flex flex-col gap-4">
                      <p className="text-sm font-mono text-[#6b7280] mb-4">
                        Please sign in with your authorized Google account to access the admin panel.
                      </p>
                      {error && <span className="text-red-500 text-xs font-mono">{error}</span>}
                      <button type="submit" className="w-full bg-[#fe0000] text-white rounded-lg p-3 font-mono uppercase tracking-widest hover:bg-red-700 transition-colors">
                        Sign in with Google
                      </button>
                    </form>
                  </div>
                </div>
              ) : (
                <>
                  <div className="p-6 border-b border-[#e5e7eb] flex justify-between items-center bg-white shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-[#fe0000] text-white rounded flex items-center justify-center font-bold">
                            <Settings size={18} />
                        </div>
                        <h2 className="text-xl font-bold font-head tracking-tight uppercase">Admin Console</h2>
                    </div>
                    <div className="flex gap-4 items-center">
                      <button onClick={handleLogout} className="flex items-center gap-2 text-xs font-medium text-[#6b7280] hover:text-[#fe0000] transition-colors">
                        Logout
                      </button>
                      <div className="w-px h-4 bg-[#e5e7eb]" />
                      <button onClick={() => {
                        if (window.confirm(`Are you sure you want to reset the "${activeTab}" section to its default values?`)) {
                          resetSection(activeTab);
                          showToast(`Section "${activeTab}" reset to defaults`);
                        }
                      }} className="flex items-center gap-1.5 text-xs font-medium text-[#6b7280] hover:text-red-600 transition-colors">
                        <RefreshCw size={12} /> Reset Section
                      </button>
                      <button onClick={() => { setIsOpen(false); onClose?.(); }} aria-label="Close Admin Panel" className="ml-2 text-[#6b7280] hover:text-black transition-colors bg-gray-100 hover:bg-gray-200 p-2 rounded-full">
                        <X size={18} />
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-col md:flex-row flex-1 overflow-hidden bg-[#f9fafb]">
                    {/* Sidebar */}
                <div className="w-full md:w-64 border-b md:border-b-0 md:border-r border-[#e5e7eb] p-4 flex md:flex-col gap-1 overflow-x-auto md:overflow-y-auto whitespace-nowrap bg-white shrink-0 tracking-tight">
                  {(adminRole === 'superadmin') && (
                    <div className="mb-4">
                      <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-3 mb-2 hidden md:block">System</div>
                      <button onClick={() => setActiveTab('theme')} className={`w-full flex items-center gap-3 text-left px-3 py-2 rounded-lg text-sm transition-colors ${activeTab === 'theme' ? 'bg-[#fff0f0] text-[#fe0000] font-medium' : 'text-gray-600 hover:bg-gray-50 hover:text-black'}`}>
                        <Palette size={16} /> Theme
                      </button>
                      <button onClick={() => setActiveTab('branding')} className={`w-full flex items-center gap-3 text-left px-3 py-2 rounded-lg text-sm transition-colors ${activeTab === 'branding' ? 'bg-[#fff0f0] text-[#fe0000] font-medium' : 'text-gray-600 hover:bg-gray-50 hover:text-black'}`}>
                        <ImageIcon size={16} /> Branding
                      </button>
                      <button onClick={() => setActiveTab('admins')} className={`w-full flex items-center gap-3 text-left px-3 py-2 rounded-lg text-sm transition-colors ${activeTab === 'admins' ? 'bg-[#fff0f0] text-[#fe0000] font-medium' : 'text-gray-600 hover:bg-gray-50 hover:text-black'}`}>
                        <ShieldCheck size={16} /> Admins
                      </button>
                      <button onClick={() => setActiveTab('users')} className={`w-full flex items-center gap-3 text-left px-3 py-2 rounded-lg text-sm transition-colors ${activeTab === 'users' ? 'bg-[#fff0f0] text-[#fe0000] font-medium' : 'text-gray-600 hover:bg-gray-50 hover:text-black'}`}>
                        <Users size={16} /> Users
                      </button>
                      <button onClick={() => setActiveTab('system_tools')} className={`w-full flex items-center gap-3 text-left px-3 py-2 rounded-lg text-sm transition-colors ${activeTab === 'system_tools' ? 'bg-[#fff0f0] text-[#fe0000] font-medium' : 'text-gray-600 hover:bg-gray-50 hover:text-black'}`}>
                        <Database size={16} /> System Tools
                      </button>
                    </div>
                  )}
                  {(adminRole === 'superadmin' || adminRole === 'contenteditor') && (
                    <div className="mb-4 text-left">
                      <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-3 mb-2 hidden md:block">Content Management</div>
                      <button onClick={() => setActiveTab('about')} className={`w-full flex items-center gap-3 text-left px-3 py-2 rounded-lg text-sm transition-colors ${activeTab === 'about' ? 'bg-[#fff0f0] text-[#fe0000] font-medium' : 'text-gray-600 hover:bg-gray-50 hover:text-black'}`}>
                        <Info size={16} /> About
                      </button>
                      <button onClick={() => setActiveTab('capabilities')} className={`w-full flex items-center gap-3 text-left px-3 py-2 rounded-lg text-sm transition-colors ${activeTab === 'capabilities' ? 'bg-[#fff0f0] text-[#fe0000] font-medium' : 'text-gray-600 hover:bg-gray-50 hover:text-black'}`}>
                        <Zap size={16} /> Core Capabilities
                      </button>
                      <button onClick={() => setActiveTab('translations')} className={`w-full flex items-center gap-3 text-left px-3 py-2 rounded-lg text-sm transition-colors ${activeTab === 'translations' ? 'bg-[#fff0f0] text-[#fe0000] font-medium' : 'text-gray-600 hover:bg-gray-50 hover:text-black'}`}>
                        <Languages size={16} /> Translations
                      </button>
                      <button onClick={() => setActiveTab('portfolio')} className={`w-full flex items-center gap-3 text-left px-3 py-2 rounded-lg text-sm transition-colors ${activeTab === 'portfolio' ? 'bg-[#fff0f0] text-[#fe0000] font-medium' : 'text-gray-600 hover:bg-gray-50 hover:text-black'}`}>
                        <Briefcase size={16} /> Portfolio
                      </button>
                      <button onClick={() => setActiveTab('lab')} className={`w-full flex items-center gap-3 text-left px-3 py-2 rounded-lg text-sm transition-colors ${activeTab === 'lab' ? 'bg-[#fff0f0] text-[#fe0000] font-medium' : 'text-gray-600 hover:bg-gray-50 hover:text-black'}`}>
                        <FlaskConical size={16} /> Lab / Experiments
                      </button>
                      <button onClick={() => setActiveTab('press')} className={`w-full flex items-center gap-3 text-left px-3 py-2 rounded-lg text-sm transition-colors ${activeTab === 'press' ? 'bg-[#fff0f0] text-[#fe0000] font-medium' : 'text-gray-600 hover:bg-gray-50 hover:text-black'}`}>
                        <Newspaper size={16} /> Press & Media
                      </button>
                      <button onClick={() => setActiveTab('collaborators')} className={`w-full flex items-center gap-3 text-left px-3 py-2 rounded-lg text-sm transition-colors ${activeTab === 'collaborators' ? 'bg-[#fff0f0] text-[#fe0000] font-medium' : 'text-gray-600 hover:bg-gray-50 hover:text-black'}`}>
                        <Users size={16} /> Collaborators
                      </button>
                      <button onClick={() => setActiveTab('contact')} className={`w-full flex items-center gap-3 text-left px-3 py-2 rounded-lg text-sm transition-colors ${activeTab === 'contact' ? 'bg-[#fff0f0] text-[#fe0000] font-medium' : 'text-gray-600 hover:bg-gray-50 hover:text-black'}`}>
                        <Phone size={16} /> Contact Info
                      </button>
                    </div>
                  )}
                  {(adminRole === 'superadmin' || adminRole === 'formadmin') && (
                    <div className="mb-4 text-left">
                      <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-3 mb-2 hidden md:block">Engagement</div>
                      <button onClick={() => setActiveTab('forms')} className={`w-full flex items-center gap-3 text-left px-3 py-2 rounded-lg text-sm transition-colors ${activeTab === 'forms' ? 'bg-[#fff0f0] text-[#fe0000] font-medium' : 'text-gray-600 hover:bg-gray-50 hover:text-black'}`}>
                        <FileText size={16} /> Forms & Events
                      </button>
                      <button onClick={() => setActiveTab('applications')} className={`w-full flex items-center gap-3 text-left px-3 py-2 rounded-lg text-sm transition-colors ${activeTab === 'applications' ? 'bg-[#fff0f0] text-[#fe0000] font-medium' : 'text-gray-600 hover:bg-gray-50 hover:text-black'}`}>
                        <Inbox size={16} /> Applications (CRM)
                      </button>
                      <button onClick={() => setActiveTab('certificates')} className={`w-full flex items-center gap-3 text-left px-3 py-2 rounded-lg text-sm transition-colors ${activeTab === 'certificates' ? 'bg-[#fff0f0] text-[#fe0000] font-medium' : 'text-gray-600 hover:bg-gray-50 hover:text-black'}`}>
                        <Award size={16} /> Certificates
                      </button>
                      {adminRole === 'superadmin' && (
                        <button onClick={() => { setActiveTab('logs'); loadProfileLogs(); }} className={`w-full flex items-center gap-3 text-left px-3 py-2 rounded-lg text-sm transition-colors ${activeTab === 'logs' ? 'bg-[#fff0f0] text-[#fe0000] font-medium' : 'text-gray-600 hover:bg-gray-50 hover:text-black'}`}>
                          <FileClock size={16} /> Audit Logs
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 overflow-hidden flex flex-col" data-lenis-prevent="true">
                  <div className="flex-1 overflow-y-auto p-6 md:p-8">
                    <div className="mx-auto max-w-5xl">
                  {activeTab === 'branding' && (
                    <div className="space-y-6">
                      <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-bold">Branding</h3>
                        <button 
                          onClick={async () => {
                            try {
                              await setDoc(doc(db, 'settings', 'branding'), { data: branding }, { merge: true });
                              showToast('Branding saved successfully!');
                            } catch (err) {
                              console.error('Failed to save branding:', err);
                              showToast('Failed to save branding');
                            }
                          }}
                          className="bg-[#fe0000] text-white px-4 py-1.5 rounded text-sm hover:bg-red-700 transition-colors flex items-center gap-2"
                        >
                          <Save size={16} /> Save Branding
                        </button>
                      </div>
                      
                      <div className="space-y-4 bg-[#f9fafb] p-4 rounded border border-[#e5e7eb]">
                        <div>
                          <label className="block text-xs font-bold mb-1 text-[#6b7280]">Site Logo URL</label>
                          <input 
                            type="text" 
                            value={branding?.logoUrl || ''} 
                            onChange={(e) => updateBranding({ ...branding, logoUrl: e.target.value })}
                            className="w-full bg-white border border-[#e5e7eb] rounded p-2 text-sm"
                            placeholder="https://example.com/logo.png"
                          />
                          {branding?.logoUrl && (
                            <img src={branding.logoUrl} alt="Logo Preview" className="mt-2 h-16 object-contain rounded border border-[#e5e7eb] bg-white p-2" />
                          )}
                        </div>
                        
                        <div>
                          <label className="block text-xs font-bold mb-1 text-[#6b7280]">Favicon URL</label>
                          <input 
                            type="text" 
                            value={branding?.faviconUrl || ''} 
                            onChange={(e) => updateBranding({ ...branding, faviconUrl: e.target.value })}
                            className="w-full bg-white border border-[#e5e7eb] rounded p-2 text-sm"
                            placeholder="https://example.com/favicon.ico"
                          />
                          {branding?.faviconUrl && (
                            <img src={branding.faviconUrl} alt="Favicon Preview" className="mt-2 h-8 w-8 object-contain rounded border border-[#e5e7eb] bg-white p-1" />
                          )}
                        </div>

                        <div>
                          <label className="block text-xs font-bold mb-1 text-[#6b7280]">Social Share Image (OG Image) URL</label>
                          <input 
                            type="text" 
                            value={branding?.ogImageUrl || ''} 
                            onChange={(e) => updateBranding({ ...branding, ogImageUrl: e.target.value })}
                            className="w-full bg-white border border-[#e5e7eb] rounded p-2 text-sm"
                            placeholder="https://example.com/og-image.jpg"
                          />
                          {branding?.ogImageUrl && (
                            <img src={branding.ogImageUrl} alt="OG Image Preview" className="mt-2 h-32 object-cover rounded border border-[#e5e7eb]" />
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === 'about' && (
                    <div className="space-y-6">
                      <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-bold">About Section</h3>
                        <div className="flex gap-4">
                          <div className="flex gap-2 bg-[#f9fafb] p-1 rounded">
                            {['en', 'ru', 'az'].map(l => (
                              <button key={l} onClick={() => setSelectedLang(l)} className={`px-4 py-1 rounded font-mono uppercase ${selectedLang === l ? 'bg-[#fe0000] text-white' : 'bg-transparent'}`}>{l}</button>
                            ))}
                          </div>
                          <button 
                            onClick={async () => {
                              try {
                                await setDoc(doc(db, 'settings', 'about'), { data: aboutData }, { merge: true });
                                await setDoc(doc(db, 'settings', 'translations'), { data: translations }, { merge: true });
                                showToast('About section saved successfully!');
                              } catch (err) {
                                console.error('Failed to save about:', err);
                                showToast('Failed to save about section');
                              }
                            }}
                            className="bg-[#fe0000] text-white px-4 py-1.5 rounded text-sm hover:bg-red-700 transition-colors flex items-center gap-2"
                          >
                            <Save size={16} /> Save About
                          </button>
                        </div>
                      </div>
                      
                      <div className="space-y-4 bg-[#f9fafb] p-4 rounded border border-[#e5e7eb]">
                        <div>
                          <label className="block text-xs font-bold mb-1 text-[#6b7280]">Image URL</label>
                          <input 
                            type="text" 
                            value={aboutData?.image || ''} 
                            onChange={(e) => updateAboutData({ ...aboutData, image: e.target.value })}
                            className="w-full bg-white border border-[#e5e7eb] rounded p-2 text-sm"
                            placeholder="https://example.com/image.jpg"
                          />
                          {aboutData?.image && (
                            <img src={aboutData.image} alt="Preview" className="mt-2 h-32 object-cover rounded border border-[#e5e7eb]" />
                          )}
                        </div>
                        
                        <div>
                          <label className="block text-xs font-bold mb-1 text-[#6b7280]">Title ({selectedLang.toUpperCase()})</label>
                          <input 
                            type="text" 
                            value={translations[selectedLang]?.about_title || ''} 
                            onChange={(e) => updateTranslations(selectedLang, 'about_title', e.target.value)}
                            className="w-full bg-white border border-[#e5e7eb] rounded p-2 text-sm"
                            placeholder="e.g. RAMAZAN HABIBOV"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-xs font-bold mb-1 text-[#6b7280]">Description ({selectedLang.toUpperCase()})</label>
                          <textarea 
                            value={translations[selectedLang]?.about_text || ''} 
                            onChange={(e) => updateTranslations(selectedLang, 'about_text', e.target.value)}
                            className="w-full bg-white border border-[#e5e7eb] rounded p-2 text-sm min-h-[150px]"
                            placeholder="Enter description..."
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === 'theme' && (
                    <div className="space-y-6">
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-bold">Site Theme</h3>
                        <button 
                          onClick={() => handleSaveSection('theme', theme)}
                          className="bg-[#fe0000] text-white px-4 py-1.5 rounded text-sm hover:bg-red-700 transition-colors flex items-center gap-2"
                        >
                          <Save size={16} /> Save Theme
                        </button>
                      </div>
                      <div className="flex gap-4">
                        <button 
                          onClick={() => setTheme('light')}
                          className={`flex-1 p-6 border rounded-xl flex flex-col items-center gap-4 ${theme === 'light' ? 'border-[#fe0000] bg-[#fe0000]/5' : 'border-[#e5e7eb]'}`}
                        >
                          <Sun size={32} />
                          <span className="font-mono">Light Mode</span>
                        </button>
                        <button 
                          onClick={() => setTheme('dark')}
                          className={`flex-1 p-6 border rounded-xl flex flex-col items-center gap-4 ${theme === 'dark' ? 'border-[#fe0000] bg-[#fe0000]/5' : 'border-[#e5e7eb]'}`}
                        >
                          <Moon size={32} />
                          <span className="font-mono">Dark Mode</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {activeTab === 'capabilities' && (
                    <div className="space-y-6">
                      <div className="flex justify-between items-center mb-6">
                        <div className="flex gap-2">
                          {['en', 'ru', 'az'].map(l => (
                            <button key={l} onClick={() => setSelectedLang(l)} className={`px-4 py-1 rounded font-mono uppercase ${selectedLang === l ? 'bg-[#fe0000] text-white' : 'bg-[#f9fafb]'}`}>{l}</button>
                          ))}
                        </div>
                        <button 
                          onClick={() => handleSaveSection('translations', translations)}
                          className="bg-[#fe0000] text-white px-4 py-1.5 rounded text-sm hover:bg-red-700 transition-colors flex items-center gap-2"
                        >
                          <Save size={16} /> Save Capabilities
                        </button>
                      </div>
                      <div className="space-y-8">
                        {Object.keys(portfolioData).map(cap => (
                          <div key={cap} className="border border-[#e5e7eb] p-4 rounded-xl space-y-4">
                            <h4 className="font-bold uppercase text-lg">{cap}</h4>
                            <div className="flex flex-col gap-1">
                              <label className="text-xs font-mono text-[#6b7280]">Title</label>
                              <input 
                                type="text"
                                value={translations[selectedLang]?.[`s_${cap}`] || ''}
                                onChange={(e) => updateTranslations(selectedLang, `s_${cap}`, e.target.value)}
                                className="w-full bg-transparent border border-[#e5e7eb] rounded p-2 text-sm"
                              />
                            </div>
                            <div className="flex flex-col gap-1">
                              <label className="text-xs font-mono text-[#6b7280]">Description</label>
                              <textarea 
                                value={translations[selectedLang]?.[`s_${cap}_p`] || ''}
                                onChange={(e) => updateTranslations(selectedLang, `s_${cap}_p`, e.target.value)}
                                className="w-full bg-transparent border border-[#e5e7eb] rounded p-2 text-sm min-h-[80px]"
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {activeTab === 'translations' && (
                    <div className="space-y-6">
                      <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-bold">Translations</h3>
                        <div className="flex gap-4 items-center">
                          <form onSubmit={handleAddTranslationKey} className="flex gap-2">
                            <input 
                              type="text"
                              value={newTranslationKey}
                              onChange={(e) => setNewTranslationKey(e.target.value)}
                              placeholder="New translation key"
                              className="bg-transparent border border-[#e5e7eb] rounded p-1.5 text-sm font-mono w-48"
                            />
                            <button type="submit" className="bg-[#f9fafb] border border-[#e5e7eb] px-3 py-1.5 rounded text-sm hover:bg-[#fe0000] hover:text-white transition-colors">
                              Add Key
                            </button>
                          </form>
                          <button 
                            onClick={() => handleSaveSection('translations', translations)}
                            className="bg-[#fe0000] text-white px-4 py-1.5 rounded text-sm hover:bg-red-700 transition-colors flex items-center gap-2"
                          >
                            <Save size={16} /> Save Translations
                          </button>
                        </div>
                      </div>
                      {(() => {
                        const allKeys = Array.from(new Set([
                          ...Object.keys(translations['en'] || {}),
                          ...Object.keys(translations['ru'] || {}),
                          ...Object.keys(translations['az'] || {})
                        ])).sort();

                      const translationGroups = [
                        { title: 'ШАПКА / HEADER', keys: ['nav_design', 'nav_about', 'nav_contact', 'working_worldwide', 'sound', 'light', 'dark'] },
                        { title: 'ОБЛОЖКА / HERO', keys: ['studio'] },
                        { title: '[ CORE CAPABILITIES ]', keys: ['core_capabilities', 'select_module', 's_fashion', 's_fashion_p', 's_event', 's_event_p', 's_graphic', 's_graphic_p', 's_web', 's_web_p'] },
                        { title: 'ABOUT / MANIFESTO', keys: ['about_title', 'about_text', 'manifesto'] },
                        { title: 'PORTFOLIO / PROJECTS', keys: ['back_to_projects', 'coming_soon', 'visit_site', 'timeline'] },
                        { title: '[ LAB / EXPERIMENTS ]', keys: ['lab_experiments', 'rd_division', 'experiments'] },
                        { title: '[ PRESS & MEDIA ]', keys: ['press_media', 'publications'] },
                        { title: '[ COLLABORATORS ]', keys: ['collaborators'] },
                        { title: 'CARRER / OPPORTUNITIES', keys: ['vacancies', 'vacancies_info', 'internship', 'internship_info', 'volunteer', 'select_event', 'no_events', 'form_not_configured', 'close'] },
                        { title: 'CONTACT / FORMS', keys: ['lets_talk', 'initiate_sequence', 'name', 'company', 'project_type', 'budget', 'message', 'send_inquiry', 'success_contact'] },
                        { title: 'FOOTER / NEWSLETTER', keys: ['subscribe_void', 'enter_email', 'join', 'success_subscribe', 'success_copy', 'designed_by'] },
                      ];

                      // Collect categorized keys
                      const categorizedKeys = new Set(translationGroups.flatMap(g => g.keys));
                      const uncategorizedKeys = allKeys.filter(k => !categorizedKeys.has(k));

                      if (uncategorizedKeys.length > 0) {
                        translationGroups.push({ title: 'OTHER / OTHERS', keys: uncategorizedKeys });
                      }

                      return (
                        <div className="space-y-8">
                          {translationGroups.map((group) => (
                            <div key={group.title} className="space-y-4">
                              <h4 className="font-bold text-sm tracking-widest text-[#fe0000] border-b border-[#e5e7eb] pb-2 uppercase">{group.title}</h4>
                              <div className="space-y-4">
                                {group.keys.map((key) => {
                                  // Skip if key doesn't exist in our data at all (in case a predefined key was fully deleted, though unlikely)
                                  if (!allKeys.includes(key)) return null;
                                  return (
                                    <details key={key} className="border border-[#e5e7eb] rounded-xl overflow-hidden group">
                                      <summary className="p-4 bg-[#f9fafb] cursor-pointer font-mono text-sm hover:bg-gray-100 flex justify-between items-center list-none">
                                        <span>{key}</span>
                                        <span className="text-[#6b7280] group-open:rotate-180 transition-transform">▼</span>
                                      </summary>
                                      <div className="p-4 space-y-4 border-t border-[#e5e7eb] bg-white">
                                        {['en', 'ru', 'az'].map(lang => {
                                          const value = translations[lang]?.[key] || '';
                                          return (
                                            <div key={lang} className="flex flex-col gap-1">
                                              <label className="text-xs font-mono text-[#6b7280] uppercase">{lang}</label>
                                              {typeof value === 'string' && value.length > 50 ? (
                                                <textarea 
                                                  value={value}
                                                  onChange={(e) => updateTranslations(lang, key, e.target.value)}
                                                  className="w-full bg-transparent border border-[#e5e7eb] rounded p-2 text-sm min-h-[80px]"
                                                />
                                              ) : (
                                                <input 
                                                  type="text"
                                                  value={value}
                                                  onChange={(e) => updateTranslations(lang, key, e.target.value)}
                                                  className="w-full bg-transparent border border-[#e5e7eb] rounded p-2 text-sm"
                                                />
                                              )}
                                            </div>
                                          );
                                        })}
                                      </div>
                                    </details>
                                  );
                                })}
                              </div>
                            </div>
                          ))}
                        </div>
                      );
                    })()}
                  </div>
                  )}

                  {activeTab === 'portfolio' && (
                    <div className="space-y-6">
                      <div className="flex justify-between items-center mb-6">
                        <div className="flex gap-2 flex-wrap items-center">
                          {Object.keys(portfolioData).map(c => (
                            <button key={c} onClick={() => setSelectedCategory(c)} className={`px-4 py-1 rounded font-mono uppercase ${selectedCategory === c ? 'bg-[#fe0000] text-white' : 'bg-[#f9fafb]'}`}>{c}</button>
                          ))}
                          <button 
                            onClick={() => {
                              const newCat = prompt("Enter new category name (e.g. architecture):");
                              if (newCat && !portfolioData[newCat]) {
                                useSiteStore.setState(state => ({
                                  portfolioData: { ...state.portfolioData, [newCat.toLowerCase()]: [] }
                                }));
                                setSelectedCategory(newCat.toLowerCase());
                              }
                            }}
                            className="px-2 py-1 rounded font-mono text-xs border border-dashed border-[#e5e7eb] text-[#6b7280] hover:text-[#fe0000] hover:border-[#fe0000]"
                          >
                            + Add Category
                          </button>
                          <button
                            onClick={() => {
                              if (Object.keys(portfolioData).length <= 1) {
                                alert("You cannot delete the last category.");
                                return;
                              }
                              if (true) {
                                useSiteStore.setState(state => {
                                  const newData = { ...state.portfolioData };
                                  delete newData[selectedCategory];
                                  return { portfolioData: newData };
                                });
                                setSelectedCategory(Object.keys(portfolioData).find(k => k !== selectedCategory) || Object.keys(portfolioData)[0]);
                              }
                            }}
                            className="px-2 py-1 rounded font-mono text-xs border border-dashed border-red-200 text-red-500 hover:text-white hover:bg-red-500 hover:border-red-500 transition-colors"
                          >
                            - Delete Category
                          </button>
                        </div>
                        <button 
                          onClick={() => handleSaveSection('portfolio', portfolioData)}
                          className="bg-[#fe0000] text-white px-4 py-1.5 rounded text-sm hover:bg-red-700 transition-colors flex items-center gap-2"
                        >
                          <Save size={16} /> Save Portfolio
                        </button>
                      </div>
                      
                      <div className="space-y-8">
                        {portfolioData[selectedCategory]?.map((project, idx) => (
                          <div key={idx} className="border border-[#e5e7eb] p-4 rounded-xl relative">
                            <button onClick={() => removeProject(selectedCategory, idx)} aria-label="Remove Project" className="absolute top-4 right-4 text-red-500 hover:text-red-600"><Trash2 size={16} /></button>
                            <div className="space-y-4">
                              <div>
                                <label className="text-xs font-mono text-[#6b7280]">Project Name</label>
                                <input 
                                  type="text"
                                  value={project.name}
                                  onChange={(e) => updatePortfolio(selectedCategory, idx, { ...project, name: e.target.value })}
                                  className="w-full bg-transparent border border-[#e5e7eb] rounded p-2 text-sm mt-1"
                                />
                              </div>
                              <div>
                                <label className="text-xs font-mono text-[#6b7280]">Link (Optional)</label>
                                <input 
                                  type="text"
                                  value={project.link || ''}
                                  onChange={(e) => updatePortfolio(selectedCategory, idx, { ...project, link: e.target.value })}
                                  className="w-full bg-transparent border border-[#e5e7eb] rounded p-2 text-sm mt-1"
                                />
                              </div>
                              <div>
                                <label className="text-xs font-mono text-[#6b7280]">Images (Comma separated URLs)</label>
                                <textarea 
                                  value={project.images?.join(',\n') || ''}
                                  onChange={(e) => updatePortfolio(selectedCategory, idx, { ...project, images: e.target.value.split(/[\n,]+/).map(s => s.trim()).filter(Boolean) })}
                                  className="w-full bg-transparent border border-[#e5e7eb] rounded p-2 text-sm mt-1 min-h-[80px]"
                                />
                              </div>
                              <div>
                                <label className="text-xs font-mono text-[#6b7280]">Concept</label>
                                <textarea 
                                  value={project.concept || ''}
                                  onChange={(e) => updatePortfolio(selectedCategory, idx, { ...project, concept: e.target.value })}
                                  className="w-full bg-transparent border border-[#e5e7eb] rounded p-2 text-sm mt-1 min-h-[80px]"
                                />
                              </div>
                              <div>
                                <label className="text-xs font-mono text-[#6b7280]">Process</label>
                                <textarea 
                                  value={project.process || ''}
                                  onChange={(e) => updatePortfolio(selectedCategory, idx, { ...project, process: e.target.value })}
                                  className="w-full bg-transparent border border-[#e5e7eb] rounded p-2 text-sm mt-1 min-h-[80px]"
                                />
                              </div>
                              <div>
                                <label className="text-xs font-mono text-[#6b7280]">Credits</label>
                                <textarea 
                                  value={project.credits || ''}
                                  onChange={(e) => updatePortfolio(selectedCategory, idx, { ...project, credits: e.target.value })}
                                  className="w-full bg-transparent border border-[#e5e7eb] rounded p-2 text-sm mt-1 min-h-[80px]"
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                        <button onClick={handleAddProject} className="w-full py-4 border-2 border-dashed border-[#e5e7eb] rounded-xl flex items-center justify-center gap-2 text-[#6b7280] hover:text-[#fe0000] hover:border-[#fe0000] transition-colors">
                          <Plus size={20} /> Add Project
                        </button>
                      </div>
                    </div>
                  )}

                  {activeTab === 'lab' && (
                    <div className="space-y-6">
                      <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-bold">Lab / Experiments</h3>
                        <button 
                          onClick={() => handleSaveSection('lab', labData)}
                          className="bg-[#fe0000] text-white px-4 py-1.5 rounded text-sm hover:bg-red-700 transition-colors flex items-center gap-2"
                        >
                          <Save size={16} /> Save Lab
                        </button>
                      </div>
                      
                      <div className="space-y-8">
                        {labData.map((item, idx) => (
                          <details key={idx} className="border border-[#e5e7eb] rounded-xl relative overflow-hidden group">
                            <summary className="p-4 bg-[#f9fafb] cursor-pointer font-bold text-sm hover:bg-gray-100 flex justify-between items-center list-none transition-colors">
                              <span>{item.title || 'Untitled Lab Item'}</span>
                              <div className="flex items-center gap-4">
                                <button 
                                  onClick={(e) => { e.preventDefault(); removeLab(idx); }} 
                                  aria-label="Remove Lab Item" 
                                  className="text-red-500 hover:text-red-600 transition-colors p-1"
                                >
                                  <Trash2 size={16} />
                                </button>
                                <span className="text-[#6b7280] group-open:rotate-180 transition-transform">▼</span>
                              </div>
                            </summary>
                            <div className="p-4 space-y-4 bg-white border-t border-[#e5e7eb]">
                              <div>
                                <label className="text-xs font-mono text-[#6b7280]">Title</label>
                                <input 
                                  type="text"
                                  value={item.title}
                                  onChange={(e) => updateLab(idx, { ...item, title: e.target.value })}
                                  className="w-full bg-transparent border border-[#e5e7eb] rounded p-2 text-sm mt-1"
                                />
                              </div>
                              <div>
                                <label className="text-xs font-mono text-[#6b7280]">Image / Video URL</label>
                                <input 
                                  type="text"
                                  value={item.image}
                                  onChange={(e) => updateLab(idx, { ...item, image: e.target.value })}
                                  className="w-full bg-transparent border border-[#e5e7eb] rounded p-2 text-sm mt-1"
                                />
                              </div>
                              <div>
                                <label className="text-xs font-mono text-[#6b7280]">Description</label>
                                <textarea 
                                  value={item.description}
                                  onChange={(e) => updateLab(idx, { ...item, description: e.target.value })}
                                  className="w-full bg-transparent border border-[#e5e7eb] rounded p-2 text-sm mt-1 min-h-[80px]"
                                />
                              </div>
                              <div className="mt-6">
                                <label className="text-xs font-mono text-[#6b7280] mb-2 block">Experiments List</label>
                                <div className="space-y-3">
                                  {item.experiments.map((exp, expIdx) => (
                                    <div key={expIdx} className="flex gap-2 items-start bg-gray-50 p-3 rounded border border-gray-100">
                                      <div className="flex-1 space-y-2">
                                        <input 
                                          type="text"
                                          placeholder="Experiment Name"
                                          value={exp.name}
                                          onChange={(e) => {
                                            const newExps = [...item.experiments];
                                            newExps[expIdx] = { ...exp, name: e.target.value };
                                            updateLab(idx, { ...item, experiments: newExps });
                                          }}
                                          className="w-full bg-white border border-[#e5e7eb] rounded p-2 text-sm"
                                        />
                                        <textarea 
                                          placeholder="Experiment Description"
                                          value={exp.desc}
                                          onChange={(e) => {
                                            const newExps = [...item.experiments];
                                            newExps[expIdx] = { ...exp, desc: e.target.value };
                                            updateLab(idx, { ...item, experiments: newExps });
                                          }}
                                          className="w-full bg-white border border-[#e5e7eb] rounded p-2 text-sm min-h-[60px]"
                                        />
                                      </div>
                                      <button 
                                        onClick={(e) => {
                                          e.preventDefault();
                                          const newExps = item.experiments.filter((_, i) => i !== expIdx);
                                          updateLab(idx, { ...item, experiments: newExps });
                                        }}
                                        className="text-red-500 hover:bg-red-50 p-2 rounded transition-colors"
                                      >
                                        <Trash2 size={16} />
                                      </button>
                                    </div>
                                  ))}
                                  <button 
                                    onClick={(e) => {
                                      e.preventDefault();
                                      const newExps = [...item.experiments, { name: '', desc: '' }];
                                      updateLab(idx, { ...item, experiments: newExps });
                                    }}
                                    className="text-xs font-mono text-[#fe0000] flex items-center gap-1 hover:underline mt-2 p-1"
                                  >
                                    <Plus size={12} /> Add Experiment
                                  </button>
                                </div>
                              </div>
                            </div>
                          </details>
                        ))}
                        <button 
                          onClick={() => addLab({ id: Date.now().toString(), title: 'New Lab Item', image: '', description: '', experiments: [] })}
                          className="w-full py-4 border-2 border-dashed border-[#e5e7eb] rounded-xl text-[#6b7280] hover:border-[#fe0000] hover:text-[#fe0000] transition-colors flex items-center justify-center gap-2"
                        >
                          <Plus size={20} /> Add Lab Item
                        </button>
                      </div>
                    </div>
                  )}

                  {activeTab === 'press' && (
                    <div className="space-y-6">
                      <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-bold">Press & Media</h3>
                        <button 
                          onClick={() => handleSaveSection('press', pressData)}
                          className="bg-[#fe0000] text-white px-4 py-1.5 rounded text-sm hover:bg-red-700 transition-colors flex items-center gap-2"
                        >
                          <Save size={16} /> Save Press
                        </button>
                      </div>
                      <div className="space-y-8">
                        {pressData.map((item, idx) => (
                          <div key={idx} className="border border-[#e5e7eb] p-4 rounded-xl relative">
                            <div className="absolute top-4 right-4 flex gap-2">
                              {idx > 0 && (
                                <button onClick={() => {
                                  let newPress = [...pressData];
                                  [newPress[idx - 1], newPress[idx]] = [newPress[idx], newPress[idx - 1]];
                                  useSiteStore.setState({ pressData: newPress });
                                }} aria-label="Move Up" className="text-gray-400 hover:text-black"><ArrowUp size={16} /></button>
                              )}
                              {idx < pressData.length - 1 && (
                                <button onClick={() => {
                                  let newPress = [...pressData];
                                  [newPress[idx + 1], newPress[idx]] = [newPress[idx], newPress[idx + 1]];
                                  useSiteStore.setState({ pressData: newPress });
                                }} aria-label="Move Down" className="text-gray-400 hover:text-black"><ArrowDown size={16} /></button>
                              )}
                              <button onClick={() => removePress(idx)} aria-label="Remove Press Item" className="text-red-500 hover:text-red-600"><Trash2 size={16} /></button>
                            </div>
                            <div className="space-y-4">
                              <div>
                                <label className="text-xs font-mono text-[#6b7280]">Year</label>
                                <input 
                                  type="text"
                                  value={item.year}
                                  onChange={(e) => updatePress(idx, { ...item, year: e.target.value })}
                                  className="w-full bg-transparent border border-[#e5e7eb] rounded p-2 text-sm mt-1"
                                />
                              </div>
                              <div>
                                <label className="text-xs font-mono text-[#6b7280]">Title</label>
                                <input 
                                  type="text"
                                  value={item.title}
                                  onChange={(e) => updatePress(idx, { ...item, title: e.target.value })}
                                  className="w-full bg-transparent border border-[#e5e7eb] rounded p-2 text-sm mt-1"
                                />
                              </div>
                              <div>
                                <label className="text-xs font-mono text-[#6b7280]">Publication</label>
                                <input 
                                  type="text"
                                  value={item.publication}
                                  onChange={(e) => updatePress(idx, { ...item, publication: e.target.value })}
                                  className="w-full bg-transparent border border-[#e5e7eb] rounded p-2 text-sm mt-1"
                                />
                              </div>
                              <div>
                                <label className="text-xs font-mono text-[#6b7280]">Link</label>
                                <input 
                                  type="text"
                                  value={item.link}
                                  onChange={(e) => updatePress(idx, { ...item, link: e.target.value })}
                                  className="w-full bg-transparent border border-[#e5e7eb] rounded p-2 text-sm mt-1"
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                        <button onClick={() => addPress({ year: '2026', title: 'New Article', publication: 'Magazine', link: '#' })} className="w-full py-4 border-2 border-dashed border-[#e5e7eb] rounded-xl flex items-center justify-center gap-2 text-[#6b7280] hover:text-[#fe0000] hover:border-[#fe0000] transition-colors">
                          <Plus size={20} /> Add Press Item
                        </button>
                      </div>
                    </div>
                  )}

                  {activeTab === 'collaborators' && (
                    <div className="space-y-6">
                      <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-bold">Collaborators</h3>
                        <button 
                          onClick={() => handleSaveSection('collaborators', collaboratorsData)}
                          className="bg-[#fe0000] text-white px-4 py-1.5 rounded text-sm hover:bg-red-700 transition-colors flex items-center gap-2"
                        >
                          <Save size={16} /> Save Collaborators
                        </button>
                      </div>
                      <div className="space-y-8">
                        {collaboratorsData?.map((item, idx) => (
                          <div key={idx} className="border border-[#e5e7eb] p-4 rounded-xl relative">
                            <div className="absolute top-4 right-4 flex gap-2">
                              {idx > 0 && (
                                <button onClick={() => {
                                  const newCollabs = [...collaboratorsData];
                                  [newCollabs[idx - 1], newCollabs[idx]] = [newCollabs[idx], newCollabs[idx - 1]];
                                  updateCollaborators(newCollabs);
                                }} aria-label="Move Up" className="text-gray-400 hover:text-black"><ArrowUp size={16} /></button>
                              )}
                              {idx < collaboratorsData.length - 1 && (
                                <button onClick={() => {
                                  const newCollabs = [...collaboratorsData];
                                  [newCollabs[idx + 1], newCollabs[idx]] = [newCollabs[idx], newCollabs[idx + 1]];
                                  updateCollaborators(newCollabs);
                                }} aria-label="Move Down" className="text-gray-400 hover:text-black"><ArrowDown size={16} /></button>
                              )}
                              <button onClick={() => {
                                const newCollabs = [...collaboratorsData];
                                newCollabs.splice(idx, 1);
                                updateCollaborators(newCollabs);
                              }} aria-label="Remove Collaborator" className="text-red-500 hover:text-red-600"><Trash2 size={16} /></button>
                            </div>
                            <div className="space-y-4">
                              <div>
                                <label className="text-xs font-mono text-[#6b7280]">Name</label>
                                <input 
                                  type="text"
                                  value={item.name}
                                  onChange={(e) => {
                                    const newCollabs = [...collaboratorsData];
                                    newCollabs[idx] = { ...item, name: e.target.value };
                                    updateCollaborators(newCollabs);
                                  }}
                                  className="w-full bg-transparent border border-[#e5e7eb] rounded p-2 text-sm mt-1"
                                />
                              </div>
                              <div>
                                <label className="text-xs font-mono text-[#6b7280]">URL</label>
                                <input 
                                  type="text"
                                  value={item.url}
                                  onChange={(e) => {
                                    const newCollabs = [...collaboratorsData];
                                    newCollabs[idx] = { ...item, url: e.target.value };
                                    updateCollaborators(newCollabs);
                                  }}
                                  className="w-full bg-transparent border border-[#e5e7eb] rounded p-2 text-sm mt-1"
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                        <button onClick={() => updateCollaborators([...(collaboratorsData || []), { name: 'New Collaborator', url: '#' }])} className="w-full py-4 border-2 border-dashed border-[#e5e7eb] rounded-xl flex items-center justify-center gap-2 text-[#6b7280] hover:text-[#fe0000] hover:border-[#fe0000] transition-colors">
                          <Plus size={20} /> Add Collaborator
                        </button>
                      </div>
                    </div>
                  )}

                  {activeTab === 'contact' && (
                    <div className="space-y-6">
                      <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-bold">Contact Info</h3>
                        <button 
                          onClick={() => handleSaveSection('contact', contact)}
                          className="bg-[#fe0000] text-white px-4 py-1.5 rounded text-sm hover:bg-red-700 transition-colors flex items-center gap-2"
                        >
                          <Save size={16} /> Save Contact Info
                        </button>
                      </div>
                      <div className="space-y-4">
                        {Object.entries({ 
                          ...contact, 
                          googleDriveScriptUrl: contact.googleDriveScriptUrl || '' 
                        }).map(([key, value]) => (
                          <div key={key} className="flex flex-col gap-1">
                            <label className="text-xs font-mono text-[#6b7280] uppercase">{key}</label>
                            <input 
                              type="text"
                              value={value as string}
                              onChange={(e) => updateContact(key, e.target.value)}
                              className="w-full bg-transparent border border-[#e5e7eb] rounded p-2 text-sm"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {activeTab === 'forms' && (
                    <div className="space-y-8">


                      {/* Forms & Events List */}
                      {['volunteer', 'vacancy', 'internship'].map((category) => {
                        const config = category === 'volunteer' ? volunteerFormConfig : category === 'vacancy' ? vacanciesFormConfig : internshipsFormConfig;
                        const updateConfig = category === 'volunteer' ? updateVolunteerFormConfig : category === 'vacancy' ? updateVacanciesFormConfig : updateInternshipsFormConfig;
                        const saveConfig = category === 'volunteer' ? handleSaveFormConfig : category === 'vacancy' ? handleSaveVacanciesFormConfig : handleSaveInternshipsFormConfig;

                        return (
                          <div key={category} className="mt-8 space-y-8">
                            <div className="border border-[#e5e7eb] rounded-lg p-6 bg-[#f9fafb]">
                              <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-bold capitalize">{category === 'vacancy' ? 'Vacancies' : category + 's'} Form Configuration</h3>
                                <p className="text-xs text-[#6b7280] font-mono">
                                  Configure the main title and description for the {category} modal.
                                </p>
                              </div>
                              <div className="space-y-4">
                                <div>
                                  <label className="block text-xs font-mono text-[#6b7280] mb-1 uppercase tracking-wider">Form Title</label>
                                  <input
                                    type="text"
                                    value={config.title}
                                    onChange={(e) => updateConfig({ ...config, title: e.target.value })}
                                    className="w-full bg-transparent border border-[#e5e7eb] rounded px-3 py-2 font-mono text-sm"
                                    placeholder={`e.g. ${category} Application`}
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs font-mono text-[#6b7280] mb-1 uppercase tracking-wider">Form Description</label>
                                  <textarea
                                    value={config.description}
                                    onChange={(e) => updateConfig({ ...config, description: e.target.value })}
                                    className="w-full bg-transparent border border-[#e5e7eb] rounded px-3 py-2 font-mono text-sm min-h-[100px]"
                                    placeholder="e.g. Please fill out this form to apply..."
                                  />
                                </div>
                                <button
                                  onClick={saveConfig}
                                  className="w-full py-3 bg-[#fe0000] text-white font-mono text-xs uppercase tracking-widest rounded hover:bg-red-700 transition-colors mt-4 flex items-center justify-center gap-2"
                                >
                                  <Save size={16} /> Save {category} Config
                                </button>
                              </div>
                            </div>

                            <div>
                              <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-bold capitalize">{category === 'vacancy' ? 'Vacancies' : category + 's'}</h3>
                                <button 
                                  onClick={() => handleAddFormSchema(category as any)}
                                  className="flex items-center gap-2 text-xs bg-[#fe0000] text-white px-3 py-1.5 rounded hover:bg-red-700 transition-colors"
                                >
                                  <Plus size={14} /> Add {category}
                                </button>
                              </div>

                              <div className="space-y-4">
                                {formSchemas.filter(s => s.category === category).map((schema) => (
                                  <EventEditor
                                    key={schema.id}
                                    event={schema}
                                    onUpdate={handleLocalUpdateFormSchema}
                                    onSave={handleSaveFormSchema}
                                    onDelete={handleDeleteFormSchema}
                                  />
                                ))}
                                {formSchemas.filter(s => s.category === category).length === 0 && (
                                  <div className="text-center py-12 text-[#6b7280] font-mono text-sm">
                                    No {category} forms created yet.
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}



                  {activeTab === 'applications' && (
                    <div className="space-y-6 flex flex-col h-full">
                      <div className="flex justify-between items-center shrink-0">
                        <h3 className="text-lg font-bold">Applications & CRM</h3>
                      </div>

                      {pendingAttendanceEvents.length > 0 && !selectedFormForApps && (
                        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 p-4 rounded mb-4 font-mono">
                          <h4 className="font-bold flex items-center gap-2 mb-2">⚠️ Attention Required: Attendance Verification</h4>
                          <p className="text-sm mb-3">The following events have occurred, and their approved participants need attendance verification to receive certificates.</p>
                          <div className="space-y-2">
                            {pendingAttendanceEvents.map(event => (
                              <div key={event.id} className="flex justify-between items-center bg-white p-3 rounded border border-yellow-100 shadow-sm">
                                <div>
                                  <div className="font-bold">{event.name}</div>
                                  <div className="text-xs opacity-75">Event Date: {event.eventDate}</div>
                                </div>
                                <button
                                  onClick={() => openAttendanceCheck(event)}
                                  className="bg-yellow-100 text-yellow-800 px-4 py-2 rounded text-xs font-bold hover:bg-yellow-200 transition-colors"
                                >
                                  Check Attendance & Issue Certificates
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="flex justify-between items-center">
                        <div className="flex gap-2">
                          {(['volunteer', 'internship', 'vacancy'] as const).map(tab => (
                            <button
                              key={tab}
                              onClick={() => {
                                setActiveAppTab(tab);
                                setSelectedFormForApps(null);
                              }}
                              className={`px-4 py-2 rounded font-mono uppercase text-sm ${activeAppTab === tab ? 'bg-[#fe0000] text-white' : 'bg-[#f9fafb] text-black hover:bg-gray-100'}`}
                            >
                              {tab}s
                            </button>
                          ))}
                        </div>
                        {selectedFormForApps && (
                          <button 
                            onClick={() => {
                              // Clear cache for this form and reload
                              setAppsCache(prev => {
                                const newCache = { ...prev };
                                delete newCache[selectedFormForApps];
                                return newCache;
                              });
                              loadApplications(selectedFormForApps);
                              showToast('Refreshed applications');
                            }}
                            aria-label="Refresh Applications"
                            className="flex items-center gap-2 text-sm text-[#6b7280] hover:text-[#fe0000] transition-colors"
                          >
                            <RefreshCw size={16} className={loadingApps ? "animate-spin" : ""} />
                            Refresh
                          </button>
                        )}
                      </div>

                      {!selectedFormForApps ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {formSchemas.filter(s => s.category === activeAppTab).map(schema => (
                            <div key={schema.id} className="bg-white border border-[#e5e7eb] rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
                              <h3 className="font-bold text-lg mb-2">{schema.name}</h3>
                              <p className="text-sm text-gray-500 mb-4">{schema.date}</p>
                              
                              <div className="flex justify-between items-center mt-2">
                                <button
                                  onClick={() => setSelectedFormForApps(schema.id)}
                                  className="text-sm bg-black text-white px-4 py-2 rounded hover:bg-gray-800 transition-colors"
                                >
                                  View Responses
                                </button>
                                
                                <div className="flex flex-col gap-2 items-end">
                                  {/* Кнопка 1: Ссылка для тех, кто будет ЗАПОЛНЯТЬ форму (короткая) */}
                                  <button
                                    onClick={() => {
                                      const url = `${window.location.origin}/${activeAppTab}/${schema.id}`;
                                      navigator.clipboard.writeText(url);
                                      showToast('Form link copied!');
                                    }}
                                    className="text-sm text-[#fe0000] hover:underline flex items-center gap-1"
                                    title="Отправить кандидатам для заполнения"
                                  >
                                    <LinkIcon size={14} /> Share Form
                                  </button>

                                  {/* Кнопка 2: Ссылка для тех, кто будет ЧЕКАТЬ ответы (менеджеры) */}
                                  <button
                                    onClick={() => {
                                      const url = `${window.location.origin}/view-responses/${schema.id}`;
                                      navigator.clipboard.writeText(url);
                                      showToast('Responses link copied!');
                                    }}
                                    className="text-sm text-gray-500 hover:text-black hover:underline flex items-center gap-1"
                                    title="Отправить менеджерам для просмотра ответов"
                                  >
                                    <Share2 size={14} /> Share Responses
                                  </button>
                                </div>
                              </div>
                              
                            </div>
                          ))}
                          {formSchemas.filter(s => s.category === activeAppTab).length === 0 && (
                            <div className="col-span-full text-center py-12 text-[#6b7280] font-mono text-sm">
                              No {activeAppTab} forms found.
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="space-y-4 flex flex-col h-full">
                          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                            <button
                              onClick={() => setSelectedFormForApps(null)}
                              className="text-sm text-gray-600 hover:text-black flex items-center gap-1"
                            >
                              <ArrowLeft size={16} /> Back to Forms
                            </button>
                            <input
                              type="text"
                              placeholder="Search applications..."
                              value={appSearchQuery}
                              onChange={(e) => setAppSearchQuery(e.target.value)}
                              className="bg-white border border-[#e5e7eb] rounded px-3 py-1.5 text-sm font-mono w-full md:w-64"
                            />
                          </div>
                          
                          {/* Folder Tabs inside Response View */}
                          <div className="flex gap-2 border-b border-[#e5e7eb] pb-2 font-mono text-sm overflow-x-auto shrink-0 w-full" data-lenis-prevent="true">
                            <button
                              onClick={() => setAppStatusFilter('applied')}
                              className={`px-4 py-2 rounded-t transition-colors whitespace-nowrap ${appStatusFilter === 'applied' ? 'bg-[#f9fafb] border border-b-0 border-[#e5e7eb] font-bold text-black' : 'text-gray-500 hover:text-black'}`}
                            >
                              New (Pending)
                            </button>
                            <button
                              onClick={() => setAppStatusFilter('approved')}
                              className={`px-4 py-2 rounded-t transition-colors whitespace-nowrap ${appStatusFilter === 'approved' ? 'bg-[#f9fafb] border border-b-0 border-[#e5e7eb] font-bold text-green-700' : 'text-gray-500 hover:text-black'}`}
                            >
                              Approved
                            </button>
                            <button
                              onClick={() => setAppStatusFilter('rejected')}
                              className={`px-4 py-2 rounded-t transition-colors whitespace-nowrap ${appStatusFilter === 'rejected' ? 'bg-[#f9fafb] border border-b-0 border-[#e5e7eb] font-bold text-red-700' : 'text-gray-500 hover:text-black'}`}
                            >
                              Rejected
                            </button>
                            <button
                              onClick={() => setAppStatusFilter('finalized')}
                              className={`px-4 py-2 rounded-t transition-colors whitespace-nowrap ${appStatusFilter === 'finalized' ? 'bg-[#f9fafb] border border-b-0 border-[#e5e7eb] font-bold text-blue-700' : 'text-gray-500 hover:text-black'}`}
                            >
                              Finalists (Certificates)
                            </button>
                          </div>
                          
                          <div className="bg-[#f9fafb] border border-[#e5e7eb] border-t-0 md:border-t rounded-b-lg md:rounded-lg overflow-y-auto flex-1 min-h-[300px]" data-lenis-prevent="true">
                            {/* Desktop Table View */}
                            <div className="hidden md:block overflow-x-auto">
                              <table className="w-full text-left text-sm font-mono min-w-[600px]">
                                <thead className="bg-[#ffffff] border-b border-[#e5e7eb] sticky top-0 z-10">
                                  <tr>
                                    <th className="px-4 py-3 font-semibold w-32">Date</th>
                                    <th className="px-4 py-3 font-semibold">Name & Surname</th>
                                    <th className="px-4 py-3 font-semibold">Email</th>
                                    <th className="px-4 py-3 font-semibold text-right">Actions</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-[#e5e7eb]">
                                  {loadingApps && applications.length === 0 ? (
                                    <tr>
                                      <td colSpan={4} className="px-4 py-8 text-center text-[#6b7280]">
                                        Loading applications...
                                      </td>
                                    </tr>
                                  ) : applications.filter(a => {
                                      // Status filter logic
                                      const stat = a.status || 'applied';
                                      if (appStatusFilter === 'applied' && stat !== 'applied') return false;
                                      if (appStatusFilter === 'approved' && stat !== 'approved' && stat !== 'participated' && stat !== 'missed') return false;
                                      if (appStatusFilter === 'rejected' && stat !== 'rejected') return false;
                                      if (appStatusFilter === 'finalized' && stat !== 'finalized') return false;
                                      return true;
                                    }).length === 0 ? (
                                    <tr>
                                      <td colSpan={4} className="px-4 py-8 text-center text-[#6b7280]">
                                        No {appStatusFilter} applications found.
                                      </td>
                                    </tr>
                                  ) : (
                                    applications
                                      .filter(app => {
                                        const stat = app.status || 'applied';
                                        if (appStatusFilter === 'applied' && stat !== 'applied') return false;
                                        if (appStatusFilter === 'approved' && stat !== 'approved' && stat !== 'participated' && stat !== 'missed') return false;
                                        if (appStatusFilter === 'rejected' && stat !== 'rejected') return false;
                                        if (appStatusFilter === 'finalized' && stat !== 'finalized') return false;
                                        return true;
                                      })
                                      .map((app) => {
                                      // Try to find the first answer from formData using ordered data
                                      let submitter = '';
                                      if (app.profileName || app.profileSurname) {
                                          submitter = `${app.profileName || ''} ${app.profileSurname || ''}`.trim();
                                          if (app.name || app.surname) {
                                              submitter += ` (Form: ${app.name || ''} ${app.surname || ''})`.trim();
                                          }
                                      } else if (app.name || app.surname) {
                                          submitter = `${app.name || ''} ${app.surname || ''}`.trim();
                                      } else {
                                          const orderedData = getOrderedFormData(app);
                                          const firstVal = orderedData.length > 0 ? orderedData[0][1] : null;
                                          submitter = firstVal 
                                            ? (Array.isArray(firstVal) ? firstVal.join(', ') : String(firstVal))
                                            : app.email || 'Unknown';
                                      }
                                      
                                      if (app.isTestCertificate) {
                                        submitter = `⭐ TEST CERT: ${app.name || 'Unknown Name'} (${app.email || 'Unknown Email'})`;
                                      }
                                      
                                      return (
                                      <tr key={app.id} className="hover:bg-[#ffffff] transition-colors">
                                        <td className="px-4 py-3 whitespace-nowrap">
                                          {app.timestamp?.toDate ? app.timestamp.toDate().toLocaleDateString() : 'Unknown'}
                                        </td>
                                        <td className="px-4 py-3">{submitter}</td>
                                        <td className="px-4 py-3 text-[#6b7280]">{app.email || '—'}</td>
                                        <td className="px-4 py-3 text-right">
                                          {appStatusFilter === 'applied' && (
                                            <>
                                              <button
                                                onClick={async () => {
                                                  try {
                                                    await updateDoc(doc(db, 'volunteerApplications', app.id), { status: 'approved' });
updateLocalAppStatus(app.id, 'approved');
showToast('Application approved');
                                                  } catch (err) {
                                                    showToast('Error approving application');
                                                  }
                                                }}
                                                className="text-xs bg-green-100 text-green-700 px-3 py-1.5 rounded hover:bg-green-200 transition-colors mr-2"
                                                title="Approve"
                                              >
                                                ✅ Approve
                                              </button>
                                              <button
                                                onClick={async () => {
                                                  try {
                                                    await updateDoc(doc(db, 'volunteerApplications', app.id), { status: 'rejected' });
updateLocalAppStatus(app.id, 'rejected');
showToast('Application rejected');
                                                  } catch (err) {
                                                    showToast('Error rejecting application');
                                                  }
                                                }}
                                                className="text-xs bg-red-50 text-red-700 px-3 py-1.5 rounded hover:bg-red-100 transition-colors mr-2"
                                                title="Reject"
                                              >
                                                ❌ Reject
                                              </button>
                                            </>
                                          )}
                                          {appStatusFilter === 'approved' && (
                                            <>
                                              <button
                                                onClick={async () => {
                                                  try {
                                                    const certificateTrackingCode = Math.random().toString(36).substring(2, 10).toUpperCase();
                                                    await updateDoc(doc(db, 'volunteerApplications', app.id), { 
                                                      status: 'finalized',
                                                      certificateTrackingCode
                                                    });
                                                    updateLocalAppStatus(app.id, 'finalized');
                                                    showToast('Moved to Finalists (Certificates enabled)');
                                                  } catch (err) {
                                                    showToast('Error finalizing application');
                                                  }
                                                }}
                                                className="text-xs bg-blue-100 text-blue-700 px-3 py-1.5 rounded hover:bg-blue-200 transition-colors mr-2 hidden md:inline-block font-bold border border-blue-200"
                                                title="Final Accept"
                                              >
                                                🏆 Final Accept
                                              </button>
                                              <button
                                                onClick={async () => {
                                                  if (true) {
                                                    try {
                                                      await updateDoc(doc(db, 'volunteerApplications', app.id), { status: 'rejected' });
                                                      updateLocalAppStatus(app.id, 'rejected');
                                                      showToast('Application moved to rejected');
                                                    } catch (err) {
                                                      showToast('Error modifying status');
                                                    }
                                                  }
                                                }}
                                                className="text-xs bg-red-50 text-red-700 px-3 py-1.5 rounded hover:bg-red-100 transition-colors mr-2 hidden md:inline-block"
                                                title="Move to Rejected"
                                              >
                                                ❌ Move to Rejected
                                              </button>
                                            </>
                                          )}
                                          {appStatusFilter === 'rejected' && (
                                            <button
                                              onClick={async () => {
                                                if (true) {
                                                  try {
                                                    await updateDoc(doc(db, 'volunteerApplications', app.id), { status: 'approved' });
updateLocalAppStatus(app.id, 'approved');
showToast('Application moved to approved');
                                                  } catch (err) {
                                                    showToast('Error modifying status');
                                                  }
                                                }
                                              }}
                                              className="text-xs bg-green-100 text-green-700 px-3 py-1.5 rounded hover:bg-green-200 transition-colors mr-2 hidden md:inline-block"
                                              title="Move to Approved"
                                            >
                                              ✅ Move to Approved
                                            </button>
                                          )}
                                          <button
                                            onClick={() => setSelectedApplication(app)}
                                            className="text-xs bg-[#fe0000] text-white px-3 py-1.5 rounded hover:bg-red-700 transition-colors mr-2 mt-2 md:mt-0"
                                          >
                                            View Details
                                          </button>
                                          <button
                                            onClick={async () => {
                                              if (true) {
                                                try {
                                                  await deleteDoc(doc(db, 'volunteerApplications', app.id));
deleteLocalApp(app.id);
showToast('Application deleted');
                                                } catch (err) {
                                                  console.error('Error deleting application:', err);
                                                  showToast('Failed to delete application');
                                                }
                                              }
                                            }}
                                            className="text-xs bg-red-100 text-red-600 px-3 py-1.5 rounded hover:bg-red-200 transition-colors mt-2 md:mt-0"
                                          >
                                            Delete
                                          </button>
                                        </td>
                                      </tr>
                                    )})
                                  )}
                                </tbody>
                              </table>
                            </div>

                            {/* Mobile Card View */}
                            <div className="md:hidden divide-y divide-[#e5e7eb]">
                              {loadingApps && applications.length === 0 ? (
                                <div className="p-8 text-center text-[#6b7280] font-mono text-sm">
                                  Loading applications...
                                </div>
                              ) : applications.filter(a => {
                                      const stat = a.status || 'applied';
                                      if (appStatusFilter === 'applied' && stat !== 'applied') return false;
                                      if (appStatusFilter === 'approved' && stat !== 'approved' && stat !== 'participated' && stat !== 'missed') return false;
                                      if (appStatusFilter === 'rejected' && stat !== 'rejected') return false;
                                      return true;
                                    }).length === 0 ? (
                                <div className="p-8 text-center text-[#6b7280] font-mono text-sm">
                                  No {appStatusFilter} applications found.
                                </div>
                              ) : (
                                applications
                                  .filter(app => {
                                    const stat = app.status || 'applied';
                                    if (appStatusFilter === 'applied' && stat !== 'applied') return false;
                                    if (appStatusFilter === 'approved' && stat !== 'approved' && stat !== 'participated' && stat !== 'missed') return false;
                                    if (appStatusFilter === 'rejected' && stat !== 'rejected') return false;
                                    return true;
                                  })
                                  .map((app) => {
                                  let submitter = '';
                                  if (app.profileName || app.profileSurname) {
                                      submitter = `${app.profileName || ''} ${app.profileSurname || ''}`.trim();
                                      if (app.name || app.surname) {
                                          submitter += ` (Form: ${app.name || ''} ${app.surname || ''})`.trim();
                                      }
                                  } else if (app.name || app.surname) {
                                      submitter = `${app.name || ''} ${app.surname || ''}`.trim();
                                  } else {
                                      const orderedData = getOrderedFormData(app);
                                      const firstVal = orderedData.length > 0 ? orderedData[0][1] : null;
                                      submitter = firstVal 
                                        ? (Array.isArray(firstVal) ? firstVal.join(', ') : String(firstVal))
                                        : app.email || 'Unknown';
                                  }
                                  
                                  if (app.isTestCertificate) {
                                    submitter = `⭐ TEST CERT: ${app.name || 'Unknown Name'} (${app.email || 'Unknown Email'})`;
                                  }
                                  
                                  return (
                                  <div key={app.id} className="p-4 space-y-3 hover:bg-[#ffffff] transition-colors font-mono">
                                    <div className="flex justify-between items-start gap-4">
                                      <div className="flex flex-col">
                                         <div className="text-sm font-semibold text-gray-900 break-words">{submitter}</div>
                                         <div className="text-xs text-[#6b7280] break-words">{app.email || '—'}</div>
                                      </div>
                                      <div className="text-xs text-[#6b7280] whitespace-nowrap shrink-0">
                                        {app.timestamp?.toDate ? app.timestamp.toDate().toLocaleDateString() : 'Unknown'}
                                      </div>
                                    </div>
                                    <div className="flex flex-wrap gap-2 pt-2">
                                      {appStatusFilter === 'applied' && (
                                        <>
                                          <button
                                            onClick={async () => {
                                              try {
                                                await updateDoc(doc(db, 'volunteerApplications', app.id), { status: 'approved' });
updateLocalAppStatus(app.id, 'approved');
showToast('Application approved');
                                              } catch (err) {
                                                showToast('Error approving application');
                                              }
                                            }}
                                            className="flex-1 text-xs bg-green-100 text-green-700 px-3 py-2 rounded hover:bg-green-200 transition-colors text-center"
                                          >
                                            ✅ Approve
                                          </button>
                                          <button
                                            onClick={async () => {
                                              try {
                                                await updateDoc(doc(db, 'volunteerApplications', app.id), { status: 'rejected' });
updateLocalAppStatus(app.id, 'rejected');
showToast('Application rejected');
                                              } catch (err) {
                                                showToast('Error rejecting application');
                                              }
                                            }}
                                            className="flex-1 text-xs bg-red-50 text-red-700 px-3 py-2 rounded hover:bg-red-100 transition-colors text-center"
                                          >
                                            ❌ Reject
                                          </button>
                                        </>
                                      )}
                                      {appStatusFilter === 'approved' && (
                                        <>
                                          <button
                                            onClick={async () => {
                                              try {
                                                const certificateTrackingCode = Math.random().toString(36).substring(2, 10).toUpperCase();
                                                await updateDoc(doc(db, 'volunteerApplications', app.id), { 
                                                  status: 'finalized',
                                                  certificateTrackingCode
                                                });
                                                updateLocalAppStatus(app.id, 'finalized');
                                                showToast('Moved to Finalists');
                                              } catch (err) {
                                                showToast('Error finalizing');
                                              }
                                            }}
                                            className="flex-1 text-xs bg-blue-100 text-blue-700 px-3 py-2 rounded hover:bg-blue-200 transition-colors text-center font-bold border border-blue-200"
                                          >
                                            🏆 Final Accept
                                          </button>
                                          <button
                                            onClick={async () => {
                                              if (true) {
                                                try {
                                                  await updateDoc(doc(db, 'volunteerApplications', app.id), { status: 'rejected' });
                                                  updateLocalAppStatus(app.id, 'rejected');
                                                  showToast('Application moved to rejected');
                                                } catch (err) {
                                                  showToast('Error modifying status');
                                                }
                                              }
                                            }}
                                            className="flex-1 text-xs bg-red-50 text-red-700 px-3 py-2 rounded hover:bg-red-100 transition-colors text-center md:hidden"
                                          >
                                            ❌ Move to Rejected
                                          </button>
                                        </>
                                      )}
                                      {appStatusFilter === 'rejected' && (
                                        <button
                                          onClick={async () => {
                                            if (true) {
                                              try {
                                                await updateDoc(doc(db, 'volunteerApplications', app.id), { status: 'approved' });
updateLocalAppStatus(app.id, 'approved');
showToast('Application moved to approved');
                                              } catch (err) {
                                                showToast('Error modifying status');
                                              }
                                            }
                                          }}
                                          className="flex-1 text-xs bg-green-100 text-green-700 px-3 py-2 rounded hover:bg-green-200 transition-colors text-center md:hidden"
                                        >
                                          ✅ Move to Approved
                                        </button>
                                      )}
                                      <button
                                        onClick={() => setSelectedApplication(app)}
                                        className="flex-1 text-xs bg-[#fe0000] text-white px-3 py-2 rounded hover:bg-red-700 transition-colors text-center"
                                      >
                                        View Details
                                      </button>
                                      <button
                                        onClick={async () => {
                                          if (true) {
                                            try {
                                              await deleteDoc(doc(db, 'volunteerApplications', app.id));
deleteLocalApp(app.id);
showToast('Application deleted');
                                            } catch (err) {
                                              console.error('Error deleting application:', err);
                                              showToast('Failed to delete application');
                                            }
                                          }
                                        }}
                                        className="text-xs bg-red-100 text-red-600 px-3 py-2 rounded hover:bg-red-200 transition-colors"
                                      >
                                        Delete
                                      </button>
                                    </div>
                                  </div>
                                )})
                              )}
                            </div>
                            {hasMoreApps && !appSearchQuery && applications.length > 0 && (
                              <div className="p-4 border-t border-[#e5e7eb] flex justify-center bg-white">
                                <button
                                  onClick={() => loadApplications(selectedFormForApps, true)}
                                  disabled={loadingApps}
                                  className="text-sm font-mono text-[#6b7280] hover:text-black disabled:opacity-50"
                                >
                                  {loadingApps ? 'Loading...' : 'Load More'}
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {activeTab === 'admins' && (
                    <div className="space-y-6">
                      <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-bold">Manage Admins</h3>
                      </div>
                      
                      <div className="space-y-4 bg-[#f9fafb] p-4 rounded border border-[#e5e7eb]">
                        <p className="text-sm text-[#6b7280] font-mono mb-4">
                          Add new administrators and assign them specific roles. Superadmins have full access. Form Admins can manage forms and applications. Content Editors can manage portfolio, lab, press, and about sections.
                        </p>
                        
                        <form 
                          onSubmit={async (e) => {
                            e.preventDefault();
                            const form = e.target as HTMLFormElement;
                            const emailInput = form.elements.namedItem('email') as HTMLInputElement;
                            const roleSelect = form.elements.namedItem('role') as HTMLSelectElement;
                            
                            const email = emailInput.value.trim();
                            const role = roleSelect.value;
                            
                            if (!email || !role) return;
                            
                            try {
                              await setDoc(doc(db, 'adminRoles', email), { role });
                              showToast(`Added ${email} as ${role}`);
                              form.reset();
                              loadAdmins();
                            } catch (err) {
                              console.error('Failed to add admin:', err);
                              showToast('Failed to add admin');
                            }
                          }}
                          className="flex flex-col md:flex-row gap-4 items-end"
                        >
                          <div className="flex-1 w-full">
                            <label className="block text-xs font-bold mb-1 text-[#6b7280]">Email Address</label>
                            <input 
                              type="email" 
                              name="email"
                              required
                              className="w-full bg-white border border-[#e5e7eb] rounded p-2 text-sm"
                              placeholder="admin@example.com"
                            />
                          </div>
                          <div className="flex-1 w-full">
                            <label className="block text-xs font-bold mb-1 text-[#6b7280]">Role</label>
                            <select 
                              name="role"
                              required
                              className="w-full bg-white border border-[#e5e7eb] rounded p-2 text-sm"
                            >
                              <option value="superadmin">Superadmin (Full Access)</option>
                              <option value="formadmin">Form Admin (Forms & CRM)</option>
                              <option value="contenteditor">Content Editor (Portfolio, Lab, etc.)</option>
                            </select>
                          </div>
                          <button 
                            type="submit"
                            className="bg-[#fe0000] text-white px-4 py-2 rounded text-sm hover:bg-red-700 transition-colors w-full md:w-auto shrink-0"
                          >
                            Add Admin
                          </button>
                        </form>
                      </div>

                      <div className="bg-white rounded border border-[#e5e7eb] overflow-hidden">
                        <div className="p-4 border-b border-[#e5e7eb] bg-[#f9fafb]">
                          <h4 className="font-bold text-sm">Current Administrators</h4>
                        </div>
                        <div className="divide-y divide-[#e5e7eb]">
                          {adminsList.map((admin) => (
                            <div key={admin.id} className="p-4 flex justify-between items-center hover:bg-[#f9fafb] transition-colors">
                              <div>
                                <div className="font-bold text-sm">{admin.id}</div>
                                <div className="text-xs text-[#6b7280] uppercase tracking-wider mt-1">{admin.role}</div>
                              </div>
                              <button
                                onClick={async () => {
                                  if (true) {
                                    try {
                                      await deleteDoc(doc(db, 'adminRoles', admin.id));
                                      showToast(`Removed ${admin.id}`);
                                      loadAdmins();
                                    } catch (err) {
                                      console.error('Failed to remove admin:', err);
                                      showToast('Failed to remove admin');
                                    }
                                  }
                                }}
                                className="text-red-500 hover:text-red-700 p-2"
                                title="Remove Admin"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          ))}
                          {adminsList.length === 0 && (
                            <div className="p-8 text-center text-[#6b7280] text-sm">
                              No additional administrators found.
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === 'users' && (
                    <div className="space-y-6">
                      <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-bold">Registered Users</h3>
                        <div className="flex gap-2">
                          <button 
                            onClick={async () => {
                              if(window.confirm('This will disable users inactive for over 6 months. Continue?')) {
                                const sixMonthsAgo = new Date();
                                sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
                                let count = 0;
                                for (const u of siteUsers) {
                                  const lastActive = u.lastActiveAt?.toDate?.() || u.createdAt?.toDate?.() || new Date(0);
                                  if (lastActive < sixMonthsAgo && !u.isDisabled) {
                                    try {
                                      await updateDoc(doc(db, 'users', u.uid), { isDisabled: true });
                                      count++;
                                    } catch(e) { handleFirestoreError(e, OperationType.UPDATE, 'users'); }
                                  }
                                }
                                showToast(`${count} inactive users disabled.`);
                                loadSiteUsers();
                              }
                            }}
                            className="text-xs text-white bg-black flex items-center gap-1 hover:bg-gray-800 px-3 py-2 rounded transition-colors shadow-sm"
                          >
                            <Trash2 size={14} /> Cleanup Inactive {'>'} 6mo
                          </button>
                          <button onClick={loadSiteUsers} className="text-xs text-[#6b7280] flex items-center gap-1 hover:text-black hover:bg-[#e5e7eb] px-2 py-1 rounded transition-colors bg-[#f9fafb] border border-[#e5e7eb]">
                            <RefreshCw size={14} /> Refresh
                          </button>
                        </div>
                      </div>
                      
                      <div className="bg-white rounded border border-[#e5e7eb] overflow-hidden flex flex-col">
                        <div className="p-4 border-b border-[#e5e7eb] bg-[#f9fafb] flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
                          <div className="flex gap-2">
                            <button
                              onClick={() => setUsersFilter('all')}
                              className={`px-4 py-2 rounded transition-colors text-sm font-mono whitespace-nowrap ${usersFilter === 'all' ? 'bg-black text-white font-bold' : 'bg-white border text-gray-500 hover:text-black hover:bg-gray-100'}`}
                            >
                              All Users
                            </button>
                            <button
                              onClick={() => setUsersFilter('banned')}
                              className={`px-4 py-2 rounded transition-colors text-sm font-mono whitespace-nowrap ${usersFilter === 'banned' ? 'bg-red-600 text-white font-bold' : 'bg-white border text-gray-500 hover:text-black hover:bg-gray-100'}`}
                            >
                              Banned Users
                            </button>
                          </div>
                          <div className="flex bg-white items-center px-3 py-2 border border-[#e5e7eb] rounded-lg shadow-sm w-full md:w-auto">
                            <Search className="text-gray-400 mr-2" size={16} />
                            <input 
                              type="text" 
                              placeholder="Search by name, email, phone..." 
                              value={usersSearchQuery}
                              onChange={(e) => setUsersSearchQuery(e.target.value)}
                              className="outline-none text-sm w-full font-mono bg-transparent"
                            />
                            {usersSearchQuery && (
                              <button onClick={() => setUsersSearchQuery('')} className="ml-2 text-gray-400 hover:text-black">
                                &times;
                              </button>
                            )}
                          </div>
                        </div>
                        <div className="divide-y divide-[#e5e7eb]">
                          {loadingUsers && siteUsers.length === 0 ? (
                            <div className="p-8 text-center text-[#6b7280]">Loading users...</div>
                          ) : siteUsers.filter((u) => {
                             if (usersFilter !== 'all' && !(usersFilter === 'banned' && u.isBanned)) return false;
                             if (usersSearchQuery) {
                               const queryObj = usersSearchQuery.toLowerCase();
                               const nameMatch = u.name?.toLowerCase().includes(queryObj) || false;
                               const surnameMatch = u.surname?.toLowerCase().includes(queryObj) || false;
                               const emailMatch = u.email?.toLowerCase().includes(queryObj) || false;
                               const phoneMatch = u.phone?.toLowerCase().includes(queryObj) || false;
                               return nameMatch || surnameMatch || emailMatch || phoneMatch;
                             }
                             return true;
                          }).length === 0 ? (
                            <div className="p-8 text-center text-[#6b7280] text-sm font-mono">
                              No users found in this category.
                            </div>
                          ) : (
                            <>
                              {siteUsers.filter((u) => {
                                 if (usersFilter !== 'all' && !(usersFilter === 'banned' && u.isBanned)) return false;
                                 if (usersSearchQuery) {
                                   const queryObj = usersSearchQuery.toLowerCase();
                                   const nameMatch = u.name?.toLowerCase().includes(queryObj) || false;
                                   const surnameMatch = u.surname?.toLowerCase().includes(queryObj) || false;
                                   const emailMatch = u.email?.toLowerCase().includes(queryObj) || false;
                                   const phoneMatch = u.phone?.toLowerCase().includes(queryObj) || false;
                                   return nameMatch || surnameMatch || emailMatch || phoneMatch;
                                 }
                                 return true;
                              }).map((u) => {
                                const lastActive = u.lastActiveAt?.toDate?.() || u.createdAt?.toDate?.() || null;
                                const isInactive = lastActive ? (new Date().getTime() - lastActive.getTime() > 6 * 30 * 24 * 60 * 60 * 1000) : false;
                                
                                return (
                                <div key={u.uid} className={`p-4 flex flex-col md:flex-row justify-between md:items-center transition-colors gap-4 ${isInactive ? 'bg-orange-50/50' : 'hover:bg-[#f9fafb]'}`}>
                                  <div className="flex flex-col">
                                    <div className="font-bold text-sm uppercase font-head mb-1 flex items-center gap-2">
                                      {u.name} {u.surname}
                                      {u.isBanned && <span className="bg-red-500 text-white text-[10px] px-2 py-0.5 rounded">BANNED</span>}
                                      {u.isDisabled && <span className="bg-gray-500 text-white text-[10px] px-2 py-0.5 rounded">DISABLED</span>}
                                      {!u.isDisabled && isInactive && <span className="text-orange-500 text-[10px] border border-orange-200 px-1">INACTIVE</span>}
                                    </div>
                                    <div className="text-xs text-[#6b7280] font-mono">{u.email}</div>
                                    {lastActive && <div className="text-[10px] text-gray-400 mt-1">Last active: {lastActive.toLocaleDateString()}</div>}
                                  </div>
                                  <div className="flex items-center gap-2 self-start md:self-auto flex-wrap">
                                    <button
                                      onClick={async () => {
                                        try {
                                          const isBanning = !u.isBanned;
                                          if(isBanning) {
                                            if(!window.confirm(`Ban ${u.email}? They will not be able to log in.`)) return;
                                          }
                                          
                                          // Optimistic UI update
                                          setSiteUsers(prev => prev.map(p => p.uid === u.uid ? { ...p, isBanned: isBanning } : p));
                                          
                                          if(isBanning) {
                                            await updateDoc(doc(db, 'users', u.uid), { isBanned: true });
                                            showToast('User banned successfully');
                                          } else {
                                            await updateDoc(doc(db, 'users', u.uid), { isBanned: false });
                                            showToast('User unbanned successfully');
                                          }
                                        } catch(e: any) {
                                          showToast(e.message || "Failed to update user status", true);
                                          try { handleFirestoreError(e, OperationType.UPDATE, `users/${u.uid}`); } catch(err) {}
                                          await loadSiteUsers(); // Revert on failure
                                        }
                                      }}
                                      className={`px-3 py-1.5 font-mono text-xs transition-colors rounded-sm border ${u.isBanned ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100' : 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100'}`}
                                    >
                                      {u.isBanned ? 'Unban' : 'Ban User'}
                                    </button>
                                    <button
                                      onClick={() => setSelectedSiteUser(u)}
                                      className="bg-black text-white px-3 py-1.5 font-mono text-xs hover:bg-gray-800 transition-colors flex items-center gap-2 rounded-sm"
                                      title="View Details"
                                    >
                                      View Data
                                    </button>
                                    <button
                                      onClick={async () => {
                                        if(window.confirm(`CRITICAL: Are you sure you want to permanently delete user ${u.email}? This will wipe their profile and cabinet completely. They must re-register! (Note: their submitted form datasets will remain but lose profile link).`)) {
                                          
                                          // Optimistic UI update
                                          setSiteUsers(prev => prev.filter(p => p.uid !== u.uid));
                                          
                                          try {
                                            await deleteDoc(doc(db, 'users', u.uid));
                                            
                                            // Also delete all their volunteer applications to wipe all traces
                                            const appsRef = collection(db, 'volunteerApplications');
                                            const userAppsQuery = query(appsRef, where('userId', '==', u.uid));
                                            const userAppsSnap = await getDocs(userAppsQuery);
                                            for (const appDoc of userAppsSnap.docs) {
                                              await cleanUpCloudinaryImagesForApp(appDoc.data());
                                              await deleteDoc(appDoc.ref);
                                            }

                                            showToast(`Deleted user and ${userAppsSnap.docs.length} apps`);
                                          } catch(e: any) {
                                            showToast(e.message || "Failed to delete user", true);
                                            try { handleFirestoreError(e, OperationType.DELETE, `users/${u.uid}`); } catch(err) {}
                                            await loadSiteUsers(); // Revert on failure
                                          }
                                        }
                                      }}
                                      className="bg-white text-red-600 border border-red-200 px-3 py-1.5 font-mono text-xs hover:bg-red-50 transition-colors flex items-center gap-2 rounded-sm ml-4"
                                    >
                                      Delete
                                    </button>
                                  </div>
                                </div>
                              )})}
                              {hasMoreUsers && usersFilter === 'all' && siteUsers.length > 0 && (
                                <div className="p-4 flex justify-center bg-white border-t border-[#e5e7eb]">
                                  <button
                                    onClick={() => loadSiteUsers(true)}
                                    disabled={loadingUsers}
                                    className="text-sm font-mono text-[#6b7280] hover:text-black disabled:opacity-50"
                                  >
                                    {loadingUsers ? 'Loading...' : 'Load More'}
                                  </button>
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === 'certificates' && (
                    <div className="space-y-6">
                       <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-bold uppercase font-head text-gray-900">Certificates Management</h3>
                        <button onClick={loadCertificates} className="text-xs text-[#6b7280] flex items-center gap-1 hover:text-black hover:bg-[#e5e7eb] px-2 py-1 rounded transition-colors bg-[#f9fafb] border border-[#e5e7eb]">
                          <RefreshCw size={14} /> Refresh
                        </button>
                      </div>

                      <div className="bg-white p-6 border border-[#e5e7eb] shadow-sm mb-8 rounded">
                         <h4 className="font-bold text-sm uppercase font-head text-gray-900 mb-4 flex items-center gap-2">
                           <Shield size={16} className="text-red-500" />
                           Issue Test Certificate
                         </h4>
                         <div className="flex flex-col md:flex-row gap-4 items-end">
                           <div className="flex-1">
                             <label className="block text-xs font-bold text-gray-700 uppercase mb-2">Target User Email</label>
                             <input 
                               id="test_cert_email"
                               type="email" 
                               placeholder="e.g. user@example.com" 
                               className="w-full px-4 py-2 border border-[#e5e7eb] text-sm focus:outline-none focus:border-black font-mono bg-white text-black" 
                             />
                           </div>
                           <div className="flex-1">
                             <label className="block text-xs font-bold text-gray-700 uppercase mb-2">Select Event Template</label>
                             <select id="test_cert_event" className="w-full px-4 py-2 border border-[#e5e7eb] text-sm focus:outline-none focus:border-black font-mono bg-white text-black">
                                <option value="">-- Choose Event --</option>
                                {certificates.map(cert => (
                                  <option key={cert.id} value={cert.formId}>
                                    {formSchemas.find(s => s.id === cert.formId)?.name || 'Unknown Event'}
                                  </option>
                                ))}
                             </select>
                           </div>
                           <button 
                             onClick={async () => {
                               const emailInput = document.getElementById('test_cert_email') as HTMLInputElement;
                               const eventSelect = document.getElementById('test_cert_event') as HTMLSelectElement;
                               if (!emailInput.value || !eventSelect.value) {
                                 showToast('Please provide email and select an event.');
                                 return;
                               }
                               
                               try {
                                 const q = query(collection(db, 'users'), where('email', '==', emailInput.value.trim()), limit(1));
                                 const snapshot = await getDocs(q);
                                 if (snapshot.empty) {
                                   showToast('User not found in system. They must login at least once.', true);
                                   return;
                                 }
                                 const userDoc = snapshot.docs[0];
                                 const userData = userDoc.data();
                                 const targetUid = userDoc.id;
                                 
                                 const formId = eventSelect.value;
                                 const schemaName = formSchemas.find(s => s.id === formId)?.name || 'Test Event';
                                 
                                 const trackingCode = `TEST_${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
                                 const appId = `${formId}_${targetUid}`;
                                 
                                 await setDoc(doc(db, 'volunteerApplications', appId), {
                                   eventId: formId,
                                   eventName: schemaName,
                                   type: 'volunteer',
                                   userId: targetUid,
                                   name: `${userData.name || ''} ${userData.surname || ''}`.trim(),
                                   email: userData.email || emailInput.value.trim(),
                                   searchKeywords: generateApplicationKeywords({
                                     name: userData.name || '',
                                     surname: userData.surname || '',
                                     email: userData.email || emailInput.value.trim()
                                   }),
                                   isTestCertificate: true,
                                   formData: {
                                      "Name": `${userData.name || ''} ${userData.surname || ''}`.trim(),
                                      "Email": userData.email || emailInput.value.trim(),
                                      "Note": "This is a Test Certificate",
                                      "Time": new Date().toLocaleString()
                                   },
                                   status: 'finalized',
                                   certificateTrackingCode: trackingCode,
                                   timestamp: serverTimestamp()
                                 });
                                 
                                 showToast(`Test cert issued to ${userData.name || emailInput.value}!`);
                                 emailInput.value = '';
                                 eventSelect.value = '';
                               } catch (err) {
                                 console.error("Test claim error", err);
                                 showToast('Failed to issue cert.', true);
                               }
                             }}
                             className="bg-black text-white px-6 py-2 text-sm font-bold uppercase transition-colors hover:bg-[#fe0000] whitespace-nowrap rounded"
                           >
                             Issue Now
                           </button>
                         </div>
                         <p className="text-xs text-gray-400 font-mono mt-3">The user will see the test certificate immediately in their cabinet.</p>
                      </div>

                      <div className="bg-white p-6 border border-[#e5e7eb] shadow-sm mb-8 rounded">
                         <h4 className="font-bold text-sm uppercase font-head text-gray-900 mb-4 flex items-center gap-2">
                           <Trash2 size={16} className="text-red-500" />
                           Revoke / Delete Certificate
                         </h4>
                         <div className="flex flex-col md:flex-row gap-4 items-end">
                           <div className="flex-1">
                             <label className="block text-xs font-bold text-gray-700 uppercase mb-2">Target User Email</label>
                             <input 
                               id="revoke_cert_email"
                               type="email" 
                               placeholder="e.g. user@example.com"
                               value={revokeEmail}
                               onChange={(e) => setRevokeEmail(e.target.value)}
                               className="w-full px-4 py-2 border border-[#e5e7eb] text-sm focus:outline-none focus:border-red-500 font-mono bg-white text-black" 
                             />
                           </div>
                           <div className="flex-1">
                             <label className="block text-xs font-bold text-gray-700 uppercase mb-2">Select Event Template</label>
                             <select id="revoke_cert_event" className="w-full px-4 py-2 border border-[#e5e7eb] text-sm focus:outline-none focus:border-red-500 font-mono bg-white text-black">
                                {findingCerts ? (
                                  <option value="">-- Scanning... --</option>
                                ) : userCertsToRevoke.length === 0 && revokeEmail ? (
                                  <option value="">-- No certificates found --</option>
                                ) : (
                                  <>
                                    <option value="">-- Choose Event --</option>
                                    {userCertsToRevoke.map(cert => {
                                      const eventId = cert.eventId || cert.formId;
                                      return (
                                        <option key={cert.id} value={cert.id}>
                                          {cert.eventName || formSchemas.find(s => s.id === eventId)?.name || 'Unknown Event'}
                                        </option>
                                      );
                                    })}
                                  </>
                                )}
                             </select>
                           </div>
                           <button 
                             onClick={async () => {
                               const emailInput = document.getElementById('revoke_cert_email') as HTMLInputElement;
                               const eventSelect = document.getElementById('revoke_cert_event') as HTMLSelectElement;
                               if (!emailInput.value || !eventSelect.value) {
                                 showToast('Please provide email and select an event.');
                                 return;
                               }
                               
                               if (!confirm(`Are you sure you want to revoke/delete the certificate for ${emailInput.value}?`)) return;

                               try {
                                 const certId = eventSelect.value;
                                 const docRef = doc(db, 'volunteerApplications', certId);
                                 const docSnap = await getDoc(docRef);
                                 
                                 if (!docSnap.exists()) {
                                    showToast('Assigned certificate not found.', true);
                                    return;
                                 }

                                 const appData = docSnap.data();
                                 if (appData.formData?.Note === "This is a Test Certificate" || appData.isTestCertificate) {
                                    await deleteDoc(docRef);
                                 } else {
                                    await updateDoc(docRef, {
                                      status: 'applied',
                                      certificateTrackingCode: deleteField()
                                    });
                                 }

                                 showToast(`Successfully revoked the certificate.`);
                                 setRevokeEmail(emailInput.value.trim() + ' ');
                                 setTimeout(() => setRevokeEmail(emailInput.value.trim()), 0);
                               } catch (err) {
                                 console.error(err);
                                 showToast('Revoke operation failed', true);
                               }
                             }}
                             className="bg-white text-red-500 border border-red-500 px-6 py-2 text-sm font-bold uppercase transition-colors hover:bg-red-500 hover:text-white whitespace-nowrap rounded"
                           >
                             Revoke
                           </button>
                         </div>
                      </div>

                      <div className="bg-white rounded border border-[#e5e7eb] p-6 space-y-6 shadow-sm">
                         <h4 className="font-bold text-sm border-b pb-2 text-gray-900">{editingCert ? 'Edit Certificate Template' : 'Assign Certificate Template to Form'}</h4>
                         <p className="text-xs text-gray-500">When an application for the selected form is finalized, the user will see a certificate with their name placed at the specified coordinates.</p>
                         <form key={editingCert?.id || 'new'} className="space-y-4 max-w-xl" onSubmit={async (e) => {
                            e.preventDefault();
                            const formData = new FormData(e.currentTarget);
                            const formId = formData.get('formId') as string;
                            const templateUrl = formData.get('templateUrl') as string;
                            const x = Number(formData.get('nameX'));
                            const y = Number(formData.get('nameY'));
                            const fontSize = Number(formData.get('fontSize'));
                            const color = formData.get('color') as string;
                            const qrX = Number(formData.get('qrX'));
                            const qrY = Number(formData.get('qrY'));
                            const qrSize = Number(formData.get('qrSize'));

                            if (!formId || !templateUrl) return;

                            try {
                              if (editingCert) {
                                await updateDoc(doc(db, 'certificates', editingCert.id), {
                                  formId,
                                  templateUrl,
                                  namePos: { x, y },
                                  qrPos: { x: qrX, y: qrY, size: qrSize },
                                  fontSize,
                                  color,
                                  updatedAt: serverTimestamp()
                                });
                                showToast('Certificate template updated!');
                                setEditingCert(null);
                              } else {
                                await addDoc(collection(db, 'certificates'), {
                                  formId,
                                  templateUrl,
                                  namePos: { x, y },
                                  qrPos: { x: qrX, y: qrY, size: qrSize },
                                  fontSize,
                                  color,
                                  createdAt: serverTimestamp()
                                });
                                showToast('Certificate template saved!');
                              }
                              loadCertificates();
                              (e.target as HTMLFormElement).reset();
                            } catch (err) {
                              console.error(err);
                              showToast('Failed to save certificate');
                            }
                         }}>
                            <div>
                               <label className="block text-xs font-bold font-mono mb-1 text-gray-700">Select Form/Event</label>
                               <select name="formId" defaultValue={editingCert?.formId || ""} className="w-full border border-[#e5e7eb] p-2 text-sm rounded bg-white text-gray-900" required>
                                  <option value="">-- Choose Form --</option>
                                  {formSchemas.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                               </select>
                            </div>
                            <div>
                               <label className="block text-xs font-bold font-mono mb-1 text-gray-700">Background Image URL (Certificate Cover)</label>
                               <div className="flex gap-2">
                                 <input id="certTemplateUrl" name="templateUrl" type="text" defaultValue={editingCert?.templateUrl || ""} className="w-full border border-[#e5e7eb] p-2 text-sm rounded text-gray-900" placeholder="https://..." required />
                                 <button type="button" onClick={() => {
                                   const url = (document.getElementById('certTemplateUrl') as HTMLInputElement)?.value;
                                   if (!url) {
                                     alert('Please enter a Background Image URL first.');
                                     return;
                                   }
                                   setPickerImageUrl(url);
                                   setPickerTarget('name');
                                   const curX = Number((document.getElementById('certNameX') as HTMLInputElement)?.value) || 200;
                                   const curY = Number((document.getElementById('certNameY') as HTMLInputElement)?.value) || 300;
                                   setPickerPosition({ x: curX, y: curY });
                                   setShowPickerModal(true);
                                 }} className="bg-blue-600 text-white px-4 py-2 rounded text-xs whitespace-nowrap hover:bg-blue-700 transition-colors font-mono">Set Name Visually</button>
                                 <button type="button" onClick={() => {
                                   const url = (document.getElementById('certTemplateUrl') as HTMLInputElement)?.value;
                                   if (!url) {
                                     alert('Please enter a Background Image URL first.');
                                     return;
                                   }
                                   setPickerImageUrl(url);
                                   setPickerTarget('qr');
                                   const curX = Number((document.getElementById('certQrX') as HTMLInputElement)?.value) || 100;
                                   const curY = Number((document.getElementById('certQrY') as HTMLInputElement)?.value) || 100;
                                   setQrPickerPosition({ x: curX, y: curY });
                                   setShowPickerModal(true);
                                 }} className="bg-green-600 text-white px-4 py-2 rounded text-xs whitespace-nowrap hover:bg-green-700 transition-colors font-mono">Set QR Visually</button>
                               </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                               <div>
                                  <label className="block text-xs font-bold font-mono mb-1 text-blue-600">Name X-Position (px)</label>
                                  <input id="certNameX" name="nameX" type="number" defaultValue={editingCert?.namePos?.x || 200} className="w-full border border-[#e5e7eb] p-2 text-sm rounded text-gray-900" />
                               </div>
                               <div>
                                  <label className="block text-xs font-bold font-mono mb-1 text-blue-600">Name Y-Position (px)</label>
                                  <input id="certNameY" name="nameY" type="number" defaultValue={editingCert?.namePos?.y || 300} className="w-full border border-[#e5e7eb] p-2 text-sm rounded text-gray-900" />
                               </div>
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                               <div>
                                  <label className="block text-xs font-bold font-mono mb-1 text-green-600">QR X-Pos (px)</label>
                                  <input id="certQrX" name="qrX" type="number" defaultValue={editingCert?.qrPos?.x || 100} className="w-full border border-[#e5e7eb] p-2 text-sm rounded text-gray-900" />
                               </div>
                               <div>
                                  <label className="block text-xs font-bold font-mono mb-1 text-green-600">QR Y-Pos (px)</label>
                                  <input id="certQrY" name="qrY" type="number" defaultValue={editingCert?.qrPos?.y || 100} className="w-full border border-[#e5e7eb] p-2 text-sm rounded text-gray-900" />
                               </div>
                               <div>
                                  <label className="block text-xs font-bold font-mono mb-1 text-green-600">QR Size (px)</label>
                                  <input name="qrSize" type="number" defaultValue={editingCert?.qrPos?.size || 150} className="w-full border border-[#e5e7eb] p-2 text-sm rounded text-gray-900" />
                               </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                               <div>
                                  <label className="block text-xs font-bold font-mono mb-1 text-gray-700">Font Size (px)</label>
                                  <input name="fontSize" type="number" defaultValue={editingCert?.fontSize || 32} className="w-full border border-[#e5e7eb] p-2 text-sm rounded text-gray-900" />
                               </div>
                               <div>
                                  <label className="block text-xs font-bold font-mono mb-1 text-gray-700">Text Color (hex)</label>
                                  <input name="color" type="text" defaultValue={editingCert?.color || "#000000"} className="w-full border border-[#e5e7eb] p-2 text-sm rounded text-gray-900" />
                               </div>
                            </div>
                            <div className="flex gap-4">
                               <button type="submit" className="bg-[#fe0000] text-white px-6 py-2 rounded text-sm hover:bg-red-700 transition-colors font-bold shadow-sm">
                                  {editingCert ? 'Update Certificate Template' : 'Add Certificate Template'}
                               </button>
                               {editingCert && (
                                 <button type="button" onClick={() => setEditingCert(null)} className="bg-gray-200 text-gray-800 px-6 py-2 rounded text-sm hover:bg-gray-300 transition-colors font-bold shadow-sm">
                                    Cancel
                                 </button>
                               )}
                            </div>
                         </form>
                      </div>

                      <div className="bg-white rounded border border-[#e5e7eb] overflow-hidden shadow-sm">
                         <div className="p-4 border-b border-[#e5e7eb] bg-[#f9fafb]">
                            <h4 className="font-bold text-sm uppercase font-head text-gray-900 flex justify-between items-center">
                               <span>Configured Certificate Templates</span>
                            </h4>
                         </div>
                         <div className="divide-y divide-[#e5e7eb]">
                            {loadingCertificates ? (
                              <div className="p-8 text-center text-gray-500 font-mono text-sm">Loading templates...</div>
                            ) : certificates.length === 0 ? (
                              <div className="p-8 text-center text-gray-500 italic font-mono text-sm">No certificate templates configured yet.</div>
                            ) : certificates.map(cert => (
                              <div key={cert.id} className="p-4 flex justify-between items-center group hover:bg-[#f9fafb] transition-colors">
                                 <div className="flex-1">
                                    <div className="font-bold text-sm text-gray-900">{formSchemas.find(s => s.id === cert.formId)?.name || 'Unknown Form'}</div>
                                    <div className="text-[10px] text-gray-500 font-mono mt-1">
                                       X:{cert.namePos.x} Y:{cert.namePos.y} | SIZE:{cert.fontSize}px | HEX:{cert.color}
                                    </div>
                                 </div>
                                 <div className="flex gap-4 items-center">
                                    <div className="relative group/preview">
                                      <img src={cert.templateUrl} alt="Preview" className="h-10 w-16 object-cover rounded border border-[#e5e7eb] bg-gray-50" />
                                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/preview:opacity-100 flex items-center justify-center transition-opacity rounded">
                                        <a href={cert.templateUrl} target="_blank" rel="noreferrer" className="text-white text-[8px] uppercase font-bold">Zoom</a>
                                      </div>
                                    </div>
                                    <button 
                                      onClick={() => {
                                        setEditingCert(cert);
                                        // Scroll to top of the block where the form is
                                        window.scrollTo({ top: 0, behavior: 'smooth' });
                                      }}
                                      className="text-blue-500 hover:text-blue-700 p-2 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity"
                                      aria-label="Edit Template"
                                    >
                                       <Edit2 size={16} />
                                    </button>
                                    <button 
                                      onClick={async () => {
                                         if (window.confirm('Are you sure you want to delete this template?')) {
                                           try {
                                              await deleteDoc(doc(db, 'certificates', cert.id));
                                              showToast('Certificate removed');
                                              loadCertificates();
                                           } catch (err) {
                                              showToast('Delete failed');
                                           }
                                         }
                                      }}
                                      className="text-red-500 hover:text-red-700 p-2 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity"
                                      aria-label="Delete Template"
                                    >
                                       <Trash2 size={16} />
                                    </button>
                                 </div>
                              </div>
                            ))}
                         </div>
                      </div>

                      <div className="bg-white rounded border border-[#e5e7eb] overflow-hidden shadow-sm mt-8">
                         <div className="p-4 border-b border-[#e5e7eb] bg-[#f9fafb] flex justify-between items-center">
                            <h4 className="font-bold text-sm uppercase font-head text-gray-900">Certificate Download Logs</h4>
                            <button onClick={loadDownloadLogs} className="text-xs text-[#6b7280] font-normal hover:text-black hover:bg-[#e5e7eb] px-2 py-1 flex items-center gap-1 rounded border border-[#e5e7eb]">
                              <RefreshCw size={12} className={loadingLogs ? "animate-spin" : ""} /> Refresh Logs
                            </button>
                         </div>
                         <div className="divide-y divide-[#e5e7eb]">
                           {loadingLogs ? (
                              <div className="p-8 text-center text-gray-500 font-mono text-sm">Loading logs...</div>
                           ) : downloadLogs.length === 0 ? (
                              <div className="p-8 text-center text-gray-500 italic font-mono text-sm">
                                No certificates have been downloaded yet. Click refresh to check for new downloads.
                              </div>
                           ) : (
                              <>
                                <table className="w-full text-left text-sm font-mono">
                                  <thead className="bg-gray-50 border-b border-[#e5e7eb] text-xs text-gray-500 uppercase">
                                    <tr>
                                      <th className="px-4 py-3 font-medium">Date & Time</th>
                                      <th className="px-4 py-3 font-medium">User</th>
                                      <th className="px-4 py-3 font-medium">Event</th>
                                      <th className="px-4 py-3 font-medium text-right">Downloads</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-[#e5e7eb]">
                                    {downloadLogs.map((log: any) => (
                                      <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-4 py-3 whitespace-nowrap">{new Date(log.lastDownload).toLocaleString()}</td>
                                        <td className="px-4 py-3">
                                          <div className="font-bold text-gray-900">{log.name}</div>
                                          <div className="text-xs text-gray-500">{log.email}</div>
                                        </td>
                                        <td className="px-4 py-3">
                                          <div>{log.eventName}</div>
                                          <div className="text-[10px] text-gray-400">Code: {log.trackingCode}</div>
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                          <span className="inline-flex items-center justify-center bg-blue-100 text-blue-800 text-xs font-bold px-2 py-1 rounded-full">
                                            {log.history.length}
                                          </span>
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                                {hasMoreLogs && downloadLogs.length > 0 && (
                                  <div className="p-4 flex justify-center border-t border-[#e5e7eb]">
                                    <button
                                      onClick={() => loadDownloadLogs(true)}
                                      disabled={loadingLogs}
                                      className="text-sm font-mono text-[#6b7280] hover:text-black disabled:opacity-50"
                                    >
                                      {loadingLogs ? 'Loading...' : 'Load More'}
                                    </button>
                                  </div>
                                )}
                              </>
                           )}
                         </div>
                      </div>
                    </div>
                  )}

                  {activeTab === 'system_tools' && (
                    <div className="space-y-6">
                      <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-bold">System Tools</h3>
                      </div>
                      
                      <div className="bg-white rounded border border-[#e5e7eb] p-6 space-y-6 shadow-sm">
                        <h4 className="font-bold text-sm border-b pb-2 text-gray-900">Data Migration</h4>
                        <p className="text-sm text-gray-600">Run these tools only once to migrate data to the new structure.</p>
                        
                        <div className="space-y-4">
                          <div className="p-4 bg-gray-50 rounded border border-gray-200 flex justify-between items-center">
                            <div>
                              <div className="font-bold">Migrate Settings</div>
                              <div className="text-xs text-gray-500">Migrates separate settings documents into a single 'settings/global' document.</div>
                            </div>
                            <button
                              className="bg-[#fe0000] text-white px-4 py-2 rounded text-sm hover:bg-red-700 transition-colors"
                              onClick={async () => {
                                if (!window.confirm('Run settings migration?')) return;
                                try {
                                  const collectionsToMigrate = ['about', 'translations', 'portfolio', 'press', 'lab', 'contact', 'collaborators', 'theme', 'branding', 'volunteerForm', 'vacanciesForm', 'internshipsForm'];
                                  const globalData: any = {};
                                  for (const key of collectionsToMigrate) {
                                      const docRef = doc(db, 'settings', key);
                                      const docSnap = await getDoc(docRef);
                                      if (docSnap.exists()) {
                                          globalData[key] = docSnap.data().data || docSnap.data();
                                      }
                                  }
                                  if (Object.keys(globalData).length > 0) {
                                      await setDoc(doc(db, 'settings', 'global'), globalData, { merge: true });
                                      showToast('Successfully migrated settings to global config');
                                  } else {
                                      showToast('No data found to migrate');
                                  }
                                } catch (e) {
                                  console.error(e);
                                  showToast('Settings migration failed');
                                }
                              }}
                            >
                              Migrate Settings
                            </button>
                          </div>

                          <div className="p-4 bg-gray-50 rounded border border-gray-200 flex justify-between items-center">
                            <div>
                              <div className="font-bold">Migrate Keywords (Search)</div>
                              <div className="text-xs text-gray-500">Generates searchKeywords for all existing volunteer applications to enable server-side filtering.</div>
                            </div>
                            <button
                              className="bg-[#fe0000] text-white px-4 py-2 rounded text-sm hover:bg-red-700 transition-colors"
                              onClick={async () => {
                                if (!window.confirm('Run keywords migration? This might take a while.')) return;
                                try {
                                  let q = query(collection(db, 'volunteerApplications'));
                                  const snapshot = await getDocs(q);
                                  let count = 0;
                                  showToast(`Migrating ${snapshot.docs.length} apps for keywords...`);
                                  for (const d of snapshot.docs) {
                                    const appData = d.data();
                                    const searchKeywords = generateApplicationKeywords(appData);
                                    await updateDoc(d.ref, { searchKeywords });
                                    count++;
                                  }
                                  showToast(`Migrated ${count} apps for search successfully.`);
                                } catch (e) {
                                  console.error(e);
                                  showToast('Keywords migration failed');
                                }
                              }}
                            >
                              Migrate Keywords
                            </button>
                          </div>

                          <div className="p-4 bg-gray-50 rounded border border-gray-200 flex justify-between items-center">
                            <div>
                              <div className="font-bold">Migrate Applications (CRM)</div>
                              <div className="text-xs text-gray-500">Hydrates legacy applications with names/emails directly on the document (reducing reads).</div>
                            </div>
                            <button
                              className="bg-[#fe0000] text-white px-4 py-2 rounded text-sm hover:bg-red-700 transition-colors"
                              onClick={async () => {
                                if (!window.confirm('Run applications migration? This might take a while.')) return;
                                try {
                                  let q = query(collection(db, 'volunteerApplications'));
                                  const snapshot = await getDocs(q);
                                  let count = 0;
                                  showToast(`Migrating ${snapshot.docs.length} apps...`);
                                  for (const d of snapshot.docs) {
                                    const appData = d.data();
                                    if (appData.userId && (!appData.name || !appData.surname || !appData.email)) {
                                      const userDoc = await getDoc(doc(db, 'users', appData.userId));
                                      if (userDoc.exists()) {
                                        const userData = userDoc.data();
                                        const updates: any = {};
                                        updates.name = userData.name || appData.name || appData.formData?.name || '';
                                        updates.surname = userData.surname || appData.surname || appData.formData?.surname || '';
                                        updates.email = userData.email || appData.email || appData.formData?.email || '';
                                        await updateDoc(d.ref, updates);
                                        count++;
                                      }
                                    }
                                  }
                                  showToast(`Migrated ${count} apps successfully.`);
                                } catch (e) {
                                  console.error(e);
                                  showToast('Applications migration failed');
                                }
                              }}
                            >
                              Migrate Apps
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === 'logs' && (
                    <div className="space-y-6">
                      <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-bold">Profile Audit Logs</h3>
                        <button onClick={loadProfileLogs} className="bg-gray-100 hover:bg-gray-200 text-gray-800 px-4 py-2 rounded text-sm transition-colors border border-gray-300 flex items-center gap-2">
                           <RefreshCw size={14} className={loadingProfileLogs ? "animate-spin" : ""} /> Refresh
                        </button>
                      </div>
                      
                      <div className="bg-white rounded border border-[#e5e7eb] overflow-hidden shadow-sm">
                         <div className="p-4 border-b border-[#e5e7eb] bg-[#f9fafb]">
                            <h4 className="font-bold text-sm uppercase font-head text-gray-900 flex justify-between items-center">
                               <span>Name & Surname Changes</span>
                            </h4>
                         </div>
                         <div className="divide-y divide-[#e5e7eb]">
                           {loadingProfileLogs ? (
                              <div className="p-8 text-center text-gray-500 font-mono text-sm">Loading logs...</div>
                           ) : profileLogs.length === 0 ? (
                              <div className="p-8 text-center text-gray-500 italic font-mono text-sm">No profile changes recorded.</div>
                           ) : (
                              <table className="w-full text-left text-sm font-mono">
                                <thead className="bg-gray-50 border-b border-[#e5e7eb] text-xs text-gray-500 uppercase">
                                  <tr>
                                    <th className="px-4 py-3 font-medium">Date & Time</th>
                                    <th className="px-4 py-3 font-medium">User</th>
                                    <th className="px-4 py-3 font-medium">Changes</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-[#e5e7eb]">
                                  {profileLogs.map((log: any) => (
                                    <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                                      <td className="px-4 py-3 whitespace-nowrap text-xs">
                                        {new Date(log.timestamp?.seconds * 1000).toLocaleString()}
                                      </td>
                                      <td className="px-4 py-3">
                                        <div className="text-gray-900 font-bold">{log.email}</div>
                                        <div className="text-xs text-gray-400">ID: {log.uid}</div>
                                      </td>
                                      <td className="px-4 py-3 space-y-1">
                                         {log.changes?.name && (
                                           <div className="text-xs">
                                             <span className="text-gray-500">Name:</span> <span className="line-through text-red-500">{log.changes.name.old}</span> &rarr; <span className="text-green-600 font-bold">{log.changes.name.new}</span>
                                           </div>
                                         )}
                                         {log.changes?.surname && (
                                           <div className="text-xs">
                                              <span className="text-gray-500">Surname:</span> <span className="line-through text-red-500">{log.changes.surname.old}</span> &rarr; <span className="text-green-600 font-bold">{log.changes.surname.new}</span>
                                           </div>
                                         )}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                           )}
                         </div>
                      </div>
                    </div>
                  )}

                  {showPickerModal && (
                    <div className="fixed inset-0 z-[100] bg-black bg-opacity-80 flex items-center justify-center p-4">
                      <div className="bg-white rounded max-w-5xl w-full max-h-[90vh] flex flex-col overflow-hidden shadow-2xl relative">
                        <div className="p-4 border-b flex justify-between items-center bg-gray-50">
                          <div>
                             <h3 className="font-bold text-lg font-head uppercase">{pickerTarget === 'name' ? 'Pick text Position' : 'Pick QR Position'}</h3>
                             <p className="text-xs text-gray-500 font-mono">Click exactly where the {pickerTarget === 'name' ? "participant's name" : "verification QR code"} should appear.</p>
                          </div>
                          <button onClick={() => setShowPickerModal(false)} className="text-gray-500 hover:text-black hover:bg-gray-200 p-2 rounded transition-colors"><X size={20}/></button>
                        </div>
                        <div className="flex-1 overflow-auto bg-gray-200 p-4 relative flex items-start justify-center">
                           <div className="relative inline-block border border-gray-400 shadow-xl cursor-crosshair bg-white">
                             <img 
                               src={pickerImageUrl} 
                               alt="Certificate Template" 
                               className="block max-w-[80vw]"
                               onLoad={(e) => {
                                 setPickerNaturalSize({
                                   w: e.currentTarget.naturalWidth,
                                   h: e.currentTarget.naturalHeight
                                 });
                               }}
                               onClick={(e) => {
                                  const rect = e.currentTarget.getBoundingClientRect();
                                  const scaleX = e.currentTarget.naturalWidth / rect.width;
                                  const scaleY = e.currentTarget.naturalHeight / rect.height;
                                  const clickX = (e.clientX - rect.left) * scaleX;
                                  const clickY = (e.clientY - rect.top) * scaleY;
                                  if (pickerTarget === 'name') {
                                    setPickerPosition({ x: Math.round(clickX), y: Math.round(clickY) });
                                  } else {
                                    setQrPickerPosition({ x: Math.round(clickX), y: Math.round(clickY) });
                                  }
                               }}
                             />
                             <div 
                               className={`absolute border-2 ${pickerTarget === 'name' ? 'border-[#fe0000] bg-[#fe0000]' : 'border-green-600 bg-green-600'} bg-opacity-20 pointer-events-none transform -translate-x-1/2 -translate-y-1/2 flex items-center justify-center rounded-full`}
                               style={{ 
                                 left: `${((pickerTarget === 'name' ? pickerPosition.x : qrPickerPosition.x) / pickerNaturalSize.w) * 100}%`, 
                                 top: `${((pickerTarget === 'name' ? pickerPosition.y : qrPickerPosition.y) / pickerNaturalSize.h) * 100}%`,
                                 width: pickerTarget === 'name' ? '32px' : '80px',
                                 height: pickerTarget === 'name' ? '32px' : '80px'
                               }}
                             >
                                <div className={`w-1.5 h-1.5 ${pickerTarget === 'name' ? 'bg-[#fe0000]' : 'bg-green-600'} rounded-full`}></div>
                                <div className="absolute top-full mt-1 bg-black text-white text-[9px] px-1 py-0.5 rounded-sm whitespace-nowrap">
                                  {pickerTarget === 'name' ? `${pickerPosition.x}, ${pickerPosition.y}` : `${qrPickerPosition.x}, ${qrPickerPosition.y}`}
                                </div>
                             </div>
                           </div>
                        </div>
                        <div className="p-4 border-t bg-gray-50 flex justify-between items-center">
                          <div className="text-xs font-mono text-gray-700 bg-gray-200 px-3 py-1.5 rounded">
                             Selected: X: {pickerTarget === 'name' ? pickerPosition.x : qrPickerPosition.x}px | Y: {pickerTarget === 'name' ? pickerPosition.y : qrPickerPosition.y}px (Native Res: {pickerNaturalSize.w}x{pickerNaturalSize.h}px)
                          </div>
                          <div className="flex gap-2">
                             <button onClick={() => setShowPickerModal(false)} className="px-4 py-2 text-sm text-gray-600 font-mono hover:text-black">Cancel</button>
                             <button 
                               onClick={() => {
                                 if (pickerTarget === 'name') {
                                   const xInput = document.getElementById('certNameX') as HTMLInputElement;
                                   const yInput = document.getElementById('certNameY') as HTMLInputElement;
                                   if (xInput) xInput.value = pickerPosition.x.toString();
                                   if (yInput) yInput.value = pickerPosition.y.toString();
                                 } else {
                                   const xInput = document.getElementById('certQrX') as HTMLInputElement;
                                   const yInput = document.getElementById('certQrY') as HTMLInputElement;
                                   if (xInput) xInput.value = qrPickerPosition.x.toString();
                                   if (yInput) yInput.value = qrPickerPosition.y.toString();
                                 }
                                 setShowPickerModal(false);
                               }} 
                               className="bg-black text-white px-6 py-2 rounded text-sm hover:bg-gray-800 transition-colors uppercase tracking-widest font-mono"
                             >
                               Save Position
                             </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </motion.div>
  </motion.div>
        )}
      </AnimatePresence>

      {/* User Details Modal */}
      <AnimatePresence>
        {selectedSiteUser && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 z-[110] flex items-center justify-center p-4 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              // ДОБАВЛЕН text-black СЮДА:
              className="bg-white text-black w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded shadow-2xl flex flex-col"
            >
              <div className="p-6 border-b border-[#e5e7eb] flex justify-between items-center sticky top-0 bg-white z-10">
                <h3 className="text-xl font-bold font-head uppercase tracking-wider">User Dossier</h3>
                <button onClick={() => setSelectedSiteUser(null)} className="text-[#6b7280] hover:text-[#fe0000] transition-colors">
                  <X size={24} />
                </button>
              </div>
              <div className="p-6 space-y-4 flex-1 font-mono text-sm">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <div className="bg-[#f9fafb] p-4 border border-[#e5e7eb] rounded break-words">
                      <span className="text-[#6b7280] block mb-1 text-[10px] uppercase tracking-widest">User ID (UID)</span>
                      <span className="font-bold">{selectedSiteUser.uid}</span>
                   </div>
                   <div className="bg-[#f9fafb] p-4 border border-[#e5e7eb] rounded break-words">
                      <span className="text-[#6b7280] block mb-1 text-[10px] uppercase tracking-widest">Email</span>
                      <span className="font-bold">{selectedSiteUser.email || 'N/A'}</span>
                   </div>
                   <div className="bg-[#f9fafb] p-4 border border-[#e5e7eb] rounded break-words">
                      <span className="text-[#6b7280] block mb-1 text-[10px] uppercase tracking-widest">Full Name</span>
                      <span className="font-bold">{selectedSiteUser.name || 'N/A'} {selectedSiteUser.surname || ''}</span>
                   </div>
                   <div className="bg-[#f9fafb] p-4 border border-[#e5e7eb] rounded break-words">
                      <span className="text-[#6b7280] block mb-1 text-[10px] uppercase tracking-widest">Born & Age</span>
                      <span className="font-bold">{selectedSiteUser.dateOfBirth || selectedSiteUser.yearOfBirth || 'N/A'} ({selectedSiteUser.age ? selectedSiteUser.age + 'y' : 'N/A'})</span>
                   </div>
                   <div className="bg-[#f9fafb] p-4 border border-[#e5e7eb] rounded break-words md:col-span-2">
                      <span className="text-[#6b7280] block mb-1 text-[10px] uppercase tracking-widest">Phone Number</span>
                      <span className="font-bold">{selectedSiteUser.phone || 'N/A'}</span>
                   </div>
                   <div className="bg-[#f9fafb] p-4 border border-[#e5e7eb] rounded break-words md:col-span-2">
                      <span className="text-[#6b7280] block mb-1 text-[10px] uppercase tracking-widest">University / Organization</span>
                      <span className="font-bold">{selectedSiteUser.university || 'N/A'}</span>
                   </div>
                   <div className="bg-[#f9fafb] p-4 border border-[#e5e7eb] rounded break-words md:col-span-2">
                      <span className="text-[#6b7280] block mb-1 text-[10px] uppercase tracking-widest">Field of Activity</span>
                      <span className="font-bold">{selectedSiteUser.fieldOfActivity || 'N/A'}</span>
                   </div>
                   <div className="bg-[#f9fafb] p-4 border border-[#e5e7eb] rounded break-words md:col-span-2">
                      <span className="text-[#6b7280] block mb-1 text-[10px] uppercase tracking-widest">Past Experience</span>
                      <span className="font-bold whitespace-pre-wrap">{selectedSiteUser.pastEvents || 'N/A'}</span>
                   </div>
                   <div className="bg-[#f9fafb] p-4 border border-[#e5e7eb] rounded break-words md:col-span-2">
                      <span className="text-[#6b7280] block mb-1 text-[10px] uppercase tracking-widest">Profile Picture</span>
                      {selectedSiteUser.profilePicture ? (
                        <a href={selectedSiteUser.profilePicture} target="_blank" rel="noreferrer" className="text-blue-600 hover:text-[#fe0000] underline flex flex-col mt-2 w-max">
                          Open Original Image
                          <img src={selectedSiteUser.profilePicture} alt="Avatar" className="w-24 h-24 object-cover border border-[#e5e7eb] mt-2 rounded-full" />
                        </a>
                      ) : (
                        <span className="font-bold text-[#6b7280]">Not Uploaded</span>
                      )}
                   </div>
                </div>
                <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 text-yellow-800 text-[10px] uppercase tracking-widest leading-relaxed">
                   <strong>SECURITY NOTICE:</strong> Passwords are end-to-end encrypted and managed by Google Firebase Auth. Admins cannot view or extract user passwords. Last login session timings are internally handled by security tokens to ensure minimal latency, but explicit registered user details are completely dumped above.
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Application Details Modal */}
      {/* Modal overlays and notifications */}
      <AnimatePresence>
        {attendanceCheckEvent && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-xl shadow-2xl overflow-hidden w-full max-w-2xl max-h-[90vh] flex flex-col font-mono relative"
            >
              <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-gray-50">
                <div>
                  <h3 className="text-xl font-bold uppercase mb-1">Verify Attendance</h3>
                  <p className="text-sm text-gray-500">Event: {attendanceCheckEvent.name}</p>
                </div>
                <button
                  onClick={() => setAttendanceCheckEvent(null)}
                  className="text-gray-400 hover:text-red-500 transition-colors bg-white p-2 rounded-full shadow-sm"
                  disabled={attendanceLoading}
                >
                  <X size={20} />
                </button>
              </div>
              
              <div className="p-6 overflow-y-auto flex-1">
                {attendanceLoading ? (
                  <div className="py-12 text-center text-gray-500">Loading approved participants...</div>
                ) : attendanceAppList.length === 0 ? (
                  <div className="py-12 text-center text-gray-500">No approved participants found for this event.</div>
                ) : (
                  <div className="space-y-4">
                    <p className="text-sm mb-4">Please select the participants who attended the event. Unselected participants will be marked as 'Missed'. The selected ones will be sent a certificate.</p>
                    <div className="flex justify-between mb-4 border-b pb-2">
                       <button onClick={() => setAttendanceSelectedIds(new Set(attendanceAppList.map(a => a.id)))} className="text-sm text-blue-600 hover:underline">Select All</button>
                       <button onClick={() => setAttendanceSelectedIds(new Set())} className="text-sm text-gray-500 hover:underline">Select None</button>
                    </div>
                    {attendanceAppList.map(app => {
                      let submitter = '';
                      if (app.name || app.surname) {
                          submitter = `${app.name || ''} ${app.surname || ''}`.trim();
                      } else {
                          const firstVal = getOrderedFormData(app)[0]?.[1];
                          submitter = firstVal 
                            ? (Array.isArray(firstVal) ? firstVal.join(', ') : String(firstVal))
                            : app.email || 'Unknown';
                      }
                      
                      return (
                        <label key={app.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded border border-gray-200 cursor-pointer hover:bg-gray-100">
                          <input 
                            type="checkbox" 
                            className="w-5 h-5 accent-[#fe0000]"
                            checked={attendanceSelectedIds.has(app.id)}
                            onChange={(e) => {
                               const newSet = new Set(attendanceSelectedIds);
                               if (e.target.checked) newSet.add(app.id);
                               else newSet.delete(app.id);
                               setAttendanceSelectedIds(newSet);
                            }}
                          />
                          <div className="flex flex-col">
                             <span className="font-bold">{submitter}</span>
                             <span className="text-xs text-gray-500">{app.email}</span>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>
              
              {!attendanceLoading && attendanceAppList.length > 0 && (
                <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end gap-4">
                  <button
                    onClick={() => setAttendanceCheckEvent(null)}
                    className="px-6 py-2 rounded font-bold text-gray-600 hover:text-black transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmAttendance}
                    className="bg-[#fe0000] text-white px-6 py-2 rounded font-bold hover:bg-red-700 transition-colors shadow-md flex items-center justify-center gap-2"
                  >
                    Issue {attendanceSelectedIds.size} Certificates
                  </button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedApplication && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-[110] flex items-center justify-center p-4 backdrop-blur-sm"
            onClick={() => setSelectedApplication(null)}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              onClick={e => e.stopPropagation()}
              className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden"
            >
              <div className="p-6 border-b border-[#e5e7eb] flex justify-between items-center shrink-0 bg-white">
                <h3 className="text-xl font-bold font-head text-gray-900">Application Details</h3>
                <button onClick={() => setSelectedApplication(null)} aria-label="Close Application Details" className="text-[#6b7280] hover:text-[#fe0000]">
                  <X size={24} />
                </button>
              </div>
              <div className="p-6 space-y-6 font-mono text-sm text-gray-900 overflow-y-auto flex-1">
                <div className="grid grid-cols-2 gap-4 bg-[#f9fafb] p-4 rounded-lg border border-[#e5e7eb]">
                  <div>
                    <span className="text-[#6b7280] text-xs uppercase block mb-1">Date</span>
                    {selectedApplication.timestamp?.toDate ? selectedApplication.timestamp.toDate().toLocaleString() : 'Unknown'}
                  </div>
                  <div>
                    <span className="text-[#6b7280] text-xs uppercase block mb-1">Type</span>
                    <span className="capitalize">{selectedApplication.type || 'volunteer'}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-[#6b7280] text-xs uppercase block mb-1">Event / Form</span>
                    {selectedApplication.eventName}
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-bold border-b border-[#e5e7eb] pb-2 text-gray-900">Submitted Data</h4>

                  {(selectedApplication.profileName || selectedApplication.profileSurname) && (
                    <div className="mb-4 bg-gray-50 border border-gray-200 p-3 rounded">
                      <span className="text-[#6b7280] text-xs uppercase block mb-1 font-bold">Cabinet Profile Name</span>
                      <div className="text-gray-900 font-bold">{selectedApplication.profileName || ''} {selectedApplication.profileSurname || ''}</div>
                    </div>
                  )}

                  {selectedApplication.formData ? (
                    getOrderedFormData(selectedApplication).map(([key, value]) => (
                      <div key={key} className="break-words">
                        <span className="text-[#6b7280] text-xs uppercase block mb-1">{key}</span>
                        {typeof value === 'string' && (value.startsWith('http://') || value.startsWith('https://')) ? (
                          <a href={value} target="_blank" rel="noopener noreferrer" className="text-[#fe0000] hover:underline break-all">
                            {value}
                          </a>
                        ) : (
                          <div className="whitespace-pre-wrap bg-[#f9fafb] p-3 rounded border border-[#e5e7eb] text-gray-900">
                            {Array.isArray(value) ? value.join(', ') : String(value)}
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="text-[#6b7280] italic">No dynamic form data found.</div>
                  )}
                  
                  {/* Fallback for old flat structure */}
                  {!selectedApplication.formData && (
                    <>
                      {selectedApplication.name && (
                        <div>
                          <span className="text-[#6b7280] text-xs uppercase block mb-1">Name</span>
                          <div className="bg-[#f9fafb] p-3 rounded border border-[#e5e7eb]">{selectedApplication.name}</div>
                        </div>
                      )}
                      {selectedApplication.email && (
                        <div>
                          <span className="text-[#6b7280] text-xs uppercase block mb-1">Email</span>
                          <div className="bg-[#f9fafb] p-3 rounded border border-[#e5e7eb]">{selectedApplication.email}</div>
                        </div>
                      )}
                      {selectedApplication.phone && (
                        <div>
                          <span className="text-[#6b7280] text-xs uppercase block mb-1">Phone</span>
                          <div className="bg-[#f9fafb] p-3 rounded border border-[#e5e7eb]">{selectedApplication.phone}</div>
                        </div>
                      )}
                      {selectedApplication.motivation && (
                        <div>
                          <span className="text-[#6b7280] text-xs uppercase block mb-1">Motivation</span>
                          <div className="whitespace-pre-wrap bg-[#f9fafb] p-3 rounded border border-[#e5e7eb]">{selectedApplication.motivation}</div>
                        </div>
                      )}
                      {selectedApplication.photoUrl && (
                        <div>
                          <span className="text-[#6b7280] text-xs uppercase block mb-1">Photo</span>
                          <a href={selectedApplication.photoUrl} target="_blank" rel="noopener noreferrer" className="text-[#fe0000] hover:underline break-all">
                            {selectedApplication.photoUrl}
                          </a>
                        </div>
                      )}
                    </>
                  )}
                </div>
                
                {selectedApplication.userId && (
                  <div className="mt-8 pt-6 border-t border-[#e5e7eb]">
                    <h4 className="font-bold pb-4 text-gray-900">Participation Status</h4>
                    <div className="flex gap-4">
                      {selectedApplication.status === 'participated' ? (
                        <div className="bg-green-100 text-green-800 px-4 py-2 rounded-lg text-sm font-bold flex-1 text-center">✅ Participated</div>
                      ) : selectedApplication.status === 'missed' ? (
                        <div className="bg-red-100 text-red-800 px-4 py-2 rounded-lg text-sm font-bold flex-1 text-center">❌ Did Not Participate</div>
                      ) : selectedApplication.status === 'rejected' ? (
                        <>
                          <div className="bg-red-100 text-red-800 px-4 py-3 rounded-lg text-sm font-bold flex-1 flex items-center justify-center border border-red-200">
                            Candidate Rejected
                          </div>
                          <button
                            onClick={async () => {
                              if (true) {
                                try {
                                  await updateDoc(doc(db, 'volunteerApplications', selectedApplication.id), { status: 'approved' });
                                  updateLocalAppStatus(selectedApplication.id, 'approved');
                                  showToast('Moved to approved');
                                } catch (e) {
                                  console.error(e);
                                  showToast('Failed to update status');
                                }
                              }
                            }}
                            className="bg-green-100 hover:bg-green-200 text-green-800 border border-green-200 px-4 py-3 rounded-lg text-sm font-bold transition-colors shadow-sm"
                          >
                            ✅ Approve
                          </button>
                        </>
                      ) : selectedApplication.status === 'approved' ? (
                        <div className="flex flex-col gap-3 w-full">
                          <div className="flex gap-4">
                            <button
                              onClick={async () => {
                                if (true) {
                                  try {
                                    await updateDoc(doc(db, 'volunteerApplications', selectedApplication.id), { status: 'participated' });
                                    
                                    const userRef = doc(db, 'users', selectedApplication.userId);
                                    const userSnap = await getDoc(userRef);
                                    if (userSnap.exists()) {
                                      const pd = userSnap.data().participatedEvents || [];
                                      await updateDoc(userRef, {
                                        participatedEvents: [...pd, {
                                          eventId: selectedApplication.eventId,
                                          eventName: selectedApplication.eventName,
                                          date: new Date().toLocaleDateString(),
                                        }]
                                      });
                                    }
                                    
                                    updateLocalAppStatus(selectedApplication.id, 'participated');
                                    showToast('Marked as participated');
                                  } catch (e) {
                                    console.error(e);
                                    showToast('Failed to update status');
                                  }
                                }
                              }}
                              className="bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-lg text-sm font-bold flex-[2] transition-colors shadow-sm"
                            >
                              ✅ Mark Participated
                            </button>
                            <button
                              onClick={async () => {
                                if (true) {
                                  try {
                                    await updateDoc(doc(db, 'volunteerApplications', selectedApplication.id), { status: 'missed' });
                                    updateLocalAppStatus(selectedApplication.id, 'missed');
                                    showToast('Marked as missed');
                                  } catch (e) {
                                    console.error(e);
                                    showToast('Failed to update status');
                                  }
                                }
                              }}
                              className="bg-gray-100 hover:bg-gray-200 border border-gray-300 text-gray-800 px-4 py-3 rounded-lg text-sm font-bold flex-1 transition-colors shadow-sm"
                            >
                              Missed
                            </button>
                          </div>
                          
                          <div className="flex gap-4">
                            <button
                              onClick={async () => {
                                try {
                                  await updateDoc(doc(db, 'volunteerApplications', selectedApplication.id), { status: 'finalized' });
                                  updateLocalAppStatus(selectedApplication.id, 'finalized');
                                  showToast('Approved as Finalist (Certificates enabled)');
                                  setSelectedApplication(prev => prev ? {...prev, status: 'finalized'} : null);
                                } catch (e) {
                                  console.error(e);
                                  showToast('Failed to finalize');
                                }
                              }}
                              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg text-sm font-bold w-full transition-colors flex items-center justify-center gap-2 shadow-md border border-blue-500"
                            >
                              🏆 Final Accept (Finalist)
                            </button>
                          </div>

                          <div className="flex gap-4">
                            <button
                              onClick={async () => {
                                if (true) {
                                  try {
                                    await updateDoc(doc(db, 'volunteerApplications', selectedApplication.id), { status: 'rejected' });
                                    updateLocalAppStatus(selectedApplication.id, 'rejected');
                                    showToast('Application rejected');
                                  } catch (e) {
                                    console.error(e);
                                    showToast('Failed to update status');
                                  }
                                }
                              }}
                              className="bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 px-4 py-3 rounded-lg text-sm font-bold w-full transition-colors flex items-center justify-center gap-2"
                            >
                              ❌ Move to Rejected
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="bg-yellow-50 text-yellow-800 px-4 py-2 rounded-lg text-sm font-bold flex-1 text-center border border-yellow-200">
                           Candidate pending approval (Must be Approved first)
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}