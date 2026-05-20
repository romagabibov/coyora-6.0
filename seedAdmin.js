import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc } from "firebase/firestore";
import fs from "fs";

const config = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));
const app = initializeApp(config);
const db = getFirestore(app, config.firestoreDatabaseId);

async function run() {
  await setDoc(doc(db, 'adminRoles', 'vnsbek@gmail.com'), {
    role: 'superadmin',
    addedBy: 'system',
    addedAt: new Date().toISOString()
  });
  console.log("Seeded");
}
run();
