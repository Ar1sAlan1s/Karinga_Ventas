import Icono from './Icono';

export default function Encabezado() {
  return (
    <header className="karinga-header">
      <div className="karinga-header-info">
        <div className="karinga-logo-icono" title="Karinga Resort Ecoturístico">
          <Icono nombre="nature" tamano={28} color="#FFFFFF" />
        </div>
        <div>
          <h1 className="karinga-titulo-h1">Karinga Resort Ecoturístico</h1>
          <p className="karinga-subtitulo">Punto de Venta y Gestión de Reservas</p>
        </div>
      </div>
    </header>
  );
}
