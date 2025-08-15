// src/firebase/firebaseConfig.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// 🔹 Configuración de Firebase
const firebaseConfig = {
  apiKey: "AIzaSyBjOf-kkUYFqCZ04jl-FB0crEX_ISGZVQw",
  authDomain: "la-canga-reservas.firebaseapp.com",
  projectId: "la-canga-reservas",
  storageBucket: "la-canga-reservas.appspot.com",
  messagingSenderId: "886018115437",
  appId: "1:886018115437:web:bc1777f23e78d74b1ebc64",
  measurementId: "G-DGKNJ91QX8"
};

// 🔹 Inicializa Firebase
const app = initializeApp(firebaseConfig);

// ✅ Exporta Firestore normalmente (no da problemas en tests)
export const db = getFirestore(app);

// ✅ Auth: carga perezosa SOLO en navegador para evitar errores en Jest/Node
export let auth = null;
export const ensureAuth = async () => {
  if (auth) return auth;
  // Solo en entorno navegador (no en Jest/Node)
  if (typeof window !== "undefined" && typeof document !== "undefined") {
    const { getAuth } = await import("firebase/auth");
    auth = getAuth(app);
    return auth;
  }
  // En tests/Node devolvemos null
  return null;
};

