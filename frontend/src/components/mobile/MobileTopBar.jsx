import Icono from '../Icono';
import { useAuth } from '../../context/AuthContext';

export default function MobileTopBar({
  fecha,
  onAbrirSincronizacion,
  modoEscritorioForzado,
  setModoEscritorioForzado
}) {
  const { cerrarSesion } = useAuth();

  const formatearFechaCorta = (fechaStr) => {
    if (!fechaStr) return '';
    try {
      const [anio, mes, dia] = fechaStr.split('-');
      const d = new Date(parseInt(anio, 10), parseInt(mes, 10) - 1, parseInt(dia, 10));
      return d.toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric', month: 'short' });
    } catch {
      return fechaStr;
    }
  };

  return (
    <header className="karinga-mobile-topbar">
      <div className="karinga-mobile-topbar-brand">
        <div className="karinga-mobile-logo">
          <Icono nombre="nature" tamano={18} color="#86EFAC" />
        </div>
        <div>
          <h1 className="karinga-mobile-title">Karinga</h1>
          <span className="karinga-mobile-date">{formatearFechaCorta(fecha)}</span>
        </div>
      </div>

      <div className="karinga-mobile-topbar-actions">
        {onAbrirSincronizacion && (
          <button
            type="button"
            className="karinga-mobile-action-btn"
            onClick={onAbrirSincronizacion}
            title="Sincronizar Google Calendar"
          >
            <Icono nombre="calendar" tamano={16} color="var(--verde-oscuro)" />
            <span>Google Cal</span>
          </button>
        )}

        <button
          type="button"
          className="karinga-mobile-mode-btn"
          onClick={() => setModoEscritorioForzado((prev) => !prev)}
          title={modoEscritorioForzado ? 'Cambiar a vista móvil' : 'Ver versión de escritorio'}
        >
          <Icono nombre={modoEscritorioForzado ? 'bed' : 'settings'} tamano={15} color="#475569" />
          <span>{modoEscritorioForzado ? 'Móvil' : 'PC'}</span>
        </button>

        <button
          type="button"
          className="karinga-mobile-mode-btn"
          onClick={cerrarSesion}
          title="Cerrar sesión"
          style={{ borderColor: '#FCA5A5', color: '#DC2626' }}
        >
          <Icono nombre="lock" tamano={14} color="#DC2626" />
        </button>
      </div>
    </header>
  );
}
