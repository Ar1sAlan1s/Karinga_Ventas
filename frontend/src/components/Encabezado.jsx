import Icono from './Icono';
import { useAuth } from '../context/AuthContext';

export default function Encabezado() {
  const { usuario, cerrarSesion } = useAuth();

  return (
    <header className="karinga-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
      <div className="karinga-header-info">
        <div className="karinga-logo-icono" title="Karinga Resort Ecoturístico">
          <Icono nombre="nature" tamano={28} color="#FFFFFF" />
        </div>
        <div>
          <h1 className="karinga-titulo-h1">Karinga Resort Ecoturístico</h1>
          <p className="karinga-subtitulo">Punto de Venta y Gestión de Reservas</p>
        </div>
      </div>

      {usuario && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
            <span style={{ fontSize: '0.88rem', fontWeight: 600, color: '#FFFFFF' }}>{usuario.nombre}</span>
            <span style={{
              fontSize: '0.7rem',
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              color: '#FFFFFF',
              padding: '1px 7px',
              borderRadius: '10px',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              {usuario.rol}
            </span>
          </div>
          <button
            type="button"
            onClick={cerrarSesion}
            title="Cerrar sesión"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: 'rgba(255, 255, 255, 0.15)',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              color: '#FFFFFF',
              padding: '6px 12px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '0.82rem',
              fontWeight: 500,
              transition: 'background-color 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.25)'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.15)'}
          >
            <Icono nombre="lock" tamano={15} color="#FFFFFF" />
            <span>Salir</span>
          </button>
        </div>
      )}
    </header>
  );
}
