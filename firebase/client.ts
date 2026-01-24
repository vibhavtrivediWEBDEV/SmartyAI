// Import the functions you need from the SDKs you need
import { getApp, getApps, initializeApp } from "firebase/app";
// import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBWf6ZYIsz0or9944pNuvj1H2ad6dgrMdA",
  authDomain: "smarty-a99d5.firebaseapp.com",
  projectId: "smarty-a99d5",
  storageBucket: "smarty-a99d5.firebasestorage.app",
  messagingSenderId: "1001039653240",
  appId: "1:1001039653240:web:12ba3ba47cc491791d408d",
  measurementId: "G-N0P8TD4NME"
};



// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
// const analytics = getAnalytics(app);

export const auth = getAuth(app);
export const db = getFirestore(app);



