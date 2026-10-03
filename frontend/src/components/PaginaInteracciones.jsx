import { useState } from 'react';
import MetodoPago from './MetodoPago';
import Icono from './Icono';
import { TARIFAS_ACTIVIDADES } from '../constantes/datosIniciales';
import { determinarInfoFecha } from '../utilidades/gestorTemporadas';

export default function PaginaInteracciones({
  alRegistrar,
  registrando,
  fecha,
  alCambiarFecha,
  hora,
  alCambiarHora,
  diasTemporadaAlta = []
}) {
  // Datos del Cliente / Visitante
  const [nombreCliente, setNombreCliente] = useState('');

  // Cantidades de Actividades
  const [visitasPersonas, setVisitasPersonas] = useState(0);
  const [campingPersonas, setCampingPersonas] = useState(0);
  const infoFechaActual = determinarInfoFecha(fecha, diasTemporadaAlta);
  const [forzarTemporadaAltaCamping, setForzarTemporadaAltaCamping] = useState(null);
  const campingTemporadaAlta = forzarTemporadaAltaCamping !== null ? forzarTemporadaAltaCamping : infoFechaActual.esTemporadaAlta;

  const [fresaKilos, setFresaKilos] = useState(0);
  const [fresaMedios, setFresaMedios] = useState(0);
  const [tirolesaBoletos, setTirolesaBoletos] = useState(0);
  const [cabalgata30min, setCabalgata30min] = useState(0);
  const [cabalgata1hora, setCabalgata1hora] = useState(0);

  // Nuevas Actividades y Productos
  const [gotchaPaquetes, setGotchaPaquetes] = useState(0);
  const [interaccionAnimales, setInteraccionAnimales] = useState(0);
  const [mielLitros, setMielLitros] = useState(0);
  const [huevoConos, setHuevoConos] = useState(0);
  const [huevoPiezas, setHuevoPiezas] = useState(0);

  // Paquetes Especiales Karinga
  const [paqueteGranja, setPaqueteGranja] = useState(0);
  const [paqueteVive, setPaqueteVive] = useState(0);
  const [senderismoPersonas, setSenderismoPersonas] = useState(0);

  // Manejo de Anticipo en Actividades
  const [tieneAnticipo, setTieneAnticipo] = useState(false);
  const [montoAnticipo, setMontoAnticipo] = useState(0);
  const [metodoPagoAnticipo, setMetodoPagoAnticipo] = useState('Transferencia BBVA');
  const [comprobanteAnticipo, setComprobanteAnticipo] = useState('');

  // Liquidación / Cobro actual
  const [metodoPago, setMetodoPago] = useState('Efectivo');
  const [errorValidacion, setErrorValidacion] = useState('');

  const precioCampingUnitario = campingTemporadaAlta
    ? TARIFAS_ACTIVIDADES.CAMPING_ALTA
    : TARIFAS_ACTIVIDADES.CAMPING_NORMAL;

  const costoVisitas = visitasPersonas * TARIFAS_ACTIVIDADES.VISITA_PERSONA;
  const costoCamping = campingPersonas * precioCampingUnitario;
  const costoFresa = (fresaKilos * TARIFAS_ACTIVIDADES.FRESA_KILO) + (fresaMedios * TARIFAS_ACTIVIDADES.FRESA_MEDIO);
  const costoTirolesa = tirolesaBoletos * TARIFAS_ACTIVIDADES.TIROLESA_BOLETO;
  const costoCabalgata = (cabalgata30min * TARIFAS_ACTIVIDADES.CABALGATA_30MIN) + (cabalgata1hora * TARIFAS_ACTIVIDADES.CABALGATA_1HORA);

  const costoGotcha = gotchaPaquetes * TARIFAS_ACTIVIDADES.GOTCHA;
  const costoInteraccion = interaccionAnimales * TARIFAS_ACTIVIDADES.INTERACCION_ANIMALES;
  const costoMiel = mielLitros * TARIFAS_ACTIVIDADES.MIEL_LITRO;
  const costoHuevo = (huevoConos * TARIFAS_ACTIVIDADES.HUEVO_CONO) + (huevoPiezas * TARIFAS_ACTIVIDADES.HUEVO_PIEZA);

  const costoPaqueteGranja = paqueteGranja * TARIFAS_ACTIVIDADES.PAQUETE_GRANJA;
  const costoPaqueteVive = paqueteVive * TARIFAS_ACTIVIDADES.PAQUETE_VIVE;
  const senderismoPrecioUnitario = senderismoPersonas >= 6
    ? TARIFAS_ACTIVIDADES.SENDERISMO_MIN_6
    : (senderismoPersonas > 0 ? TARIFAS_ACTIVIDADES.SENDERISMO_HASTA_5 : 0);
  const costoSenderismo = senderismoPersonas * senderismoPrecioUnitario;

  const subtotalActividades =
    costoVisitas +
    costoCamping +
    costoFresa +
    costoTirolesa +
    costoCabalgata +
    costoGotcha +
    costoInteraccion +
    costoMiel +
    costoHuevo +
    costoPaqueteGranja +
    costoPaqueteVive +
    costoSenderismo;

  const anticipoEfectivo = tieneAnticipo ? (Number(montoAnticipo) || 0) : 0;
  const saldoALiquidar = Math.max(0, Math.round((subtotalActividades - anticipoEfectivo) * 100) / 100);

  const actualizarValor = (valorActual, cambio, actualizador) => {
    actualizador(Math.max(0, valorActual + cambio));
  };

  const manejarEnvio = () => {
    setErrorValidacion('');
    if (subtotalActividades <= 0) {
      setErrorValidacion('Debe agregar al menos una entrada, paquete, actividad o producto para registrar.');
      return;
    }

    const partesDesc = [];
    if (paqueteGranja > 0) partesDesc.push(`Paquete Granja (${paqueteGranja})`);
    if (paqueteVive > 0) partesDesc.push(`Paquete Vive Karinga (${paqueteVive})`);
    if (senderismoPersonas > 0) partesDesc.push(`Senderismo (${senderismoPersonas} pers. @ $${senderismoPrecioUnitario})`);
    if (gotchaPaquetes > 0) partesDesc.push(`Gotcha (${gotchaPaquetes})`);
    if (interaccionAnimales > 0) partesDesc.push(`Interacción Animales (${interaccionAnimales})`);
    if (campingPersonas > 0) partesDesc.push(`Camping (${campingPersonas} pers.)`);
    if (visitasPersonas > 0) partesDesc.push(`Entrada Visitas (${visitasPersonas})`);
    if (fresaKilos > 0) partesDesc.push(`Fresa (${fresaKilos} Kg)`);
    if (fresaMedios > 0) partesDesc.push(`Fresa (${fresaMedios} × ½ Kg)`);
    if (mielLitros > 0) partesDesc.push(`Miel (${mielLitros} L)`);
    if (huevoConos > 0) partesDesc.push(`Huevo (${huevoConos} conos)`);
    if (huevoPiezas > 0) partesDesc.push(`Huevo (${huevoPiezas} pz)`);
    if (tirolesaBoletos > 0) partesDesc.push(`Tirolesa (${tirolesaBoletos})`);
    if (cabalgata30min > 0) partesDesc.push(`Cabalgata 30m (${cabalgata30min})`);
    if (cabalgata1hora > 0) partesDesc.push(`Cabalgata 1h (${cabalgata1hora})`);
    const conceptoDescriptivo = partesDesc.length > 0 ? partesDesc.join(', ') : 'Actividades Recreativas';

    const payload = {
      tipo: 'actividades',
      fecha,
      hora,
      temporada: 'N/A',
      cliente_nombre: nombreCliente.trim() || 'Público General',
      nombre_reservacion: nombreCliente.trim() || 'Público General',
      cabana_id: null,
      noches: 0,
      huespedes_totales: 0,
      personas_extra: 0,
      horas_extra: 0,
      anticipo: anticipoEfectivo,
      metodo_pago_anticipo: anticipoEfectivo > 0 ? metodoPagoAnticipo : null,
      comprobante_anticipo: comprobanteAnticipo.trim(),
      estado_pago: 'liquidado',
      monto_liquidado: saldoALiquidar,
      metodo_pago_liquidacion: metodoPago,
      tipo_descuento: 'monto',
      valor_descuento: 0,
      descuento_especial: 0,
      visitas_personas: visitasPersonas,
      camping_personas: campingPersonas,
      camping_temporada_alta: campingTemporadaAlta,
      fresa_kilos: fresaKilos,
      fresa_medios: fresaMedios,
      tirolesa_boletos: tirolesaBoletos,
      cabalgata_30min: cabalgata30min,
      cabalgata_1hora: cabalgata1hora,
      gotcha_paquetes: gotchaPaquetes,
      interaccion_animales: interaccionAnimales,
      miel_litros: mielLitros,
      huevo_conos: huevoConos,
      huevo_piezas: huevoPiezas,
      paquete_granja: paqueteGranja,
      paquete_vive: paqueteVive,
      senderismo_personas: senderismoPersonas,
      metodo_pago: saldoALiquidar > 0 ? metodoPago : (anticipoEfectivo > 0 ? metodoPagoAnticipo : metodoPago),
      concepto: conceptoDescriptivo
    };

    alRegistrar(payload, () => {
      setNombreCliente('');
      setVisitasPersonas(0);
      setCampingPersonas(0);
      setFresaKilos(0);
      setFresaMedios(0);
      setTirolesaBoletos(0);
      setCabalgata30min(0);
      setCabalgata1hora(0);
      setGotchaPaquetes(0);
      setInteraccionAnimales(0);
      setMielLitros(0);
      setHuevoConos(0);
      setHuevoPiezas(0);
      setPaqueteGranja(0);
      setPaqueteVive(0);
      setSenderismoPersonas(0);
      setTieneAnticipo(false);
      setMontoAnticipo(0);
      setComprobanteAnticipo('');
      setMetodoPago('Efectivo');
    });
  };

  return (
    <div className="karinga-pos-grid">
      <main>
        {/* Paso 1: Fecha, Hora y Nombre del Cliente */}
        <section className="karinga-tarjeta karinga-seccion-bloque">
          <div className="karinga-seccion-header">
                        <h2 className="karinga-tarjeta-titulo" style={{ margin: 0, padding: 0, border: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Icono nombre="clock" tamano={20} color="var(--verde-oscuro)" />
              <span>Fecha, Hora y Datos del Cliente</span>
            </h2>
          </div>

          <div className="karinga-fila-campos">
            <div className="karinga-campo" style={{ flex: 1.2 }}>
              <label htmlFor="nombre-cliente-act">
                Nombre del Cliente o Grupo (Opcional)
              </label>
              <input
                id="nombre-cliente-act"
                type="text"
                className="karinga-input"
                placeholder="Ej. Familia Morales / Carlos Ruiz (Público General)"
                value={nombreCliente}
                onChange={(e) => setNombreCliente(e.target.value)}
              />
            </div>

            <div className="karinga-campo">
              <label htmlFor="fecha-registro-act">Fecha de Venta</label>
              <input
                id="fecha-registro-act"
                type="date"
                className="karinga-input"
                value={fecha}
                onChange={(e) => alCambiarFecha(e.target.value)}
                required
              />
              {infoFechaActual.diaNombre && (
                <div style={{ marginTop: '0.35rem' }}>
                  <span className={"karinga-temporada-info-badge " + infoFechaActual.temporadaSugerida}>
                    <Icono nombre={infoFechaActual.esTemporadaAlta ? 'star' : 'calendar'} tamano={13} color="currentColor" />
                    <span>{infoFechaActual.diaNombre} • {infoFechaActual.esTemporadaAlta ? 'Temporada Alta' : (infoFechaActual.esFinSemana ? 'Fin de semana' : 'Entre semana')}</span>
                  </span>
                </div>
              )}
            </div>

            <div className="karinga-campo">
              <label htmlFor="hora-registro-act">Hora de Venta</label>
              <input
                id="hora-registro-act"
                type="time"
                className="karinga-input"
                value={hora}
                onChange={(e) => alCambiarHora(e.target.value)}
                required
              />
            </div>
          </div>
        </section>

        {/* Paso 2: Catálogo de Actividades */}
        <section className="karinga-tarjeta karinga-seccion-bloque">
          <div className="karinga-seccion-header">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', flexWrap: 'wrap' }}>
              <h2 className="karinga-tarjeta-titulo" style={{ margin: 0, padding: 0, border: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Icono nombre="ticket" tamano={20} color="var(--verde-oscuro)" />
                <span>Venta de Actividades & Entradas</span>
              </h2>
              {subtotalActividades > 0 && (
                <span className="badge-subtotal-flotante">
                  Subtotal: ${subtotalActividades.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                </span>
              )}
            </div>
          </div>

          {/* 1. PAQUETES ESPECIALES KARINGA */}
          <div className="karinga-subseccion-titulo" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.25rem' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', color: '#1B4D3E', fontWeight: 800 }}>
              <Icono nombre="package" tamano={18} color="#1B4D3E" />
              <span>Paquetes Especiales Karinga</span>
            </span>
            <span style={{ fontSize: '0.73rem', background: '#D1FAE5', color: '#065F46', padding: '0.15rem 0.5rem', borderRadius: '4px', fontWeight: 700 }}>
              Experiencias Completas
            </span>
          </div>

          <div className="karinga-actividades-grid" style={{ marginBottom: '1.5rem' }}>
            {/* Paquete Granja Karinga */}
            <div className={`karinga-actividad-item ${paqueteGranja > 0 ? 'activa' : ''}`} style={{ borderTop: '3px solid #16A34A' }}>
              <div className="karinga-actividad-cabecera">
                <div>
                  <span className="karinga-actividad-nombre" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Icono nombre="paw" tamano={16} color="#16A34A" />
                    <span>Granja Karinga</span>
                  </span>
                  <small style={{ display: 'block', color: 'var(--gris-medio)', fontSize: '0.74rem' }}>
                    Cabalgata 30 min (caballo o pony) + Conoce y alimenta animalitos
                  </small>
                </div>
                <span className="karinga-actividad-precio" style={{ background: '#DCFCE7', color: '#166534', fontWeight: 800 }}>
                  ${TARIFAS_ACTIVIDADES.PAQUETE_GRANJA} c/u
                </span>
              </div>
              <div className="karinga-control-contador">
                <button type="button" className="karinga-btn-contador" onClick={() => actualizarValor(paqueteGranja, -1, setPaqueteGranja)}>-</button>
                <input
                  type="number"
                  min="0"
                  className="karinga-input-contador"
                  value={paqueteGranja}
                  onChange={(e) => setPaqueteGranja(Math.max(0, parseInt(e.target.value, 10) || 0))}
                />
                <button type="button" className="karinga-btn-contador" onClick={() => actualizarValor(paqueteGranja, 1, setPaqueteGranja)}>+</button>
              </div>
            </div>

            {/* Paquete Vive Karinga */}
            <div className={`karinga-actividad-item ${paqueteVive > 0 ? 'activa' : ''}`} style={{ borderTop: '3px solid #0284C7' }}>
              <div className="karinga-actividad-cabecera">
                <div>
                  <span className="karinga-actividad-nombre" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Icono nombre="sparkles" tamano={16} color="#0284C7" />
                    <span>Vive Karinga</span>
                  </span>
                  <small style={{ display: 'block', color: 'var(--gris-medio)', fontSize: '0.74rem' }}>
                    Cabalgata 30 min + Tirolesa (2 vueltas) + Invernadero (1/2 kg fresa)
                  </small>
                </div>
                <span className="karinga-actividad-precio" style={{ background: '#E0F2FE', color: '#0369A1', fontWeight: 800 }}>
                  ${TARIFAS_ACTIVIDADES.PAQUETE_VIVE} c/u
                </span>
              </div>
              <div className="karinga-control-contador">
                <button type="button" className="karinga-btn-contador" onClick={() => actualizarValor(paqueteVive, -1, setPaqueteVive)}>-</button>
                <input
                  type="number"
                  min="0"
                  className="karinga-input-contador"
                  value={paqueteVive}
                  onChange={(e) => setPaqueteVive(Math.max(0, parseInt(e.target.value, 10) || 0))}
                />
                <button type="button" className="karinga-btn-contador" onClick={() => actualizarValor(paqueteVive, 1, setPaqueteVive)}>+</button>
              </div>
            </div>

            {/* Senderismo Guiado con Tarifa Dinámica */}
            <div className={`karinga-actividad-item ${senderismoPersonas > 0 ? 'activa' : ''}`} style={{ borderTop: '3px solid #D97706' }}>
              <div className="karinga-actividad-cabecera">
                <div>
                  <span className="karinga-actividad-nombre" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Icono nombre="hiking" tamano={16} color="#D97706" />
                    <span>Senderismo Guiado</span>
                  </span>
                  <small style={{ display: 'block', color: 'var(--gris-medio)', fontSize: '0.74rem' }}>
                    Mirador Piedra de la Campana • 4.4 km • 1h 30m
                  </small>
                  <div style={{ marginTop: '0.25rem' }}>
                    <span style={{
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      padding: '0.12rem 0.4rem',
                      borderRadius: '4px',
                      background: senderismoPersonas >= 6 ? '#D1FAE5' : (senderismoPersonas > 0 ? '#FEF3C7' : '#F1F5F9'),
                      color: senderismoPersonas >= 6 ? '#065F46' : (senderismoPersonas > 0 ? '#92400E' : '#64748B')
                    }}>
                      {senderismoPersonas >= 6
                        ? 'Tarifa 6+ pers: $70 c/u'
                        : (senderismoPersonas > 0 ? 'Tarifa 1-5 pers: $100 c/u' : '≥6 pers: $70 c/u | ≤5 pers: $100 c/u')}
                    </span>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span className="karinga-actividad-precio" style={{ background: '#FEF3C7', color: '#B45309', fontWeight: 800 }}>
                    ${senderismoPrecioUnitario > 0 ? senderismoPrecioUnitario : TARIFAS_ACTIVIDADES.SENDERISMO_MIN_6} c/u
                  </span>
                  {senderismoPersonas > 0 && (
                    <small style={{ display: 'block', fontSize: '0.72rem', color: '#64748B', marginTop: '0.15rem' }}>
                      Total: ${costoSenderismo.toLocaleString('es-MX')}
                    </small>
                  )}
                </div>
              </div>
              <div className="karinga-control-contador">
                <button type="button" className="karinga-btn-contador" onClick={() => actualizarValor(senderismoPersonas, -1, setSenderismoPersonas)}>-</button>
                <input
                  type="number"
                  min="0"
                  className="karinga-input-contador"
                  value={senderismoPersonas}
                  onChange={(e) => setSenderismoPersonas(Math.max(0, parseInt(e.target.value, 10) || 0))}
                />
                <button type="button" className="karinga-btn-contador" onClick={() => actualizarValor(senderismoPersonas, 1, setSenderismoPersonas)}>+</button>
              </div>
            </div>
          </div>

          {/* 2. ENTRADAS Y ZONA DE CAMPING */}
          <div className="karinga-subseccion-titulo">
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Icono nombre="tent" tamano={18} color="var(--verde-oscuro)" />
              <span>Entradas y Zona de Camping</span>
            </span>
          </div>

          <div className="karinga-actividades-grid" style={{ marginBottom: '1.5rem' }}>
            <div className={`karinga-actividad-item ${visitasPersonas > 0 ? 'activa' : ''}`}>
              <div className="karinga-actividad-cabecera">
                <div>
                  <span className="karinga-actividad-nombre" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Icono nombre="ticket" tamano={16} color="var(--verde-oscuro)" />
                    <span>Entrada / Visitas</span>
                  </span>
                  <small style={{ display: 'block', color: 'var(--gris-medio)', fontSize: '0.75rem' }}>Pase de acceso general</small>
                </div>
                <span className="karinga-actividad-precio">${TARIFAS_ACTIVIDADES.VISITA_PERSONA} c/u</span>
              </div>
              <div className="karinga-control-contador">
                <button type="button" className="karinga-btn-contador" onClick={() => actualizarValor(visitasPersonas, -1, setVisitasPersonas)}>-</button>
                <input
                  type="number"
                  min="0"
                  className="karinga-input-contador"
                  value={visitasPersonas}
                  onChange={(e) => setVisitasPersonas(Math.max(0, parseInt(e.target.value, 10) || 0))}
                />
                <button type="button" className="karinga-btn-contador" onClick={() => actualizarValor(visitasPersonas, 1, setVisitasPersonas)}>+</button>
              </div>
            </div>

            <div className={`karinga-actividad-item ${campingPersonas > 0 ? 'activa' : ''}`}>
              <div className="karinga-actividad-cabecera">
                <div>
                  <span className="karinga-actividad-nombre" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Icono nombre="tent" tamano={16} color="var(--verde-oscuro)" />
                    <span>Camping (Por persona)</span>
                  </span>
                  <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.2rem' }}>
                    <button
                      type="button"
                      style={{
                        padding: '0.15rem 0.4rem',
                        fontSize: '0.7rem',
                        borderRadius: '4px',
                        border: '1px solid #CBD5E1',
                        background: !campingTemporadaAlta ? '#0A2540' : '#F1F5F9',
                        color: !campingTemporadaAlta ? '#FFF' : '#475569',
                        cursor: 'pointer'
                      }}
                      onClick={() => setForzarTemporadaAltaCamping(false)}
                    >
                      Normal ($140)
                    </button>
                    <button
                      type="button"
                      style={{
                        padding: '0.15rem 0.4rem',
                        fontSize: '0.7rem',
                        borderRadius: '4px',
                        border: '1px solid #CBD5E1',
                        background: campingTemporadaAlta ? '#DC2626' : '#F1F5F9',
                        color: campingTemporadaAlta ? '#FFF' : '#475569',
                        cursor: 'pointer'
                      }}
                      onClick={() => setForzarTemporadaAltaCamping(true)}
                    >
                      Alta ($160)
                    </button>
                  </div>
                </div>
                <span className="karinga-actividad-precio" style={{ background: campingTemporadaAlta ? '#FEE2E2' : '#E8F5E9', color: campingTemporadaAlta ? '#991B1B' : 'var(--verde-medio)' }}>
                  ${precioCampingUnitario} c/u
                </span>
              </div>
              <div className="karinga-control-contador">
                <button type="button" className="karinga-btn-contador" onClick={() => actualizarValor(campingPersonas, -1, setCampingPersonas)}>-</button>
                <input
                  type="number"
                  min="0"
                  className="karinga-input-contador"
                  value={campingPersonas}
                  onChange={(e) => setCampingPersonas(Math.max(0, parseInt(e.target.value, 10) || 0))}
                />
                <button type="button" className="karinga-btn-contador" onClick={() => actualizarValor(campingPersonas, 1, setCampingPersonas)}>+</button>
              </div>
            </div>
          </div>

          {/* 3. ACTIVIDADES DE AVENTURA */}
          <div className="karinga-subseccion-titulo">
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Icono nombre="aventura" tamano={18} color="#0284C7" />
              <span>Actividades de Aventura y Recreación</span>
            </span>
          </div>

          <div className="karinga-actividades-grid" style={{ marginBottom: '1.5rem' }}>
            <div className={`karinga-actividad-item ${tirolesaBoletos > 0 ? 'activa' : ''}`}>
              <div className="karinga-actividad-cabecera">
                <div>
                  <span className="karinga-actividad-nombre" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Icono nombre="tirolesa" tamano={16} color="#0284C7" />
                    <span>Tirolesa</span>
                  </span>
                  <small style={{ display: 'block', color: 'var(--gris-medio)', fontSize: '0.74rem' }}>2 vueltas por persona</small>
                </div>
                <span className="karinga-actividad-precio">${TARIFAS_ACTIVIDADES.TIROLESA_BOLETO} c/u</span>
              </div>
              <div className="karinga-control-contador">
                <button type="button" className="karinga-btn-contador" onClick={() => actualizarValor(tirolesaBoletos, -1, setTirolesaBoletos)}>-</button>
                <input type="number" min="0" className="karinga-input-contador" value={tirolesaBoletos} onChange={(e) => setTirolesaBoletos(Math.max(0, parseInt(e.target.value, 10) || 0))} />
                <button type="button" className="karinga-btn-contador" onClick={() => actualizarValor(tirolesaBoletos, 1, setTirolesaBoletos)}>+</button>
              </div>
            </div>

            <div className={`karinga-actividad-item ${cabalgata30min > 0 ? 'activa' : ''}`}>
              <div className="karinga-actividad-cabecera">
                <div>
                  <span className="karinga-actividad-nombre" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Icono nombre="horse" tamano={16} color="#D97706" />
                    <span>Cabalgata (30 min)</span>
                  </span>
                  <small style={{ display: 'block', color: 'var(--gris-medio)', fontSize: '0.74rem' }}>Caballo o pony</small>
                </div>
                <span className="karinga-actividad-precio">${TARIFAS_ACTIVIDADES.CABALGATA_30MIN} c/u</span>
              </div>
              <div className="karinga-control-contador">
                <button type="button" className="karinga-btn-contador" onClick={() => actualizarValor(cabalgata30min, -1, setCabalgata30min)}>-</button>
                <input type="number" min="0" className="karinga-input-contador" value={cabalgata30min} onChange={(e) => setCabalgata30min(Math.max(0, parseInt(e.target.value, 10) || 0))} />
                <button type="button" className="karinga-btn-contador" onClick={() => actualizarValor(cabalgata30min, 1, setCabalgata30min)}>+</button>
              </div>
            </div>

            <div className={`karinga-actividad-item ${cabalgata1hora > 0 ? 'activa' : ''}`}>
              <div className="karinga-actividad-cabecera">
                <div>
                  <span className="karinga-actividad-nombre" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Icono nombre="horse" tamano={16} color="#D97706" />
                    <span>Cabalgata (1 hora)</span>
                  </span>
                  <small style={{ display: 'block', color: 'var(--gris-medio)', fontSize: '0.74rem' }}>Recorrido guiado completo</small>
                </div>
                <span className="karinga-actividad-precio">${TARIFAS_ACTIVIDADES.CABALGATA_1HORA} c/u</span>
              </div>
              <div className="karinga-control-contador">
                <button type="button" className="karinga-btn-contador" onClick={() => actualizarValor(cabalgata1hora, -1, setCabalgata1hora)}>-</button>
                <input type="number" min="0" className="karinga-input-contador" value={cabalgata1hora} onChange={(e) => setCabalgata1hora(Math.max(0, parseInt(e.target.value, 10) || 0))} />
                <button type="button" className="karinga-btn-contador" onClick={() => actualizarValor(cabalgata1hora, 1, setCabalgata1hora)}>+</button>
              </div>
            </div>

            {/* Gotcha */}
            <div className={`karinga-actividad-item ${gotchaPaquetes > 0 ? 'activa' : ''}`}>
              <div className="karinga-actividad-cabecera">
                <div>
                  <span className="karinga-actividad-nombre" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Icono nombre="target" tamano={16} color="#DC2626" />
                    <span>Gotcha Karinga</span>
                  </span>
                  <small style={{ display: 'block', color: 'var(--gris-medio)', fontSize: '0.74rem' }}>
                    10 equipos completos y 2,000 balas
                  </small>
                </div>
                <span className="karinga-actividad-precio">${TARIFAS_ACTIVIDADES.GOTCHA.toLocaleString('es-MX')}</span>
              </div>
              <div className="karinga-control-contador">
                <button type="button" className="karinga-btn-contador" onClick={() => actualizarValor(gotchaPaquetes, -1, setGotchaPaquetes)}>-</button>
                <input type="number" min="0" className="karinga-input-contador" value={gotchaPaquetes} onChange={(e) => setGotchaPaquetes(Math.max(0, parseInt(e.target.value, 10) || 0))} />
                <button type="button" className="karinga-btn-contador" onClick={() => actualizarValor(gotchaPaquetes, 1, setGotchaPaquetes)}>+</button>
              </div>
            </div>

            {/* Interacción con Animales */}
            <div className={`karinga-actividad-item ${interaccionAnimales > 0 ? 'activa' : ''}`}>
              <div className="karinga-actividad-cabecera">
                <div>
                  <span className="karinga-actividad-nombre" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Icono nombre="paw" tamano={16} color="#059669" />
                    <span>Interacción Animales</span>
                  </span>
                  <small style={{ display: 'block', color: 'var(--gris-medio)', fontSize: '0.74rem' }}>
                    Alimentar animales, venado, cerdito, conejos
                  </small>
                </div>
                <span className="karinga-actividad-precio">${TARIFAS_ACTIVIDADES.INTERACCION_ANIMALES} c/u</span>
              </div>
              <div className="karinga-control-contador">
                <button type="button" className="karinga-btn-contador" onClick={() => actualizarValor(interaccionAnimales, -1, setInteraccionAnimales)}>-</button>
                <input type="number" min="0" className="karinga-input-contador" value={interaccionAnimales} onChange={(e) => setInteraccionAnimales(Math.max(0, parseInt(e.target.value, 10) || 0))} />
                <button type="button" className="karinga-btn-contador" onClick={() => actualizarValor(interaccionAnimales, 1, setInteraccionAnimales)}>+</button>
              </div>
            </div>
          </div>

          {/* 4. PRODUCTOS DE RANCHO Y COSECHA */}
          <div className="karinga-subseccion-titulo">
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Icono nombre="nature" tamano={18} color="#059669" />
              <span>Productos de Rancho y Huerto Orgánico</span>
            </span>
          </div>

          <div className="karinga-actividades-grid">
            <div className={`karinga-actividad-item ${fresaKilos > 0 ? 'activa' : ''}`}>
              <div className="karinga-actividad-cabecera">
                <div>
                  <span className="karinga-actividad-nombre" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Icono nombre="fresa" tamano={16} color="#E11D48" />
                    <span>Fresa Orgánica (1 Kg)</span>
                  </span>
                  <small style={{ display: 'block', color: 'var(--gris-medio)', fontSize: '0.74rem' }}>Sujeto a disponibilidad</small>
                </div>
                <span className="karinga-actividad-precio">${TARIFAS_ACTIVIDADES.FRESA_KILO} c/u</span>
              </div>
              <div className="karinga-control-contador">
                <button type="button" className="karinga-btn-contador" onClick={() => actualizarValor(fresaKilos, -1, setFresaKilos)}>-</button>
                <input type="number" min="0" className="karinga-input-contador" value={fresaKilos} onChange={(e) => setFresaKilos(Math.max(0, parseInt(e.target.value, 10) || 0))} />
                <button type="button" className="karinga-btn-contador" onClick={() => actualizarValor(fresaKilos, 1, setFresaKilos)}>+</button>
              </div>
            </div>

            <div className={`karinga-actividad-item ${fresaMedios > 0 ? 'activa' : ''}`}>
              <div className="karinga-actividad-cabecera">
                <div>
                  <span className="karinga-actividad-nombre" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Icono nombre="fresa" tamano={16} color="#E11D48" />
                    <span>Fresa Orgánica (1/2 Kg)</span>
                  </span>
                  <small style={{ display: 'block', color: 'var(--gris-medio)', fontSize: '0.74rem' }}>Domos de ½ Kilo</small>
                </div>
                <span className="karinga-actividad-precio">${TARIFAS_ACTIVIDADES.FRESA_MEDIO} c/u</span>
              </div>
              <div className="karinga-control-contador">
                <button type="button" className="karinga-btn-contador" onClick={() => actualizarValor(fresaMedios, -1, setFresaMedios)}>-</button>
                <input type="number" min="0" className="karinga-input-contador" value={fresaMedios} onChange={(e) => setFresaMedios(Math.max(0, parseInt(e.target.value, 10) || 0))} />
                <button type="button" className="karinga-btn-contador" onClick={() => actualizarValor(fresaMedios, 1, setFresaMedios)}>+</button>
              </div>
            </div>

            {/* Miel Natural */}
            <div className={`karinga-actividad-item ${mielLitros > 0 ? 'activa' : ''}`}>
              <div className="karinga-actividad-cabecera">
                <div>
                  <span className="karinga-actividad-nombre" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Icono nombre="honey" tamano={16} color="#D97706" />
                    <span>Miel Natural (1 Litro)</span>
                  </span>
                  <small style={{ display: 'block', color: 'var(--gris-medio)', fontSize: '0.74rem' }}>Frascos envasados de 1L</small>
                </div>
                <span className="karinga-actividad-precio">${TARIFAS_ACTIVIDADES.MIEL_LITRO} c/u</span>
              </div>
              <div className="karinga-control-contador">
                <button type="button" className="karinga-btn-contador" onClick={() => actualizarValor(mielLitros, -1, setMielLitros)}>-</button>
                <input type="number" min="0" className="karinga-input-contador" value={mielLitros} onChange={(e) => setMielLitros(Math.max(0, parseInt(e.target.value, 10) || 0))} />
                <button type="button" className="karinga-btn-contador" onClick={() => actualizarValor(mielLitros, 1, setMielLitros)}>+</button>
              </div>
            </div>

            {/* Huevo de Rancho Cono */}
            <div className={`karinga-actividad-item ${huevoConos > 0 ? 'activa' : ''}`}>
              <div className="karinga-actividad-cabecera">
                <div>
                  <span className="karinga-actividad-nombre" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Icono nombre="egg" tamano={16} color="#B45309" />
                    <span>Huevo de Rancho (Cono)</span>
                  </span>
                  <small style={{ display: 'block', color: 'var(--gris-medio)', fontSize: '0.74rem' }}>Cono completo de 30 piezas</small>
                </div>
                <span className="karinga-actividad-precio">${TARIFAS_ACTIVIDADES.HUEVO_CONO} c/u</span>
              </div>
              <div className="karinga-control-contador">
                <button type="button" className="karinga-btn-contador" onClick={() => actualizarValor(huevoConos, -1, setHuevoConos)}>-</button>
                <input type="number" min="0" className="karinga-input-contador" value={huevoConos} onChange={(e) => setHuevoConos(Math.max(0, parseInt(e.target.value, 10) || 0))} />
                <button type="button" className="karinga-btn-contador" onClick={() => actualizarValor(huevoConos, 1, setHuevoConos)}>+</button>
              </div>
            </div>

            {/* Huevo de Rancho Pieza */}
            <div className={`karinga-actividad-item ${huevoPiezas > 0 ? 'activa' : ''}`}>
              <div className="karinga-actividad-cabecera">
                <div>
                  <span className="karinga-actividad-nombre" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Icono nombre="egg" tamano={16} color="#B45309" />
                    <span>Huevo de Rancho (Pieza)</span>
                  </span>
                  <small style={{ display: 'block', color: 'var(--gris-medio)', fontSize: '0.74rem' }}>Pieza suelta fresca</small>
                </div>
                <span className="karinga-actividad-precio">${TARIFAS_ACTIVIDADES.HUEVO_PIEZA} c/u</span>
              </div>
              <div className="karinga-control-contador">
                <button type="button" className="karinga-btn-contador" onClick={() => actualizarValor(huevoPiezas, -1, setHuevoPiezas)}>-</button>
                <input type="number" min="0" className="karinga-input-contador" value={huevoPiezas} onChange={(e) => setHuevoPiezas(Math.max(0, parseInt(e.target.value, 10) || 0))} />
                <button type="button" className="karinga-btn-contador" onClick={() => actualizarValor(huevoPiezas, 1, setHuevoPiezas)}>+</button>
              </div>
            </div>
          </div>
        </section>

        {/* Paso 3: Anticipos en Actividades (Opcional) */}
        <section className="karinga-tarjeta karinga-seccion-bloque">
          <div className="karinga-seccion-header">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', flexWrap: 'wrap', gap: '0.5rem' }}>
              <h2 className="karinga-tarjeta-titulo" style={{ margin: 0, padding: 0, border: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Icono nombre="arrow-down-line" tamano={20} color="var(--verde-oscuro)" />
                <span>Anticipo o Pago Previo de Actividades</span>
              </h2>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', margin: 0, fontWeight: 700, fontSize: '0.88rem', color: '#1E40AF' }}>
                <input
                  type="checkbox"
                  checked={tieneAnticipo}
                  onChange={(e) => {
                    setTieneAnticipo(e.target.checked);
                    if (!e.target.checked) setMontoAnticipo(0);
                  }}
                />
                <span>¿El cliente dio un anticipo previo?</span>
              </label>
            </div>
          </div>

          {tieneAnticipo && (
            <div style={{ background: '#EFF6FF', border: '1.5px solid #BFDBFE', padding: '1.1rem', borderRadius: '10px' }}>
              <div className="karinga-fila-campos">
                <div className="karinga-campo">
                  <label htmlFor="act-ant-monto">Monto de Anticipo ($ MXN) <span className="requerido">*</span></label>
                  <input
                    id="act-ant-monto"
                    type="number"
                    min="0"
                    step="0.01"
                    className="karinga-input"
                    placeholder="0.00"
                    value={montoAnticipo === 0 ? '' : montoAnticipo}
                    onChange={(e) => setMontoAnticipo(Math.max(0, parseFloat(e.target.value) || 0))}
                  />
                </div>

                <div className="karinga-campo">
                  <label htmlFor="act-ant-metodo">Método de Pago del Anticipo</label>
                  <select
                    id="act-ant-metodo"
                    className="karinga-select"
                    value={metodoPagoAnticipo}
                    onChange={(e) => setMetodoPagoAnticipo(e.target.value)}
                  >
                    <option value="Transferencia BBVA">Transferencia BBVA</option>
                    <option value="Transferencia Bajío">Transferencia Bajío</option>
                    <option value="Tarjeta Zettle">Tarjeta Zettle</option>
                    <option value="Web">Web</option>
                    <option value="Efectivo">Efectivo</option>
                    <option value="Airbnb">Airbnb</option>
                  </select>
                </div>

                <div className="karinga-campo">
                  <label htmlFor="act-ant-comp">Folio o Comprobante de Referencia</label>
                  <input
                    id="act-ant-comp"
                    type="text"
                    className="karinga-input"
                    placeholder="Ej. Transferencia BBVA #4102"
                    value={comprobanteAnticipo}
                    onChange={(e) => setComprobanteAnticipo(e.target.value)}
                  />
                </div>
              </div>

              {anticipoEfectivo > 0 && (
                <div style={{ marginTop: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#FFFFFF', padding: '0.65rem 1rem', borderRadius: '8px', border: '1px solid #93C5FD', fontSize: '0.88rem' }}>
                  <span>Saldo Restante a Liquidar:</span>
                  <strong style={{ color: '#15803D', fontSize: '1.15rem' }}>
                    ${saldoALiquidar.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN
                  </strong>
                </div>
              )}
            </div>
          )}
        </section>

        {/* Paso 4: Método de Pago para Liquidación */}
        <MetodoPago metodoSeleccionado={metodoPago} alCambiarMetodo={setMetodoPago} />
      </main>

      {/* Ticket Lateral de Cobro */}
      <aside className="karinga-resumen-sidebar">
        <div className="karinga-ticket">
          <div className="karinga-ticket-header">
            <Icono nombre="ticket" tamano={24} color="#D1FAE5" />
            <h3 className="karinga-ticket-titulo">Cobro de Actividades</h3>
            <small style={{ color: '#D1FAE5' }}>{nombreCliente.trim() ? nombreCliente.trim() : 'Venta Directa en Taquilla'}</small>
          </div>

          <div className="karinga-ticket-cuerpo">
            {subtotalActividades > 0 ? (
              <>
                {nombreCliente.trim() && (
                  <div className="karinga-ticket-linea">
                    <span>Cliente:</span>
                    <strong>{nombreCliente.trim()}</strong>
                  </div>
                )}
                {paqueteGranja > 0 && (
                  <div className="karinga-ticket-linea">
                    <span>Paquete Granja ({paqueteGranja})</span>
                    <strong>${costoPaqueteGranja.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</strong>
                  </div>
                )}
                {paqueteVive > 0 && (
                  <div className="karinga-ticket-linea">
                    <span>Paquete Vive ({paqueteVive})</span>
                    <strong>${costoPaqueteVive.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</strong>
                  </div>
                )}
                {senderismoPersonas > 0 && (
                  <div className="karinga-ticket-linea">
                    <span>Senderismo ({senderismoPersonas} pers. @ ${senderismoPrecioUnitario})</span>
                    <strong>${costoSenderismo.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</strong>
                  </div>
                )}
                {visitasPersonas > 0 && (
                  <div className="karinga-ticket-linea">
                    <span>Entradas ({visitasPersonas})</span>
                    <strong>${costoVisitas.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</strong>
                  </div>
                )}
                {campingPersonas > 0 && (
                  <div className="karinga-ticket-linea">
                    <span>Camping ({campingPersonas} pers.)</span>
                    <strong>${costoCamping.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</strong>
                  </div>
                )}
                {tirolesaBoletos > 0 && (
                  <div className="karinga-ticket-linea">
                    <span>Tirolesa ({tirolesaBoletos})</span>
                    <strong>${costoTirolesa.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</strong>
                  </div>
                )}
                {cabalgata30min > 0 && (
                  <div className="karinga-ticket-linea">
                    <span>Cabalgata 30m ({cabalgata30min})</span>
                    <strong>${(cabalgata30min * TARIFAS_ACTIVIDADES.CABALGATA_30MIN).toLocaleString('es-MX', { minimumFractionDigits: 2 })}</strong>
                  </div>
                )}
                {cabalgata1hora > 0 && (
                  <div className="karinga-ticket-linea">
                    <span>Cabalgata 1h ({cabalgata1hora})</span>
                    <strong>${(cabalgata1hora * TARIFAS_ACTIVIDADES.CABALGATA_1HORA).toLocaleString('es-MX', { minimumFractionDigits: 2 })}</strong>
                  </div>
                )}
                {gotchaPaquetes > 0 && (
                  <div className="karinga-ticket-linea">
                    <span>Gotcha ({gotchaPaquetes})</span>
                    <strong>${costoGotcha.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</strong>
                  </div>
                )}
                {interaccionAnimales > 0 && (
                  <div className="karinga-ticket-linea">
                    <span>Interacción Animales ({interaccionAnimales})</span>
                    <strong>${costoInteraccion.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</strong>
                  </div>
                )}
                {fresaKilos > 0 && (
                  <div className="karinga-ticket-linea">
                    <span>Fresa ({fresaKilos} Kg)</span>
                    <strong>${(fresaKilos * TARIFAS_ACTIVIDADES.FRESA_KILO).toLocaleString('es-MX', { minimumFractionDigits: 2 })}</strong>
                  </div>
                )}
                {fresaMedios > 0 && (
                  <div className="karinga-ticket-linea">
                    <span>Fresa ({fresaMedios} de 1/2 Kg)</span>
                    <strong>${(fresaMedios * TARIFAS_ACTIVIDADES.FRESA_MEDIO).toLocaleString('es-MX', { minimumFractionDigits: 2 })}</strong>
                  </div>
                )}
                {mielLitros > 0 && (
                  <div className="karinga-ticket-linea">
                    <span>Miel Natural ({mielLitros} L)</span>
                    <strong>${costoMiel.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</strong>
                  </div>
                )}
                {huevoConos > 0 && (
                  <div className="karinga-ticket-linea">
                    <span>Huevo ({huevoConos} conos)</span>
                    <strong>${(huevoConos * TARIFAS_ACTIVIDADES.HUEVO_CONO).toLocaleString('es-MX', { minimumFractionDigits: 2 })}</strong>
                  </div>
                )}
                {huevoPiezas > 0 && (
                  <div className="karinga-ticket-linea">
                    <span>Huevo ({huevoPiezas} pz)</span>
                    <strong>${(huevoPiezas * TARIFAS_ACTIVIDADES.HUEVO_PIEZA).toLocaleString('es-MX', { minimumFractionDigits: 2 })}</strong>
                  </div>
                )}

                <div className="karinga-ticket-separador" />

                <div className="karinga-ticket-linea">
                  <span>Subtotal Actividades</span>
                  <strong>${subtotalActividades.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</strong>
                </div>

                {anticipoEfectivo > 0 && (
                  <div className="karinga-ticket-linea" style={{ color: '#0369A1' }}>
                    <span>Anticipo Registrado ({metodoPagoAnticipo})</span>
                    <strong>-${anticipoEfectivo.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</strong>
                  </div>
                )}

                <div className="karinga-ticket-total-box">
                  <span className="karinga-ticket-total-label">
                    {anticipoEfectivo > 0 ? 'Saldo a Liquidar' : 'Gran Total a Cobrar'}
                  </span>
                  <div className="karinga-ticket-total-monto">
                    ${saldoALiquidar.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                  </div>
                  <small style={{ color: '#D1FAE5', fontSize: '0.75rem' }}>
                    {saldoALiquidar > 0 ? `Liquidación vía ${metodoPago}` : 'Liquidado con anticipo'}
                  </small>
                </div>

                {errorValidacion && (
                  <div style={{ color: 'var(--rojo-alerta)', fontSize: '0.85rem', fontWeight: 600, textAlign: 'center' }}>
                    {errorValidacion}
                  </div>
                )}

                <button
                  type="button"
                  className="karinga-btn-registrar"
                  onClick={manejarEnvio}
                  disabled={registrando}
                >
                  <Icono nombre="check" tamano={18} color="#FFFFFF" />
                  <span>{registrando ? 'Registrando...' : 'Registrar Venta de Actividades'}</span>
                </button>
              </>
            ) : (
              <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--gris-medio)' }}>
                <p style={{ margin: 0, fontSize: '0.9rem' }}>Seleccione entradas o actividades para generar el ticket.</p>
              </div>
            )}
          </div>
        </div>
      </aside>
    </div>
  );
}
