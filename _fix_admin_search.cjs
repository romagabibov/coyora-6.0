const fs = require('fs');

let code = fs.readFileSync('src/AdminPanel.tsx', 'utf8');

// Fix search in AdminPanel
code = code.replace(
  /where\('searchKeywords', 'array-contains', searchQuery\.toLowerCase\(\)\.trim\(\)\)/g,
  `where('searchKeywords', 'array-contains', searchQuery.toLowerCase().trim().split(/\\s+/)[0])`
);

const filterOld = `const newApps = newAppsData.map((app: any) => {`;
const filterNew = `let newApps = newAppsData.map((app: any) => {`;

code = code.replace(filterOld, filterNew);

const postMapOld = `const lastVisible = snapshot.docs[snapshot.docs.length - 1];`;
const postMapNew = `if (searchQuery) {
          const queryWords = searchQuery.toLowerCase().trim().split(/\\s+/);
          if (queryWords.length > 1) {
             newApps = newApps.filter((app: any) => {
                 const fullText = [
                     app.name, app.surname, app.email, app.profileName, app.profileSurname,
                     ...(app.formData ? Object.values(app.formData) : [])
                 ].join(' ').toLowerCase();
                 return queryWords.every(word => fullText.includes(word));
             });
          }
      }
      
      const lastVisible = snapshot.docs[snapshot.docs.length - 1];`;

code = code.replace(postMapOld, postMapNew);

fs.writeFileSync('src/AdminPanel.tsx', code);
