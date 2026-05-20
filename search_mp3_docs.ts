import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import fs from "fs";

const firebaseConfig = JSON.parse(fs.readFileSync('firebase-applet-config.json', 'utf-8'));
const app = initializeApp(firebaseConfig);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

async function run() {
  const docs = ['about', 'branding', 'theme', 'lab', 'contact', 'collaborators', 'press', 'translations'];
  for (const d of docs) {
    try {
      const docSnap = await getDoc(doc(db, 'settings', d));
      if (docSnap.exists()) {
        const dataStr = JSON.stringify(docSnap.data());
        if (dataStr.includes('.mp3') || dataStr.includes('audio') || dataStr.includes('music')) {
          console.log(`Found in settings/${d}:`);
          console.log(dataStr);
        }
      }
    } catch (e) {
      console.error(`Error fetching settings/${d}:`, e);
    }
  }
  process.exit(0);
}
run();
