const ProductoCard = ({
  producto,
  roles = [],
  onAddToCart = () => { },
  onIncrementStock = () => { },
  onOpenImage = () => { },
  onEdit = () => { },
  onDelete = () => { },
}) => {
  const stock4034 = parseInt(producto.cantidadDisponibleAndes4034 || 0, 10);
  const stock4320 = parseInt(producto.cantidadDisponibleAndes4320 || 0, 10);
  const outOfStock4034 = stock4034 === 0;
  const outOfStock4320 = stock4320 === 0;
  const outOfStockBoth = outOfStock4034 && outOfStock4320;

  // Función para calcular cuotas (simplificada)
  const configuracionCuotas = [
    { cuotas: 2, interes: 15 },
    { cuotas: 3, interes: 25 },
    { cuotas: 4, interes: 40 },
    { cuotas: 6, interes: 60 },
    { cuotas: 9, interes: 75 },
    { cuotas: 12, interes: 100 }/* ,
    { cuotas: 18, interes: 150 },
    { cuotas: 24, interes: 180 }, */
  ];

  const calcularCuotasHover = (precio) => {
    if (isNaN(precio) || precio <= 0) return [];

    const cuotasFiltradas = configuracionCuotas.filter((opcion) => {
      if (precio < 30000) return opcion.cuotas <= 2;
      if (precio >= 30000 && precio < 80000) return opcion.cuotas <= 3;
      if (precio >= 80000 && precio < 150000) return opcion.cuotas <= 6;
      if (precio >= 150000 && precio < 250000) return opcion.cuotas <= 9;
      if (precio >= 250000 && precio < 350000) return opcion.cuotas <= 12;
      if (precio >= 350000 && precio < 500000) return opcion.cuotas <= 18;
      return true;
    });

    return cuotasFiltradas.map(({ cuotas, interes }) => {
      const montoConInteres = precio * (1 + interes / 100);
      const montoCuota = Math.round(montoConInteres / cuotas / 1000) * 1000;
      return { cuotas, montoCuota: montoCuota.toLocaleString('es-AR') };
    });
  };

  const productoClass = (roles.includes('invitado') || !outOfStockBoth) ? '' : 'producto-sin-stock';

  return (
    <li className={`card-producto ${productoClass} categoria-${producto.categoriaId}`} style={{ listStyle: 'none', marginBottom: '1rem', border: '1px solid #ccc', padding: '1rem', borderRadius: '6px' }}>
      {outOfStockBoth && <span style={{ color: 'red', fontWeight: 'bold' }}>SIN STOCK</span>}

      <img
        src={producto.imagenUrl || 'https://via.placeholder.com/150'}
        alt={producto.nombre || 'Sin nombre'}
        style={{ width: '150px', height: '150px', objectFit: 'contain', cursor: 'zoom-in', marginBottom: '5px' }}
        loading="lazy"
        onClick={() => onOpenImage(producto.imagenUrl)}
      />

      <h4>{producto.nombre || 'Sin nombre'}</h4>

      <p style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>
        ${((producto.precio || 0) * 1).toLocaleString('es-AR')}
      </p>

      <div>
        {calcularCuotasHover(producto.precio || 0).map((c, idx) => (
          <p key={idx} style={{ margin: '2px 0' }}>
            En {c.cuotas} cuotas de ${c.montoCuota}
          </p>
        ))}
      </div>

      {['jefe', 'vendedor', 'encargado', 'fotografo'].some(r => roles.includes(r)) && (
        <>
          <p>
            Andes 4034: {stock4034}
            <button onClick={() => onAddToCart(producto, 'Andes4034')} disabled={outOfStock4034} style={{ marginLeft: '0.5rem' }}>+🛒</button>
            {(roles.includes('jefe') || roles.includes('encargado')) && (
              <button onClick={() => onIncrementStock(producto.id, 'cantidadDisponibleAndes4034')} style={{ marginLeft: '0.5rem' }}>+</button>
            )}
          </p>

          <p>
            Andes 4320: {stock4320}
            <button onClick={() => onAddToCart(producto, 'Andes4320')} disabled={outOfStock4320} style={{ marginLeft: '0.5rem' }}>+🛒</button>
            {(roles.includes('jefe') || roles.includes('encargado')) && (
              <button onClick={() => onIncrementStock(producto.id, 'cantidadDisponibleAndes4320')} style={{ marginLeft: '0.5rem' }}>+</button>
            )}
          </p>
        </>
      )}

      {(roles.includes('jefe') || roles.includes('encargado') || roles.includes('fotografo')) && (
        <>
          <button onClick={() => onEdit(producto)} style={{ marginRight: '0.5rem' }}>✏️ Editar</button>
          {roles.includes('jefe') && <button onClick={() => onDelete(producto.id)}>🗑️ Eliminar</button>}
        </>
      )}
    </li>
  );
};

export default ProductoCard;
