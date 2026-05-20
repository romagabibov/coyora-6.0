const fs = require('fs');

let code = fs.readFileSync('src/AdminPanel.tsx', 'utf8');

if (!code.includes('selectedUserApplications')) {
  code = code.replace(
    /const \[selectedSiteUser, setSelectedSiteUser\] = useState<any>\(null\);/,
    `const [selectedSiteUser, setSelectedSiteUser] = useState<any>(null);\n  const [selectedUserApplications, setSelectedUserApplications] = useState<any[]>([]);\n  const [loadingUserApplications, setLoadingUserApplications] = useState(false);\n  useEffect(() => {\n    if (selectedSiteUser) {\n      setLoadingUserApplications(true);\n      const q = query(collection(db, 'volunteerApplications'), where('userId', '==', selectedSiteUser.uid));\n      getDocs(q).then(snap => {\n        setSelectedUserApplications(snap.docs.map(d => ({id: d.id, ...d.data()})));\n        setLoadingUserApplications(false);\n      }).catch(err => {\n         console.error('Failed to load apps for user:', err);\n         setLoadingUserApplications(false);\n      });\n    } else {\n      setSelectedUserApplications([]);\n    }\n  }, [selectedSiteUser]);`
  );
}

// Add UI for current applications
const pastExpHTML = `<span className="font-bold whitespace-pre-wrap">{selectedSiteUser.pastEvents || 'N/A'}</span>
                   </div>`;

const currentAppsHTML = `<span className="font-bold whitespace-pre-wrap">{selectedSiteUser.pastEvents || 'N/A'}</span>
                   </div>
                   <div className="bg-[#f9fafb] p-4 border border-[#e5e7eb] rounded break-words md:col-span-2">
                      <span className="text-[#6b7280] block mb-1 text-[10px] uppercase tracking-widest">Current Event Registrations</span>
                      {loadingUserApplications ? (
                         <span className="font-bold font-mono text-sm text-gray-400 animate-pulse">Loading...</span>
                      ) : selectedUserApplications.length > 0 ? (
                         <div className="space-y-2 mt-2">
                           {selectedUserApplications.map(app => (
                             <div key={app.id} className="flex flex-col md:flex-row md:justify-between items-start md:items-center bg-white p-3 border border-[#e5e7eb] rounded gap-2">
                               <div>
                                 <div className="font-bold text-sm text-gray-900">{app.eventName || 'Unnamed Event'}</div>
                                 <div className="text-[10px] text-gray-500 uppercase">{new Date(app.timestamp?.toDate ? app.timestamp.toDate() : Date.now()).toLocaleDateString()}</div>
                               </div>
                               <span className={\`text-[10px] px-2 py-1 rounded-full uppercase font-bold \${app.status === 'finalized' ? 'bg-green-100 text-green-800' : app.status === 'rejected' ? 'bg-red-100 text-red-800' : app.status === 'deleted' ? 'bg-gray-100 text-gray-800' : app.status === 'approved' ? 'bg-indigo-100 text-indigo-800' : 'bg-blue-100 text-blue-800'}\`}>
                                 {app.status || 'applied'}
                               </span>
                             </div>
                           ))}
                         </div>
                      ) : (
                         <span className="font-bold text-[#6b7280]">No active registrations</span>
                      )}
                   </div>`;

code = code.replace(pastExpHTML, currentAppsHTML);

fs.writeFileSync('src/AdminPanel.tsx', code);
