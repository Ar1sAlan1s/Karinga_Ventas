import { useState } from 'react';
import Icono from '../Icono';
import { TARIFAS_ACTIVIDADES, METODOS_PAGO } from '../../constantes/datosIniciales';
import { determinarInfoFecha } from '../../utilidades/gestorTemporadas';

export default function PaginaInteraccionesMobile({
  alRegistrar,
  registrando,
  fecha,
  alCambiarFecha,
  hora,
  alCambiarHora,
  diasTemporadaAlta = []
}) {
  const [nombreCliente, setNombreCliente] = useState('');
  const [visitasPersonas, setVisitasPersonas] = useState(0);
  const [campingPersonas, setCampingPersonas] = useState(0);
  const [fresaKilos, setFresaKilos] = useState(0);
  const [tirolesaBoletos, setTirolesaBoletos] = useState(0);
  const [cabalgata30min, setCabalgata30min] = useState(0);
  const [cabalgata1hora, setCabalgata1hora] = useState(0);

  // Nuevas Actividades y Productos
  const [gotchaPaquetes, setGotchaPaquetes] = useState(0);
  const [interaccionAnimales, setInteraccionAnimales] = useState(0);
  const [mielLitros, setMielLitros] = useState(0);
  const [huevoConos, setHuevoConos] = useState(0);
  const [huevoPiezas, setHuevoPiezas] = useState(0);

  // Paquetes
  const [paqueteGranja, setPaqueteGranja] = useState(0);
  const [paqueteVive, setPaqueteVive] = useState(0);
  const [senderismoPersonas, setSenderismoPersonas] = useState(0);

  const [metodoPago, setMetodoPago] = useState('Efectivo');
  const [comprobante, setComprobante] = useState('');
  const [modalCobroAbierto, setModalCobroAbierto] = useState(false);
  const [errorMensaje, setErrorMensaje] = useState('');

  const infoFecha = determinarInfoFecha(fecha, diasTemporadaAlta);
  const precioCamping = infoFecha.esTemporadaAlta
    ? TARIFAS_ACTIVIDADES.CAMPING_ALTA
    : TARIFAS_ACTIVIDADES.CAMPING_NORMAL;

  const totalVisitas = visitasPersonas * TARIFAS_ACTIVIDADES.VISITA_PERSONA;
  const totalCamping = campingPersonas * precioCamping;
  const totalFresa = fresaKilos * TARIFAS_ACTIVIDADES.FRESA_KILO;
  const totalTirolesa = tirolesaBoletos * TARIFAS_ACTIVIDADES.TIROLESA_BOLETO;
  const totalCabalgata30 = cabalgata30min * TARIFAS_ACTIVIDADES.CABALGATA_30MIN;
  const totalCabalgata1h = cabalgata1hora * TARIFAS_ACTIVIDADES.CABALGATA_1HORA;
  const totalGotcha = gotchaPaquetes * TARIFAS_ACTIVIDADES.GOTCHA;
  const totalInteraccion = interaccionAnimales * TARIFAS_ACTIVIDADES.INTERACCION_ANIMALES;
  const totalMiel = mielLitros * TARIFAS_ACTIVIDADES.MIEL_LITRO;
  const totalHuevoCono = huevoConos * TARIFAS_ACTIVIDADES.HUEVO_CONO;
  const totalHuevoPieza = huevoPiezas * TARIFAS_ACTIVIDADES.HUEVO_PIEZA;
  const totalPaqueteGranja = paqueteGranja * TARIFAS_ACTIVIDADES.PAQUETE_GRANJA;
  const totalPaqueteVive = paqueteVive * TARIFAS_ACTIVIDADES.PAQUETE_VIVE;

  const senderismoPrecioUnitario = senderismoPersonas >= 6
    ? TARIFAS_ACTIVIDADES.SENDERISMO_MIN_6
    : (senderismoPersonas > 0 ? TARIFAS_ACTIVIDADES.SENDERISMO_HASTA_5 : 0);
  const totalSenderismo = senderismoPersonas * senderismoPrecioUnitario;

  const totalGeneral =
    totalVisitas +
    totalCamping +
    totalFresa +
    totalTirolesa +
    totalCabalgata30 +
    totalCabalgata1h +
    totalGotcha +
    totalInteraccion +
    totalMiel +
    totalHuevoCono +
    totalHuevoPieza +
    totalPaqueteGranja +
    totalPaqueteVive +
    totalSenderismo;

  const items = [
    // Paquetes
    {
      id: 'paquete_granja',
      categoria: 'Paquetes Especiales',
      titulo: 'Granja Karinga',
      subtitulo: 'Cabalgata 30m + Animalitos',
      precio: `$${TARIFAS_ACTIVIDADES.PAQUETE_GRANJA} / pers.`,
      icono: 'paw',
      color: '#16A34A',
      valor: paqueteGranja,
      set: setPaqueteGranja
    },
    {
      id: 'paquete_vive',
      categoria: 'Paquetes Especiales',
      titulo: 'Vive Karinga',
      subtitulo: 'Cabalgata 30m + Tirolesa + 1/2kg Fresa',
      precio: `$${TARIFAS_ACTIVIDADES.PAQUETE_VIVE} / pers.`,
      icono: 'sparkles',
      color: '#0284C7',
      valor: paqueteVive,
      set: setPaqueteVive
    },
    {
      id: 'senderismo',
      categoria: 'Paquetes Especiales',
      titulo: 'Senderismo Guiado',
      subtitulo: senderismoPersonas >= 6
        ? 'Tarifa 6+ pers: $70 c/u'
        : (senderismoPersonas > 0 ? 'Tarifa 1-5 pers: $100 c/u' : 'Mirador (≥6: $70 | ≤5: $100)'),
      precio: `$${senderismoPrecioUnitario > 0 ? senderismoPrecioUnitario : TARIFAS_ACTIVIDADES.SENDERISMO_MIN_6} / pers.`,
      icono: 'hiking',
      color: '#D97706',
      valor: senderismoPersonas,
      set: setSenderismoPersonas
    },
    // Entradas y Camping
    {
      id: 'visita',
      categoria: 'Entradas & Camping',
      titulo: 'Entrada Visitas General',
      subtitulo: 'Pase general de acceso',
      precio: `$${TARIFAS_ACTIVIDADES.VISITA_PERSONA} / pers.`,
      icono: 'ticket',
      color: 'var(--verde-oscuro)',
      valor: visitasPersonas,
      set: setVisitasPersonas
    },
    {
      id: 'camping',
      categoria: 'Entradas & Camping',
      titulo: 'Camping Karinga',
      subtitulo: `${infoFecha.esTemporadaAlta ? 'Temporada Alta' : 'Regular'}`,
      precio: `$${precioCamping} / pers.`,
      icono: 'tent',
      color: 'var(--verde-oscuro)',
      valor: campingPersonas,
      set: setCampingPersonas
    },
    // Actividades Aventura
    {
      id: 'tirolesa',
      categoria: 'Aventura & Recreación',
      titulo: 'Tirolesa (2 vueltas)',
      subtitulo: '2 vueltas por persona',
      precio: `$${TARIFAS_ACTIVIDADES.TIROLESA_BOLETO} / boleto`,
      icono: 'tirolesa',
      color: '#0284C7',
      valor: tirolesaBoletos,
      set: setTirolesaBoletos
    },
    {
      id: 'cabalgata30',
      categoria: 'Aventura & Recreación',
      titulo: 'Cabalgata (30 min)',
      subtitulo: 'Caballo o pony',
      precio: `$${TARIFAS_ACTIVIDADES.CABALGATA_30MIN} / pers.`,
      icono: 'horse',
      color: '#D97706',
      valor: cabalgata30min,
      set: setCabalgata30min
    },
    {
      id: 'cabalgata1h',
      categoria: 'Aventura & Recreación',
      titulo: 'Cabalgata (1 hora)',
      subtitulo: 'Recorrido guiado',
      precio: `$${TARIFAS_ACTIVIDADES.CABALGATA_1HORA} / pers.`,
      icono: 'horse',
      color: '#D97706',
      valor: cabalgata1hora,
      set: setCabalgata1hora
    },
    {
      id: 'gotcha',
      categoria: 'Aventura & Recreación',
      titulo: 'Gotcha Karinga',
      subtitulo: '10 equipos y 2,000 balas',
      precio: `$${TARIFAS_ACTIVIDADES.GOTCHA.toLocaleString('es-MX')}`,
      icono: 'target',
      color: '#DC2626',
      valor: gotchaPaquetes,
      set: setGotchaPaquetes
    },
    {
      id: 'interaccion',
      categoria: 'Aventura & Recreación',
      titulo: 'Interacción Animales',
      subtitulo: 'Venado, cerdito, conejos',
      precio: `$${TARIFAS_ACTIVIDADES.INTERACCION_ANIMALES} c/u`,
      icono: 'paw',
      color: '#059669',
      valor: interaccionAnimales,
      set: setInteraccionAnimales
    },
    // Productos de Rancho
    {
      id: 'fresa',
      categoria: 'Rancho & Huerto',
      titulo: 'Fresa Orgánica (1 Kg)',
      subtitulo: 'Cosecha fresca',
      precio: `$${TARIFAS_ACTIVIDADES.FRESA_KILO} / kg`,
      icono: 'fresa',
      color: '#E11D48',
      valor: fresaKilos,
      set: setFresaKilos
    },
    {
      id: 'miel',
      categoria: 'Rancho & Huerto',
      titulo: 'Miel Natural (1 Litro)',
      subtitulo: 'Frasco envasado',
      precio: `$${TARIFAS_ACTIVIDADES.MIEL_LITRO} / litro`,
      icono: 'honey',
      color: '#D97706',
      valor: mielLitros,
      set: setMielLitros
    },
    {
      id: 'huevo_cono',
      categoria: 'Rancho & Huerto',
      titulo: 'Huevo Rancho (Cono)',
      subtitulo: 'Cono de 30 piezas',
      precio: `$${TARIFAS_ACTIVIDADES.HUEVO_CONO} / cono`,
      icono: 'egg',
      color: '#B45309',
      valor: huevoConos,
      set: setHuevoConos
    },
    {
      id: 'huevo_pieza',
      categoria: 'Rancho & Huerto',
      titulo: 'Huevo Rancho (Pieza)',
      subtitulo: 'Pieza fresca',
      precio: `$${TARIFAS_ACTIVIDADES.HUEVO_PIEZA} / pz`,
      icono: 'egg',
      color: '#B45309',
      valor: huevoPiezas,
      set: setHuevoPiezas
    }
  ];

  const confirmarCobro = () => {
    setErrorMensaje('');
    if (totalGeneral <= 0) {
      setErrorMensaje('Selecciona al menos una entrada o servicio');
      return;
    }

    const payload = {
      tipo: 'actividades',
      fecha,
      hora,
      temporada: 'N/A',
      cliente_nombre: nombreCliente.trim() || 'Público General',
      nombre_reservacion: nombreCliente.trim() || 'Público General',
      cabana_id: null,
      noches: 0,
      anticipo: 0,
      metodo_pago_anticipo: null,
      estado_pago: 'liquidado',
      monto_liquidado: totalGeneral,
      metodo_pago_liquidacion: metodoPago,
      comprobante_pago: comprobante.trim(),
      total: totalGeneral,
      visitas_personas: visitasPersonas,
      camping_personas: campingPersonas,
      fresa_kilos: fresaKilos,
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
      notas: 'Venta registrada desde versión móvil'
    };

    if (alRegistrar) {
      alRegistrar(payload, () => {
        setVisitasPersonas(0);
        setCampingPersonas(0);
        setFresaKilos(0);
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
        setNombreCliente('');
        setModalCobroAbierto(false);
      });
    }
  };

  return (
    <div className="karinga-mobile-page">
      <div className="karinga-mobile-section">
        {/* Identificación del Cliente */}
        <div className="karinga-mobile-form-card" style={{ marginBottom: '1rem' }}>
          <label className="karinga-mobile-label">Nombre del Cliente / Grupo:</label>
          <input
            type="text"
            className="karinga-mobile-input"
            placeholder="Público General..."
            value={nombreCliente}
            onChange={(e) => setNombreCliente(e.target.value)}
          />
        </div>

        {/* Lista Espaciosa y Organizada de Actividades */}
        <div className="karinga-mobile-activities-list">
          {items.map((act, idx) => {
            const anterior = items[idx - 1];
            const mostrarCatHeader = !anterior || anterior.categoria !== act.categoria;
            return (
              <div key={act.id}>
                {mostrarCatHeader && (
                  <div style={{
                    fontSize: '0.76rem',
                    fontWeight: 800,
                    color: '#1B4D3E',
                    padding: '0.75rem 0.25rem 0.35rem 0.25rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem'
                  }}>
                    <span>{act.categoria}</span>
                  </div>
                )}
                <div className="karinga-mobile-activity-card">
                  <div className="karinga-mobile-act-info">
                    <div className="karinga-mobile-act-header">
                      <Icono nombre={act.icono} tamano={18} color={act.color || 'var(--verde-oscuro)'} />
                      <strong className="karinga-mobile-act-title">{act.titulo}</strong>
                    </div>
                    {act.subtitulo && (
                      <small style={{ display: 'block', color: '#64748B', fontSize: '0.72rem', marginTop: '0.1rem' }}>
                        {act.subtitulo}
                      </small>
                    )}
                    <span className="karinga-mobile-act-price">{act.precio}</span>
                  </div>

                  <div className="karinga-mobile-stepper">
                    <button
                      type="button"
                      onClick={() => act.set(Math.max(0, act.valor - 1))}
                      disabled={act.valor === 0}
                    >
                      -
                    </button>
                    <span>{act.valor}</span>
                    <button
                      type="button"
                      onClick={() => act.set(act.valor + 1)}
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Indicador de ayuda cuando no hay items seleccionados */}
      {totalGeneral === 0 && (
        <div style={{
          margin: '1rem 0 5rem 0',
          padding: '0.85rem 1rem',
          background: '#F0FDF4',
          border: '1px dashed #86EFAC',
          borderRadius: '12px',
          display: 'flex',
          alignItems: 'center',
          gap: '0.65rem',
          color: '#166534',
          fontSize: '0.82rem'
        }}>
          <Icono nombre="nature" tamano={18} color="#16A34A" />
          <span>Toca <strong>+</strong> en cualquier entrada o actividad para calcular y cobrar.</span>
        </div>
      )}

      {/* Barra Flotante de Cobro en Actividades */}
      {totalGeneral > 0 && (
        <div className="karinga-mobile-floating-bar">
          <div className="karinga-mobile-floating-total">
            <span className="karinga-mobile-floating-label">Total a Cobrar:</span>
            <strong className="karinga-mobile-floating-amount">
              ${totalGeneral.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN
            </strong>
          </div>
          <button
            type="button"
            className="karinga-mobile-floating-btn"
            onClick={() => setModalCobroAbierto(true)}
          >
            <span>Cobrar</span>
            <Icono nombre="check" tamano={16} color="#FFFFFF" />
          </button>
        </div>
      )}

      {/* Modal / Sheet de Finalización de Cobro */}
      {modalCobroAbierto && (
        <div className="karinga-mobile-sheet-overlay" onClick={() => setModalCobroAbierto(false)}>
          <div className="karinga-mobile-checkin-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="karinga-mobile-sheet-header">
              <div>
                <span className="karinga-mobile-sheet-sub">Cobrar Actividades Recreativas</span>
                <h3 className="karinga-mobile-sheet-title">
                  Total: ${totalGeneral.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN
                </h3>
              </div>
              <button
                type="button"
                className="karinga-mobile-sheet-close"
                onClick={() => setModalCobroAbierto(false)}
              >
                <Icono nombre="close" tamano={16} color="#334155" />
              </button>
            </div>

            {errorMensaje && (
              <div className="karinga-mobile-error-box">
                <Icono nombre="alert" tamano={15} color="#DC2626" />
                <span>{errorMensaje}</span>
              </div>
            )}

            <div className="karinga-mobile-field-block">
              <label className="karinga-mobile-label">Forma de Pago:</label>
              <div className="karinga-mobile-payment-options">
                {['Efectivo', 'Tarjeta en Terminal', 'Transferencia BBVA', 'Transferencia Bajío'].map((met) => (
                  <button
                    key={met}
                    type="button"
                    className={`karinga-mobile-pay-btn ${metodoPago === met ? 'activo' : ''}`}
                    onClick={() => setMetodoPago(met)}
                  >
                    <Icono
                      nombre={met.includes('Efectivo') ? 'coins' : met.includes('Tarjeta') ? 'credit-card' : 'building-bank'}
                      tamano={16}
                      color="currentColor"
                    />
                    <span>{met}</span>
                  </button>
                ))}
              </div>
            </div>

            {metodoPago !== 'Efectivo' && (
              <div className="karinga-mobile-field-block">
                <label className="karinga-mobile-label">Folio / Comprobante:</label>
                <input
                  type="text"
                  className="karinga-mobile-input"
                  placeholder="Referencia de pago..."
                  value={comprobante}
                  onChange={(e) => setComprobante(e.target.value)}
                />
              </div>
            )}

            <button
              type="button"
              className="karinga-mobile-complete-checkin-btn"
              onClick={confirmarCobro}
              disabled={registrando}
            >
              <Icono nombre="check" tamano={18} color="#FFFFFF" />
              <span>{registrando ? 'Registrando...' : 'Confirmar Cobro'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

