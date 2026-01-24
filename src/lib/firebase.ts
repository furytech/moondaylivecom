import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAnalytics, isSupported } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyAc51VZTpK5sWKesieNWfN9C5iAc-_rkpU",
  authDomain: "moonday-aea4f.firebaseapp.com",
  projectId: "moonday-aea4f",
  storageBucket: "moonday-aea4f.firebasestorage.app",
  messagingSenderId: "529632529615",
  appId: "1:529632529615:web:454c8bf09cf2bd6abf0022",
  measurementId: "G-1CW7EV6QKH"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore
export const db = getFirestore(app);

// Initialize Analytics (only in browser)
export const initAnalytics = async () => {
  if (await isSupported()) {
    return getAnalytics(app);
  }
  return null;
};

export default app;
