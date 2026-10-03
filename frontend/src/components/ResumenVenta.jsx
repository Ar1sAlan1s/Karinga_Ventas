import Icono from './Icono';
import { TARIFAS_ACTIVIDADES } from '../constantes/datosIniciales';

export default function ResumenVenta({
  cabana,
  temporada,
  noches,
  huespedesTotales,
  anticipo,
  descuentoEspecial,
  visitasPersonas,
  campingPersonas,
  fresaKilos,
  fresaMedios,
  tirolesaBoletos,
  cabalgata30min,
  cabalgata1hora,
  metodoPago,
  alRegistrar,
  registrando,
  errorValidacion
}) {
  let precioNoche = 0;
  if (cabana) {
    if (temporada === 'fin_semana') {
      precioNoche = Number(cabana.precio_fin_semana);
    } else if (temporada === 'temporada_alta') {
      precioNoche = Number(cabana.precio_temporada_alta);
    } else {
      precioNoche = Number(cabana.precio_entre_semana);
    }
  }

  const numNoches = cabana ? (Number(noches) > 0 ? Number(noches) : 1) : 0;
  const costoCabana = cabana ? precioNoche * numNoches : 0;

  const capacidadBase = cabana ? Number(cabana.capacidad) : 0;
  const totalHuespedes = Number(huespedesTotales) || 0;
  const personasExtra = (cabana && totalHuespedes > capacidadBase) 
    ? totalHuespedes - capacidadBase 
    : 0;
  const costoPersonasExtra = personasExtra * TARIFAS_ACTIVIDADES.COSTO_PERSONA_EXTRA;

  // Visitas y Camping
  const precioCamping = temporada === 'temporada_alta' 
    ? TARIFAS_ACTIVIDADES.CAMPING_ALTA 
    : TARIFAS_ACTIVIDADES.CAMPING_NORMAL;
  const costoVisitas = visitasPersonas * TARIFAS_ACTIVIDADES.VISITA_PERSONA;
  const costoCamping = campingPersonas * precioCamping;

  const subtotalFresa = (fresaKilos * TARIFAS_ACTIVIDADES.FRESA_KILO) + (fresaMedios * TARIFAS_ACTIVIDADES.FRESA_MEDIO);
  const subtotalTirolesa = tirolesaBoletos * TARIFAS_ACTIVIDADES.TIROLESA_BOLETO;
  const subtotalCabalgata = (cabalgata30min * TARIFAS_ACTIVIDADES.CABALGATA_30MIN) + (cabalgata1hora * TARIFAS_ACTIVIDADES.CABALGATA_1HORA);
  const costoActividades = costoVisitas + costoCamping + subtotalFresa + subtotalTirolesa + subtotalCabalgata;

  const subtotal = costoCabana + costoPersonasExtra + costoActividades;
  const totalALiquidar = Math.max(0, subtotal - (Number(anticipo) || 0) - (Number(descuentoEspecial) || 0));

  const hayItems = cabana || costoActividades > 0;

  return (
    <aside className="karinga-resumen-sidebar">
      <div className="karinga-ticket">
        <div className="karinga-ticket-header">
          <Icono nombre="receipt" tamano={22} color="#D1FAE5" />
          <h3 className="karinga-ticket-titulo">Resumen de Venta</h3>
          <small style={{ color: '#D1FAE5' }}>Karinga POS</small>
        </div>

        <div className="karinga-ticket-cuerpo">
          {cabana ? (
            <div>
              <div className="karinga-ticket-linea">
                <span>
                  <strong>{cabana.nombre}</strong> ({numNoches} noche{numNoches > 1 ? 's' : ''})
                </span>
                <span>${costoCabana.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
              </div>
              <small style={{ color: 'var(--gris-medio)', fontSize: '0.78rem' }}>
                ${precioNoche.toLocaleString('es-MX', { minimumFractionDigits: 2 })} x noche
              </small>
            </div>
          ) : (
            <div className="karinga-ticket-linea" style={{ color: 'var(--gris-medio)', fontStyle: 'italic' }}>
              <span>Sin cabaña seleccionada</span>
              <span>$0.00</span>
            </div>
          )}

          {personasExtra > 0 && (
            <div className="karinga-ticket-linea" style={{ color: '#B45309' }}>
              <span>
                <strong>+{personasExtra}</strong> Huésped(es) extra ($250 c/u)
              </span>
              <span>+${costoPersonasExtra.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
            </div>
          )}

          {costoActividades > 0 && (
            <div>
              <div className="karinga-ticket-linea">
                <span><strong>Visitas & Actividades</strong></span>
                <span>+${costoActividades.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
              </div>
              <ul style={{ paddingLeft: '1.2rem', fontSize: '0.78rem', color: 'var(--gris-medio)', marginTop: '0.2rem' }}>
                {visitasPersonas > 0 && <li>Entrada / Visitas ({visitasPersonas} pers.): ${costoVisitas}</li>}
                {campingPersonas > 0 && <li>Camping ({campingPersonas} pers. a ${precioCamping}): ${costoCamping}</li>}
                {fresaKilos > 0 && <li>Fresa ({fresaKilos} kg): ${fresaKilos * TARIFAS_ACTIVIDADES.FRESA_KILO}</li>}
                {fresaMedios > 0 && <li>Fresa 1/2 kg ({fresaMedios}): ${fresaMedios * TARIFAS_ACTIVIDADES.FRESA_MEDIO}</li>}
                {tirolesaBoletos > 0 && <li>Tirolesa ({tirolesaBoletos}): ${tirolesaBoletos * TARIFAS_ACTIVIDADES.TIROLESA_BOLETO}</li>}
                {cabalgata30min > 0 && <li>Cabalgata 30m ({cabalgata30min}): ${cabalgata30min * TARIFAS_ACTIVIDADES.CABALGATA_30MIN}</li>}
                {cabalgata1hora > 0 && <li>Cabalgata 1h ({cabalgata1hora}): ${cabalgata1hora * TARIFAS_ACTIVIDADES.CABALGATA_1HORA}</li>}
              </ul>
            </div>
          )}

          <div className="karinga-ticket-separador" />

          <div className="karinga-ticket-linea">
            <span>Subtotal</span>
            <strong>${subtotal.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</strong>
          </div>

          {anticipo > 0 && (
            <div className="karinga-ticket-linea descuento">
              <span>- Anticipo comprobado</span>
              <span>-${Number(anticipo).toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
            </div>
          )}

          {descuentoEspecial > 0 && (
            <div className="karinga-ticket-linea descuento">
              <span>- Descuento especial</span>
              <span>-${Number(descuentoEspecial).toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
            </div>
          )}

          {cabana && Number(cabana.deposito) > 0 && (
            <div className="karinga-ticket-linea deposito-info">
              <span>Depósito en Garantía:</span>
              <strong>${Number(cabana.deposito).toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN</strong>
            </div>
          )}

          <div className="karinga-ticket-linea" style={{ fontSize: '0.82rem' }}>
            <span style={{ color: 'var(--gris-medio)' }}>Pago:</span>
            <span className="badge-pago">{metodoPago}</span>
          </div>

          <div className="karinga-ticket-total-box">
            <span className="karinga-ticket-total-label">Gran Total a Liquidar</span>
            <div className="karinga-ticket-total-monto">
              ${totalALiquidar.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
            </div>
            <small style={{ color: '#A7F3D0', fontSize: '0.75rem' }}>Moneda Nacional (MXN)</small>
          </div>

          {errorValidacion && (
            <div style={{ color: 'var(--rojo-alerta)', fontSize: '0.82rem', fontWeight: 600, marginTop: '0.5rem', textAlign: 'center' }}>
              {errorValidacion}
            </div>
          )}

          <button
            type="button"
            className="karinga-btn-registrar"
            onClick={alRegistrar}
            disabled={registrando || !hayItems}
          >
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem' }}><Icono nombre={registrando ? 'clock' : 'check'} tamano={18} /><span>{registrando ? 'Registrando...' : 'Registrar Movimiento'}</span></span>
          </button>
        </div>
      </div>
    </aside>
  );
}
