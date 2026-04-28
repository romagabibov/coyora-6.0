import fs from 'fs';

const file = 'src/AdminPanel.tsx';
let content = fs.readFileSync(file, 'utf8');

const replacement = `    <>
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
             {activeTab === 'forms' && (
                <div className="space-y-8 animate-in fade-in zoom-in-95 duration-300">
                  <div className="flex justify-between items-end">
                    <div>
                      <h2 className="text-3xl font-head uppercase tracking-tighter text-gray-900 mb-2 flex items-center gap-3"><FileText size={32} className="text-[#fe0000]"/> Forms & Events</h2>
                      <p className="text-sm font-mono text-gray-500 uppercase tracking-widest">Manage forms and applications.</p>
                    </div>
                  </div>
                  <div className="bg-white p-6 border border-[#e5e7eb] shadow-sm rounded">
                     <div className="flex flex-col gap-4">
                       {formSchemas.map(schema => (
                         <div key={schema.id} className="p-4 border border-gray-200 rounded flex justify-between items-center bg-gray-50">
                           <div>
                             <h4 className="font-bold">{schema.name}</h4>
                             <p className="text-xs text-gray-500">{schema.description}</p>
                           </div>
                           <button onClick={() => { setSelectedFormForApps(schema.id); setActiveTab('applications'); }} className="bg-black text-white px-4 py-2 text-xs rounded hover:bg-gray-800 transition-colors uppercase font-bold tracking-wider">View Applications</button>
                         </div>
                       ))}
                       {formSchemas.length === 0 && <p className="text-gray-500 text-sm">No forms available.</p>}
                     </div>
                  </div>
                </div>
             )}

             {activeTab === 'users' && (
                <div className="space-y-8 animate-in fade-in zoom-in-95 duration-300">
                  <div className="flex justify-between items-end">
                    <div>
                      <h2 className="text-3xl font-head uppercase tracking-tighter text-gray-900 mb-2 flex items-center gap-3"><Users size={32} className="text-[#fe0000]"/> Registered Users</h2>
                      <p className="text-sm font-mono text-gray-500 uppercase tracking-widest">Manage registered users.</p>
                    </div>
                  </div>
                  <div className="bg-white p-6 border border-[#e5e7eb] shadow-sm rounded">
                     <div className="flex flex-col gap-4">
                       {siteUsers.map(user => (
                         <div key={user.uid} className="p-4 border border-gray-200 rounded flex justify-between items-center bg-gray-50">
                           <div>
                             <h4 className="font-bold">{user.name} {user.surname}</h4>
                             <p className="text-xs text-gray-500">{user.email}</p>
                           </div>
                         </div>
                       ))}
                       {siteUsers.length === 0 && <p className="text-gray-500 text-sm">No users registered.</p>}
                     </div>
                  </div>
                </div>
             )}

             {activeTab === 'admins' && (
                <div className="space-y-8 animate-in fade-in zoom-in-95 duration-300">
                  <div className="flex justify-between items-end">
                    <div>
                      <h2 className="text-3xl font-head uppercase tracking-tighter text-gray-900 mb-2 flex items-center gap-3"><Shield size={32} className="text-[#fe0000]"/> Manage Admins</h2>
                      <p className="text-sm font-mono text-gray-500 uppercase tracking-widest">Manage administrative access.</p>
                    </div>
                  </div>
                  <div className="bg-white p-6 border border-[#e5e7eb] shadow-sm rounded">
                     <div className="flex flex-col gap-4">
                       {adminsList.map(admin => (
                         <div key={admin.id} className="p-4 border border-gray-200 rounded flex justify-between items-center bg-gray-50">
                           <div>
                             <h4 className="font-bold">{admin.id}</h4>
                             <p className="text-xs text-gray-500 capitalize">{admin.role}</p>
                           </div>
                         </div>
                       ))}
                       {adminsList.length === 0 && <p className="text-gray-500 text-sm">No admins available.</p>}
                     </div>
                  </div>
                </div>
             )}

             {activeTab === 'applications' && selectedFormForApps && (
                <div className="space-y-8 animate-in fade-in zoom-in-95 duration-300">
                  <div className="flex justify-between items-end">
                    <div>
                      <h2 className="text-3xl font-head uppercase tracking-tighter text-gray-900 mb-2 flex items-center gap-3"><FileText size={32} className="text-[#fe0000]"/> Applications</h2>
                      <p className="text-sm font-mono text-gray-500 uppercase tracking-widest">Applications for {formSchemas.find(s => s.id === selectedFormForApps)?.name}</p>
                    </div>
                    <button onClick={() => { setActiveTab('forms'); setSelectedFormForApps(null); }} className="text-gray-500 underline hover:text-black">Back to Forms</button>
                  </div>
                  <div className="bg-white p-6 border border-[#e5e7eb] shadow-sm rounded">
                     <div className="flex flex-col gap-4">
                       {applications.map(app => (
                         <div key={app.id} className="p-4 border border-gray-200 rounded flex justify-between items-center bg-gray-50 cursor-pointer hover:bg-gray-100" onClick={() => setSelectedApplication(app)}>
                           <div>
                             <h4 className="font-bold">{app.formData?.name || app.name || app.email}</h4>
                             <p className="text-xs text-gray-500">Status: {app.status}</p>
                           </div>
                           <button onClick={(e) => { e.stopPropagation(); setSelectedApplication(app); }} className="bg-black text-white px-4 py-2 text-xs rounded hover:bg-gray-800 transition-colors uppercase font-bold tracking-wider">View Details</button>
                         </div>
                       ))}
                       {applications.length === 0 && !loadingApps && <p className="text-gray-500 text-sm">No applications found.</p>}
                       {loadingApps && <p className="text-gray-500 text-sm">Loading applications...</p>}
                     </div>
                  </div>
                </div>
             )}

             {activeTab === 'lab' && (
                <div className="space-y-8 animate-in fade-in zoom-in-95 duration-300">
                  <div className="flex justify-between items-end">
                    <div>
                      <h2 className="text-3xl font-head uppercase tracking-tighter text-gray-900 mb-2 flex items-center gap-3"><FlaskConical size={32} className="text-[#fe0000]"/> Lab / Experiments</h2>
                      <p className="text-sm font-mono text-gray-500 uppercase tracking-widest">Manage your research and experiments.</p>
                    </div>
                  </div>
                  
                  {/* Collapsible content request from user! */}
                  <div className="bg-white rounded border border-[#e5e7eb] shadow-sm overflow-hidden">
                    <button onClick={() => { 
                      const el = document.getElementById('lab_content'); 
                      if(el) el.classList.toggle('hidden'); 
                    }} className="w-full p-4 bg-[#f9fafb] text-left font-bold text-sm uppercase tracking-wide flex justify-between items-center hover:bg-gray-100 transition-colors">
                      Toggle Lab Editor
                      <ArrowDown size={16} />
                    </button>
                    <div id="lab_content" className="p-6 hidden">
                      <p className="text-xs text-gray-500">Lab Editor content goes here. (Collapsed by default)</p>
                    </div>
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
                              <button `;

const startRegex = /    <>\n      <Toast message=\{toastMessage\} isVisible=\{isToastVisible\} onClose=\{[\s\S]*?\} \/>\n      <button /m;
content = content.replace(startRegex, replacement);

fs.writeFileSync(file, content);
console.log('patched start');
