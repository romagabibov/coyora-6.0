const fs = require('fs');
let code = fs.readFileSync('src/AdminPanel.tsx', 'utf8');

// replace window.confirm for updates
code = code.replace(/onClick=\{async \(\) => \{\n\s+if \(true\) \{\n\s+try \{\n\s+await updateDoc\(doc\(db, 'volunteerApplications', app\.id\), \{ status: 'approved' \}\);/g, 
`onClick={async () => {\n                                                if (!window.confirm('Restore application to Approved?')) return;\n                                                try {\n                                                  await updateDoc(doc(db, 'volunteerApplications', app.id), { status: 'approved' });`);

code = code.replace(/onClick=\{async \(\) => \{\n\s+if \(true\) \{\n\s+try \{\n\s+await updateDoc\(doc\(db, 'volunteerApplications', app\.id\), \{ status: 'rejected' \}\);/g, 
`onClick={async () => {\n                                                if (!window.confirm('Are you sure you want to Move to Rejected?')) return;\n                                                try {\n                                                  await updateDoc(doc(db, 'volunteerApplications', app.id), { status: 'rejected' });`);

// And approve/reject initially without if(true)
code = code.replace(/onClick=\{async \(\) => \{\n\s+try \{\n\s+await updateDoc\(doc\(db, 'volunteerApplications', app\.id\), \{ status: 'approved' \}\);/g,
`onClick={async () => {\n                                                  if (!window.confirm('Are you sure you want to approve this application?')) return;\n                                                  try {\n                                                    await updateDoc(doc(db, 'volunteerApplications', app.id), { status: 'approved' });`);

code = code.replace(/onClick=\{async \(\) => \{\n\s+try \{\n\s+await updateDoc\(doc\(db, 'volunteerApplications', app\.id\), \{ status: 'rejected' \}\);/g,
`onClick={async () => {\n                                                  if (!window.confirm('Are you sure you want to reject this application?')) return;\n                                                  try {\n                                                    await updateDoc(doc(db, 'volunteerApplications', app.id), { status: 'rejected' });`);

fs.writeFileSync('src/AdminPanel.tsx', code);
