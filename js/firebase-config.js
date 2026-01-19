import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth, GoogleAuthProvider } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore, initializeFirestore } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCLj0mtk2Xr-elLhY31GkhGdk3fhj8cOg8",
  authDomain: "thezenterminal.firebaseapp.com",
  projectId: "thezenterminal",
  storageBucket: "thezenterminal.firebasestorage.app",
  messagingSenderId: "258199028737",
  appId: "1:258199028737:web:8a398beceab4863fddec00"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
// Use initializeFirestore instead of getFirestore to pass settings
const db = initializeFirestore(app, {
    experimentalForceLongPolling: true
});
const provider = new GoogleAuthProvider();

export { auth, db, provider };
