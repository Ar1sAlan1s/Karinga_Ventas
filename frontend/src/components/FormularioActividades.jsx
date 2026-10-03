import Icono from './Icono';
import { TARIFAS_ACTIVIDADES } from '../constantes/datosIniciales';

export default function FormularioActividades({
  temporada,
  visitasPersonas,
  alCambiarVisitasPersonas,
  campingPersonas,
  alCambiarCampingPersonas,
  fresaKilos,
  alCambiarFresaKilos,
  fresaMedios,
  alCambiarFresaMedios,
  tirolesaBoletos,
  alCambiarTirolesaBoletos,
  cabalgata30min,
  alCambiarCabalgata30min,
  cabalgata1hora,
  alCambiarCabalgata1hora
}) {
  const precioCampingUnitario = temporada === 'temporada_alta' 
    ? TARIFAS_ACTIVIDADES.CAMPING_ALTA 
    : TARIFAS_ACTIVIDADES.CAMPING_NORMAL;

  const subtotalVisitas = visitasPersonas * TARIFAS_ACTIVIDADES.VISITA_PERSONA;
  const subtotalCamping = campingPersonas * precioCampingUnitario;
  const subtotalFresa = (fresaKilos * TARIFAS_ACTIVIDADES.FRESA_KILO) + (fresaMedios * TARIFAS_ACTIVIDADES.FRESA_MEDIO);
  const subtotalTirolesa = tirolesaBoletos * TARIFAS_ACTIVIDADES.TIROLESA_BOLETO;
  const subtotalCabalgata = (cabalgata30min * TARIFAS_ACTIVIDADES.CABALGATA_30MIN) + (cabalgata1hora * TARIFAS_ACTIVIDADES.CABALGATA_1HORA);

  const subtotalTotal = subtotalVisitas + subtotalCamping + subtotalFresa + subtotalTirolesa + subtotalCabalgata;

  const actualizarValor = (valorActual, cambio, actualizador) => {
    const nuevo = Math.max(0, valorActual + cambio);
    actualizador(nuevo);
  };

  return (
    <section className="karinga-tarjeta karinga-seccion-bloque">
      <div className="karinga-seccion-header">
        <div className="karinga-seccion-badge">Sección 3</div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', flexWrap: 'wrap', gap: '0.5rem' }}>
          <h2 className="karinga-tarjeta-titulo" style={{ margin: 0, padding: 0, border: 'none' }}>
            <Icono nombre="ticket" tamano={20} color="var(--verde-oscuro)" />
            <span>Visitas, Camping y Actividades Ecoturísticas</span>
          </h2>
          {subtotalTotal > 0 && (
            <span className="badge-subtotal-flotante">
              Total Sección: ${subtotalTotal.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
            </span>
          )}
        </div>
      </div>

      {/* Subsección A: Acceso y Zona de Acampar */}
      <div className="karinga-subseccion-titulo">
        <span style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem" }}><Icono nombre="tent" tamano={18} color="var(--verde-oscuro)" /><span>Acceso General y Zona de Acampar</span></span>
      </div>
      <div className="karinga-actividades-grid" style={{ marginBottom: '1.5rem' }}>
        {/* Visitas */}
        <div className={`karinga-actividad-item ${visitasPersonas > 0 ? 'activa' : ''}`}>
          <div className="karinga-actividad-cabecera">
            <div>
              <span className="karinga-actividad-nombre">Entrada / Visitas</span>
              <small style={{ display: 'block', color: 'var(--gris-medio)', fontSize: '0.75rem' }}>Pase de acceso general</small>
            </div>
            <span className="karinga-actividad-precio">${TARIFAS_ACTIVIDADES.VISITA_PERSONA} c/u</span>
          </div>
          <div className="karinga-control-contador">
            <button
              type="button"
              className="karinga-btn-contador"
              onClick={() => actualizarValor(visitasPersonas, -1, alCambiarVisitasPersonas)}
            >
              -
            </button>
            <input
              type="number"
              min="0"
              className="karinga-input-contador"
              value={visitasPersonas}
              onChange={(e) => alCambiarVisitasPersonas(Math.max(0, parseInt(e.target.value, 10) || 0))}
            />
            <button
              type="button"
              className="karinga-btn-contador"
              onClick={() => actualizarValor(visitasPersonas, 1, alCambiarVisitasPersonas)}
            >
              +
            </button>
          </div>
        </div>

        {/* Camping */}
        <div className={`karinga-actividad-item ${campingPersonas > 0 ? 'activa' : ''}`}>
          <div className="karinga-actividad-cabecera">
            <div>
              <span className="karinga-actividad-nombre">Camping (Por persona)</span>
              <small style={{ display: 'block', color: temporada === 'temporada_alta' ? '#DC2626' : 'var(--gris-medio)', fontSize: '0.75rem', fontWeight: 600 }}>
                {temporada === 'temporada_alta' ? 'Tarifa Temporada Alta' : 'Tarifa Regular'}
              </small>
            </div>
            <span className="karinga-actividad-precio" style={{ background: temporada === 'temporada_alta' ? '#FEE2E2' : '#E8F5E9', color: temporada === 'temporada_alta' ? '#991B1B' : 'var(--verde-medio)' }}>
              ${precioCampingUnitario} c/u
            </span>
          </div>
          <div className="karinga-control-contador">
            <button
              type="button"
              className="karinga-btn-contador"
              onClick={() => actualizarValor(campingPersonas, -1, alCambiarCampingPersonas)}
            >
              -
            </button>
            <input
              type="number"
              min="0"
              className="karinga-input-contador"
              value={campingPersonas}
              onChange={(e) => alCambiarCampingPersonas(Math.max(0, parseInt(e.target.value, 10) || 0))}
            />
            <button
              type="button"
              className="karinga-btn-contador"
              onClick={() => actualizarValor(campingPersonas, 1, alCambiarCampingPersonas)}
            >
              +
            </button>
          </div>
        </div>
      </div>

      {/* Subsección B: Experiencias y Aventura */}
      <div className="karinga-subseccion-titulo">
        <span style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem" }}><Icono nombre="fresa" tamano={18} color="var(--verde-oscuro)" /><span>Huerto de Fresa y Actividades de Aventura</span></span>
      </div>
      <div className="karinga-actividades-grid">
        {/* Fresa 1 Kilo */}
        <div className={`karinga-actividad-item ${fresaKilos > 0 ? 'activa' : ''}`}>
          <div className="karinga-actividad-cabecera">
            <span className="karinga-actividad-nombre">Fresa (1 Kilo)</span>
            <span className="karinga-actividad-precio">${TARIFAS_ACTIVIDADES.FRESA_KILO} c/u</span>
          </div>
          <div className="karinga-control-contador">
            <button
              type="button"
              className="karinga-btn-contador"
              onClick={() => actualizarValor(fresaKilos, -1, alCambiarFresaKilos)}
            >
              -
            </button>
            <input
              type="number"
              min="0"
              className="karinga-input-contador"
              value={fresaKilos}
              onChange={(e) => alCambiarFresaKilos(Math.max(0, parseInt(e.target.value, 10) || 0))}
            />
            <button
              type="button"
              className="karinga-btn-contador"
              onClick={() => actualizarValor(fresaKilos, 1, alCambiarFresaKilos)}
            >
              +
            </button>
          </div>
        </div>

        {/* Fresa 1/2 Kilo */}
        <div className={`karinga-actividad-item ${fresaMedios > 0 ? 'activa' : ''}`}>
          <div className="karinga-actividad-cabecera">
            <span className="karinga-actividad-nombre">Fresa (1/2 Kilo)</span>
            <span className="karinga-actividad-precio">${TARIFAS_ACTIVIDADES.FRESA_MEDIO} c/u</span>
          </div>
          <div className="karinga-control-contador">
            <button
              type="button"
              className="karinga-btn-contador"
              onClick={() => actualizarValor(fresaMedios, -1, alCambiarFresaMedios)}
            >
              -
            </button>
            <input
              type="number"
              min="0"
              className="karinga-input-contador"
              value={fresaMedios}
              onChange={(e) => alCambiarFresaMedios(Math.max(0, parseInt(e.target.value, 10) || 0))}
            />
            <button
              type="button"
              className="karinga-btn-contador"
              onClick={() => actualizarValor(fresaMedios, 1, alCambiarFresaMedios)}
            >
              +
            </button>
          </div>
        </div>

        {/* Tirolesa */}
        <div className={`karinga-actividad-item ${tirolesaBoletos > 0 ? 'activa' : ''}`}>
          <div className="karinga-actividad-cabecera">
            <span className="karinga-actividad-nombre">Tirolesa (Boleto)</span>
            <span className="karinga-actividad-precio">${TARIFAS_ACTIVIDADES.TIROLESA_BOLETO} c/u</span>
          </div>
          <div className="karinga-control-contador">
            <button
              type="button"
              className="karinga-btn-contador"
              onClick={() => actualizarValor(tirolesaBoletos, -1, alCambiarTirolesaBoletos)}
            >
              -
            </button>
            <input
              type="number"
              min="0"
              className="karinga-input-contador"
              value={tirolesaBoletos}
              onChange={(e) => alCambiarTirolesaBoletos(Math.max(0, parseInt(e.target.value, 10) || 0))}
            />
            <button
              type="button"
              className="karinga-btn-contador"
              onClick={() => actualizarValor(tirolesaBoletos, 1, alCambiarTirolesaBoletos)}
            >
              +
            </button>
          </div>
        </div>

        {/* Cabalgata 30 min */}
        <div className={`karinga-actividad-item ${cabalgata30min > 0 ? 'activa' : ''}`}>
          <div className="karinga-actividad-cabecera">
            <span className="karinga-actividad-nombre">Cabalgata (30 min)</span>
            <span className="karinga-actividad-precio">${TARIFAS_ACTIVIDADES.CABALGATA_30MIN} c/u</span>
          </div>
          <div className="karinga-control-contador">
            <button
              type="button"
              className="karinga-btn-contador"
              onClick={() => actualizarValor(cabalgata30min, -1, alCambiarCabalgata30min)}
            >
              -
            </button>
            <input
              type="number"
              min="0"
              className="karinga-input-contador"
              value={cabalgata30min}
              onChange={(e) => alCambiarCabalgata30min(Math.max(0, parseInt(e.target.value, 10) || 0))}
            />
            <button
              type="button"
              className="karinga-btn-contador"
              onClick={() => actualizarValor(cabalgata30min, 1, alCambiarCabalgata30min)}
            >
              +
            </button>
          </div>
        </div>

        {/* Cabalgata 1 hora */}
        <div className={`karinga-actividad-item ${cabalgata1hora > 0 ? 'activa' : ''}`}>
          <div className="karinga-actividad-cabecera">
            <span className="karinga-actividad-nombre">Cabalgata (1 hora)</span>
            <span className="karinga-actividad-precio">${TARIFAS_ACTIVIDADES.CABALGATA_1HORA} c/u</span>
          </div>
          <div className="karinga-control-contador">
            <button
              type="button"
              className="karinga-btn-contador"
              onClick={() => actualizarValor(cabalgata1hora, -1, alCambiarCabalgata1hora)}
            >
              -
            </button>
            <input
              type="number"
              min="0"
              className="karinga-input-contador"
              value={cabalgata1hora}
              onChange={(e) => alCambiarCabalgata1hora(Math.max(0, parseInt(e.target.value, 10) || 0))}
            />
            <button
              type="button"
              className="karinga-btn-contador"
              onClick={() => actualizarValor(cabalgata1hora, 1, alCambiarCabalgata1hora)}
            >
              +
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
