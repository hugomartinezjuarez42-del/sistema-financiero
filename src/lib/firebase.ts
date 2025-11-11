import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyB2RNL2B0jdg1746uGQ7zg-xQ5LPufZps",
  authDomain: "sistema-de-prestamos-65a8d.firebaseapp.com",
  projectId: "sistema-de-prestamos-65a8d",
  storageBucket: "sistema-de-prestamos-65a8d.appspot.com",
  messagingSenderId: "444755361723",
  appId: "1:444755361723:web:0bfaef05b3f8ac9c850e9e",
  measurementId: "G-VDH7QEFTH6"
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);