import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";
import fs from "fs";

const firebaseConfig = JSON.parse(fs.readFileSync('firebase-applet-config.json', 'utf-8'));
const app = initializeApp(firebaseConfig);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

async function run() {
  const collections = ['settings', 'formSchemas', 'adminRoles'];
  for (const col of collections) {
    const querySnapshot = await getDocs(collection(db, col));
    querySnapshot.forEach((doc) => {
      const dataStr = JSON.stringify(doc.data());
      if (dataStr.includes('ADY05273_duv5g8.jpg')) {
        console.log(`Found in ${col}/${doc.id}:`);
        console.log(dataStr);
      }
    });
  }
  process.exit(0);
}
run();
