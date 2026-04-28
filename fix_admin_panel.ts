import fs from 'fs';

let content = fs.readFileSync('src/AdminPanel.tsx', 'utf8');
const target = `          const userPromises = userIds.map((uid: unknown) => getDoc(doc(db, 'users', uid as string)));
          const userSnaps = await Promise.all(userPromises);
          userSnaps.forEach(uSnap => {
              if (uSnap.exists()) {
                  usersMap[uSnap.id] = uSnap.data();
              }
          });`;

const replacement = `          const userPromises = userIds.map(async (uid: unknown) => {
              try {
                  return await getDoc(doc(db, 'users', uid as string));
              } catch (e) {
                  console.warn('Skipped getting user', uid);
                  return null;
              }
          });
          const userSnaps = await Promise.all(userPromises);
          userSnaps.forEach(uSnap => {
              if (uSnap && uSnap.exists()) {
                  usersMap[uSnap.id] = uSnap.data();
              }
          });`;

content = content.replace(target, replacement);
content = content.replace(target, replacement);

fs.writeFileSync('src/AdminPanel.tsx', content, 'utf8');
console.log('Fixed!');
