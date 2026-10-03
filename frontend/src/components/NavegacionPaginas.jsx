import Icono from './Icono';

export default function NavegacionPaginas({ paginaActiva, alCambiarPagina, conteoVentas }) {
  const paginas = [
    { id: 'cabanas', etiqueta: 'Hospedaje & Cabañas', icono: 'bed', descripcion: 'Reservas, liquidación y horas extra' },
    { id: 'interacciones', etiqueta: 'Solo Actividades', icono: 'ticket', descripcion: 'Visitas, camping, huerta y anticipos' },
    { id: 'calendario', etiqueta: 'Calendario de Estancia', icono: 'calendar', descripcion: 'Check-in (15:00) y Check-out (12:00)' },
    { id: 'reportes', etiqueta: 'Métricas & Reportes', icono: 'chart', descripcion: `${conteoVentas} registro(s) y desglose de cobro` },
    { id: 'exportacion', etiqueta: 'Centro de Exportación', icono: 'excel', descripcion: 'Descarga de libros Excel (.xlsx)' }
  ];

  return (
    <nav className="karinga-nav-paginas">
      {paginas.map((p) => {
        const esActiva = paginaActiva === p.id;
        return (
          <button
            key={p.id}
            type="button"
            className={`karinga-nav-btn ${esActiva ? 'activo' : ''}`}
            onClick={() => alCambiarPagina(p.id)}
          >
            <span className="karinga-nav-icono">
              <Icono nombre={p.icono} tamano={22} color={esActiva ? '#FDB813' : 'currentColor'} />
            </span>
            <div className="karinga-nav-textos">
              <span className="karinga-nav-titulo">{p.etiqueta}</span>
              <span className="karinga-nav-sub">{p.descripcion}</span>
            </div>
            {esActiva && <span className="karinga-nav-indicador" />}
          </button>
        );
      })}
    </nav>
  );
}
