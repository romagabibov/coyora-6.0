import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";
import fs from "fs";

const firebaseConfig = JSON.parse(fs.readFileSync('firebase-applet-config.json', 'utf-8'));
const app = initializeApp(firebaseConfig);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

async function run() {
  const querySnapshot = await getDocs(collection(db, 'settings'));
  querySnapshot.forEach((doc) => {
    const dataStr = JSON.stringify(doc.data());
    if (dataStr.includes('cloudinary')) {
      console.log(`Found in settings/${doc.id}:`);
      console.log(dataStr);
    }
  });
  process.exit(0);
}
run();
