
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// IMPORTANT: Replace this with your app's actual Firebase configuration
// from the Firebase console.
const firebaseConfig = {
  apiKey: "AIzaSyAoXtFPNqxZ_iA2SK58rGdI9NIWx56_NmY",
  authDomain: "scoreverse-kgk6y.firebaseapp.com",
  projectId: "scoreverse-kgk6y",
  storageBucket: "scoreverse-kgk6y.appspot.com",
  messagingSenderId: "1057020357350",
  appId: "1:1057020357350:web:2f752b46fb78b18a7f6927"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

const auth = getAuth(app);
const db = getFirestore(app);

// A helper function to check if the Firebase config is valid.
export const isFirebaseConfigured = () => {
    return firebaseConfig.apiKey !== "YOUR_API_KEY";
}

export { auth, db };
