// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { GoogleAuthProvider } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAOIwQqdgCKbcd1l-yDeoEWufvJ95o1y7g",
  authDomain: "login-bfb74.firebaseapp.com",
  projectId: "login-bfb74",
  storageBucket: "login-bfb74.firebasestorage.app",
  messagingSenderId: "479566644691",
  appId: "1:479566644691:web:0f40624b996a27eacd5b26",
  measurementId: "G-CFDSS2T3W9"
};

// Initialize Firebase

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

