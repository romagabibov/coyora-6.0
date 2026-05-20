const fs = require('fs');

function applyCertPublishFixes() {
  let adminCode = fs.readFileSync('src/AdminPanel.tsx', 'utf8');

  // Fix 1: Issue Test Certificate dropdown to show if it's draft
  adminCode = adminCode.replace(
    /\{formSchemas\.find\(s => s\.id === cert\.formId\)\?\.name \|\| 'Unknown Event'\}/g,
    `{formSchemas.find(s => s.id === cert.formId)?.name || 'Unknown Event'} {cert.isDraft ? '(DRAFT)' : ''}`
  );

  // Fix 2: Save as Draft vs Publish buttons
  const oldButtons = `<div className="flex gap-4">
                               <button type="submit" className="bg-\[#fe0000\] text-white px-6 py-2 rounded text-sm hover:bg-red-700 transition-colors font-bold shadow-sm">
                                  {editingCert \? 'Update Certificate Template' : 'Add Certificate Template'}
                               </button>`;
  const newButtons = `<div className="flex gap-4">
                               <button 
                                 type="submit" 
                                 onClick={() => {
                                   (window as any)._certAction = 'draft';
                                 }}
                                 className="bg-gray-800 text-white px-6 py-2 rounded text-sm hover:bg-gray-900 transition-colors font-bold shadow-sm"
                               >
                                  {editingCert ? 'Save as Draft' : 'Save as Draft'}
                               </button>
                               <button 
                                 type="submit" 
                                 onClick={() => {
                                   (window as any)._certAction = 'publish';
                                 }}
                                 className="bg-[#fe0000] text-white px-6 py-2 rounded text-sm hover:bg-red-700 transition-colors font-bold shadow-sm"
                               >
                                  {editingCert ? 'Publish Changes' : 'Publish to All'}
                               </button>`;

  adminCode = adminCode.replace(oldButtons, newButtons);

  // Fix 3: Handle the save action (draft vs publish)
  const oldSaveObjectUpdate = `updatedAt: serverTimestamp()`;
  const newSaveObjectUpdate = `updatedAt: serverTimestamp(),
                                  isDraft: (window as any)._certAction === 'draft'`;

  const oldSaveObjectAdd = `createdAt: serverTimestamp()`;
  const newSaveObjectAdd = `createdAt: serverTimestamp(),
                                  isDraft: (window as any)._certAction === 'draft'`;

  adminCode = adminCode.replace(/updatedAt: serverTimestamp\(\)/g, newSaveObjectUpdate);
  adminCode = adminCode.replace(/createdAt: serverTimestamp\(\)/g, newSaveObjectAdd);

  // Fix 4: Show Draft status and a "Publish now" quick button in the list
  const oldCertItem = `<div className="font-bold text-sm text-gray-900">\{formSchemas.find\\(s => s.id === cert.formId\\)\\?.name \\|\\| 'Unknown Form'\}</div>`;
  const newCertItem = `<div className="font-bold text-sm text-gray-900">
                                        {formSchemas.find(s => s.id === cert.formId)?.name || 'Unknown Form'}
                                        {cert.isDraft && <span className="ml-2 bg-yellow-100 text-yellow-800 text-[10px] px-2 py-0.5 rounded border border-yellow-200">DRAFT</span>}
                                     </div>`;
  
  adminCode = adminCode.replace(
    /<div className="font-bold text-sm text-gray-900">\{formSchemas\.find\(s => s\.id === cert\.formId\)\?\.name \|\| 'Unknown Form'\}<\/div>/g, 
    newCertItem
  );

  const oldEditBtn = `<button 
                                      onClick={() => {
                                        setEditingCert(cert);`;

  const newEditBtn = `{cert.isDraft && (
                                       <button
                                         onClick={async () => {
                                            if (window.confirm('Are you sure you want to Publish this certificate to all finalized applicants?')) {
                                               try {
                                                  await updateDoc(doc(db, 'certificates', cert.id), { isDraft: false });
                                                  showToast('Certificate Published via Share All!');
                                                  loadCertificates();
                                               } catch (e) {
                                                  showToast('Failed to publish');
                                               }
                                            }
                                         }}
                                         className="text-green-600 hover:text-green-800 p-2 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity font-bold text-xs uppercase flex items-center gap-1"
                                         title="Publish to All (Share All)"
                                       >
                                         <Share2 size={12} /> Share All
                                       </button>
                                    )}
                                    <button 
                                      onClick={() => {
                                        setEditingCert(cert);`;

  adminCode = adminCode.replace(oldEditBtn, newEditBtn);

  fs.writeFileSync('src/AdminPanel.tsx', adminCode);

  let cabCode = fs.readFileSync('src/Cabinet.tsx', 'utf8');
  cabCode = cabCode.replace(
    /setTemplates\(tSnap\.docs\.map\(d => \(\{ id: d\.id, \.\.\.d\.data\(\) \} as CertificateTemplate\)\)\);/g,
    `setTemplates(tSnap.docs.map(d => ({ id: d.id, ...d.data() } as CertificateTemplate)).filter(t => !t.isDraft));`
  );
  fs.writeFileSync('src/Cabinet.tsx', cabCode);
}

applyCertPublishFixes();
