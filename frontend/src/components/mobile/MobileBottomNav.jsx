import Icono from '../Icono';

export default function MobileBottomNav({ paginaActiva, alCambiarPagina, conteoPendientes = 0 }) {
  const items = [
    { id: 'cabanas', etiqueta: 'Cabañas', icono: 'bed', badge: conteoPendientes },
    { id: 'interacciones', etiqueta: 'Actividades', icono: 'nature' },
    { id: 'calendario', etiqueta: 'Calendario', icono: 'calendar' },
    { id: 'reportes', etiqueta: 'Reportes', icono: 'chart-bar' },
    { id: 'exportacion', etiqueta: 'Exportar', icono: 'download' }
  ];

  return (
    <nav className="karinga-mobile-bottom-nav" aria-label="Navegación móvil">
      {items.map((item) => {
        const esActivo = paginaActiva === item.id;
        return (
          <button
            key={item.id}
            type="button"
            className={`karinga-mobile-nav-item ${esActivo ? 'activo' : ''}`}
            onClick={() => alCambiarPagina(item.id)}
          >
            <div className="karinga-mobile-nav-icon-wrap">
              <Icono
                nombre={item.icono}
                tamano={20}
                color={esActivo ? '#15803D' : '#64748B'}
              />
              {item.badge > 0 && (
                <span className="karinga-mobile-nav-badge">{item.badge}</span>
              )}
            </div>
            <span className="karinga-mobile-nav-label">{item.etiqueta}</span>
          </button>
        );
      })}
    </nav>
  );
}

