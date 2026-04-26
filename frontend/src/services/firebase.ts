import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "***ENTFERNT***",
  authDomain: "oceanguard-76b24.firebaseapp.com",
  projectId: "oceanguard-76b24",
  storageBucket: "oceanguard-76b24.firebasestorage.app",
  messagingSenderId: "897676835847",
  appId: "1:897676835847:web:dd681e7486295185b3fea2",
  measurementId: "G-NZ3DMV1PP5"
};

// Firebase initialisieren
export const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);