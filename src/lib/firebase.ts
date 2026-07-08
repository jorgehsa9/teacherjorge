import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { initializeFirestore } from 'firebase/firestore';

const firebaseConfig = {
  projectId: "collective-outlet-ncf5x",
  appId: "1:238790685265:web:bc7f1b6663c1fe1cfcfe70",
  apiKey: "AIzaSyDMIOzJ2bgrkSca14HpZUJ0-GtZGqx2iSY",
  authDomain: "collective-outlet-ncf5x.firebaseapp.com",
  storageBucket: "collective-outlet-ncf5x.firebasestorage.app",
  messagingSenderId: "238790685265"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);

// Use initializeFirestore to specify the custom databaseId if needed, otherwise fallback to default
export const db = initializeFirestore(app, {}, "ai-studio-studentmanagemen-6d61bf66-9d2f-4f3b-b9f0-4d90a6bf8614");
