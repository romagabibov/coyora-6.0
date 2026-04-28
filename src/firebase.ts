import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer, setLogLevel } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import firebaseConfig from '../firebase-applet-config.json';

// Suppress benign grpc stream warnings
setLogLevel('error');

const app = initializeApp(firebaseConfig);

// Use getFirestore as recommended
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

export const auth = getAuth(app);
export const storage = getStorage(app);

// Connectivity Test (as per system requirements)
const testConnection = async () => {
  try {
    // Attempting a server read to verify connection
    await getDocFromServer(doc(db, '_connection_test_', 'check'));
  } catch (error: any) {
    if (error?.message?.includes('the client is offline')) {
      console.warn("Firestore is operating in offline mode. Check your network or Firebase configuration.");
    }
  }
};
testConnection();
