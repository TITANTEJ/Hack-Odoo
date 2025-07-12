// src/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth, signInWithCustomToken, signInAnonymously, onAuthStateChanged } from "firebase/auth";
import { getFirestore, collection, doc, getDoc, setDoc, addDoc, updateDoc, deleteDoc, onSnapshot, query, where, getDocs } from "firebase/firestore";

// Global variables provided by the Canvas environment
// These variables are automatically provided by the Canvas runtime.
// DO NOT modify these lines.
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {
  // **REPLACE THESE PLACEHOLDERS WITH YOUR ACTUAL VALUES FROM FIREBASE CONSOLE**
  apiKey: "AIzaSyAl09Zce-kZuxiyXeYzwOAqkGPKp11wY1g", // <--- THIS MUST BE YOUR ACTUAL API KEY
  authDomain: "stackit-forum-priyanshu.firebaseapp.com",
  projectId: "stackit-forum-priyanshu",
  storageBucket: "stackit-forum-priyanshu.firebasestorage.app",
  messagingSenderId: "570589049036",
  appId: "1:570589049036:web:e8aa294c7fb3026cfcd269",
  measurementId: "G-MG0H4MLS7Y"
};
const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Function to handle initial authentication (anonymous or custom token)
async function initializeFirebaseAuth() {
  try {
    if (initialAuthToken) {
      await signInWithCustomToken(auth, initialAuthToken);
      console.log("Firebase: Signed in with custom token.");
    } else {
      // Attempt to sign in anonymously only if no custom token
      await signInAnonymously(auth);
      console.log("Firebase: Signed in anonymously.");
    }
  } catch (error) {
    console.error("Firebase authentication initialization error:", error);
  }
}

// Call the authentication initialization function
initializeFirebaseAuth();

// Export all necessary Firebase instances and functions, INCLUDING appId
export { app, auth, db, collection, doc, getDoc, setDoc, addDoc, updateDoc, deleteDoc, onSnapshot, query, where, getDocs, onAuthStateChanged, appId };
