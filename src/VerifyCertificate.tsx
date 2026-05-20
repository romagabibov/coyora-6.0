import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from './firebase';

export function getParticipantNameFallback(data: any, profile?: any): string {
  if (profile && (profile.name || profile.surname)) {
    return `${profile.name || ''} ${profile.surname || ''}`.trim();
  }
  
  if (data.name) return data.name;
  if (!data.formData) return data.email || 'Unknown';

  if (data.formData['Name'] && data.formData['Surname']) return `${data.formData['Name']} ${data.formData['Surname']}`;
  if (data.formData['Name']) return data.formData['Name'];
  if (data.formData['Full Name']) return data.formData['Full Name'];
  
  for (const key of Object.keys(data.formData)) {
    const lkey = key.toLowerCase();
    if (lkey.includes("имя") || lkey.includes("name") || lkey.includes("аты") || key.startsWith("1.")) {
      const val = data.formData[key];
      if (typeof val === 'string' && val.trim().length > 0) return val;
    }
  }

  const firstStr = Object.values(data.formData).find(v => typeof v === 'string' && v.trim() !== '');
  return (firstStr as string) || data.email || 'Unknown';
}

export const VerifyCertificate = () => {
  const { code } = useParams();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const checkCert = async () => {
      if (!code) {
        setError('No tracking code provided.');
        setLoading(false);
        return;
      }

      try {
        const appRef = doc(db, 'volunteerApplications', code);
        const snapshot = await getDoc(appRef);
        
        if (!snapshot.exists() || snapshot.data().status !== 'finalized') {
          setError('Certificate not found or invalid tracking code.');
        } else {
          const app = snapshot.data();
          setData(app);
          
          if (app.userId) {
            try {
              const userRef = doc(db, 'users', app.userId);
              const userSnap = await getDoc(userRef);
              if (userSnap.exists()) {
                setProfile(userSnap.data());
              }
            } catch (userErr) {
              console.warn('Could not load user profile, relying on application data.', userErr);
            }
          }
        }
      } catch (err) {
        console.error(err);
        setError('An error occurred while verifying the certificate.');
      }
      setLoading(false);
    };

    checkCert();
  }, [code]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--color-bg)] flex items-center justify-center p-4">
        <div className="font-mono text-sm tracking-widest uppercase">Verifying Digital Signature...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text)] flex flex-col items-center justify-center p-4 md:p-8">
      <div className="max-w-2xl w-full border border-[var(--color-border)] bg-[var(--color-surface)] p-8 md:p-16 relative shadow-2xl overflow-hidden">
        <div className="absolute top-0 right-0 w-16 h-16 border-b border-l border-[var(--color-border)] bg-[var(--color-bg)] flex items-center justify-center">
          <div className={`w-2 h-2 rounded-full ${data ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
        </div>

        {error ? (
          <div>
            <h1 className="font-head text-4xl uppercase tracking-tighter mb-4 text-[#fe0000]">Verification Failed</h1>
            <p className="font-mono text-sm text-[var(--color-muted)]">{error}</p>
          </div>
        ) : (
          <div>
            <div className="flex items-center gap-3 mb-6">
              <span className="inline-block px-2 py-1 bg-green-500 text-white font-mono text-[10px] uppercase tracking-widest truncate">Verified</span>
              <span className="font-mono text-[10px] text-[var(--color-muted)] uppercase tracking-widest">ID: {code}</span>
            </div>
            <h1 className="font-head text-4xl md:text-5xl uppercase tracking-tighter mb-8 border-b border-[var(--color-border)] pb-8">
              Official Record
            </h1>
            
            <div className="space-y-6 font-mono text-sm">
              <div className="flex flex-col border-b border-[var(--color-border)] pb-4">
                <span className="text-[10px] uppercase tracking-widest text-[var(--color-muted)] mb-1">Participant Name</span>
                <span className="uppercase text-lg">
                  {getParticipantNameFallback(data, profile)}
                </span>
              </div>
              <div className="flex flex-col border-b border-[var(--color-border)] pb-4">
                <span className="text-[10px] uppercase tracking-widest text-[var(--color-muted)] mb-1">Event / Program</span>
                <span className="uppercase text-lg">{data.eventName}</span>
              </div>
              <div className="flex flex-col pb-4">
                <span className="text-[10px] uppercase tracking-widest text-[var(--color-muted)] mb-1">Status</span>
                <span className="uppercase text-green-500">Successfully Participated & Concluded</span>
              </div>
            </div>
          </div>
        )}

        <div className="mt-12 pt-6 border-t border-[var(--color-border)]">
          <Link to="/" className="text-[10px] font-mono tracking-widest uppercase hover:text-[#fe0000] inline-flex items-center gap-2 group">
            <span className="transform transition-transform group-hover:-translate-x-1">&larr;</span> Return to Main Portal
          </Link>
        </div>
      </div>
    </div>
  );
};
