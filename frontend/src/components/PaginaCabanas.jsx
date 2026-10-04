import Icono from './Icono';
import { useState, useMemo } from 'react';
import ConfiguracionRegistro from './ConfiguracionRegistro';
import ModalSincronizarCalendario from './ModalSincronizarCalendario';
import PanelSincronizacionCalendario from './PanelSincronizacionCalendario';
import {
  obtenerSemanasDeVentas,
  filtrarVentasPorSemana,
  obtenerSemanaActual,
  obtenerProximaSemana,
  estaReservaEnSemana,
  obtenerInfoSemana
} from '../utilidades/gestorSemanas';
import {
  calcularDesgloseNoches,
  formatearFechaConDia,
  formatearHora12
} from '../utilidades/gestorTemporadas';

export default function PaginaCabanas({
  cabanas = [],
  ventas = [],
  alRegistrar,
  alAsignarHorasExtra,
  alRegistrarDanoDeposito,
  alLiquidarSaldo,
  registrando,
  fecha,
  alCambiarFecha,
  hora,
  alCambiarHora,
  temporada,
  alCambiarTemporada,
  diasTemporadaAlta = [],
  alGuardarDiasTemporadaAlta,
  alRecargarVentas
}) {
  // Modalidades dinámicas:
  // 'checkin_completo' -> Recepción & Liquidación (ambos pagos juntos)
  // 'nueva_reserva'    -> Reservación Futura (apartado con anticipo)
  // 'horas_extra'      -> Horas Libres, Personas Extra y Otros Servicios
  // 'dano_deposito'    -> Deducción de Depósito por Artículos Dañados o Perdidos
  const [modalidad, setModalidad] = useState('checkin_completo');

  // Sincronización con Google Calendar
  const [modalSincronizarAbierto, setModalSincronizarAbierto] = useState(false);

  // Reservación vinculada para liquidar en Check-in sin duplicar registro
  const [reservaCargadaCheckinId, setReservaCargadaCheckinId] = useState(null);
  const [filtroSemanaCheckin, setFiltroSemanaCheckin] = useState('actual'); // 'actual' | 'proxima' | 'todas'

  // Información de la semana en la que se encuentra el usuario
  const semanaActual = useMemo(() => obtenerSemanaActual(fecha), [fecha]);
  const proximaSemana = useMemo(() => obtenerProximaSemana(fecha), [fecha]);

  // Reservaciones de cabaña con saldo pendiente (importadas de Google Calendar o registradas en el sistema)
  const reservacionesPendientes = useMemo(() => {
    return ventas.filter((v) => {
      const esCabana = Boolean(v.cabana_id);
      const esPendiente = v.estado_pago === 'pendiente_liquidacion' || Number(v.saldo_pendiente) > 0;
      return esCabana && esPendiente;
    });
  }, [ventas]);

  // Reservaciones pendientes de esta semana en particular
  const pendientesEstaSemana = useMemo(() => {
    return reservacionesPendientes.filter((r) => estaReservaEnSemana(r, semanaActual));
  }, [reservacionesPendientes, semanaActual]);

  // Reservaciones pendientes de la próxima semana
  const pendientesProximaSemana = useMemo(() => {
    return reservacionesPendientes.filter((r) => estaReservaEnSemana(r, proximaSemana));
  }, [reservacionesPendientes, proximaSemana]);

  // Reservaciones para el selector de check-in según el filtro
  const reservacionesCheckinFiltradas = useMemo(() => {
    let list;
    if (filtroSemanaCheckin === 'actual') list = pendientesEstaSemana;
    else if (filtroSemanaCheckin === 'proxima') list = pendientesProximaSemana;
    else list = reservacionesPendientes;

    return [...list].sort((a, b) => {
      const fa = (a.fecha_checkin || a.fecha || '').split('T')[0];
      const fb = (b.fecha_checkin || b.fecha || '').split('T')[0];
      return fa.localeCompare(fb);
    });
  }, [filtroSemanaCheckin, pendientesEstaSemana, pendientesProximaSemana, reservacionesPendientes]);

  const manejarSeleccionarReservacionCalendario = (reserva) => {
    if (!reserva) return;
    setModalidad('checkin_completo');

    // Verificar si ya existe en BD de ventas para liquidarla
    const existenteEnDb = ventas.find((v) =>
      (v.notas || '').includes(`[GCAL_EVENT_ID:${reserva.id}]`) ||
      (String(v.cabana_id) === String(reserva.cabana_id) &&
       (v.fecha_checkin || v.fecha) === reserva.fecha_inicio &&
       v.nombre_reservacion === reserva.nombre_reservacion)
    );

    if (existenteEnDb) {
      setReservaCargadaCheckinId(existenteEnDb.id);
    } else {
      setReservaCargadaCheckinId(null);
    }

    // 1. Cabaña (deducida del calendario de origen)
    if (reserva.cabana_id) {
      manejarSeleccionCabana(reserva.cabana_id);
    }

    // 2. Nombre de reservación (del título / summary del evento)
    if (reserva.nombre_reservacion) {
      setNombreReservacion(reserva.nombre_reservacion);
    }

    // 3. Noches (calculadas automáticamente)
    if (reserva.noches) {
      setNoches(Math.max(1, Number(reserva.noches) || 1));
    }

    // 4. Actualizar fecha si el evento tiene fecha de inicio
    if (reserva.fecha_inicio && alCambiarFecha) {
      alCambiarFecha(reserva.fecha_inicio);
    }

    setErrorValidacion('');
  };

  // Cargar una reservación pendiente directamente en el formulario de Recepción
  const manejarCargarReservaEnCheckin = (reserva) => {
    if (!reserva) return;
    setModalidad('checkin_completo');
    setReservaCargadaCheckinId(reserva.id || null);
    if (reserva.cabana_id) manejarSeleccionCabana(reserva.cabana_id);
    if (reserva.nombre_reservacion) setNombreReservacion(reserva.nombre_reservacion);
    if (reserva.noches) setNoches(Math.max(1, Number(reserva.noches) || 1));
    const fechaIn = reserva.fecha_checkin || reserva.fecha;
    if (fechaIn && alCambiarFecha) alCambiarFecha(fechaIn.split('T')[0]);
    if (reserva.huespedes_totales) setHuespedesTotales(Number(reserva.huespedes_totales) || 0);
    setMontoPagoAnterior(Number(reserva.anticipo) || 0);
    setComprobantePagoAnterior(reserva.comprobante_anticipo || '');
    setMetodoPagoAnterior(reserva.metodo_pago_anticipo || 'Transferencia BBVA');
    setHorasExtraLlegada(Number(reserva.horas_extra) || 0);
    if (reserva.descuento_especial || reserva.valor_descuento) {
      setTipoDescuento(reserva.tipo_descuento || 'monto');
      setValorDescuento(Number(reserva.valor_descuento ?? reserva.descuento_especial) || 0);
    } else {
      setValorDescuento(0);
    }
    setErrorValidacion('');
  };

  // Cabaña y Huéspedes
  const [cabanaSeleccionadaId, setCabanaSeleccionadaId] = useState('');
  const [nombreReservacion, setNombreReservacion] = useState('');
  const [noches, setNoches] = useState(1);
  const [huespedesTotales, setHuespedesTotales] = useState(0);

  // Pago 1: Anticipo Registrado que muestran
  const [montoPagoAnterior, setMontoPagoAnterior] = useState(0);
  const [metodoPagoAnterior, setMetodoPagoAnterior] = useState('Transferencia BBVA');
  const [comprobantePagoAnterior, setComprobantePagoAnterior] = useState('');

  // Pago 2: Liquidación que dan en taquilla al llegar
  const [metodoPagoActual, setMetodoPagoActual] = useState('Efectivo');
  const [horasExtraLlegada, setHorasExtraLlegada] = useState(0);

  // Descuento
  const [tipoDescuento, setTipoDescuento] = useState('monto');
  const [valorDescuento, setValorDescuento] = useState(0);
  const [errorValidacion, setErrorValidacion] = useState('');

  // Modo Horas Libres y Extras Asignados al Historial
  const [reservaHistorialId, setReservaHistorialId] = useState('');
  const [filtroSemanaExtras, setFiltroSemanaExtras] = useState('todas');
  const [busquedaExtras, setBusquedaExtras] = useState('');
  const [horasExtraHistorial, setHorasExtraHistorial] = useState(0);
  const [personasExtraHistorial, setPersonasExtraHistorial] = useState(0);
  const [otroConceptoHistorial, setOtroConceptoHistorial] = useState('');
  const [otroMontoHistorial, setOtroMontoHistorial] = useState('');
  const [metodoPagoHorasExtra, setMetodoPagoHorasExtra] = useState('Efectivo');
  const [notasExtrasHistorial, setNotasExtrasHistorial] = useState('');

  // Modo Deducción de Depósito por Daño o Pérdida
  const [reservaDanoId, setReservaDanoId] = useState('');
  const [filtroSemanaDano, setFiltroSemanaDano] = useState('todas');
  const [busquedaDano, setBusquedaDano] = useState('');
  const [montoDano, setMontoDano] = useState('');
  const [conceptoDano, setConceptoDano] = useState('');
  const [notasDano, setNotasDano] = useState('');

  // Reservaciones de cabaña activas en el historial para vincular
  const reservacionesCabanasHistorial = useMemo(() => {
    return ventas.filter((v) => Boolean(v.cabana_id));
  }, [ventas]);

  // Semanas disponibles con reservaciones de cabañas
  const semanasCabanas = useMemo(() => {
    return obtenerSemanasDeVentas(reservacionesCabanasHistorial);
  }, [reservacionesCabanasHistorial]);

  // Reservaciones filtradas por semana y búsqueda para Extras
  const reservacionesFiltradasExtras = useMemo(() => {
    let list = filtrarVentasPorSemana(reservacionesCabanasHistorial, filtroSemanaExtras);
    if (busquedaExtras.trim()) {
      const q = busquedaExtras.toLowerCase().trim();
      list = list.filter((r) => {
        const nom = (r.nombre_reservacion || '').toLowerCase();
        const cab = (r.cabana_nombre || '').toLowerCase();
        const idStr = String(r.id || '');
        return nom.includes(q) || cab.includes(q) || idStr.includes(q);
      });
    }
    return list;
  }, [reservacionesCabanasHistorial, filtroSemanaExtras, busquedaExtras]);

  // Reservaciones filtradas por semana y búsqueda para Daños
  const reservacionesFiltradasDano = useMemo(() => {
    let list = filtrarVentasPorSemana(reservacionesCabanasHistorial, filtroSemanaDano);
    if (busquedaDano.trim()) {
      const q = busquedaDano.toLowerCase().trim();
      list = list.filter((r) => {
        const nom = (r.nombre_reservacion || '').toLowerCase();
        const cab = (r.cabana_nombre || '').toLowerCase();
        const idStr = String(r.id || '');
        return nom.includes(q) || cab.includes(q) || idStr.includes(q);
      });
    }
    return list;
  }, [reservacionesCabanasHistorial, filtroSemanaDano, busquedaDano]);

  const cabanaActual = cabanas.find((c) => String(c.id) === String(cabanaSeleccionadaId));

  const manejarSeleccionCabana = (id) => {
    setCabanaSeleccionadaId(id);
    setErrorValidacion('');
    if (id) {
      const encontrada = cabanas.find((c) => String(c.id) === String(id));
      if (encontrada) setHuespedesTotales(encontrada.capacidad);
    } else {
      setHuespedesTotales(0);
    }
  };

  const numNoches = Math.max(1, Number(noches) || 1);
  const [ajustesTarifasNoches, setAjustesTarifasNoches] = useState({});

  // Desglose de cada noche asignado automáticamente por fecha y calendario
  const desgloseNoches = useMemo(() => {
    const ajustes = { ...ajustesTarifasNoches };
    if (numNoches === 1 && !ajustes[0] && temporada) {
      ajustes[0] = temporada;
    }
    return calcularDesgloseNoches(fecha, numNoches, diasTemporadaAlta, cabanaActual, ajustes);
  }, [fecha, numNoches, diasTemporadaAlta, cabanaActual, ajustesTarifasNoches, temporada]);

  const cambiarTarifaNoche = (indice, nuevaTarifa) => {
    setAjustesTarifasNoches((prev) => ({
      ...prev,
      [indice]: nuevaTarifa
    }));
  };

  const restablecerTarifasNoches = () => {
    setAjustesTarifasNoches({});
  };

  const costoCabana = cabanaActual
    ? desgloseNoches.reduce((acc, n) => acc + (Number(n.precio) || 0), 0)
    : 0;

  const precioNoche = desgloseNoches.length > 0 ? (desgloseNoches[0].precio || 0) : 0;

  // Resumen textual de tarifas de las noches (ej. "2× Fin de semana" o "1× Entre semana + 1× Fin de semana")
  const resumenTarifasTexto = useMemo(() => {
    if (!cabanaActual || desgloseNoches.length === 0) return '';
    const conteos = {};
    desgloseNoches.forEach((n) => {
      const nombre = n.tarifaAplicada === 'fin_semana'
        ? 'Fin de semana'
        : n.tarifaAplicada === 'temporada_alta'
          ? 'Temporada alta'
          : 'Entre semana';
      conteos[nombre] = (conteos[nombre] || 0) + 1;
    });
    return Object.entries(conteos)
      .map(([nom, cant]) => `${cant}× ${nom}`)
      .join(' + ');
  }, [cabanaActual, desgloseNoches]);

  // Menú interactivo de ajuste y desglose de tarifas por noche
  const renderMenuDesgloseNoches = () => {
    if (!cabanaActual || numNoches < 2) return null;

    return (
      <div style={{
        background: '#F8FAFC',
        border: '1px solid #CBD5E1',
        borderRadius: '10px',
        padding: '1rem',
        marginTop: '1.25rem'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.65rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
            <Icono nombre="calendar" tamano={18} color="var(--verde-oscuro)" />
            <strong style={{ fontSize: '0.92rem', color: '#0F172A' }}>
              Ajuste y Desglose de Tarifas por Noche ({numNoches} noches)
            </strong>
          </div>
          {Object.keys(ajustesTarifasNoches).length > 0 && (
            <button
              type="button"
              onClick={restablecerTarifasNoches}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#0284C7',
                fontSize: '0.78rem',
                fontWeight: 700,
                cursor: 'pointer',
                textDecoration: 'underline'
              }}
              title="Restablecer a las tarifas automáticas según el calendario"
            >
              Restablecer automáticas
            </button>
          )}
        </div>
        <p style={{ margin: '0 0 0.85rem 0', fontSize: '0.79rem', color: '#64748B' }}>
          Tarifas asignadas automáticamente por fecha. Puedes cambiar libremente cada noche a <strong>Entre semana</strong>, <strong>Fin de semana</strong> o <strong>Temporada alta</strong>:
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
          {desgloseNoches.map((noche) => (
            <div
              key={noche.indice}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: '#FFFFFF',
                border: noche.esAjusteManual ? '1px solid #93C5FD' : '1px solid #E2E8F0',
                borderRadius: '8px',
                padding: '0.65rem 0.9rem',
                flexWrap: 'wrap',
                gap: '0.65rem'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <span style={{
                  background: '#DCFCE7',
                  color: '#15803D',
                  fontWeight: 800,
                  fontSize: '0.75rem',
                  padding: '0.2rem 0.5rem',
                  borderRadius: '6px'
                }}>
                  Noche {noche.numeroNoche}
                </span>
                <div>
                  <strong style={{ fontSize: '0.86rem', color: '#1E293B', display: 'block' }}>
                    {noche.diaNombre} {noche.fecha}
                  </strong>
                  <small style={{ fontSize: '0.73rem', color: noche.esAjusteManual ? '#1D4ED8' : '#64748B' }}>
                    {noche.esAjusteManual ? '(Ajustado manual)' : noche.motivo}
                  </small>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                <div style={{ display: 'inline-flex', gap: '0.3rem', background: '#F1F5F9', padding: '0.2rem', borderRadius: '6px' }}>
                  <button
                    type="button"
                    onClick={() => cambiarTarifaNoche(noche.indice, 'entre_semana')}
                    style={{
                      fontSize: '0.74rem',
                      fontWeight: 600,
                      padding: '0.25rem 0.55rem',
                      borderRadius: '4px',
                      border: 'none',
                      cursor: 'pointer',
                      background: noche.tarifaAplicada === 'entre_semana' ? '#15803D' : 'transparent',
                      color: noche.tarifaAplicada === 'entre_semana' ? '#FFFFFF' : '#475569',
                      transition: 'all 0.15s ease'
                    }}
                    title={`Tarifa Entre semana: $${Number(cabanaActual.precio_entre_semana).toLocaleString('es-MX')} MXN`}
                  >
                    Entre sem (${Number(cabanaActual.precio_entre_semana).toLocaleString('es-MX')})
                  </button>
                  <button
                    type="button"
                    onClick={() => cambiarTarifaNoche(noche.indice, 'fin_semana')}
                    style={{
                      fontSize: '0.74rem',
                      fontWeight: 600,
                      padding: '0.25rem 0.55rem',
                      borderRadius: '4px',
                      border: 'none',
                      cursor: 'pointer',
                      background: noche.tarifaAplicada === 'fin_semana' ? '#1E40AF' : 'transparent',
                      color: noche.tarifaAplicada === 'fin_semana' ? '#FFFFFF' : '#475569',
                      transition: 'all 0.15s ease'
                    }}
                    title={`Tarifa Fin de semana: $${Number(cabanaActual.precio_fin_semana).toLocaleString('es-MX')} MXN`}
                  >
                    Fin sem (${Number(cabanaActual.precio_fin_semana).toLocaleString('es-MX')})
                  </button>
                  <button
                    type="button"
                    onClick={() => cambiarTarifaNoche(noche.indice, 'temporada_alta')}
                    style={{
                      fontSize: '0.74rem',
                      fontWeight: 600,
                      padding: '0.25rem 0.55rem',
                      borderRadius: '4px',
                      border: 'none',
                      cursor: 'pointer',
                      background: noche.tarifaAplicada === 'temporada_alta' ? '#B45309' : 'transparent',
                      color: noche.tarifaAplicada === 'temporada_alta' ? '#FFFFFF' : '#475569',
                      transition: 'all 0.15s ease'
                    }}
                    title={`Tarifa Temporada alta: $${Number(cabanaActual.precio_temporada_alta).toLocaleString('es-MX')} MXN`}
                  >
                    Alta (${Number(cabanaActual.precio_temporada_alta).toLocaleString('es-MX')})
                  </button>
                </div>

                <div style={{ textAlign: 'right', minWidth: '85px' }}>
                  <strong style={{ fontSize: '0.92rem', color: '#0F172A' }}>
                    ${noche.precio.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                  </strong>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: '0.85rem',
          paddingTop: '0.65rem',
          borderTop: '1px solid #E2E8F0',
          fontSize: '0.86rem'
        }}>
          <span style={{ fontWeight: 600, color: '#334155' }}>
            Total Hospedaje ({numNoches} noches):
          </span>
          <strong style={{ fontSize: '1.05rem', color: '#15803D' }}>
            ${costoCabana.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN
          </strong>
        </div>
      </div>
    );
  };

  const capacidadBase = cabanaActual ? Number(cabanaActual.capacidad) : 0;
  const numHuespedes = Number(huespedesTotales) || 0;
  const personasExtra = (cabanaActual && numHuespedes > capacidadBase) ? numHuespedes - capacidadBase : 0;
  const cargoPersonasExtra = personasExtra * 250;

  // Horas extra en llegada
  const numHorasExtraLlegada = Math.max(0, parseInt(horasExtraLlegada, 10) || 0);
  const cargoHorasExtraLlegada = numHorasExtraLlegada * 250;
  const horaSalidaLlegada = `${String(12 + numHorasExtraLlegada).padStart(2, '0')}:00`;

  const subtotalEstancia = costoCabana + cargoPersonasExtra + cargoHorasExtraLlegada;

  let descuentoCalculado = 0;
  if (tipoDescuento === 'porcentaje') {
    descuentoCalculado = (subtotalEstancia * (Number(valorDescuento) || 0)) / 100;
  } else {
    descuentoCalculado = Number(valorDescuento) || 0;
  }
  descuentoCalculado = Math.min(subtotalEstancia, Math.round(descuentoCalculado * 100) / 100);

  // Equivalencia bidireccional entre Monto ($) y Porcentaje (%)
  const porcentajeEquivalente = subtotalEstancia > 0
    ? Math.round(((descuentoCalculado / subtotalEstancia) * 100) * 10) / 10
    : 0;

  const totalGeneralHospedaje = Math.max(0, subtotalEstancia - descuentoCalculado);
  const anticipoEfectivo = Number(montoPagoAnterior) || 0;

  // Lo que deben cobrar en mano en este momento
  const cobroEnManoAhorita = Math.max(0, Math.round((totalGeneralHospedaje - anticipoEfectivo) * 100) / 100);

  // Enviar Llegada & Check-in Completo (Registra ambos pagos juntos)
  const manejarEnvioCheckinCompleto = () => {
    setErrorValidacion('');
    if (!cabanaSeleccionadaId) {
      setErrorValidacion('Por favor seleccione una cabaña del catálogo.');
      return;
    }
    if (!nombreReservacion || nombreReservacion.trim() === '') {
      setErrorValidacion('El Nombre de quien hace la reservación es obligatorio.');
      return;
    }

    // Si fue cargada desde una reservación existente (Google Calendar o previa)
    if (reservaCargadaCheckinId && alLiquidarSaldo) {
      const payloadCheckin = {
        anticipo: anticipoEfectivo,
        metodo_pago_anticipo: anticipoEfectivo > 0 ? metodoPagoAnterior : null,
        comprobante_anticipo: comprobantePagoAnterior.trim(),
        monto_liquidado: cobroEnManoAhorita,
        metodo_pago_liquidacion: metodoPagoActual,
        metodo_pago: cobroEnManoAhorita > 0 ? metodoPagoActual : metodoPagoAnterior,
        tipo_descuento: tipoDescuento,
        valor_descuento: Number(valorDescuento) || 0,
        descuento_especial: descuentoCalculado,
        subtotal: subtotalEstancia,
        total: totalGeneralHospedaje,
        costo_cabana: costoCabana,
        personas_extra: personasExtra,
        costo_personas_extra: cargoPersonasExtra,
        horas_extra: numHorasExtraLlegada,
        huespedes_totales: numHuespedes,
        nombre_reservacion: nombreReservacion.trim(),
        notas: `Check-in liquidado en recepción [Anticipo: $${anticipoEfectivo.toLocaleString('es-MX')} vía ${metodoPagoAnterior}, Liquidación: $${cobroEnManoAhorita.toLocaleString('es-MX')} vía ${metodoPagoActual}${descuentoCalculado > 0 ? `, Descuento: $${descuentoCalculado.toLocaleString('es-MX')}` : ''}]`
      };

      alLiquidarSaldo(
        reservaCargadaCheckinId,
        payloadCheckin,
        () => {
          setReservaCargadaCheckinId(null);
          setCabanaSeleccionadaId('');
          setNombreReservacion('');
          setNoches(1);
          setHuespedesTotales(0);
          setMontoPagoAnterior(0);
          setComprobantePagoAnterior('');
          setHorasExtraLlegada(0);
          setValorDescuento(0);
        }
      );
      return;
    }

    const payload = {
      tipo: 'cabanas',
      fecha,
      hora,
      temporada,
      nombre_reservacion: nombreReservacion.trim(),
      cabana_id: parseInt(cabanaSeleccionadaId, 10),
      noches: numNoches,
      huespedes_totales: numHuespedes,
      horas_extra: numHorasExtraLlegada,
      anticipo: anticipoEfectivo,
      metodo_pago_anticipo: anticipoEfectivo > 0 ? metodoPagoAnterior : null,
      comprobante_anticipo: comprobantePagoAnterior.trim(),
      estado_pago: 'liquidado',
      monto_liquidado: cobroEnManoAhorita,
      metodo_pago_liquidacion: metodoPagoActual,
      tipo_descuento: tipoDescuento,
      valor_descuento: Number(valorDescuento) || 0,
      descuento_especial: descuentoCalculado,
      metodo_pago: cobroEnManoAhorita > 0 ? metodoPagoActual : metodoPagoAnterior,
      concepto: `Check-in ${cabanaActual?.nombre || 'Cabaña'} (${numNoches}n)${numHorasExtraLlegada > 0 ? ` + ${numHorasExtraLlegada}h extra` : ''}`
    };

    alRegistrar(payload, () => {
      setReservaCargadaCheckinId(null);
      setCabanaSeleccionadaId('');
      setNombreReservacion('');
      setNoches(1);
      setHuespedesTotales(0);
      setMontoPagoAnterior(0);
      setComprobantePagoAnterior('');
      setHorasExtraLlegada(0);
      setValorDescuento(0);
    });
  };

  // Enviar Reservación a Futuro (Apartado con anticipo)
  const [anticipoFuturo, setAnticipoFuturo] = useState(0);
  const [metodoAnticipoFuturo, setMetodoAnticipoFuturo] = useState('Transferencia BBVA');
  const [compAnticipoFuturo, setCompAnticipoFuturo] = useState('');

  const saldoPendienteFuturo = Math.max(0, totalGeneralHospedaje - (Number(anticipoFuturo) || 0));

  const manejarEnvioReservaFutura = () => {
    setErrorValidacion('');
    if (!cabanaSeleccionadaId) {
      setErrorValidacion('Por favor seleccione una cabaña.');
      return;
    }
    if (!nombreReservacion || nombreReservacion.trim() === '') {
      setErrorValidacion('El Nombre de quien reserva es obligatorio.');
      return;
    }
    if (!anticipoFuturo || Number(anticipoFuturo) <= 0) {
      setErrorValidacion('Ingrese el monto de anticipo con el que el cliente aparta la cabaña.');
      return;
    }

    const payload = {
      tipo: 'cabanas',
      fecha,
      hora,
      temporada,
      nombre_reservacion: nombreReservacion.trim(),
      cabana_id: parseInt(cabanaSeleccionadaId, 10),
      noches: numNoches,
      costo_cabana: costoCabana,
      huespedes_totales: numHuespedes,
      horas_extra: 0,
      anticipo: Number(anticipoFuturo),
      metodo_pago_anticipo: metodoAnticipoFuturo,
      comprobante_anticipo: compAnticipoFuturo.trim(),
      estado_pago: 'pendiente_liquidacion',
      saldo_pendiente: saldoPendienteFuturo,
      monto_liquidado: 0.00,
      metodo_pago_liquidacion: null,
      tipo_descuento: tipoDescuento,
      valor_descuento: Number(valorDescuento) || 0,
      descuento_especial: descuentoCalculado,
      metodo_pago: metodoAnticipoFuturo,
      concepto: `Reserva Futura ${cabanaActual?.nombre || 'Cabaña'} (Anticipo de Apartado)`
    };

    alRegistrar(payload, () => {
      setCabanaSeleccionadaId('');
      setNombreReservacion('');
      setNoches(1);
      setAjustesTarifasNoches({});
      setHuespedesTotales(0);
      setAnticipoFuturo(0);
      setCompAnticipoFuturo('');
      setValorDescuento(0);
    });
  };

  // Extras Vinculados al Historial (Horas Libres, Personas Extra, Otros)
  const reservaParaHorasExtra = reservacionesCabanasHistorial.find((r) => String(r.id) === String(reservaHistorialId));
  const horasPrevias = Number(reservaParaHorasExtra?.horas_extra) || 0;
  const personasPrevias = Number(reservaParaHorasExtra?.personas_extra) || 0;

  const numHorasExtraAdd = Math.max(0, parseInt(horasExtraHistorial, 10) || 0);
  const numPersonasExtraAdd = Math.max(0, parseInt(personasExtraHistorial, 10) || 0);
  const otroMontoNum = Math.max(0, parseFloat(otroMontoHistorial) || 0);

  const cargoHorasExtraHistorial = numHorasExtraAdd * 250;
  const cargoPersonasExtraHistorial = numPersonasExtraAdd * 250;
  const cargoOtroExtraHistorial = otroMontoNum;
  const cargoTotalExtrasHistorial = cargoHorasExtraHistorial + cargoPersonasExtraHistorial + cargoOtroExtraHistorial;

  const nuevasHorasTotal = horasPrevias + numHorasExtraAdd;
  const nuevaHoraSalidaExtra = `${String(12 + nuevasHorasTotal).padStart(2, '0')}:00`;

  const totalActualReserva = Number(reservaParaHorasExtra?.total) || 0;
  const nuevoTotalReserva = totalActualReserva + cargoTotalExtrasHistorial;

  // Daños de Depósito
  const reservaParaDano = reservacionesCabanasHistorial.find((r) => String(r.id) === String(reservaDanoId));
  const depositoEnGarantia = Number(reservaParaDano?.deposito_requerido) || 500;
  const montDanoNum = Math.max(0, parseFloat(montoDano) || 0);
  const depositoDevolver = Math.max(0, depositoEnGarantia - montDanoNum);

  const manejarEnvioDanoDeposito = () => {
    setErrorValidacion('');
    if (!reservaDanoId) {
      setErrorValidacion('Seleccione una reservación de cabaña del listado.');
      return;
    }
    if (!conceptoDano.trim()) {
      setErrorValidacion('Especifique qué artículo u objeto se rompió o perdió.');
      return;
    }
    if (!montDanoNum || montDanoNum <= 0) {
      setErrorValidacion('Especifique el monto a descontar del depósito.');
      return;
    }

    if (alRegistrarDanoDeposito) {
      alRegistrarDanoDeposito(reservaDanoId, {
        monto_dano: montDanoNum,
        concepto_dano: conceptoDano.trim(),
        notas: notasDano.trim()
      }, () => {
        setReservaDanoId('');
        setMontoDano('');
        setConceptoDano('');
        setNotasDano('');
      });
    }
  };

  const manejarEnvioHorasExtraHistorial = () => {
    setErrorValidacion('');
    if (!reservaHistorialId) {
      setErrorValidacion('Debe seleccionar una reservación existente del historial.');
      return;
    }
    if (cargoTotalExtrasHistorial <= 0) {
      setErrorValidacion('Especifique al menos un cargo extra (horas libres, personas u otro servicio con precio).');
      return;
    }
    if (otroMontoNum > 0 && !otroConceptoHistorial.trim()) {
      setErrorValidacion('Por favor especifique la descripción o concepto del servicio extra.');
      return;
    }

    if (alAsignarHorasExtra) {
      alAsignarHorasExtra(reservaHistorialId, {
        horas_extra: numHorasExtraAdd,
        personas_extra: numPersonasExtraAdd,
        otro_extra_concepto: otroConceptoHistorial.trim(),
        otro_extra_monto: cargoOtroExtraHistorial,
        metodo_pago: metodoPagoHorasExtra,
        notas: notasExtrasHistorial.trim()
      }, () => {
        setReservaHistorialId('');
        setHorasExtraHistorial(0);
        setPersonasExtraHistorial(0);
        setOtroConceptoHistorial('');
        setOtroMontoHistorial('');
        setNotasExtrasHistorial('');
      });
    }
  };

  return (
    <div className="karinga-pos-grid">
      <main>
        {/* MENÚ DINÁMICO, ESPACIOSO Y MODERNO */}
        <div className="karinga-menu-dinamico">
          <button
            type="button"
            className={`karinga-modo-card ${modalidad === 'checkin_completo' ? 'activo' : ''}`}
            onClick={() => setModalidad('checkin_completo')}
          >
            <div className="karinga-modo-icono">
              <Icono nombre="bed" tamano={24} color={modalidad === 'checkin_completo' ? 'var(--verde-oscuro)' : '#64748B'} />
            </div>
            <div className="karinga-modo-info">
              <span className="karinga-modo-titulo">Recepción & Liquidación</span>
              <span className="karinga-modo-sub">Registro de anticipo y liquidación de saldo</span>
            </div>
          </button>

          <button
            type="button"
            className={`karinga-modo-card ${modalidad === 'nueva_reserva' ? 'activo' : ''}`}
            onClick={() => setModalidad('nueva_reserva')}
          >
            <div className="karinga-modo-icono">
              <Icono nombre="calendar" tamano={24} color={modalidad === 'nueva_reserva' ? 'var(--verde-oscuro)' : '#64748B'} />
            </div>
            <div className="karinga-modo-info">
              <span className="karinga-modo-titulo">Reservación Futura</span>
              <span className="karinga-modo-sub">Apartado de cabaña con anticipo</span>
            </div>
          </button>

          <button
            type="button"
            className={`karinga-modo-card ${modalidad === 'horas_extra' ? 'activo' : ''}`}
            onClick={() => setModalidad('horas_extra')}
          >
            <div className="karinga-modo-icono">
              <Icono nombre="sparkles" tamano={24} color={modalidad === 'horas_extra' ? 'var(--verde-oscuro)' : '#64748B'} />
            </div>
            <div className="karinga-modo-info">
              <span className="karinga-modo-titulo">Horas Libres y Extras</span>
              <span className="karinga-modo-sub">Horas libres, personas extra y otros servicios</span>
            </div>
          </button>

          <button
            type="button"
            className={`karinga-modo-card ${modalidad === 'dano_deposito' ? 'activo' : ''}`}
            onClick={() => setModalidad('dano_deposito')}
          >
            <div className="karinga-modo-icono">
              <Icono nombre="shield" tamano={24} color={modalidad === 'dano_deposito' ? 'var(--verde-oscuro)' : '#64748B'} />
            </div>
            <div className="karinga-modo-info">
              <span className="karinga-modo-titulo">Deducción de Depósito</span>
              <span className="karinga-modo-sub">Artículos dañados o perdidos</span>
            </div>
          </button>
        </div>

        {/* Panel de Sincronización Google Calendar (Semana 40) con Creación Automática */}
        <PanelSincronizacionCalendario
          cabanas={cabanas}
          ventas={ventas}
          alRecargarVentas={alRecargarVentas}
          alCargarReservaEnCheckin={manejarCargarReservaEnCheckin}
        />

        {/* MODALIDAD 1: RECEPCIÓN Y COBRO COMPLETO (LOS 2 PAGOS JUNTOS) */}
        {modalidad === 'checkin_completo' && (
          <>
            <ConfiguracionRegistro
              fecha={fecha}
              alCambiarFecha={alCambiarFecha}
              hora={hora}
              alCambiarHora={alCambiarHora}
              temporada={temporada}
              alCambiarTemporada={alCambiarTemporada}
              diasTemporadaAlta={diasTemporadaAlta}
              alGuardarDiasTemporadaAlta={alGuardarDiasTemporadaAlta}
            />

            {/* Datos de Hospedaje */}
            <section className="karinga-tarjeta karinga-seccion-bloque">
              <div className="karinga-seccion-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
                <h2 className="karinga-tarjeta-titulo" style={{ margin: 0, padding: 0, border: 'none' }}>
                  <Icono nombre="bed" tamano={20} color="var(--verde-oscuro)" />
                  <span>Datos de la Cabaña</span>
                </h2>
                <button
                  type="button"
                  className="karinga-btn-secundario"
                  onClick={() => setModalSincronizarAbierto(true)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.45rem',
                    padding: '0.45rem 0.85rem',
                    fontSize: '0.84rem',
                    fontWeight: 700,
                    borderRadius: '8px',
                    borderColor: 'var(--verde-oscuro)',
                    color: 'var(--verde-oscuro)',
                    cursor: 'pointer',
                    background: '#F0FDF4'
                  }}
                  title="Consultar reservaciones en Google Calendar y autocompletar"
                >
                  <Icono nombre="calendar" tamano={16} color="var(--verde-oscuro)" />
                  <span>Sincronizar Calendarios</span>
                </button>
              </div>

              {/* Selector Rápido de Check-in para Cabañas de la Semana Actual */}
              {reservacionesPendientes.length > 0 && (
                <div
                  className="karinga-checkin-arrival-box"
                  style={{
                    background: 'linear-gradient(135deg, #F0FDF4 0%, #ECFDF5 100%)',
                    border: '1.5px solid #86EFAC',
                    borderRadius: '10px',
                    padding: '0.85rem 1.1rem',
                    marginBottom: '1.25rem',
                    boxShadow: '0 2px 6px rgba(21, 128, 61, 0.08)'
                  }}
                >
                  <div
                    className="karinga-checkin-arrival-header"
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: '0.5rem',
                      marginBottom: '0.6rem'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <div
                        style={{
                          width: '28px',
                          height: '28px',
                          borderRadius: '6px',
                          background: '#1B4D3E',
                          color: '#86EFAC',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        <Icono nombre="calendar" tamano={16} color="currentColor" />
                      </div>
                      <div>
                        <strong style={{ fontSize: '0.88rem', color: '#0F2D24', display: 'block' }}>
                          Llegadas de {filtroSemanaCheckin === 'actual' ? `Esta Semana (${semanaActual?.etiquetaRango})` : (filtroSemanaCheckin === 'proxima' ? `la Próxima Semana (${proximaSemana?.etiquetaRango})` : 'Todas las semanas')}:
                        </strong>
                        <span style={{ fontSize: '0.74rem', color: '#166534' }}>
                          {reservacionesCheckinFiltradas.length} reservación(es) por liquidar • Selecciona una para autocompletar la cabaña
                        </span>
                      </div>
                    </div>

                    <div className="karinga-checkin-arrival-pills" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexWrap: 'wrap' }}>
                      <button
                        type="button"
                        onClick={() => setFiltroSemanaCheckin('actual')}
                        style={{
                          background: filtroSemanaCheckin === 'actual' ? '#1B4D3E' : '#FFFFFF',
                          color: filtroSemanaCheckin === 'actual' ? '#FFFFFF' : '#1B4D3E',
                          border: `1.5px solid ${filtroSemanaCheckin === 'actual' ? '#1B4D3E' : '#86EFAC'}`,
                          padding: '0.28rem 0.65rem',
                          borderRadius: '6px',
                          fontSize: '0.76rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.35rem'
                        }}
                      >
                        <Icono nombre="calendar-check" tamano={13} color="currentColor" />
                        <span>Esta Semana ({pendientesEstaSemana.length})</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setFiltroSemanaCheckin('proxima')}
                        style={{
                          background: filtroSemanaCheckin === 'proxima' ? '#1B4D3E' : '#FFFFFF',
                          color: filtroSemanaCheckin === 'proxima' ? '#FFFFFF' : '#1B4D3E',
                          border: `1.5px solid ${filtroSemanaCheckin === 'proxima' ? '#1B4D3E' : '#86EFAC'}`,
                          padding: '0.28rem 0.65rem',
                          borderRadius: '6px',
                          fontSize: '0.76rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.35rem'
                        }}
                      >
                        <Icono nombre="calendar" tamano={13} color="currentColor" />
                        <span>Próx. Semana ({pendientesProximaSemana.length})</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setFiltroSemanaCheckin('todas')}
                        style={{
                          background: filtroSemanaCheckin === 'todas' ? '#1B4D3E' : '#FFFFFF',
                          color: filtroSemanaCheckin === 'todas' ? '#FFFFFF' : '#1B4D3E',
                          border: `1.5px solid ${filtroSemanaCheckin === 'todas' ? '#1B4D3E' : '#86EFAC'}`,
                          padding: '0.28rem 0.65rem',
                          borderRadius: '6px',
                          fontSize: '0.76rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.35rem'
                        }}
                      >
                        <Icono nombre="calendar-days" tamano={13} color="currentColor" />
                        <span>Todas ({reservacionesPendientes.length})</span>
                      </button>
                    </div>
                  </div>

                  {reservacionesCheckinFiltradas.length > 0 ? (
                    <div className="karinga-checkin-selector-row" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <select
                        className="karinga-select"
                        value={reservaCargadaCheckinId || ''}
                        onChange={(e) => {
                          const encontrada = reservacionesPendientes.find((r) => String(r.id) === String(e.target.value));
                          if (encontrada) {
                            manejarCargarReservaEnCheckin(encontrada);
                          } else {
                            setReservaCargadaCheckinId(null);
                          }
                        }}
                        style={{
                          background: '#FFFFFF',
                          borderColor: '#86EFAC',
                          fontSize: '0.86rem',
                          fontWeight: 600,
                          color: '#0F172A',
                          padding: '0.55rem 0.85rem'
                        }}
                      >
                        <option value="">
                          -- Seleccione una cabaña con llegada {filtroSemanaCheckin === 'actual' ? 'esta semana' : 'agendada'} ({reservacionesCheckinFiltradas.length} listas) --
                        </option>
                        {reservacionesCheckinFiltradas.map((r) => {
                          const fechaIn = (r.fecha_checkin || r.fecha || '').split('T')[0];
                          const fechaConDia = formatearFechaConDia(fechaIn, 'media');
                          const saldo = Number(r.saldo_pendiente) > 0 ? Number(r.saldo_pendiente) : Number(r.total) || 0;
                          return (
                            <option key={r.id} value={r.id}>
                              {r.cabana_nombre} • {r.nombre_reservacion} (Entrada: {fechaConDia}, {r.noches}n • Saldo: ${saldo.toLocaleString('es-MX')} MXN)
                            </option>
                          );
                        })}
                      </select>

                      {reservaCargadaCheckinId && (
                        <button
                          type="button"
                          onClick={() => {
                            setReservaCargadaCheckinId(null);
                            setCabanaSeleccionadaId('');
                            setNombreReservacion('');
                            setNoches(1);
                            setMontoPagoAnterior(0);
                            setComprobantePagoAnterior('');
                            setErrorValidacion('');
                          }}
                          style={{
                            background: '#FEE2E2',
                            color: '#991B1B',
                            border: '1px solid #FECACA',
                            borderRadius: '8px',
                            padding: '0.55rem 0.75rem',
                            fontSize: '0.78rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            whiteSpace: 'nowrap',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.3rem'
                          }}
                          title="Limpiar y desvincular reservación"
                        >
                          <Icono nombre="close" tamano={13} color="currentColor" />
                          <span>Limpiar</span>
                        </button>
                      )}
                    </div>
                  ) : (
                    <div style={{ fontSize: '0.8rem', color: '#166534', padding: '0.35rem 0' }}>
                      No hay reservaciones pendientes para {filtroSemanaCheckin === 'actual' ? 'esta semana' : 'la semana seleccionada'}. Puedes pulsar "Próx. Semana" o "Todas" para ver las demás.
                    </div>
                  )}

                  {reservaCargadaCheckinId && (
                    <div style={{ marginTop: '0.5rem', fontSize: '0.78rem', color: '#15803D', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <Icono nombre="check" tamano={15} color="#15803D" />
                      <span>Reservación vinculada correctamente. Al liquidar, se marcará como pagada sin crear duplicados.</span>
                    </div>
                  )}
                </div>
              )}

              <div className="karinga-fila-campos">
                <div className="karinga-campo" style={{ flex: 1.5 }}>
                  <label htmlFor="cabana-select-checkin">
                    Seleccionar Cabaña o Glamping <span className="requerido">*</span>
                  </label>
                  <select
                    id="cabana-select-checkin"
                    className="karinga-select"
                    value={cabanaSeleccionadaId}
                    onChange={(e) => manejarSeleccionCabana(e.target.value)}
                  >
                    <option value="">-- Elija una cabaña del catálogo --</option>
                    {cabanas.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nombre} (Capacidad: {c.capacidad} pers.)
                      </option>
                    ))}
                  </select>
                </div>

                <div className="karinga-campo" style={{ flex: 1.5 }}>
                  <label htmlFor="nombre-reservacion-checkin">
                    Nombre del Huésped <span className="requerido">*</span>
                  </label>
                  <input
                    id="nombre-reservacion-checkin"
                    type="text"
                    className="karinga-input"
                    placeholder="Ej. Juan Carlos Ramos"
                    value={nombreReservacion}
                    onChange={(e) => setNombreReservacion(e.target.value)}
                    required
                  />
                </div>
              </div>

              {cabanaActual && (
                <>
                  <div className="karinga-cabana-detalle">
                    <div className="karinga-dato-pill">
                      <span className="etiqueta">Capacidad Base</span>
                      <span className="valor">{cabanaActual.capacidad} personas</span>
                    </div>
                    <div className="karinga-dato-pill">
                      <span className="etiqueta">Precio por Noche</span>
                      <span className="valor resaltado">
                        ${precioNoche.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="karinga-dato-pill">
                      <span className="etiqueta">Depósito en Garantía</span>
                      <span className="valor" style={{ color: 'var(--amarillo-sol-hover)' }}>
                        ${Number(cabanaActual.deposito).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>

                  <div className="karinga-fila-campos" style={{ marginTop: '1.25rem' }}>
                    <div className="karinga-campo">
                      <label htmlFor="noches-checkin">Número de Noches <span className="requerido">*</span></label>
                      <input
                        id="noches-checkin"
                        type="number"
                        min="1"
                        className="karinga-input"
                        value={noches}
                        onChange={(e) => setNoches(Math.max(1, parseInt(e.target.value, 10) || 1))}
                        required
                      />
                    </div>

                    <div className="karinga-campo">
                      <label htmlFor="huespedes-checkin">
                        Huéspedes Totales (pulseras) <span className="requerido">*</span>
                      </label>
                      <input
                        id="huespedes-checkin"
                        type="number"
                        min="1"
                        className="karinga-input"
                        value={huespedesTotales}
                        onChange={(e) => setHuespedesTotales(Math.max(0, parseInt(e.target.value, 10) || 0))}
                        required
                      />
                    </div>
                  </div>

                  {renderMenuDesgloseNoches()}

                  {personasExtra > 0 && (
                    <div className="karinga-alerta-extra">
                      <Icono nombre="alert" tamano={20} color="#D97706" />
                      <div>
                        <strong>Personas Extra: </strong>
                        Capacidad base superada por {personasExtra} persona(s).
                        Cargo: <strong>+${cargoPersonasExtra.toLocaleString('es-MX')} MXN</strong> ($250.00 c/u).
                      </div>
                    </div>
                  )}

                  {/* Descuento Especial ($ o %) */}
                  <div className="karinga-descuento-bloque">
                    <label htmlFor="descuento-checkin" style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--negro-carbon)', display: 'block' }}>
                      Descuento Especial (Opcional)
                    </label>
                    <div className="karinga-descuento-grid">
                      <div className="karinga-tipo-descuento-btn-group">
                        <button
                          type="button"
                          className={"karinga-tipo-descuento-btn " + (tipoDescuento === 'monto' ? 'activo' : '')}
                          onClick={() => setTipoDescuento('monto')}
                        >
                          $ Monto
                        </button>
                        <button
                          type="button"
                          className={"karinga-tipo-descuento-btn " + (tipoDescuento === 'porcentaje' ? 'activo' : '')}
                          onClick={() => setTipoDescuento('porcentaje')}
                        >
                          % Porcentaje
                        </button>
                      </div>
                      <div style={{ flex: 1, minWidth: '150px' }}>
                        <input
                          id="descuento-checkin"
                          type="number"
                          min="0"
                          max={tipoDescuento === 'porcentaje' ? 100 : undefined}
                          step={tipoDescuento === 'porcentaje' ? '1' : '0.01'}
                          className="karinga-input"
                          placeholder={tipoDescuento === 'porcentaje' ? 'Ej. 10 (para 10%)' : 'Ej. 200.00'}
                          value={valorDescuento === 0 ? '' : valorDescuento}
                          onChange={(e) => setValorDescuento(Math.max(0, parseFloat(e.target.value) || 0))}
                        />
                      </div>
                      {descuentoCalculado > 0 && (
                        <div style={{ color: 'var(--verde-oscuro)', fontWeight: 600, fontSize: '0.88rem', marginTop: '0.4rem', background: '#F0FDF4', padding: '0.45rem 0.8rem', borderRadius: '6px', border: '1px solid #BBF7D0' }}>
                          {tipoDescuento === 'monto' ? (
                            <span>
                              Ahorro aplicado: <strong>-${descuentoCalculado.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN</strong>{' '}
                              <span style={{ color: '#0369A1' }}>({porcentajeEquivalente}% de descuento sobre subtotal)</span>
                            </span>
                          ) : (
                            <span>
                              Descuento aplicado: <strong>{Number(valorDescuento) || 0}%</strong>{' '}
                              <span style={{ color: '#0369A1' }}>(Equivale a un ahorro de -${descuentoCalculado.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN)</span>
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </section>

            {/* LOS DOS PAGOS JUNTOS EN PANTALLA */}
            <section className="karinga-tarjeta karinga-seccion-bloque">
              <div className="karinga-seccion-header">
                <h2 className="karinga-tarjeta-titulo" style={{ margin: 0, padding: 0, border: 'none' }}>
                  <Icono nombre="credit-card" tamano={20} color="var(--verde-oscuro)" />
                  <span>Registro de los Dos Pagos (Anterior y Liquidación Actual)</span>
                </h2>
              </div>

              <div className="karinga-dos-pagos-grid">
                {/* CAJA 1: PAGO ANTERIOR QUE ME ENSEÑAN */}
                <div className="karinga-pago-caja pago-anterior">
                  <div className="karinga-pago-cabecera">
                    <span className="karinga-pago-badge">Pago 1</span>
                    <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <Icono nombre="arrow-down-line" tamano={17} color="#0284C7" />
                      <span>Pago Anterior (Anticipo Registrado)</span>
                    </h4>
                  </div>

                  <div className="karinga-campo">
                    <label htmlFor="pago-ant-monto">Monto de Anticipo Registrado ($ MXN)</label>
                    <input
                      id="pago-ant-monto"
                      type="number"
                      min="0"
                      step="0.01"
                      className="karinga-input"
                      placeholder="0.00"
                      value={montoPagoAnterior === 0 ? '' : montoPagoAnterior}
                      onChange={(e) => setMontoPagoAnterior(Math.max(0, parseFloat(e.target.value) || 0))}
                    />
                  </div>

                  <div className="karinga-campo">
                    <label htmlFor="pago-ant-metodo">Método de Pago del Anticipo</label>
                    <select
                      id="pago-ant-metodo"
                      className="karinga-select"
                      value={metodoPagoAnterior}
                      onChange={(e) => setMetodoPagoAnterior(e.target.value)}
                    >
                      <option value="Transferencia BBVA">Transferencia BBVA</option>
                      <option value="Transferencia Bajío">Transferencia Bajío</option>
                      <option value="Airbnb">Airbnb</option>
                      <option value="Tarjeta Zettle">Tarjeta Zettle</option>
                      <option value="Web">Web</option>
                      <option value="Efectivo">Efectivo</option>
                    </select>
                  </div>

                  <div className="karinga-campo">
                    <label htmlFor="pago-ant-comp">Folio o Comprobante de Referencia</label>
                    <input
                      id="pago-ant-comp"
                      type="text"
                      className="karinga-input"
                      placeholder="Ej. Rastreo BBVA #9421"
                      value={comprobantePagoAnterior}
                      onChange={(e) => setComprobantePagoAnterior(e.target.value)}
                    />
                  </div>
                </div>

                {/* CAJA 2: LIQUIDACIÓN ACTUAL QUE ME DAN EN MANO */}
                <div className="karinga-pago-caja pago-actual">
                  <div className="karinga-pago-cabecera">
                    <span className="karinga-pago-badge actual">Pago 2</span>
                    <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <Icono nombre="hand-coins" tamano={17} color="#15803D" />
                      <span>Liquidación de Saldo en Recepción</span>
                    </h4>
                  </div>

                  <div className="karinga-saldo-destacado">
                    <span>Saldo Restante a Liquidar:</span>
                    <strong className="monto">${cobroEnManoAhorita.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</strong>
                  </div>

                  <div className="karinga-campo">
                    <label htmlFor="pago-act-metodo">Método de Pago para Liquidación</label>
                    <select
                      id="pago-act-metodo"
                      className="karinga-select"
                      value={metodoPagoActual}
                      onChange={(e) => setMetodoPagoActual(e.target.value)}
                    >
                      <option value="Efectivo">Efectivo</option>
                      <option value="Tarjeta Zettle">Tarjeta Zettle</option>
                      <option value="Web">Web</option>
                      <option value="Transferencia BBVA">Transferencia BBVA</option>
                      <option value="Transferencia Bajío">Transferencia Bajío</option>
                    </select>
                  </div>

                  <div className="karinga-campo">
                    <label htmlFor="horas-extra-llegada">Horas Extra de Estancia ($250.00 c/u)</label>
                    <input
                      id="horas-extra-llegada"
                      type="number"
                      min="0"
                      className="karinga-input"
                      placeholder="0"
                      value={horasExtraLlegada === 0 ? '' : horasExtraLlegada}
                      onChange={(e) => setHorasExtraLlegada(Math.max(0, parseInt(e.target.value, 10) || 0))}
                    />
                    {numHorasExtraLlegada > 0 && (
                      <small style={{ color: 'var(--verde-medio)', fontWeight: 600, display: 'block', marginTop: '0.25rem' }}>
                        +{numHorasExtraLlegada}h extra (+${cargoHorasExtraLlegada} MXN) • Salida extendida a las {horaSalidaLlegada} hrs
                      </small>
                    )}
                  </div>
                </div>
              </div>
            </section>
          </>
        )}

        {/* MODALIDAD 2: RESERVA A FUTURO (APARTADO) */}
        {modalidad === 'nueva_reserva' && (
          <>
            <ConfiguracionRegistro
              fecha={fecha}
              alCambiarFecha={alCambiarFecha}
              hora={hora}
              alCambiarHora={alCambiarHora}
              temporada={temporada}
              alCambiarTemporada={alCambiarTemporada}
              diasTemporadaAlta={diasTemporadaAlta}
              alGuardarDiasTemporadaAlta={alGuardarDiasTemporadaAlta}
            />

            <section className="karinga-tarjeta karinga-seccion-bloque">
              <div className="karinga-seccion-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
                <h2 className="karinga-tarjeta-titulo" style={{ margin: 0, padding: 0, border: 'none' }}>
                  <Icono nombre="calendar" tamano={20} color="var(--verde-oscuro)" />
                  <span>Datos de la Reservación Futura</span>
                </h2>
                <button
                  type="button"
                  className="karinga-btn-secundario"
                  onClick={() => setModalSincronizarAbierto(true)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.45rem',
                    padding: '0.45rem 0.85rem',
                    fontSize: '0.84rem',
                    fontWeight: 700,
                    borderRadius: '8px',
                    borderColor: 'var(--verde-oscuro)',
                    color: 'var(--verde-oscuro)',
                    cursor: 'pointer',
                    background: '#F0FDF4'
                  }}
                  title="Consultar reservaciones en Google Calendar y autocompletar"
                >
                  <Icono nombre="calendar" tamano={16} color="var(--verde-oscuro)" />
                  <span>Sincronizar Calendarios</span>
                </button>
              </div>

              <div className="karinga-fila-campos">
                <div className="karinga-campo" style={{ flex: 1.5 }}>
                  <label htmlFor="cabana-futura">Cabaña o Glamping <span className="requerido">*</span></label>
                  <select
                    id="cabana-futura"
                    className="karinga-select"
                    value={cabanaSeleccionadaId}
                    onChange={(e) => manejarSeleccionCabana(e.target.value)}
                  >
                    <option value="">-- Elija una cabaña del catálogo --</option>
                    {cabanas.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nombre} (Capacidad: {c.capacidad} pers.)
                      </option>
                    ))}
                  </select>
                </div>

                <div className="karinga-campo" style={{ flex: 1.5 }}>
                  <label htmlFor="nombre-futuro">Nombre de quien reserva <span className="requerido">*</span></label>
                  <input
                    id="nombre-futuro"
                    type="text"
                    className="karinga-input"
                    placeholder="Ej. Sofía Mendoza"
                    value={nombreReservacion}
                    onChange={(e) => setNombreReservacion(e.target.value)}
                    required
                  />
                </div>
              </div>

              {cabanaActual && (
                <>
                  <div className="karinga-fila-campos" style={{ marginTop: '1.25rem' }}>
                    <div className="karinga-campo">
                      <label htmlFor="noches-futuras">Número de Noches <span className="requerido">*</span></label>
                      <input
                        id="noches-futuras"
                        type="number"
                        min="1"
                        className="karinga-input"
                        value={noches}
                        onChange={(e) => setNoches(Math.max(1, parseInt(e.target.value, 10) || 1))}
                      />
                    </div>

                    <div className="karinga-campo">
                      <label htmlFor="huespedes-futuros">Huéspedes Totales <span className="requerido">*</span></label>
                      <input
                        id="huespedes-futuros"
                        type="number"
                        min="1"
                        className="karinga-input"
                        value={huespedesTotales}
                        onChange={(e) => setHuespedesTotales(Math.max(0, parseInt(e.target.value, 10) || 0))}
                      />
                    </div>
                  </div>

                  {renderMenuDesgloseNoches()}

                  {/* Descuento Especial ($ o %) */}
                  <div className="karinga-descuento-bloque">
                    <label htmlFor="descuento-futuro" style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--negro-carbon)', display: 'block' }}>
                      Descuento Especial (Opcional)
                    </label>
                    <div className="karinga-descuento-grid">
                      <div className="karinga-tipo-descuento-btn-group">
                        <button
                          type="button"
                          className={"karinga-tipo-descuento-btn " + (tipoDescuento === 'monto' ? 'activo' : '')}
                          onClick={() => setTipoDescuento('monto')}
                        >
                          $ Monto
                        </button>
                        <button
                          type="button"
                          className={"karinga-tipo-descuento-btn " + (tipoDescuento === 'porcentaje' ? 'activo' : '')}
                          onClick={() => setTipoDescuento('porcentaje')}
                        >
                          % Porcentaje
                        </button>
                      </div>
                      <div style={{ flex: 1, minWidth: '150px' }}>
                        <input
                          id="descuento-futuro"
                          type="number"
                          min="0"
                          max={tipoDescuento === 'porcentaje' ? 100 : undefined}
                          step={tipoDescuento === 'porcentaje' ? '1' : '0.01'}
                          className="karinga-input"
                          placeholder={tipoDescuento === 'porcentaje' ? 'Ej. 10 (para 10%)' : 'Ej. 200.00'}
                          value={valorDescuento === 0 ? '' : valorDescuento}
                          onChange={(e) => setValorDescuento(Math.max(0, parseFloat(e.target.value) || 0))}
                        />
                      </div>
                      {descuentoCalculado > 0 && (
                        <div style={{ color: 'var(--verde-oscuro)', fontWeight: 600, fontSize: '0.88rem', marginTop: '0.4rem', background: '#F0FDF4', padding: '0.45rem 0.8rem', borderRadius: '6px', border: '1px solid #BBF7D0' }}>
                          {tipoDescuento === 'monto' ? (
                            <span>
                              Ahorro aplicado: <strong>-${descuentoCalculado.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN</strong>{' '}
                              <span style={{ color: '#0369A1' }}>({porcentajeEquivalente}% de descuento sobre subtotal)</span>
                            </span>
                          ) : (
                            <span>
                              Descuento aplicado: <strong>{Number(valorDescuento) || 0}%</strong>{' '}
                              <span style={{ color: '#0369A1' }}>(Equivale a un ahorro de -${descuentoCalculado.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN)</span>
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}

              {/* Anticipo para apartar */}
              <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', padding: '1rem', borderRadius: '10px', marginTop: '1.25rem' }}>
                <h4 style={{ margin: '0 0 0.8rem 0', color: '#1E40AF', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Icono nombre="arrow-down-line" tamano={17} color="#1E40AF" /><span>Anticipo de Apartado (Pago Inicial)</span>
                </h4>
                <div className="karinga-fila-campos">
                  <div className="karinga-campo">
                    <label htmlFor="anticipo-futuro-monto">Monto de Anticipo ($ MXN) <span className="requerido">*</span></label>
                    <input
                      id="anticipo-futuro-monto"
                      type="number"
                      min="0"
                      step="0.01"
                      className="karinga-input"
                      placeholder="0.00"
                      value={anticipoFuturo === 0 ? '' : anticipoFuturo}
                      onChange={(e) => setAnticipoFuturo(Math.max(0, parseFloat(e.target.value) || 0))}
                    />
                  </div>

                  <div className="karinga-campo">
                    <label htmlFor="metodo-futuro">Método de Pago del Anticipo</label>
                    <select
                      id="metodo-futuro"
                      className="karinga-select"
                      value={metodoAnticipoFuturo}
                      onChange={(e) => setMetodoAnticipoFuturo(e.target.value)}
                    >
                      <option value="Transferencia BBVA">Transferencia BBVA</option>
                      <option value="Transferencia Bajío">Transferencia Bajío</option>
                      <option value="Airbnb">Airbnb</option>
                      <option value="Tarjeta Zettle">Tarjeta Zettle</option>
                      <option value="Web">Web</option>
                      <option value="Efectivo">Efectivo</option>
                    </select>
                  </div>

                  <div className="karinga-campo">
                    <label htmlFor="comp-futuro">Comprobante / Referencia</label>
                    <input
                      id="comp-futuro"
                      type="text"
                      className="karinga-input"
                      placeholder="Ej. Transferencia BBVA #5512"
                      value={compAnticipoFuturo}
                      onChange={(e) => setCompAnticipoFuturo(e.target.value)}
                    />
                  </div>
                </div>

                <div style={{ marginTop: '0.75rem', fontSize: '0.85rem', color: '#1E40AF' }}>
                  Esta reservación quedará registrada en el sistema. El saldo restante (<strong>${saldoPendienteFuturo.toLocaleString('es-MX')} MXN</strong>) se cobrará al momento de su llegada en la opción <em>Recepción & Liquidación</em>.
                </div>
              </div>
            </section>
          </>
        )}

        {/* MODALIDAD 3: HORAS LIBRES, PERSONAS EXTRA Y OTROS SERVICIOS */}
        {modalidad === 'horas_extra' && (
          <section className="karinga-tarjeta karinga-seccion-bloque">
            <div className="karinga-seccion-header">
              <h2 className="karinga-tarjeta-titulo" style={{ margin: 0, padding: 0, border: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Icono nombre="sparkles" tamano={22} color="var(--verde-oscuro)" />
                <span>Horas Libres, Personas Extra y Servicios a Cabaña</span>
              </h2>
            </div>

            <p style={{ fontSize: '0.9rem', color: '#475569', marginBottom: '1.25rem' }}>
              Seleccione la reservación (por semana o mediante el buscador rápido) para extender horario de salida ($250/h), registrar personas extra ($250 c/u) o agregar otros servicios personalizados.
            </p>

            {/* Filtros: Selector de Semana y Buscador Directo */}
            <div className="karinga-fila-campos" style={{ marginBottom: '1rem', background: '#F8FAFC', padding: '0.85rem', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
              <div className="karinga-campo" style={{ flex: '1.2' }}>
                <label htmlFor="semana-extras-select" style={{ fontSize: '0.85rem', fontWeight: 700, color: '#334155' }}>
                  1. Filtrar por Semana
                </label>
                <select
                  id="semana-extras-select"
                  className="karinga-select"
                  value={filtroSemanaExtras}
                  onChange={(e) => {
                    setFiltroSemanaExtras(e.target.value);
                    setReservaHistorialId('');
                  }}
                >
                  <option value="todas">Todas las semanas ({reservacionesCabanasHistorial.length} reservaciones)</option>
                  {semanasCabanas.map((s) => (
                    <option key={s.claveSemana} value={s.claveSemana}>
                      {s.etiquetaCorta} ({s.inicioTexto} al {s.finTexto}) • {s.conteo} res.
                    </option>
                  ))}
                </select>
              </div>

              <div className="karinga-campo" style={{ flex: '1.2' }}>
                <label htmlFor="busqueda-extras-input" style={{ fontSize: '0.85rem', fontWeight: 700, color: '#334155' }}>
                  2. Buscar Huésped o Cabaña
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    id="busqueda-extras-input"
                    type="text"
                    className="karinga-input"
                    placeholder="Escriba nombre del huésped o cabaña..."
                    value={busquedaExtras}
                    onChange={(e) => {
                      setBusquedaExtras(e.target.value);
                      setReservaHistorialId('');
                    }}
                    style={{ paddingRight: busquedaExtras ? '2.2rem' : '0.75rem' }}
                  />
                  {busquedaExtras && (
                    <button
                      type="button"
                      onClick={() => {
                        setBusquedaExtras('');
                        setReservaHistorialId('');
                      }}
                      style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8' }}
                      title="Limpiar búsqueda"
                    >
                      <Icono nombre="close" tamano={14} />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Dropdown de Reservaciones Filtradas */}
            <div className="karinga-campo" style={{ marginBottom: '1.25rem' }}>
              <label htmlFor="reserva-select-historial">
                3. Seleccionar Reservación de Cabaña <span className="requerido">*</span>
              </label>
              <select
                id="reserva-select-historial"
                className="karinga-select"
                value={reservaHistorialId}
                onChange={(e) => setReservaHistorialId(e.target.value)}
              >
                <option value="">-- Elija una reservación ({reservacionesFiltradasExtras.length} disponibles) --</option>
                {reservacionesFiltradasExtras.map((r) => (
                  <option key={r.id} value={r.id}>
                    [#{r.id}] {r.cabana_nombre} • {r.nombre_reservacion} (Salida actual: {r.hora_checkout || '12:00'} hrs)
                  </option>
                ))}
              </select>
            </div>

            {reservaParaHorasExtra ? (
              <div style={{ background: '#F8FAFC', border: '1px solid #CBD5E1', padding: '1.25rem', borderRadius: '10px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.8rem', fontSize: '0.85rem', marginBottom: '1.25rem', background: '#FFFFFF', padding: '0.85rem', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                  <div><strong>Cabaña:</strong> {reservaParaHorasExtra.cabana_nombre}</div>
                  <div><strong>Huésped:</strong> {reservaParaHorasExtra.nombre_reservacion}</div>
                  <div><strong>Salida Actual:</strong> {reservaParaHorasExtra.hora_checkout || '12:00'} hrs</div>
                  <div><strong>Horas Extra Previas:</strong> {horasPrevias}h</div>
                  <div><strong>Personas Extra Previas:</strong> {personasPrevias}</div>
                  <div style={{ color: '#047857' }}>
                    <strong>Total Actual Cabaña:</strong> ${totalActualReserva.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN
                  </div>
                </div>

                <h4 style={{ margin: '0 0 0.85rem 0', fontSize: '0.95rem', color: '#1E293B', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Icono nombre="sparkles" tamano={18} color="var(--verde-oscuro)" />
                  <span>Especificar Extras a Registrar</span>
                </h4>

                <div className="karinga-fila-campos">
                  <div className="karinga-campo" style={{ flex: 1 }}>
                    <label htmlFor="horas-input-h">Horas Libres / Extra ($250.00 c/u)</label>
                    <input
                      id="horas-input-h"
                      type="number"
                      min="0"
                      className="karinga-input"
                      placeholder="0"
                      value={horasExtraHistorial === 0 ? '' : horasExtraHistorial}
                      onChange={(e) => setHorasExtraHistorial(Math.max(0, parseInt(e.target.value, 10) || 0))}
                    />
                    {numHorasExtraAdd > 0 && (
                      <small style={{ color: '#059669', fontWeight: 600, display: 'block', marginTop: '0.25rem' }}>
                        +{numHorasExtraAdd}h (+${cargoHorasExtraHistorial.toLocaleString('es-MX')} MXN) • Nueva salida: {nuevaHoraSalidaExtra} hrs
                      </small>
                    )}
                  </div>

                  <div className="karinga-campo" style={{ flex: 1 }}>
                    <label htmlFor="personas-input-h">Personas Extra ($250.00 c/u)</label>
                    <input
                      id="personas-input-h"
                      type="number"
                      min="0"
                      className="karinga-input"
                      placeholder="0"
                      value={personasExtraHistorial === 0 ? '' : personasExtraHistorial}
                      onChange={(e) => setPersonasExtraHistorial(Math.max(0, parseInt(e.target.value, 10) || 0))}
                    />
                    {numPersonasExtraAdd > 0 && (
                      <small style={{ color: '#D97706', fontWeight: 600, display: 'block', marginTop: '0.25rem' }}>
                        +{numPersonasExtraAdd} pers. (+${cargoPersonasExtraHistorial.toLocaleString('es-MX')} MXN)
                      </small>
                    )}
                  </div>
                </div>

                <div className="karinga-fila-campos" style={{ marginTop: '1rem' }}>
                  <div className="karinga-campo" style={{ flex: 2 }}>
                    <label htmlFor="otro-concepto-h">Otro Servicio o Extra Personalizado</label>
                    <input
                      id="otro-concepto-h"
                      type="text"
                      className="karinga-input"
                      placeholder="Ej. Leña adicional, Renta de asador premium, Colchón extra"
                      value={otroConceptoHistorial}
                      onChange={(e) => setOtroConceptoHistorial(e.target.value)}
                    />
                  </div>

                  <div className="karinga-campo" style={{ flex: 1 }}>
                    <label htmlFor="otro-monto-h">Precio del Servicio ($ MXN)</label>
                    <input
                      id="otro-monto-h"
                      type="number"
                      min="0"
                      step="any"
                      className="karinga-input"
                      placeholder="0.00"
                      value={otroMontoHistorial}
                      onChange={(e) => setOtroMontoHistorial(e.target.value)}
                    />
                  </div>
                </div>

                <div className="karinga-fila-campos" style={{ marginTop: '1rem' }}>
                  <div className="karinga-campo" style={{ flex: 1 }}>
                    <label htmlFor="metodo-input-h">Método de Pago para los Extras</label>
                    <select
                      id="metodo-input-h"
                      className="karinga-select"
                      value={metodoPagoHorasExtra}
                      onChange={(e) => setMetodoPagoHorasExtra(e.target.value)}
                    >
                      <option value="Efectivo">Efectivo</option>
                      <option value="Tarjeta Zettle">Tarjeta Zettle</option>
                      <option value="Web">Web</option>
                      <option value="Transferencia BBVA">Transferencia BBVA</option>
                      <option value="Transferencia Bajío">Transferencia Bajío</option>
                    </select>
                  </div>

                  <div className="karinga-campo" style={{ flex: 2 }}>
                    <label htmlFor="notas-input-h">Notas u Observaciones del Cobro</label>
                    <input
                      id="notas-input-h"
                      type="text"
                      className="karinga-input"
                      placeholder="Ej. Solicitado por el huésped a mediodía en recepción"
                      value={notasExtrasHistorial}
                      onChange={(e) => setNotasExtrasHistorial(e.target.value)}
                    />
                  </div>
                </div>

                <div style={{ background: '#ECFDF5', border: '1px solid #A7F3D0', padding: '1rem', borderRadius: '8px', marginTop: '1.25rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.6rem', fontSize: '0.9rem', fontWeight: 700 }}>
                    <span>Horas Libres: +${cargoHorasExtraHistorial.toLocaleString('es-MX')} MXN</span>
                    <span>Personas Extra: +${cargoPersonasExtraHistorial.toLocaleString('es-MX')} MXN</span>
                    <span>Otros Servicios: +${cargoOtroExtraHistorial.toLocaleString('es-MX')} MXN</span>
                  </div>
                  <div style={{ borderTop: '1px dashed #6EE7B7', marginTop: '0.6rem', paddingTop: '0.6rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.6rem' }}>
                    <div style={{ color: '#065F46', fontSize: '1rem', fontWeight: 800 }}>
                      Total a Cobrar Ahora: ${cargoTotalExtrasHistorial.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN ({metodoPagoHorasExtra})
                    </div>
                    <div style={{ color: '#047857', fontSize: '0.85rem' }}>
                      Nuevo Total Cabaña: <strong>${nuevoTotalReserva.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN</strong>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', padding: '1rem', borderRadius: '8px', color: '#92400E', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Icono nombre="alert" tamano={18} color="#92400E" />
                <span>Seleccione una reservación del listado para registrar horas libres, personas extra u otros servicios.</span>
              </div>
            )}
          </section>
        )}

        {/* MODALIDAD 4: DEDUCCIÓN DE DEPÓSITO POR DAÑO O PÉRDIDA */}
        {modalidad === 'dano_deposito' && (
          <section className="karinga-tarjeta karinga-seccion-bloque">
            <div className="karinga-seccion-header">
              <h2 className="karinga-tarjeta-titulo" style={{ margin: 0, padding: 0, border: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Icono nombre="shield" tamano={22} color="var(--verde-oscuro)" />
                <span>Retención de Depósito por Artículos Dañados o Perdidos</span>
              </h2>
            </div>

            <p style={{ fontSize: '0.9rem', color: '#475569', marginBottom: '1.25rem' }}>
              Cuando los huéspedes rompen o pierden un artículo de la cabaña (llaves, controles, toallas, cristalería), el importe se descuenta directamente de su depósito de garantía, se agrega como cargo extra al total de la cabaña con el nombre del daño y el saldo restante se devuelve al huésped.
            </p>

            {/* Filtros: Selector de Semana y Buscador Directo */}
            <div className="karinga-fila-campos" style={{ marginBottom: '1rem', background: '#F8FAFC', padding: '0.85rem', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
              <div className="karinga-campo" style={{ flex: '1.2' }}>
                <label htmlFor="semana-dano-select" style={{ fontSize: '0.85rem', fontWeight: 700, color: '#334155' }}>
                  1. Filtrar por Semana
                </label>
                <select
                  id="semana-dano-select"
                  className="karinga-select"
                  value={filtroSemanaDano}
                  onChange={(e) => {
                    setFiltroSemanaDano(e.target.value);
                    setReservaDanoId('');
                  }}
                >
                  <option value="todas">Todas las semanas ({reservacionesCabanasHistorial.length} reservaciones)</option>
                  {semanasCabanas.map((s) => (
                    <option key={s.claveSemana} value={s.claveSemana}>
                      {s.etiquetaCorta} ({s.inicioTexto} al {s.finTexto}) • {s.conteo} res.
                    </option>
                  ))}
                </select>
              </div>

              <div className="karinga-campo" style={{ flex: '1.2' }}>
                <label htmlFor="busqueda-dano-input" style={{ fontSize: '0.85rem', fontWeight: 700, color: '#334155' }}>
                  2. Buscar Huésped o Cabaña
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    id="busqueda-dano-input"
                    type="text"
                    className="karinga-input"
                    placeholder="Escriba nombre del huésped o cabaña..."
                    value={busquedaDano}
                    onChange={(e) => {
                      setBusquedaDano(e.target.value);
                      setReservaDanoId('');
                    }}
                    style={{ paddingRight: busquedaDano ? '2.2rem' : '0.75rem' }}
                  />
                  {busquedaDano && (
                    <button
                      type="button"
                      onClick={() => {
                        setBusquedaDano('');
                        setReservaDanoId('');
                      }}
                      style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8' }}
                      title="Limpiar búsqueda"
                    >
                      <Icono nombre="close" tamano={14} />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Dropdown de Reservaciones Filtradas */}
            <div className="karinga-campo" style={{ marginBottom: '1.25rem' }}>
              <label htmlFor="dano-select-historial">
                3. Seleccionar Reservación de Cabaña <span className="requerido">*</span>
              </label>
              <select
                id="dano-select-historial"
                className="karinga-select"
                value={reservaDanoId}
                onChange={(e) => setReservaDanoId(e.target.value)}
              >
                <option value="">-- Elija una reservación de cabaña ({reservacionesFiltradasDano.length} disponibles) --</option>
                {reservacionesFiltradasDano.map((r) => (
                  <option key={r.id} value={r.id}>
                    [#{r.id}] {r.cabana_nombre} • {r.nombre_reservacion} (Depósito garantía: ${Number(r.deposito_requerido || 500).toLocaleString('es-MX')})
                  </option>
                ))}
              </select>
            </div>

            {reservaParaDano ? (
              <div style={{ background: '#F8FAFC', border: '1px solid #CBD5E1', padding: '1.25rem', borderRadius: '10px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.8rem', fontSize: '0.88rem', marginBottom: '1.25rem', background: '#FFFFFF', padding: '0.85rem', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                  <div><strong>Cabaña:</strong> {reservaParaDano.cabana_nombre}</div>
                  <div><strong>Huésped:</strong> {reservaParaDano.nombre_reservacion}</div>
                  <div><strong>Depósito en Garantía:</strong> ${depositoEnGarantia.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN</div>
                  <div style={{ color: '#047857' }}>
                    <strong>Total Actual Cabaña:</strong> ${(Number(reservaParaDano.total) || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN
                  </div>
                </div>

                <div className="karinga-fila-campos">
                  <div className="karinga-campo" style={{ flex: '2' }}>
                    <label htmlFor="dano-concepto">Artículo Dañado o Perdido <span className="requerido">*</span></label>
                    <input
                      id="dano-concepto"
                      type="text"
                      className="karinga-input"
                      placeholder="Ej. Llave extraviada, Toalla quemada, Control de TV roto, Vaso despostillado"
                      value={conceptoDano}
                      onChange={(e) => setConceptoDano(e.target.value)}
                    />
                  </div>

                  <div className="karinga-campo" style={{ flex: '1', maxWidth: '240px' }}>
                    <label htmlFor="dano-monto">Monto a Descontar ($) <span className="requerido">*</span></label>
                    <input
                      id="dano-monto"
                      type="number"
                      min="1"
                      step="any"
                      className="karinga-input"
                      placeholder="0.00"
                      value={montoDano}
                      onChange={(e) => setMontoDano(e.target.value)}
                    />
                  </div>
                </div>

                <div className="karinga-campo" style={{ marginTop: '0.75rem' }}>
                  <label htmlFor="dano-notas">Notas u Observaciones Adicionales</label>
                  <input
                    id="dano-notas"
                    type="text"
                    className="karinga-input"
                    placeholder="Ej. Se le informó al huésped en recepción al momento del check-out"
                    value={notasDano}
                    onChange={(e) => setNotasDano(e.target.value)}
                  />
                </div>

                <div className="karinga-dano-banner" style={{ marginTop: '1rem', padding: '1rem', borderRadius: '8px', background: '#FEF2F2', border: '1px solid #FECACA' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.6rem', fontWeight: 700, fontSize: '0.9rem' }}>
                    <span>Depósito Original: ${depositoEnGarantia.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
                    <span style={{ color: '#DC2626' }}>Retención por daño (se suma a cabaña): -${montDanoNum.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
                    <span style={{ color: '#15803D' }}>Resto a devolver al huésped: ${depositoDevolver.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: '#991B1B' }}>
                    * El importe retenido (${montDanoNum.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN) se sumará al subtotal y total de la cabaña con el concepto del daño y se registrará en las métricas de reportes.
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', padding: '1rem', borderRadius: '8px', color: '#92400E', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Icono nombre="alert" tamano={18} color="#92400E" />
                <span>Seleccione una reservación del listado para gestionar deducciones de su depósito de garantía.</span>
              </div>
            )}
          </section>
        )}
      </main>

      {/* Ticket Resumen Lateral */}
      <aside className="karinga-resumen-sidebar">
        <div className="karinga-ticket">
          <div className="karinga-ticket-header">
            <Icono nombre="bed" tamano={24} color="#FFFFFF" />
            <h3 className="karinga-ticket-titulo">
              {modalidad === 'checkin_completo' && 'Recepción y Cobro'}
              {modalidad === 'nueva_reserva' && 'Apartado Futuro'}
              {modalidad === 'horas_extra' && 'Horas Libres y Extras'}
              {modalidad === 'dano_deposito' && 'Deducción Depósito'}
            </h3>
            <small style={{ color: '#D1FAE5' }}>Karinga Ecoturismo</small>
          </div>

          <div className="karinga-ticket-cuerpo">
            {modalidad === 'checkin_completo' && (
              <>
                {cabanaActual ? (
                  <div>
                    <div className="karinga-ticket-linea">
                      <span><strong>{cabanaActual.nombre}</strong></span>
                      <span>${costoCabana.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
                    </div>
                    <small style={{ color: 'var(--gris-medio)', fontSize: '0.8rem' }}>
                      {numNoches} noche(s) {resumenTarifasTexto ? `• ${resumenTarifasTexto}` : `× $${precioNoche.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`}
                    </small>
                  </div>
                ) : (
                  <div className="karinga-ticket-linea" style={{ color: 'var(--gris-medio)', fontStyle: 'italic' }}>
                    <span>Seleccione una cabaña</span>
                    <span>$0.00</span>
                  </div>
                )}

                {personasExtra > 0 && (
                  <div className="karinga-ticket-linea" style={{ color: '#B45309' }}>
                    <span>+{personasExtra} Huésped(es) extra ($250 c/u)</span>
                    <span>+${cargoPersonasExtra.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
                  </div>
                )}

                {numHorasExtraLlegada > 0 && (
                  <div className="karinga-ticket-linea" style={{ color: '#0A2540' }}>
                    <span>+{numHorasExtraLlegada}h Extra ($250 c/u)</span>
                    <span>+${cargoHorasExtraLlegada.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
                  </div>
                )}

                <div className="karinga-ticket-separador" />

                <div className="karinga-ticket-linea">
                  <span>Total Estancia</span>
                  <strong>${totalGeneralHospedaje.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</strong>
                </div>

                {anticipoEfectivo > 0 && (
                  <div className="karinga-ticket-linea" style={{ color: '#0369A1' }}>
                    <span>Pago Anterior Registrado ({metodoPagoAnterior})</span>
                    <strong>-${anticipoEfectivo.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</strong>
                  </div>
                )}

                <div className="karinga-ticket-total-box">
                  <span className="karinga-ticket-total-label">Saldo a Liquidar en Recepción</span>
                  <div className="karinga-ticket-total-monto">
                    ${cobroEnManoAhorita.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                  </div>
                  <small style={{ color: '#A7F3D0', fontSize: '0.75rem' }}>Liquidación final vía {metodoPagoActual}</small>
                </div>

                {errorValidacion && (
                  <div style={{ color: 'var(--rojo-alerta)', fontSize: '0.85rem', fontWeight: 600, textAlign: 'center' }}>
                    {errorValidacion}
                  </div>
                )}

                <button
                  type="button"
                  className="karinga-btn-registrar"
                  onClick={manejarEnvioCheckinCompleto}
                  disabled={registrando || !cabanaActual}
                >
                  <span>{registrando ? 'Registrando...' : 'Registrar Entrada y Liquidación'}</span>
                </button>
              </>
            )}

            {modalidad === 'nueva_reserva' && (
              <>
                <div className="karinga-ticket-linea">
                  <span>Cabaña:</span>
                  <strong>{cabanaActual?.nombre || 'Sin seleccionar'}</strong>
                </div>
                <div className="karinga-ticket-linea">
                  <span>Total Cabaña:</span>
                  <strong>${totalGeneralHospedaje.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</strong>
                </div>
                {resumenTarifasTexto && (
                  <small style={{ color: 'var(--gris-medio)', fontSize: '0.78rem', display: 'block', marginTop: '-0.3rem', marginBottom: '0.4rem' }}>
                    {numNoches} noche(s) • {resumenTarifasTexto}
                  </small>
                )}
                <div className="karinga-ticket-linea" style={{ color: '#0369A1' }}>
                  <span>Anticipo de Apartado:</span>
                  <strong>${Number(anticipoFuturo || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}</strong>
                </div>

                <div className="karinga-ticket-total-box" style={{ background: '#0F766E' }}>
                  <span className="karinga-ticket-total-label">Saldo Pendiente al Llegar</span>
                  <div className="karinga-ticket-total-monto">
                    ${saldoPendienteFuturo.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                  </div>
                  <small style={{ color: '#CCFBF1', fontSize: '0.75rem' }}>A cobrar el día del check-in</small>
                </div>

                {errorValidacion && (
                  <div style={{ color: 'var(--rojo-alerta)', fontSize: '0.85rem', fontWeight: 600, textAlign: 'center' }}>
                    {errorValidacion}
                  </div>
                )}

                <button
                  type="button"
                  className="karinga-btn-registrar"
                  onClick={manejarEnvioReservaFutura}
                  disabled={registrando || !cabanaActual || Number(anticipoFuturo) <= 0}
                >
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem' }}>
                    <Icono nombre={registrando ? 'clock' : 'check'} tamano={18} />
                    <span>{registrando ? 'Registrando...' : 'Confirmar Reservación Futura'}</span>
                  </span>
                </button>
              </>
            )}

            {modalidad === 'horas_extra' && (
              <>
                <div className="karinga-ticket-linea">
                  <span>Cabaña:</span>
                  <strong>{reservaParaHorasExtra?.cabana_nombre || 'Sin seleccionar'}</strong>
                </div>
                <div className="karinga-ticket-linea">
                  <span>Huésped:</span>
                  <strong>{reservaParaHorasExtra?.nombre_reservacion || '-'}</strong>
                </div>

                {numHorasExtraAdd > 0 && (
                  <div className="karinga-ticket-linea" style={{ color: '#059669' }}>
                    <span>+{numHorasExtraAdd}h Libres/Extra ($250 c/u)</span>
                    <strong>+${cargoHorasExtraHistorial.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</strong>
                  </div>
                )}

                {numPersonasExtraAdd > 0 && (
                  <div className="karinga-ticket-linea" style={{ color: '#D97706' }}>
                    <span>+{numPersonasExtraAdd} Persona(s) Extra ($250 c/u)</span>
                    <strong>+${cargoPersonasExtraHistorial.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</strong>
                  </div>
                )}

                {cargoOtroExtraHistorial > 0 && (
                  <div className="karinga-ticket-linea" style={{ color: '#7C3AED' }}>
                    <span>+{otroConceptoHistorial || 'Otro Servicio Extra'}</span>
                    <strong>+${cargoOtroExtraHistorial.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</strong>
                  </div>
                )}

                <div className="karinga-ticket-separador" />

                <div className="karinga-ticket-linea" style={{ color: '#047857' }}>
                  <span>Nuevo Total Cabaña:</span>
                  <strong>${nuevoTotalReserva.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</strong>
                </div>
                <div className="karinga-ticket-linea">
                  <span>Método de Pago:</span>
                  <span className="badge-pago">{metodoPagoHorasExtra}</span>
                </div>

                <div className="karinga-ticket-total-box">
                  <span className="karinga-ticket-total-label">Total Extras a Cobrar</span>
                  <div className="karinga-ticket-total-monto">
                    ${cargoTotalExtrasHistorial.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                  </div>
                  <small style={{ color: '#A7F3D0', fontSize: '0.75rem' }}>
                    {numHorasExtraAdd > 0 ? `Salida extendida: ${nuevaHoraSalidaExtra} hrs` : 'Cobro inmediato en recepción'}
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
                  onClick={manejarEnvioHorasExtraHistorial}
                  disabled={registrando || !reservaParaHorasExtra || cargoTotalExtrasHistorial <= 0}
                >
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem' }}>
                    <Icono nombre={registrando ? 'clock' : 'check'} tamano={18} />
                    <span>{registrando ? 'Guardando...' : 'Cobrar y Registrar Extras'}</span>
                  </span>
                </button>
              </>
            )}

            {modalidad === 'dano_deposito' && (
              <>
                <div className="karinga-ticket-linea">
                  <span>Cabaña:</span>
                  <strong>{reservaParaDano ? reservaParaDano.cabana_nombre : 'Sin seleccionar'}</strong>
                </div>
                <div className="karinga-ticket-linea">
                  <span>Huésped:</span>
                  <strong>{reservaParaDano ? reservaParaDano.nombre_reservacion : '-'}</strong>
                </div>
                <div className="karinga-ticket-linea">
                  <span>Concepto Daño:</span>
                  <strong style={{ color: '#DC2626' }}>{conceptoDano || 'Sin especificar'}</strong>
                </div>
                <div className="karinga-ticket-linea">
                  <span>Depósito Garantía:</span>
                  <strong>${depositoEnGarantia.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</strong>
                </div>
                <div className="karinga-ticket-linea">
                  <span>Devolución al Huésped:</span>
                  <strong style={{ color: '#15803D' }}>${depositoDevolver.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</strong>
                </div>

                <div className="karinga-ticket-separador" />

                <div className="karinga-ticket-total-box" style={{ background: '#7F1D1D' }}>
                  <span className="karinga-ticket-total-label">Deducción de Depósito</span>
                  <div className="karinga-ticket-total-monto">
                    ${montDanoNum.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                  </div>
                  <small style={{ color: '#FECACA', fontSize: '0.75rem' }}>Se suma a la cabaña como cargo extra</small>
                </div>

                {errorValidacion && (
                  <div style={{ color: 'var(--rojo-alerta)', fontSize: '0.85rem', fontWeight: 600, textAlign: 'center' }}>
                    {errorValidacion}
                  </div>
                )}

                <button
                  type="button"
                  className="karinga-btn-registrar"
                  onClick={manejarEnvioDanoDeposito}
                  disabled={registrando || !reservaParaDano || montDanoNum <= 0 || !conceptoDano.trim()}
                >
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem' }}>
                    <Icono nombre={registrando ? 'clock' : 'check'} tamano={18} />
                    <span>{registrando ? 'Guardando...' : 'Confirmar Deducción de Depósito'}</span>
                  </span>
                </button>
              </>
            )}
          </div>
        </div>
      </aside>

      <ModalSincronizarCalendario
        abierto={modalSincronizarAbierto}
        alCerrar={() => setModalSincronizarAbierto(false)}
        alSeleccionarReservacion={manejarSeleccionarReservacionCalendario}
      />
    </div>
  );
}

