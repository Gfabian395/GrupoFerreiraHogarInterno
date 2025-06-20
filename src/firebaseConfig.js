import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
<<<<<<< HEAD
=======
import { getStorage } from 'firebase/storage';
>>>>>>> 80de3ac (version mejorada de la original)

const firebaseConfig = {
  apiKey: "AIzaSyB-xX1IpY7NeOw8y5fRA-2wm8pR8oMy9Zc",
  authDomain: "ferreirahogar-376dd.firebaseapp.com",
  projectId: "ferreirahogar-376dd",
<<<<<<< HEAD
  storageBucket: "ferreirahogar-376dd.appspot.com",
=======
  storageBucket: "ferreirahogar-376dd.appspot.com", // Podés dejarlo para referencia
>>>>>>> 80de3ac (version mejorada de la original)
  messagingSenderId: "1047003364413",
  appId: "1:1047003364413:web:c7a687d4bdf0bd5c3e0d3b"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

<<<<<<< HEAD
export { db };
/* 
HASTA ACA FUNCIONA PERFECTO ESTE ES EL ORIGINAL
*/
=======
// Forzamos el bucket que sabemos existe:
const storage = getStorage(app, 'gs://ferreirahogar-376dd.firebasestorage.app');

export { db, storage };
>>>>>>> 80de3ac (version mejorada de la original)
