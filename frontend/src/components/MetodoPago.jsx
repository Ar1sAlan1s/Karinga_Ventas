import { METODOS_PAGO } from '../constantes/datosIniciales';
import Icono from './Icono';

export default function MetodoPago({ metodoSeleccionado, alCambiarMetodo }) {
  const obtenerIconoNombre = (id) => {
    switch (id) {
      case 'Efectivo':
        return 'cash';
      case 'Transferencia BBVA':
      case 'Transferencia Bajío':
        return 'bank';
      case 'Tarjeta':
      case 'Tarjeta Zettle':
        return 'credit-card';
      case 'Web':
        return 'web';
      case 'Airbnb':
        return 'bed';
      default:
        return 'cash';
    }
  };

  return (
    <section className="karinga-tarjeta karinga-seccion-bloque">
      <div className="karinga-seccion-header">
                <h2 className="karinga-tarjeta-titulo" style={{ margin: 0, padding: 0, border: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Icono nombre="credit-card" tamano={20} color="var(--verde-oscuro)" />
          <span>Método de Pago para Liquidación</span>
        </h2>
      </div>

      <div className="karinga-selector-botones">
        {METODOS_PAGO.map((metodo) => {
          const esActivo = metodoSeleccionado === metodo.id;
          return (
            <button
              key={metodo.id}
              type="button"
              className={`karinga-boton-opcion ${esActivo ? 'activo' : ''}`}
              onClick={() => alCambiarMetodo(metodo.id)}
            >
              <Icono nombre={obtenerIconoNombre(metodo.id)} tamano={20} color={esActivo ? '#FFFFFF' : 'currentColor'} />
              <span>{metodo.etiqueta}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
