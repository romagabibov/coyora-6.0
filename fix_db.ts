import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore';
import fs from 'fs';

const config = JSON.parse(fs.readFileSync('firebase-applet-config.json', 'utf-8'));
const app = initializeApp(config);
const db = getFirestore(app, config.firestoreDatabaseId);

async function fixDB() {
  const ref = doc(db, 'settings', 'portfolio');
  const snap = await getDoc(ref);
  if (!snap.exists()) return console.log("Not found");
  
  const data = snap.data().data;
  let changed = false;
  
  for (const cat of Object.keys(data)) {
    for (const proj of data[cat]) {
      if (proj.images) {
        let newImages = [];
        for(const img of proj.images) {
            const splitImgs = img.split(/[\n,]+/).map(s => s.trim()).filter(Boolean);
            newImages.push(...splitImgs);
        }
        if (newImages.length !== proj.images.length || newImages.some((v,i) => v !== proj.images[i])) {
            changed = true;
            proj.images = newImages;
        }
      }
    }
  }
  
  if (changed) {
    await setDoc(ref, { data }, { merge: true });
    console.log("DB Fixed!");
  } else {
    console.log("No changes needed");
  }
  process.exit(0);
}

fixDB();
