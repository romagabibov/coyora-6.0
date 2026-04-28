import fs from 'fs';
let content = fs.readFileSync('src/AdminPanel.tsx', 'utf8');

const target = `  return (
    <>
      <Toast message={toastMessage} isVisible={isToastVisible} onClose={() => setIsToastVisible(false)} />
      <button 
                              onClick={async () => {
                                const eventSelect = document.getElementById('revoke_cert_event') as HTMLSelectElement;
                                if (!revokeEmail || !eventSelect.value) {
                                  showToast('Please find a user and select an event.');
                                  return;
                                }
                                
                                if (!confirm(\`Are you sure you want to revoke/delete the certificate for \${revokeEmail}?\`)) return;

                                try {
                                  const qUser = query(collection(db, 'users'), where('email', '==', revokeEmail.trim()), limit(1));
                                  const snapshotUser = await getDocs(qUser);
                                  if (snapshotUser.empty) {
                                    showToast('User not found in system.', true);
                                    return;
                                  }
                                  const targetUid = snapshotUser.docs[0].id;
                                  const formId = eventSelect.value;
                                  
                                  const qApp = query(collection(db, 'volunteerApplications'), where('userId', '==', targetUid), where('eventId', '==', formId));
                                  const snapshotApp = await getDocs(qApp);
                                  
                                  const docsToUpdate = [];
                                  if (!snapshotApp.empty) {
                                    docsToUpdate.push(...snapshotApp.docs.filter(d => d.data().status === 'finalized' || !!d.data().certificateTrackingCode));
                                  } else {
                                     const qAppOld = query(collection(db, 'volunteerApplications'), where('userId', '==', targetUid), where('formId', '==', formId));
                                     const snapOld = await getDocs(qAppOld);
                                     docsToUpdate.push(...snapOld.docs.filter(d => d.data().status === 'finalized' || !!d.data().certificateTrackingCode || d.data().status === 'approved'));
                                  }

                                  if (docsToUpdate.length === 0) {
                                     showToast('No assigned certificates found to revoke.', true);
                                     return;
                                  }
                                  
                                  let revokedCount = 0;
                                  for (const docSnap of docsToUpdate) {
                                     const appData = docSnap.data();
                                     if (appData.formData?.Note === "This is a Test Certificate") {
                                       await deleteDoc(doc(db, 'volunteerApplications', docSnap.id));
                                     } else {
                                       await updateDoc(doc(db, 'volunteerApplications', docSnap.id), {
                                         status: 'applied',
                                         certificateTrackingCode: null
                                       });
                                     }
                                     revokedCount++;
                                  }
                                  
                                  if (revokedCount > 0) {
                                    showToast(\`Successfully revoked certificate from \${revokeEmail}!\`);
                                    setUserCertsToRevoke(prev => prev.filter((c:any) => c.eventId !== formId && c.formId !== formId));
                                  }
                                } catch (err) {
                                  console.error("Revoke error", err);
                                  showToast('Failed to revoke cert.', true);
                                }
                              }}
                              className="bg-white text-red-500 border border-red-500 px-6 py-2 text-sm font-bold uppercase transition-colors hover:bg-red-500 hover:text-white whitespace-nowrap rounded"
                            >
                              Revoke
                            </button>
                          </div>
                       </div>`;

