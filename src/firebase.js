import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc, addDoc, collection, serverTimestamp } from "firebase/firestore";
import { getAuth, signInAnonymously } from "firebase/auth";

let db = null;
let uid = null;

const apiKey = import.meta.env.VITE_FIREBASE_API_KEY;
if (apiKey) {
  try {
    const app = initializeApp({
      apiKey,
      authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
      projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
      storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
      appId: import.meta.env.VITE_FIREBASE_APP_ID,
    });
    db = getFirestore(app);
    const auth = getAuth(app);
    signInAnonymously(auth)
      .then((cred) => { uid = cred.user.uid; })
      .catch(() => {});
  } catch (_) {
    db = null;
  }
}

export async function logEvent(col, data) {
  if (!db || !uid) return;
  try {
    await addDoc(collection(db, "users", uid, col), { ...data, ts: serverTimestamp() });
  } catch (_) { /* Firestore failure should never break the app */ }
}

export async function logTopLevel(data) {
  if (!db || !uid) return;
  try {
    await setDoc(doc(db, "users", uid), { ...data, ts: serverTimestamp() }, { merge: true });
  } catch (_) { /* Firestore failure should never break the app */ }
}
