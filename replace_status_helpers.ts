import fs from 'fs';

const path = 'src/AdminPanel.tsx';
let content = fs.readFileSync(path, 'utf8');

// Replace standard Approve
content = content.replace(/await updateDoc\(doc\(db, 'volunteerApplications', app\.id\), { status: 'approved' }\);\s*setApplications\(apps => apps\.map\(a => a\.id === app\.id \? { \.\.\.a, status: 'approved' } : a\)\);\s*showToast\('Application approved'\);/g, 
"await updateDoc(doc(db, 'volunteerApplications', app.id), { status: 'approved' });\nupdateLocalAppStatus(app.id, 'approved');\nshowToast('Application approved');");

// Replace standard Reject
content = content.replace(/await updateDoc\(doc\(db, 'volunteerApplications', app\.id\), { status: 'rejected' }\);\s*setApplications\(apps => apps\.map\(a => a\.id === app\.id \? { \.\.\.a, status: 'rejected' } : a\)\);\s*showToast\('Application rejected'\);/g, 
"await updateDoc(doc(db, 'volunteerApplications', app.id), { status: 'rejected' });\nupdateLocalAppStatus(app.id, 'rejected');\nshowToast('Application rejected');");

// Replace Move to Rejected
content = content.replace(/await updateDoc\(doc\(db, 'volunteerApplications', app\.id\), { status: 'rejected' }\);\s*setApplications\(apps => apps\.map\(a => a\.id === app\.id \? { \.\.\.a, status: 'rejected' } : a\)\);\s*showToast\('Application moved to rejected'\);/g, 
"await updateDoc(doc(db, 'volunteerApplications', app.id), { status: 'rejected' });\nupdateLocalAppStatus(app.id, 'rejected');\nshowToast('Application moved to rejected');");

// Replace Move to Approved
content = content.replace(/await updateDoc\(doc\(db, 'volunteerApplications', app\.id\), { status: 'approved' }\);\s*setApplications\(apps => apps\.map\(a => a\.id === app\.id \? { \.\.\.a, status: 'approved' } : a\)\);\s*showToast\('Application moved to approved'\);/g, 
"await updateDoc(doc(db, 'volunteerApplications', app.id), { status: 'approved' });\nupdateLocalAppStatus(app.id, 'approved');\nshowToast('Application moved to approved');");

// Replace Delete
content = content.replace(/await deleteDoc\(doc\(db, 'volunteerApplications', app\.id\)\);\s*setApplications\(apps => apps\.filter\(a => a\.id !== app\.id\)\);\s*showToast\('Application deleted'\);/g, 
"await deleteDoc(doc(db, 'volunteerApplications', app.id));\ndeleteLocalApp(app.id);\nshowToast('Application deleted');");

// Replace Details Mark Participated
content = content.replace(/setSelectedApplication\({ \.\.\.selectedApplication, status: 'participated' }\);\s*setApplications\(apps => apps\.map\(a => a\.id === selectedApplication\.id \? { \.\.\.a, status: 'participated' } : a\)\);/g, 
"updateLocalAppStatus(selectedApplication.id, 'participated');");

// Replace Details Mark Missed
content = content.replace(/setSelectedApplication\({ \.\.\.selectedApplication, status: 'missed' }\);\s*setApplications\(apps => apps\.map\(a => a\.id === selectedApplication\.id \? { \.\.\.a, status: 'missed' } : a\)\);/g, 
"updateLocalAppStatus(selectedApplication.id, 'missed');");

// Replace Details Move to Rejected
content = content.replace(/setSelectedApplication\({ \.\.\.selectedApplication, status: 'rejected' }\);\s*setApplications\(apps => apps\.map\(a => a\.id === selectedApplication\.id \? { \.\.\.a, status: 'rejected' } : a\)\);/g, 
"updateLocalAppStatus(selectedApplication.id, 'rejected');");

// Replace Details Move to Approved
content = content.replace(/setSelectedApplication\({ \.\.\.selectedApplication, status: 'approved' }\);\s*setApplications\(apps => apps\.map\(a => a\.id === selectedApplication\.id \? { \.\.\.a, status: 'approved' } : a\)\);/g, 
"updateLocalAppStatus(selectedApplication.id, 'approved');");

fs.writeFileSync(path, content, 'utf8');
console.log('Replaced local list updations');
