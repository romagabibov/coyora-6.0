import * as fs from 'fs';
let content = fs.readFileSync('src/AdminPanel.tsx', 'utf8');

// Replace SELECT
const oldSelect = `                            <div className="flex-1">
                              <label className="block text-xs font-bold text-gray-700 uppercase mb-2">Select Event Template</label>
                              <select id="revoke_cert_event" className="w-full px-4 py-2 border border-[#e5e7eb] text-sm focus:outline-none focus:border-red-500 font-mono bg-white text-black">
                                 <option value="">-- Choose Event --</option>
                                 {certificates.map(cert => (
                                   <option key={cert.id} value={cert.formId}>
                                     {formSchemas.find(s => s.id === cert.formId)?.name || 'Unknown Event'}
                                   </option>
                                 ))}
                              </select>
                            </div>`;

const newSelect = `                            <div className="flex-1">
                              <label className="block text-xs font-bold text-gray-700 uppercase mb-2">Select Event Template</label>
                              <select id="revoke_cert_event" className="w-full px-4 py-2 border border-[#e5e7eb] text-sm focus:outline-none focus:border-red-500 font-mono bg-white text-black">
                                 <option value="">-- Choose Event --</option>
                                 {userCertsToRevoke.map((cert: any) => (
                                   <option key={cert.id} value={cert.eventId || cert.formId}>
                                     {cert.eventName || formSchemas.find((s: any) => s.id === (cert.eventId || cert.formId))?.name || 'Unknown Event'}
                                   </option>
                                 ))}
                              </select>
                            </div>`;
                            
content = content.replace(oldSelect, newSelect);

// Replace BUTTON
const oldBtnRegex = /<button[\s\S]*?onClick=\{async \(\) => \{[\s\S]*?const emailInput = document.getElementById\('revoke_cert_email'\) as HTMLInputElement;[\s\S]*?className="bg-white text-red-500 border border-red-500 px-6 py-2 text-sm font-bold uppercase transition-colors hover:bg-red-500 hover:text-white whitespace-nowrap rounded"[\s\S]*?>[\s\S]*?Revoke[\s\S]*?<\/button>/;

const newBtn = `<button 
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
                            </button>`;

if (oldBtnRegex.test(content)) {
    content = content.replace(oldBtnRegex, newBtn);
    fs.writeFileSync('src/AdminPanel.tsx', content);
    console.log("Success");
} else {
    console.log("Regex not found");
}
