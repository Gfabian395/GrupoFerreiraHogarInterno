// src/components/compras/AddCompra.jsx
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../../firebaseConfig';
import { collection, addDoc, Timestamp } from 'firebase/firestore';

const AddCompra = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const addCompra = async () => {
      try {
        const compra = {
          clienteId: "31989329",
          cuotas: "3",
          fecha: Timestamp.now(), // Usar la marca de tiempo de Firestore
          productos: [
            {
              cantidad: 1,
              nombre: "Producto 1",
              precio: 100 // Asegúrate de que sea number
            }
          ],
          estadoPago: "Pagado"
        };

        const docRef = await addDoc(collection(db, 'compras'), compra);
        console.log("Compra añadida con ID: ", docRef.id);

        // Redirigir a la página de ventas después de agregar la compra
        navigate('/ventas');
      } catch (e) {
        console.error("Error añadiendo la compra: ", e);
      }
    };

    addCompra();
  }, [navigate]);

  return <div>Agregando compra...</div>;
};

export default AddCompra;
/* 
HASTA ACA FUNCIONA PERFECTO ESTE ES EL ORIGINAL
*/