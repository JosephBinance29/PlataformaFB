// src/firebase.js

import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// Este es el objeto que copiaste desde la web de Firebase
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Inicializamos la aplicación de Firebase
const app = initializeApp(firebaseConfig);

// Obtenemos las instancias de los servicios que vamos a usar
const db = getFirestore(app);
const auth = getAuth(app);

// ¡LÍNEA CLAVE! Exportamos ambos servicios para que otros archivos puedan usarlos.
export { db, auth };
