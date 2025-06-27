
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// IMPORTANT: This configuration is used to connect to your Firebase project.
// Make sure these values are correct and match your project's settings.
export const firebaseConfig = {
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
const storage = getStorage(app);

// A helper function to check if the Firebase config has been changed from the default.
export const isFirebaseConfigured = () => {
    // A simple check to see if the apiKey is still the placeholder value.
    // Replace "YOUR_API_KEY" with the actual placeholder if you have a different one.
    return firebaseConfig.apiKey !== "YOUR_API_KEY" && firebaseConfig.projectId !== "";
}

export { auth, db, storage };
