import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyB-xX1IpY7NeOw8y5fRA-2wm8pR8oMy9Zc",
  authDomain: "ferreirahogar-376dd.firebaseapp.com",
  projectId: "ferreirahogar-376dd",
  storageBucket: "ferreirahogar-376dd.appspot.com",
  messagingSenderId: "1047003364413",
  appId: "1:1047003364413:web:c7a687d4bdf0bd5c3e0d3b"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db };
/* 
HASTA ACA FUNCIONA PERFECTO ESTE ES EL ORIGINAL
*/