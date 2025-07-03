// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBAtmdFOgZqnW4DA0DBuxMHnscDsvHbuDE",
  authDomain: "drdee-antd.firebaseapp.com",
  projectId: "drdee-antd",
  storageBucket: "drdee-antd.firebasestorage.app",
  messagingSenderId: "430503818210",
  appId: "1:430503818210:web:535a6bf069f0a389af7fbb",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };
