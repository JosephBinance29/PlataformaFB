// Paso 1: Importar las funciones que vamos a necesitar
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// Paso 2: Pegar aquí las credenciales que copiaste de la web de Firebase
// REEMPLAZA ESTE BLOQUE CON EL TUYO
const firebaseConfig = {
  apiKey: "AIzaSyCQiN1UI1hUBJJc6uh2cH4Wqk02olArXns",
  authDomain: "plataformafb.firebaseapp.com",
  projectId: "plataformafb",
  storageBucket: "plataformafb.firebasestorage.app",
  messagingSenderId: "562961196561",
  appId: "1:562961196561:web:ca83b1ef5fa97dc15673b0"
  };

// Paso 3: Inicializar la conexión con Firebase
const app = initializeApp(firebaseConfig);

// Paso 4: Obtener y exportar los servicios que usaremos en la aplicación.
const db = getFirestore(app);
const auth = getAuth(app);
export { db, auth };
