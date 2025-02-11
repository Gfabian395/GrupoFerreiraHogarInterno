import React, { useState } from 'react';
import './Cuotas.css';

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

function formatearNumero(valor) {
    valor = valor.replace(/\./g, '');
    valor = parseInt(valor, 10);
    return !isNaN(valor) ? valor.toLocaleString('es-AR') : '';
}

const Cuotas = ({ monto }) => {
    const [cuotas, setCuotas] = useState([]);

    const calcularCuotas = () => {
        if (isNaN(monto) || monto <= 0) {
            setCuotas([{ mensaje: "Por favor, ingrese un monto válido." }]);
            return;
        }

        const cuotasFiltradas = configuracionCuotas.filter(opcion => {
            if (monto < 30000) return opcion.cuotas <= 2;
            if (monto >= 30000 && monto < 80000) return opcion.cuotas <= 3;
            if (monto >= 80000 && monto < 150000) return opcion.cuotas <= 6;
            if (monto >= 150000 && monto < 250000) return opcion.cuotas <= 9;
            if (monto >= 250000 && monto < 350000) return opcion.cuotas <= 12;
            if (monto >= 350000 && monto < 500000) return opcion.cuotas <= 18;
            return true;
        });

        const resultados = cuotasFiltradas.map(opcion => {
            const { cuotas, interes } = opcion;
            const montoConInteres = monto * (1 + interes / 100);
            const montoCuota = Math.round(montoConInteres / cuotas / 1000) * 1000;
            return {
                cuotas,
                montoCuota: montoCuota.toLocaleString('es-AR')
            };
        });

        setCuotas(resultados);
    };

    return (
        <div className="calculadora-cuotas">
            <h1>Calculadora de Cuotas</h1>
            <div>
                <label htmlFor="monto">Monto:</label>
                <input
                    type="text"
                    id="monto"
                    value={monto.toLocaleString('es-AR')}
                    readOnly
                />
                <button onClick={calcularCuotas}>Calcular Cuotas</button>
                <div id="resultado">
                    {cuotas.map((resultado, index) => (
                        <p key={index}>{resultado.mensaje || `Para ${resultado.cuotas} cuotas: $${resultado.montoCuota} por mes`}</p>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default Cuotas;
/* 
HASTA ACA FUNCIONA PERFECTO ESTE ES EL ORIGINAL
*/