// Firebase Configuration
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
    apiKey: "AIzaSyCZconNoOlG64xrkd1y7QJ_TIBMNVYdRcU",
    authDomain: "buku-arisan-digital.firebaseapp.com",
    projectId: "buku-arisan-digital",
    storageBucket: "buku-arisan-digital.firebasestorage.app",
    messagingSenderId: "326480255556",
    appId: "1:326480255556:web:a2dccf551e1517946e3a11"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore
export const db = getFirestore(app);

// Initialize Auth
export const auth = getAuth(app);

export default app;
