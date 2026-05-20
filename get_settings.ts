import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";
import fs from "fs";

const firebaseConfig = JSON.parse(fs.readFileSync('firebase-applet-config.json', 'utf-8'));
const app = initializeApp(firebaseConfig);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

async function run() {
  try {
    const querySnapshot = await getDocs(collection(db, 'settings'));
    querySnapshot.forEach((doc) => {
      const dataStr = JSON.stringify(doc.data());
      if (dataStr.includes('http') && (dataStr.includes('.mp3') || dataStr.includes('.wav') || dataStr.includes('audio') || dataStr.includes('music'))) {
        console.log(`Found audio link in ${doc.id}:`);
        console.log(dataStr);
      }
    });
  } catch (e) {
    console.error(e);
  }
  process.exit(0);
}
run();
