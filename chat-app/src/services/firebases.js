import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDrftKIWWpWOd88pj2445AhcozVnZrBMOg",
  authDomain: "chatapp-30c2c.firebaseapp.com",
  projectId: "chatapp-30c2c",
  storageBucket: "chatapp-30c2c.appspot.com",
  messagingSenderId: "1013154109437",
  appId: "1:1013154109437:web:3a5a9037dba039b89c2b94"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