const newCode = `  return (
    <>
      <Toast message={toastMessage} isVisible={isToastVisible} onClose={() => setIsToastVisible(false)} />
      
      {!isOpen && (
        <button onClick={() => setIsOpen(true)} className="fixed top-4 left-4 z-50 bg-[#fe0000] text-white p-3 rounded-full hover:bg-black transition-colors shadow-lg shadow-[#fe0000]/20 hidden md:block">
          <Settings size={24} />
        </button>
      )}

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 left-0 h-full w-full md:w-[280px] bg-white border-r border-[#e5e7eb] shadow-xl z-50 flex flex-col font-mono text-sm overflow-hidden"
          >
            <div className="p-4 border-b border-[#e5e7eb] flex items-center justify-between bg-black text-white">
              <h2 className="font-bold tracking-widest uppercase">Admin Panel</h2>
              <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>

            {!isAuthenticated ? (
               <div className="p-6 flex flex-col justify-center flex-1">
                 <ShieldCheck size={48} className="mx-auto mb-4 text-gray-300" />
                 <h3 className="text-center font-bold mb-6 text-gray-900 uppercase">Authenticate</h3>
                 {error && <div className="text-red-500 text-xs mb-4 text-center">{error}</div>}
                 <button onClick={handleLogin} className="w-full bg-[#fe0000] text-white font-bold py-3 uppercase tracking-wider hover:bg-black transition-colors">Sign in with Google</button>
               </div>
            ) : (
              <>
                 <div className="flex-1 overflow-y-auto python-scrollbar">
                   <div className="p-2 space-y-1">
                     <button onClick={() => setActiveTab('forms')} className={\`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors font-bold uppercase tracking-wide text-[10px] \${activeTab === 'forms' ? 'bg-black text-white' : 'text-gray-600 hover:bg-gray-100 hover:text-black'}\`}>
                        <FileText size={16}/> Forms & Events
                     </button>
                     <button onClick={() => setActiveTab('lab')} className={\`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors font-bold uppercase tracking-wide text-[10px] \${activeTab === 'lab' ? 'bg-black text-white' : 'text-gray-600 hover:bg-gray-100 hover:text-black'}\`}>
                        <FlaskConical size={16}/> Lab / Experiments
                     </button>
                     <button onClick={() => setActiveTab('users')} className={\`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors font-bold uppercase tracking-wide text-[10px] \${activeTab === 'users' ? 'bg-black text-white' : 'text-gray-600 hover:bg-gray-100 hover:text-black'}\`}>
                        <Users size={16}/> Registered Users
                     </button>
                     <button onClick={() => setActiveTab('admins')} className={\`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors font-bold uppercase tracking-wide text-[10px] \${activeTab === 'admins' ? 'bg-black text-white' : 'text-gray-600 hover:bg-gray-100 hover:text-black'}\`}>
                        <Shield size={16}/> Manage Admins
                     </button>
                     <button onClick={() => setActiveTab('certificates')} className={\`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors font-bold uppercase tracking-wide text-[10px] \${activeTab === 'certificates' ? 'bg-black text-white' : 'text-gray-600 hover:bg-gray-100 hover:text-black'}\`}>
                        <Award size={16}/> Certificates
                     </button>
                     <button onClick={() => setActiveTab('logs')} className={\`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors font-bold uppercase tracking-wide text-[10px] \${activeTab === 'logs' ? 'bg-black text-white' : 'text-gray-600 hover:bg-gray-100 hover:text-black'}\`}>
                        <FileClock size={16}/> Logs
                     </button>
                   </div>
                 </div>
                 
                 <div className="p-4 border-t border-[#e5e7eb] bg-gray-50">
                   <div className="flex items-center gap-3 mb-4">
                     <img src={auth.currentUser?.photoURL || ''} alt="Admin" className="w-8 h-8 rounded-full border border-gray-300" />
                     <div className="overflow-hidden">
                       <p className="text-[10px] font-bold text-gray-900 truncate uppercase">{auth.currentUser?.displayName}</p>
                       <p className="text-[10px] text-gray-500 truncate uppercase">{adminRole}</p>
                     </div>
                   </div>
                   <button onClick={handleLogout} className="w-full text-center border border-gray-300 text-gray-700 font-bold py-2 text-xs uppercase hover:bg-gray-100 transition-colors">Logout</button>
                 </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <div className={\`transition-all duration-300 \${isOpen ? 'md:ml-[280px]' : 'ml-0'} min-h-screen bg-gray-50\`}>
        {isAuthenticated && isAdmin ? (
          <div className="p-6 md:p-12 max-w-7xl mx-auto">
             {activeTab === 'lab' && (
                <div className="space-y-8 animate-in fade-in zoom-in-95 duration-300">
                  <div className="flex justify-between items-end">
                    <div>
                      <h2 className="text-3xl font-head uppercase tracking-tighter text-gray-900 mb-2 flex items-center gap-3"><FlaskConical size={32} className="text-[#fe0000]"/> Lab / Experiments</h2>
                      <p className="text-sm font-mono text-gray-500 uppercase tracking-widest">Manage your research and experiments.</p>
                    </div>
                  </div>
                  <div className="bg-white p-6 border border-[#e5e7eb] shadow-sm rounded">
                     {/* Here goes the rest of Lab UI soon */}
                     <p className="text-xs text-gray-500">Lab Editor will go here.</p>
                  </div>
                </div>
             )}

             {activeTab === 'certificates' && (
                <div className="space-y-8 animate-in fade-in zoom-in-95 duration-300">
                   <div className="flex justify-between items-end">
                     <div>
                       <h2 className="text-3xl font-head uppercase tracking-tighter text-gray-900 mb-2 flex items-center gap-3"><Award size={32} className="text-[#fe0000]"/> Certificate Config</h2>
                       <p className="text-sm font-mono text-gray-500 uppercase tracking-widest">Manage templates and revoke certificates.</p>
                     </div>
                     <button onClick={handleAddCertificateTemplate} className="bg-[#fe0000] text-white flex items-center gap-2 px-6 py-2 text-sm font-bold uppercase tracking-widest hover:bg-black transition-colors rounded">
                        <Plus size={16} /> New Template
                     </button>
                   </div>
                   
                   <div className="bg-white rounded border border-[#e5e7eb] p-6 space-y-6 shadow-sm">
                      <h4 className="font-bold text-sm uppercase font-head text-gray-900 flex items-center gap-2">Revoke / Delete Certificate</h4>
                      <div className="flex flex-col md:flex-row gap-4 mb-4">
                        <div className="flex-1 space-y-2">
                           <div className="flex gap-2 items-end">
                            <div className="flex-1">
                              <label className="block text-xs font-bold text-gray-700 uppercase mb-2">Target User Email</label>
                              <input 
                                id="revoke_cert_email"
                                type="email" 
                                placeholder="user@example.com"
                                className="w-full px-4 py-2 border border-[#e5e7eb] text-sm focus:outline-none focus:border-red-500 font-mono bg-white text-black"
                                value={revokeEmail}
                                onChange={(e) => setRevokeEmail(e.target.value)}
                              />
                            </div>
                            <button 
                               onClick={async () => {
                                 if (!revokeEmail) return showToast('Enter email to find certs', true);
                                 setFindingCerts(true);
                                 try {
                                   const uQ = query(collection(db, 'users'), where('email', '==', revokeEmail), limit(1));
                                   const uSnap = await getDocs(uQ);
                                   if (uSnap.empty) {
                                     showToast('User not found.', true);
                                     setFindingCerts(false);
                                     return;
                                   }
                                   const targetUid = uSnap.docs[0].id;
                                   
                                   const qApp = query(collection(db, 'volunteerApplications'), where('userId', '==', targetUid));
                                   const snapApp = await getDocs(qApp);
                                   const userCerts = snapApp.docs.map(d => ({ id: d.id, ...d.data() })).filter(c => c.status === 'finalized' || !!c.certificateTrackingCode || c.status === 'approved');
                                   
                                   setUserCertsToRevoke(userCerts);
                                   if (userCerts.length === 0) {
                                     showToast('No certificates found for this user.', true);
                                   } else {
                                     showToast(\`Found \${userCerts.length} certificates.\`);
                                   }
                                 } catch (err) {
                                   console.error(err);
                                   showToast('Error finding certificates', true);
                                 }
                                 setFindingCerts(false);
                               }}
                               disabled={findingCerts || !revokeEmail}
                               className="bg-gray-200 text-gray-800 px-4 py-2 text-sm font-bold uppercase transition-colors hover:bg-gray-300 disabled:opacity-50 whitespace-nowrap rounded"
                             >
                               {findingCerts ? 'Searching...' : 'Find Certs'}
                             </button>
                           </div>
                           <div className="flex-1 pt-4">
                              <label className="block text-xs font-bold text-gray-700 uppercase mb-2">Select User's Certificate</label>
                              <select id="revoke_cert_event" className="w-full px-4 py-2 border border-[#e5e7eb] text-sm focus:outline-none focus:border-red-500 font-mono bg-white text-black">
                                 <option value="">-- Found Certificates --</option>
                                 {userCertsToRevoke.map((cert: any) => (
                                   <option key={cert.id} value={cert.eventId || cert.formId}>
                                     {cert.eventName || formSchemas.find((s: any) => s.id === (cert.eventId || cert.formId))?.name || 'Unknown Event'}
                                   </option>
                                 ))}
                              </select>
                            </div>
                            <div className="pt-4">
                              <button 
                                onClick={async () => {
                                  const eventSelect = document.getElementById('revoke_cert_event') as HTMLSelectElement;
                                  if (!revokeEmail || !eventSelect.value) {
                                    showToast('Please find a user and select an event.');
                                    return;
                                  }
                                  
                                  if (!confirm(\`Are you sure you want to revoke/delete the certificate for \${revokeEmail}?\`)) return;

                                  try {
                                    const qUser = query(collection(db, 'users'), where('email', '==', revokeEmail.trim()), limit(1));
                                    const snapshotUser = await getDocs(qUser);
                                    if (snapshotUser.empty) {
                                      showToast('User not found in system.', true);
                                      return;
                                    }
                                    const targetUid = snapshotUser.docs[0].id;
                                    const formId = eventSelect.value;
                                    
                                    const qApp = query(collection(db, 'volunteerApplications'), where('userId', '==', targetUid));
                                    const snapshotApp = await getDocs(qApp);
                                    
                                    const docsToUpdate = snapshotApp.docs.filter(d => (d.data().eventId === formId || d.data().formId === formId) && (d.data().status === 'finalized' || !!d.data().certificateTrackingCode || d.data().status === 'approved'));

                                    if (docsToUpdate.length === 0) {
                                      showToast('No assigned certificates found to revoke.', true);
                                      return;
                                    }
                                    
                                    let revokedCount = 0;
                                    for (const docSnap of docsToUpdate) {
                                      const appData = docSnap.data();
                                      if (appData.formData?.Note === "This is a Test Certificate") {
                                        await deleteDoc(doc(db, 'volunteerApplications', docSnap.id));
                                      } else {
                                        await updateDoc(doc(db, 'volunteerApplications', docSnap.id), {
                                          status: 'applied',
                                          certificateTrackingCode: null
                                        });
                                      }
                                      revokedCount++;
                                    }
                                    
                                    if (revokedCount > 0) {
                                      showToast(\`Successfully revoked certificate from \${revokeEmail}!\`);
                                      setUserCertsToRevoke((prev: any) => prev.filter((c:any) => c.eventId !== formId && c.formId !== formId));
                                    }
                                  } catch (err) {
                                    console.error("Revoke error", err);
                                    showToast('Failed to revoke cert.', true);
                                  }
                                }}
                                className="bg-white text-red-500 border border-red-500 px-6 py-2 text-sm font-bold uppercase transition-colors hover:bg-red-500 hover:text-white whitespace-nowrap rounded w-full"
                              >
                                Revoke
                              </button>
                            </div>
                        </div>
                      </div>
                   </div>`;

if (content.includes(target)) {
   content = content.replace(target, newCode);
   fs.writeFileSync('src/AdminPanel.tsx', content);
   console.log('Fixed');
} else {
   console.log('Not found');
}
