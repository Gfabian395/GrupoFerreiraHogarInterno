import React, { useState, useEffect, useRef } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { db, storage } from '../../firebaseConfig'; // storage agregado
import { collection, getDocs, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import Load from '../load/Load';
import './Productos.css';
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { QRCodeCanvas } from "qrcode.react";
import QRCode from 'qrcode';

const Productos = ({ onAddToCart, currentUser }) => {
  const { categoriaId } = useParams();
  const location = useLocation();
  const { resaltadoId } = location.state || {};

  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [alerta, setAlerta] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [currentProduct, setCurrentProduct] = useState(null);
  const [categorias, setCategorias] = useState([]);
  const formRef = useRef(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadedImageUrl, setUploadedImageUrl] = useState(null);
  const [imagenModal, setImagenModal] = useState(null);
  const [productoSeleccionado, setProductoSeleccionado] = useState(null);
  const [cuotaSeleccionada, setCuotaSeleccionada] = useState('');
  const [pasoFormulario, setPasoFormulario] = useState(1);

  const [retiroOEnvio, setRetiroOEnvio] = useState(''); // 'retiro' o 'envio'

  const [sucursalSeleccionada, setSucursalSeleccionada] = useState(''); // 'Andes4034' o 'Andes4320'

  const [direccionEnvio, setDireccionEnvio] = useState({
    calle: '',
    numero: '',
    entreCalles: '',
    localidad: '',
  });

  const [datosCliente, setDatosCliente] = useState({
    nombre: '',
    dni: '',
    telefono1: '',
    telefono2: '',
  });

  // Estado para resaltar producto y refs para hacer scroll
  const [highlightId, setHighlightId] = useState(null);
  const refsProductos = useRef({});

  const handleOpenImage = (url) => {
    setImagenModal(url);
  };

  const handleCloseImage = () => {
    setImagenModal(null);
  };

  // Roles
  const roles = Array.isArray(currentUser.role)
    ? currentUser.role
    : [currentUser.role];

  // Config cuotas e intereses
  const configuracionCuotas = [
    { cuotas: 2, interes: 15 },
    { cuotas: 3, interes: 25 },
    { cuotas: 4, interes: 40 },
    { cuotas: 6, interes: 60 },
    { cuotas: 9, interes: 75 },
    { cuotas: 12, interes: 100 },
    { cuotas: 18, interes: 150 },
    { cuotas: 24, interes: 180 }
  ];

  const calcularCuotasHover = (precio) => {
    if (isNaN(precio) || precio <= 0) return [];

    const cuotasFiltradas = [
      { cuotas: 1, interes: 0 },
      ...configuracionCuotas.filter((opcion) => {
        if (precio < 30000) return opcion.cuotas <= 2;
        if (precio >= 30000 && precio < 80000) return opcion.cuotas <= 3;
        if (precio >= 80000 && precio < 150000) return opcion.cuotas <= 6;
        if (precio >= 150000 && precio < 250000) return opcion.cuotas <= 9;
        if (precio >= 250000 && precio < 350000) return opcion.cuotas <= 12;
        if (precio >= 350000 && precio < 500000) return opcion.cuotas <= 18;
        return true;
      })
    ];


    return cuotasFiltradas.map(({ cuotas, interes }) => {
      const montoConInteres = precio * (1 + interes / 100);
      const montoCuota = Math.round(montoConInteres / cuotas / 1000) * 1000;
      return { cuotas, montoCuota: montoCuota.toLocaleString('es-AR') };
    });
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);

      try {
        // Obtener productos de la categoría seleccionada
        let productosList = [];
        if (categoriaId) {
          const productosCollection = collection(db, `categorias/${categoriaId}/productos`);
          const productosSnapshot = await getDocs(productosCollection);
          productosList = productosSnapshot.docs.map(doc => ({
            id: doc.id,
            categoriaId,
            ...doc.data(),
          }));
          productosList.sort((a, b) => a.nombre.localeCompare(b.nombre));
          setProductos(productosList);
        }

        // Obtener todas las categorías
        const categoriasCollection = collection(db, 'categorias');
        const categoriasSnapshot = await getDocs(categoriasCollection);
        const categoriasList = categoriasSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));
        setCategorias(categoriasList);

      } catch (error) {
        console.error('Error fetching data:', error);
        setAlerta('Ocurrió un error al cargar los productos o categorías.');
        setTimeout(() => setAlerta(''), 4000);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [categoriaId]);

  // EFECTO PARA SCROLL Y RESALTAR PRODUCTO SI VIENE resaltadoId
  useEffect(() => {
    if (resaltadoId && refsProductos.current[resaltadoId]) {
      refsProductos.current[resaltadoId].scrollIntoView({ behavior: 'smooth', block: 'center' });
      setHighlightId(resaltadoId);

      // Quitar el highlight luego de 3 segundos
      const timer = setTimeout(() => setHighlightId(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [resaltadoId, productos]); // productos para asegurar que se haya cargado el listado

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCurrentProduct((prevProduct) => ({
      ...prevProduct,
      [name]: value,
    }));
  };

  // Actualizar producto
  const handleUpdateProduct = async (productoId, updatedFields = null) => {
    if (
      !roles.includes('jefe') &&
      !roles.includes('encargado') &&
      !roles.includes('fotografo')
    ) {
      setAlerta('No tienes permiso para editar productos.');
      setTimeout(() => setAlerta(''), 3000);
      return;
    }

    try {
      const productoRef = doc(db, `categorias/${categoriaId}/productos`, productoId);
      const dataToUpdate = updatedFields ? updatedFields : currentProduct;
      await updateDoc(productoRef, { ...dataToUpdate });

      setProductos((prevProductos) =>
        prevProductos.map((prod) =>
          prod.id === productoId ? { ...prod, ...dataToUpdate } : prod
        )
      );

      setMostrarFormulario(false);
      setAlerta('Producto actualizado con éxito');
      setTimeout(() => setAlerta(''), 3000);

      setUploadedImageUrl(null);
      setSelectedFile(null);
    } catch (error) {
      console.error('Error al actualizar el producto:', error);
      setAlerta('Error al actualizar el producto');
      setTimeout(() => setAlerta(''), 3000);
    }
  };

  const handleShowFormulario = (producto) => {
    setCurrentProduct(producto);
    setMostrarFormulario(true);
    setUploadedImageUrl(null);
    setSelectedFile(null);
  };

  const handleCloseFormulario = () => {
    setMostrarFormulario(false);
    setCurrentProduct(null);
    setUploadedImageUrl(null);
    setSelectedFile(null);
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const filteredProductos = productos.filter((producto) =>
    producto.nombre.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const confirmarYEliminar = async (productoId) => {
    if (!roles.includes('jefe')) {
      setAlerta('No tienes permiso para eliminar productos.');
      setTimeout(() => setAlerta(''), 3000);
      return;
    }

    const clave = prompt('Para eliminar este producto, ingresá la contraseña de seguridad:');
    if (clave !== '031285') {
      if (clave !== null) {
        setAlerta('Contraseña incorrecta. Operación cancelada.');
        setTimeout(() => setAlerta(''), 3000);
      }
      return;
    }

    try {
      const productoRef = doc(db, `categorias/${categoriaId}/productos`, productoId);
      await deleteDoc(productoRef);
      setProductos((prevProductos) => prevProductos.filter((p) => p.id !== productoId));
      setAlerta('Producto eliminado con éxito');
      setTimeout(() => setAlerta(''), 3000);
    } catch (error) {
      console.error('Error al eliminar el producto: ', error);
      setAlerta('Error al eliminar el producto');
      setTimeout(() => setAlerta(''), 3000);
    }
  };

  const handleIncrementStock = async (productoId, campo) => {
    if (!roles.includes('jefe') && !roles.includes('encargado')) {
      setAlerta('No tienes permiso para actualizar el stock.');
      setTimeout(() => setAlerta(''), 3000);
      return;
    }

    try {
      const productoRef = doc(db, `categorias/${categoriaId}/productos`, productoId);
      const producto = productos.find((p) => p.id === productoId);

      if (producto && producto[campo] !== undefined && !isNaN(producto[campo])) {
        const newCantidad = parseInt(producto[campo]) + 1;
        await updateDoc(productoRef, { [campo]: newCantidad });
        setProductos(
          productos.map((p) =>
            p.id === productoId ? { ...p, [campo]: newCantidad } : p
          )
        );
        setAlerta('Stock actualizado con éxito');
        setTimeout(() => setAlerta(''), 3000);
      } else {
        console.error(
          'Error: El campo especificado no es un número válido o no existe.'
        );
      }
    } catch (error) {
      console.error('Error al actualizar el stock: ', error);
    }
  };

  const handleAddToCart = (producto, sucursal) => {
    const productoEnCarrito = { ...producto, sucursal };
    const productoStock = parseInt(producto[`cantidadDisponible${sucursal}`]);

    if (!isNaN(productoStock) && productoStock > 0) {
      onAddToCart(productoEnCarrito);
      alert('Producto añadido al carrito con éxito');
    } else {
      alert('No hay suficiente stock para añadir este producto al carrito');
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setSelectedFile(file);

    const reader = new FileReader();
    reader.onloadend = () => {
      setUploadedImageUrl(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const limpiarYCerrar = () => {
    setProductoSeleccionado(null);
    setCuotaSeleccionada('');
    setPasoFormulario(1);
    setRetiroOEnvio('');
    setSucursalSeleccionada('');
    setDireccionEnvio({ altura: '', entreCalles: '', localidad: '' });
    setDatosCliente({ nombre: '', dni: '', telefono1: '', telefono2: '' });
  };

  // Armás la dirección con los datos de direcciónEnvio que el cliente completó
  const direccion = `${direccionEnvio.calle} ${direccionEnvio.numero}, ${direccionEnvio.localidad}, entre calles ${direccionEnvio.entreCalles}`;

  // Generás el link para Google Maps con la dirección codificada
  const linkMaps = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(direccion)}`;


  const enviarPedidoWhatsapp = () => {
    const cuota = calcularCuotasHover(productoSeleccionado.precio || 0)
      .find(c => c.cuotas === parseInt(cuotaSeleccionada, 10));

    let mensaje = `Hola, quiero pedir este producto:\n\n` +
      `📦 *${productoSeleccionado.nombre}*\n` +
      `💰 Precio: $${(productoSeleccionado.precio || 0).toLocaleString('es-AR')}\n` +
      `📋 Cuotas elegidas: ${cuotaSeleccionada} cuotas de $${cuota.montoCuota}\n\n`;

    if (retiroOEnvio === 'retiro') {
      mensaje += `🚩 Retiro en sucursal: ${sucursalSeleccionada}\n\n`;
    } else if (retiroOEnvio === 'envio') {
      mensaje +=
        `🏠 Envío a domicilio:\n` +
        `Calle: ${direccionEnvio.calle}\n` +
        `Número: ${direccionEnvio.numero}\n` +
        `Entre calles: ${direccionEnvio.entreCalles}\n` +
        `Localidad: ${direccionEnvio.localidad}\n\n` +
        `📍 Ver en Google Maps: ${linkMaps}\n\n`;
    }

    mensaje += `Datos del cliente:\n` +
      `Nombre completo: ${datosCliente.nombre}\n` +
      `DNI: ${datosCliente.dni}\n` +
      `Teléfono 1: ${datosCliente.telefono1}\n` +
      `Teléfono 2: ${datosCliente.telefono2 || '-'}\n`;

    const urlWhatsapp = `https://wa.me/5491159781434?text=${encodeURIComponent(mensaje)}`;
    window.open(urlWhatsapp, '_blank', 'noopener,noreferrer');

    limpiarYCerrar();
  };

  if (loading) return <Load />;

  const generarPDFStock = async () => {
    try {
      const pdf = new jsPDF("p", "mm", "a4");
      let y = 10; // posición vertical inicial

      for (const producto of filteredProductos) {
        // Evitar que se pase del final de la hoja
        if (y > 270) {
          pdf.addPage();
          y = 10;
        }

        // Obtener imagen como base64
        const img = await cargarImagenBase64(producto.imagenUrl || 'https://via.placeholder.com/150');

        // Agregar imagen
        pdf.addImage(img, "JPEG", 5, y, 15, 15); // X, Y, ancho, alto

        // Agregar nombre (sin precio)
        pdf.text(producto.nombre || "Sin nombre", 45, y + 10);

        y += 20; // espacio entre productos
      }

      pdf.save("control_stock.pdf");
    } catch (error) {
      console.error("Error generando PDF:", error);
    }
  };

  const cargarImagenBase64 = (url) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.setAttribute("crossOrigin", "anonymous"); // evitar problemas de CORS
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL("image/jpeg"));
      };
      img.src = url;
    });
  };

  const descargarQRCategoria = async () => {
    try {
      const pdf = new jsPDF("p", "mm", "a4");
      const qrSize = 30; // QR 3 cm
      const imgSize = 30; // Imagen 3 cm
      const padding = 5;
      const itemsPerRow = 3; // 3 tarjetas por fila
      const rowHeight = Math.max(qrSize, imgSize) + 15; // altura de cada fila
      let x = padding;
      let y = padding;

      for (let i = 0; i < filteredProductos.length; i++) {
        const producto = filteredProductos[i];

        // Generar QR
        const urlProducto = `${window.location.origin}/producto/${categoriaId}/${producto.id}`;
        const qrDataUrl = await QRCode.toDataURL(urlProducto, { margin: 1, width: 150 });

        // Cargar imagen del producto
        const imgDataUrl = await new Promise((resolve) => {
          const img = new Image();
          img.crossOrigin = "anonymous";
          img.onload = () => {
            const canvas = document.createElement("canvas");
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext("2d");
            ctx.drawImage(img, 0, 0);
            resolve(canvas.toDataURL("image/jpeg"));
          };
          img.src = producto.imagenUrl || "https://via.placeholder.com/150";
        });

        // Fondo de tarjeta (NEGRO)
        pdf.setFillColor(0, 0, 0);
        pdf.roundedRect(x - 2, y - 2, qrSize + imgSize + 10, rowHeight, 2, 2, "F");

        // ✅ Línea blanca vertical al comienzo de cada QR
        pdf.setDrawColor(255, 255, 255); // blanco
        pdf.setLineWidth(1);             // 1 px
        pdf.line(
          x - 2,               // un poquito antes del QR
          y - 2,               // arriba del card
          x - 2,               // misma X
          y - 2 + rowHeight    // abajo del card
        );

        // QR
        pdf.addImage(qrDataUrl, "PNG", x, y, qrSize, qrSize);

        // Imagen al lado del QR
        pdf.addImage(imgDataUrl, "JPEG", x + qrSize + 3, y, imgSize, imgSize);

        // Nombre del producto debajo (centrado y en blanco)
        pdf.setFontSize(11);                // ✅ Más grande
        pdf.setTextColor(255, 255, 255);    // ✅ Blanco
        pdf.text(
          producto.nombre || "Sin nombre",
          x + (qrSize + imgSize + 5) / 2,   // ✅ Centrado
          y + rowHeight - 5,
          { maxWidth: qrSize + imgSize + 5, align: "center" }
        );

        // Ajustar posición
        if ((i + 1) % itemsPerRow === 0) {
          x = padding;
          y += rowHeight + 5; // espacio entre filas
          if (y + rowHeight > 290) { // nueva página
            pdf.addPage();
            y = padding;
          }
        } else {
          x += qrSize + imgSize + 5; // espacio entre columnas
        }
      }

      pdf.save(`QR_${categoriaId}.pdf`);
    } catch (error) {
      console.error("Error generando PDF de QRs:", error);
      setAlerta("Ocurrió un error al generar los QRs");
      setTimeout(() => setAlerta(""), 3000);
    }
  };

  const redondearAlMil = (valor) => {
    return Math.round(valor / 1000) * 1000;
  };

  const handleAumentarPrecios = async () => {
    if (!roles.includes('jefe')) {
      setAlerta('No tienes permiso para modificar los precios.');
      setTimeout(() => setAlerta(''), 3000);
      return;
    }

    const porcentaje = prompt("¿Cuánto querés aumentar? (Ej: 10 para +10%)");

    if (porcentaje === null) return;

    const porcNum = Number(porcentaje);

    if (isNaN(porcNum) || porcNum <= 0) {
      alert("Porcentaje inválido");
      return;
    }

    const confirmar = window.confirm(
      `Vas a aumentar TODOS los precios en ${porcNum}%.\n¿Confirmás?`
    );

    if (!confirmar) return;

    try {
      for (const producto of productos) {
        const prodRef = doc(
          db,
          `categorias/${categoriaId}/productos`,
          producto.id
        );

        const calculado = producto.precio * (1 + porcNum / 100);
        const nuevoPrecio = redondearAlMil(calculado);

        await updateDoc(prodRef, { precio: nuevoPrecio });
      }

      // Actualizar estado local
      setProductos(prev =>
        prev.map(prod => ({
          ...prod,
          precio: redondearAlMil(prod.precio * (1 + porcNum / 100)),
        }))
      );

      setAlerta(`Precios aumentados en ${porcentaje}% con éxito`);
      setTimeout(() => setAlerta(''), 3000);

    } catch (error) {
      console.error("Error aumentando precios:", error);
      setAlerta("Error al aumentar los precios");
      setTimeout(() => setAlerta(''), 3000);
    }
  };


  const handleBajarPrecios = async () => {
    if (!roles.includes('jefe')) {
      setAlerta('No tienes permiso para modificar los precios.');
      setTimeout(() => setAlerta(''), 3000);
      return;
    }

    const porcentaje = prompt("¿Cuánto querés bajar? (Ej: 10 para -10%)");

    if (porcentaje === null) return;

    const porcNum = Number(porcentaje);

    if (isNaN(porcNum) || porcNum <= 0) {
      alert("Porcentaje inválido");
      return;
    }

    const confirmar = window.confirm(
      `Vas a bajar TODOS los precios en ${porcNum}%.\n¿Confirmás?`
    );

    if (!confirmar) return;

    try {
      for (const producto of productos) {
        const prodRef = doc(
          db,
          `categorias/${categoriaId}/productos`,
          producto.id
        );

        let calculado = producto.precio * (1 - porcNum / 100);
        let nuevoPrecio = redondearAlMil(calculado);

        if (nuevoPrecio < 1000) nuevoPrecio = 1000; // evitar precios 0 o muy chicos

        await updateDoc(prodRef, { precio: nuevoPrecio });
      }

      // Actualizar estado local
      setProductos(prev =>
        prev.map(prod => {
          let calculado = prod.precio * (1 - porcNum / 100);
          let nuevoPrecio = redondearAlMil(calculado);
          if (nuevoPrecio < 1000) nuevoPrecio = 1000;
          return { ...prod, precio: nuevoPrecio };
        })
      );

      setAlerta(`Precios bajados en ${porcentaje}% con éxito`);
      setTimeout(() => setAlerta(''), 3000);

    } catch (error) {
      console.error("Error bajando precios:", error);
      setAlerta("Error al bajar los precios");
      setTimeout(() => setAlerta(''), 3000);
    }
  };


  return (
    <>
      {alerta && <div className="alert alert-success">{alerta}</div>}

      {roles.includes('jefe') && (
        <button onClick={generarPDFStock} className="btn-pdf">
          📄 Descargar PDF Stock
        </button>
      )}

      {roles.includes('jefe') && (
        <button onClick={descargarQRCategoria} className="btn-pdf">
          📄 Descargar QRs de la categoría
        </button>
      )}

      {roles.includes('jefe') && (
        <button
          onClick={handleAumentarPrecios}
          className="btn-subir-precios"
          style={{
            backgroundColor: '#d9534f',
            color: 'white',
            padding: '10px',
            borderRadius: '8px',
            marginBottom: '10px',
            border: 'none',
            cursor: 'pointer'
          }}
        >
          🔥 Aumentar precios de todos los productos
        </button>
      )}

      {roles.includes('jefe') && (
        <button
          onClick={handleBajarPrecios}
          className="btn-bajar-precios"
          style={{
            backgroundColor: '#0275d8',
            color: 'white',
            padding: '10px',
            borderRadius: '8px',
            marginBottom: '10px',
            border: 'none',
            cursor: 'pointer'
          }}
        >
          📉 Bajar precios de todos los productos
        </button>
      )}

      <div className="productos">
        <input
          type="text"
          placeholder="Buscar productos..."
          value={searchQuery}
          onChange={handleSearchChange}
          className="search-bar"
        />

        <ul>
          {filteredProductos.map((producto) => {
            const stock4034 = parseInt(producto.cantidadDisponibleAndes4034 || 0, 10);
            const stock4320 = parseInt(producto.cantidadDisponibleAndes4320 || 0, 10);
            const outOfStock4034 = stock4034 === 0;
            const outOfStock4320 = stock4320 === 0;
            const outOfStockBoth = outOfStock4034 && outOfStock4320;

            const productoClass =
              (roles.includes('invitado') || !outOfStockBoth) ? '' : 'producto-sin-stock';

            return (
              <li
                key={producto.id}
                ref={(el) => (refsProductos.current[producto.id] = el)}
                className={`card-producto ${productoClass} categoria-${producto.categoriaId}`}
                style={{
                  border: highlightId === producto.id ? '3px solid #f39c12' : undefined,
                  boxShadow: highlightId === producto.id ? '0 0 15px #f39c12' : undefined,
                  backgroundColor: highlightId === producto.id ? '#fff8e1' : undefined,
                  transition: 'box-shadow 0.5s ease, border 0.5s ease, background-color 0.5s ease'
                }}
              >
                {outOfStockBoth && <span className="badge-stock">SIN STOCK</span>}

                <img
                  src={producto.imagenUrl || 'https://via.placeholder.com/150'}
                  alt={producto.nombre || 'Sin nombre'}
                  className="producto-imagen"
                  loading="lazy"
                  onClick={() => handleOpenImage(producto.imagenUrl)}
                  style={{ cursor: 'zoom-in' }}
                />

                <div className="detallitos">
                  <h6>{producto.nombre || 'Sin nombre'}</h6>

                  <span className="precio-texto">
                    ${((producto.precio || 0) * 1).toLocaleString('es-AR')}
                  </span>

                  <div className="detalle-cuotas">
                    {calcularCuotasHover(producto.precio || 0).map((c, idx) => (
                      <p key={idx}>En {c.cuotas} cuotas de ${c.montoCuota}</p>
                    ))}

                    {roles.includes('invitado') && (
                      <button
                        className="boton-whatsapp"
                        onClick={() => {
                          setProductoSeleccionado(producto);
                          setCuotaSeleccionada(''); // Reiniciar selección
                        }}
                        style={{
                          marginTop: '10px',
                          display: 'inline-block',
                          backgroundColor: '#25D366',
                          color: 'white',
                          padding: '8px 12px',
                          borderRadius: '8px',
                          textDecoration: 'none',
                          fontWeight: 'bold',
                          cursor: 'pointer',
                          border: 'none',
                        }}
                      >
                        Pedir por WhatsApp
                      </button>
                    )}
                  </div>

                  {roles.includes('invitado') && (
                    <button
                      onClick={() =>
                        handleAddToCart(
                          producto,
                          stock4034 > 0
                            ? 'Andes4034'
                            : stock4320 > 0
                              ? 'Andes4320'
                              : ''
                        )
                      }
                      disabled={outOfStockBoth}
                      className="boton-agregar-invitado"
                      title="Agregar al carrito"
                    >
                      🛒 Agregar al carrito
                    </button>
                  )}

                  {(['jefe', 'vendedor', 'encargado', 'fotografo',].some((r) => roles.includes(r))) && (
                    <>
                      <p>
                        Andes 4034: {stock4034}
                        <button
                          onClick={() => handleAddToCart(producto, 'Andes4034')}
                          disabled={outOfStock4034}
                          className="boton-agregar"
                        >
                          +🛒
                        </button>
                        {roles.includes('jefe') || roles.includes('encargado') ? (
                          <button
                            onClick={() => handleIncrementStock(producto.id, 'cantidadDisponibleAndes4034')}
                            className="boton-incrementar"
                          >
                            +
                          </button>
                        ) : null}
                      </p>

                      <p>
                        Andes 4320: {stock4320}
                        <button
                          onClick={() => handleAddToCart(producto, 'Andes4320')}
                          disabled={outOfStock4320}
                          className="boton-agregar"
                        >
                          +🛒
                        </button>
                        {roles.includes('jefe') || roles.includes('encargado') ? (
                          <button
                            onClick={() => handleIncrementStock(producto.id, 'cantidadDisponibleAndes4320')}
                            className="boton-incrementar"
                          >
                            +
                          </button>
                        ) : null}
                      </p>
                    </>
                  )}
                </div>

                {(roles.includes('jefe') || roles.includes('encargado') || roles.includes('fotografo')) && (
                  <>
                    <button className="boton-editar" onClick={() => handleShowFormulario(producto)}><i className='bx bxs-pencil'></i></button>
                    {roles.includes('jefe') && (
                      <button
                        className="boton-borrar"
                        onClick={() => confirmarYEliminar(producto.id)}
                      >
                        <i className='bx bxs-trash-alt'></i>
                      </button>
                    )}
                  </>
                )}

                {roles.includes('jefe') && (
                  <div className="qr-contenedor">
                    <QRCodeCanvas
                      value={`${window.location.origin}/producto/${categoriaId}/${producto.id}`}
                      size={80}
                      bgColor="#ffffff"
                      fgColor="#000000"
                      includeMargin={true}
                    />
                    <p className="qr-texto">Escaneá para ver el producto</p>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </div>

      {mostrarFormulario && currentProduct && (
        <div className="blur-background">
          <form
            className="floating-form"
            ref={formRef}
            onSubmit={async (e) => {
              e.preventDefault();

              let imagenUrlFinal = currentProduct.imagenUrl;

              if (selectedFile) {
                try {
                  setAlerta('Subiendo imagen...');
                  const imageRef = ref(storage, `productos/${Date.now()}_${selectedFile.name}`);
                  await uploadBytes(imageRef, selectedFile);
                  imagenUrlFinal = await getDownloadURL(imageRef);
                } catch (error) {
                  console.error('Error subiendo imagen:', error);
                  setAlerta('Error al subir la imagen');
                  return;
                }
              }

              const dataToUpdate = {
                ...currentProduct,
                imagenUrl: imagenUrlFinal,
              };

              await handleUpdateProduct(currentProduct.id, dataToUpdate);
            }}
          >
            <span className="close" onClick={handleCloseFormulario}>
              ❌
            </span>
            <h2>Editar Producto</h2>

            <div className="form-group">
              <label htmlFor="imagenFile">Subir imagen</label>
              <input
                type="file"
                id="imagenFile"
                accept="image/*"
                onChange={handleFileChange}
              />
              <div className="preview-imagen-wrapper">
                {uploadedImageUrl ? (
                  <img src={uploadedImageUrl} alt="Preview" className="preview-imagen" />
                ) : currentProduct.imagenUrl ? (
                  <img src={currentProduct.imagenUrl} alt="Imagen actual" className="preview-imagen" />
                ) : null}
              </div>
            </div>

            {!(roles.includes('fotografo') && !roles.includes('jefe') && !roles.includes('encargado')) && (
              <>
                <div className="form-group">
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Nombre"
                    name="nombre"
                    value={currentProduct.nombre || ''}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <input
                    type="number"
                    className="form-control"
                    placeholder="Precio"
                    name="precio"
                    value={currentProduct.precio || ''}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <input
                    type="number"
                    className="form-control"
                    placeholder="Stock Andes 4034"
                    name="cantidadDisponibleAndes4034"
                    value={currentProduct.cantidadDisponibleAndes4034 || ''}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <input
                    type="number"
                    className="form-control"
                    placeholder="Stock Andes 4320"
                    name="cantidadDisponibleAndes4320"
                    value={currentProduct.cantidadDisponibleAndes4320 || ''}
                    onChange={handleInputChange}
                    required
                  />

                </div>

                <div className="form-group">
                  <select
                    className="form-control"
                    name="categoriaId"
                    value={currentProduct.categoriaId || ''}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">-- Selecciona una Categoría --</option>
                    {categorias.map((categoria) => (
                      <option key={categoria.id} value={categoria.id}>
                        {categoria.nombre}
                      </option>
                    ))}
                  </select>
                </div>
              </>
            )}

            <div className="form-group-buttons">
              <button type="submit" className="btn btn-primary">
                Guardar Cambios
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleCloseFormulario}
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {imagenModal && (
        <div className="modal-imagen" onClick={handleCloseImage}>
          <span className="cerrar-modal" onClick={handleCloseImage}>❌</span>
          <img src={imagenModal} alt="Imagen ampliada" className="imagen-modal-grande" />
        </div>
      )}

      {productoSeleccionado && (
        <div className="modal-cuotas">
          <div className="modal-cuotas-content">
            {pasoFormulario === 1 && (
              <>
                <h3>Elegí la cantidad de cuotas para:</h3>
                <p><strong>{productoSeleccionado.nombre}</strong></p>

                <select
                  value={cuotaSeleccionada}
                  onChange={(e) => setCuotaSeleccionada(e.target.value)}
                >
                  <option value="">-- Seleccioná cuotas --</option>
                  {calcularCuotasHover(productoSeleccionado.precio || 0).map((c) => (
                    <option key={c.cuotas} value={c.cuotas}>
                      {c.cuotas} cuotas de ${c.montoCuota}
                    </option>
                  ))}
                </select>

                <div style={{ marginTop: '15px' }}>
                  <button
                    disabled={!cuotaSeleccionada}
                    onClick={() => setPasoFormulario(2)}
                    style={{ marginRight: '10px' }}
                  >
                    Siguiente
                  </button>

                  <button
                    onClick={() => {
                      limpiarYCerrar();
                    }}
                  >
                    Cancelar
                  </button>
                </div>
              </>
            )}

            {pasoFormulario === 2 && (
              <>
                <h3>¿Retirás en sucursal o enviamos a domicilio?</h3>

                <label>
                  <input
                    type="radio"
                    name="retiroOEnvio"
                    value="retiro"
                    checked={retiroOEnvio === 'retiro'}
                    onChange={(e) => setRetiroOEnvio(e.target.value)}
                  />
                  Retiro en sucursal
                </label>

                <label style={{ marginLeft: '15px' }}>
                  <input
                    type="radio"
                    name="retiroOEnvio"
                    value="envio"
                    checked={retiroOEnvio === 'envio'}
                    onChange={(e) => setRetiroOEnvio(e.target.value)}
                  />
                  Envío a domicilio
                </label>

                {retiroOEnvio === 'retiro' && (
                  <div style={{ marginTop: '10px' }}>
                    <label>
                      Sucursal:
                      <select
                        value={sucursalSeleccionada}
                        onChange={(e) => setSucursalSeleccionada(e.target.value)}
                      >
                        <option value="">-- Seleccioná sucursal --</option>
                        <option value="Andes4034">Los Andes 4034</option>
                        <option value="Andes4320">Los Andes 4320</option>
                      </select>
                    </label>
                  </div>
                )}

                {retiroOEnvio === 'envio' && (
                  <div style={{ marginTop: '10px' }}>
                    <label>
                      Calle:
                      <input
                        type="text"
                        value={direccionEnvio.calle}
                        onChange={(e) =>
                          setDireccionEnvio((prev) => ({ ...prev, calle: e.target.value }))
                        }
                      />
                    </label>

                    <label>
                      Número:
                      <input
                        type="text"
                        value={direccionEnvio.numero}
                        onChange={(e) =>
                          setDireccionEnvio((prev) => ({ ...prev, numero: e.target.value }))
                        }
                      />
                    </label>

                    <label>
                      Entre calles:
                      <input
                        type="text"
                        value={direccionEnvio.entreCalles}
                        onChange={(e) =>
                          setDireccionEnvio((prev) => ({ ...prev, entreCalles: e.target.value }))
                        }
                      />
                    </label>

                    <label>
                      Localidad:
                      <input
                        type="text"
                        value={direccionEnvio.localidad}
                        onChange={(e) =>
                          setDireccionEnvio((prev) => ({ ...prev, localidad: e.target.value }))
                        }
                      />
                    </label>
                  </div>
                )}

                <div style={{ marginTop: '15px' }}>
                  <button
                    disabled={
                      retiroOEnvio === '' ||
                      (retiroOEnvio === 'retiro' && sucursalSeleccionada === '') ||
                      (retiroOEnvio === 'envio' &&
                        (
                          !direccionEnvio.calle ||
                          !direccionEnvio.numero ||
                          !direccionEnvio.entreCalles ||
                          !direccionEnvio.localidad
                        ))
                    }
                    onClick={() => setPasoFormulario(3)}
                    style={{ marginRight: '10px' }}
                  >
                    Siguiente
                  </button>

                  <button
                    onClick={() => {
                      limpiarYCerrar();
                    }}
                  >
                    Cancelar
                  </button>
                </div>
              </>
            )}

            {pasoFormulario === 3 && (
              <>
                <h3>Por último, ingresá tus datos:</h3>

                <label>
                  Nombre completo:
                  <input
                    type="text"
                    value={datosCliente.nombre}
                    onChange={(e) =>
                      setDatosCliente((prev) => ({ ...prev, nombre: e.target.value }))
                    }
                  />
                </label>

                <label>
                  DNI:
                  <input
                    type="text"
                    value={datosCliente.dni}
                    onChange={(e) =>
                      setDatosCliente((prev) => ({ ...prev, dni: e.target.value }))
                    }
                  />
                </label>

                <label>
                  Teléfono 1:
                  <input
                    type="text"
                    value={datosCliente.telefono1}
                    onChange={(e) =>
                      setDatosCliente((prev) => ({ ...prev, telefono1: e.target.value }))
                    }
                  />
                </label>

                <label>
                  Teléfono 2:
                  <input
                    type="text"
                    value={datosCliente.telefono2}
                    onChange={(e) =>
                      setDatosCliente((prev) => ({ ...prev, telefono2: e.target.value }))
                    }
                  />
                </label>

                <div style={{ marginTop: '15px' }}>
                  <button
                    disabled={
                      !datosCliente.nombre ||
                      !datosCliente.dni ||
                      !datosCliente.telefono1
                    }
                    onClick={() => {
                      enviarPedidoWhatsapp();
                    }}
                    style={{ marginRight: '10px' }}
                  >
                    Confirmar pedido
                  </button>

                  <button
                    onClick={() => {
                      limpiarYCerrar();
                    }}
                  >
                    Cancelar
                  </button>
                </div>
              </>
            )}
          </div>

          <div
            className="modal-cuotas-backdrop"
            onClick={() => {
              setProductoSeleccionado(null);
              setCuotaSeleccionada('');
            }}
          ></div>
        </div>
      )}
    </>
  );
};

export default Productos;
