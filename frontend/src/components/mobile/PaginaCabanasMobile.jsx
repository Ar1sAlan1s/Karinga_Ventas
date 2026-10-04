import { useState, useMemo } from 'react';
import Icono from '../Icono';
import ModalSincronizarCalendario from '../ModalSincronizarCalendario';
import { sincronizarCalendariosApi } from '../../servicios/api';
import { METODOS_PAGO, METODOS_PAGO_ANTICIPO, METODOS_PAGO_LIQUIDACION } from '../../constantes/datosIniciales';
import { calcularNoches, calcularFechaCheckout } from '../../utilidades/gestorNoches';
import {
  determinarInfoFecha,
  calcularDesgloseNoches,
  formatearFechaConDia,
  formatearHora12
} from '../../utilidades/gestorTemporadas';
import {
  obtenerSemanaActual,
  obtenerProximaSemana,
  estaReservaEnSemana
} from '../../utilidades/gestorSemanas';

const obtenerIconoPago = (metodo) => {
  if (!metodo) return 'cash';
  if (metodo.includes('Efectivo')) return 'cash';
  if (metodo.includes('Tarjeta') || metodo.includes('Zettle')) return 'credit-card';
  if (metodo.includes('Web')) return 'web';
  if (metodo.includes('Airbnb')) return 'bed';
  return 'bank';
};

export default function PaginaCabanasMobile({
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
  // Pestaña principal de la vista móvil
  const [subpestana, setSubpestana] = useState('checkin'); // 'checkin' | 'nueva' | 'extras'
  const [filtroSemana, setFiltroSemana] = useState('actual'); // 'actual' | 'proxima' | 'todas'
  const [busqueda, setBusqueda] = useState('');
  const [modalSincronizarAbierto, setModalSincronizarAbierto] = useState(false);
  const [sincronizandoGlobal, setSincronizandoGlobal] = useState(false);
  const [mensajeSync, setMensajeSync] = useState(null);

  // Estado de Reservación en proceso de Check-in (2 Pagos: Anticipo + Liquidación)
  const [reservaSeleccionada, setReservaSeleccionada] = useState(null);
  const [montoAnticipoCheckin, setMontoAnticipoCheckin] = useState(0);
  const [metodoPagoAnticipoCheckin, setMetodoPagoAnticipoCheckin] = useState('Transferencia BBVA');
  const [comprobanteAnticipoCheckin, setComprobanteAnticipoCheckin] = useState('');
  const [metodoPagoLiquidacion, setMetodoPagoLiquidacion] = useState('Efectivo');
  const [comprobanteLiquidacion, setComprobanteLiquidacion] = useState('');
  const [descuentoCheckin, setDescuentoCheckin] = useState(0);

  // Estado para Nueva Reservación
  const [nuevaCabanaId, setNuevaCabanaId] = useState('');
  const [nuevoNombreHuesped, setNuevoNombreHuesped] = useState('');
  const [nuevasNoches, setNuevasNoches] = useState(1);
  const [modalidadCobroNueva, setModalidadCobroNueva] = useState('anticipo'); // 'anticipo' | 'total' | 'pendiente'
  const [nuevoAnticipo, setNuevoAnticipo] = useState('');
  const [nuevoMetodoPago, setNuevoMetodoPago] = useState('Transferencia BBVA');
  const [nuevoComprobante, setNuevoComprobante] = useState('');

  // Cabaña seleccionada y total calculado para nueva reservación
  const cabanaSeleccionadaObj = useMemo(() => {
    return cabanas.find((c) => String(c.id) === String(nuevaCabanaId)) || null;
  }, [cabanas, nuevaCabanaId]);

  const totalEstanciaNueva = useMemo(() => {
    if (!cabanaSeleccionadaObj) return 0;
    const desglose = calcularDesgloseNoches(fecha, nuevasNoches, diasTemporadaAlta, cabanaSeleccionadaObj);
    return desglose.reduce((sum, n) => sum + (n.precio || 0), 0);
  }, [cabanaSeleccionadaObj, fecha, nuevasNoches, diasTemporadaAlta]);

  // Estado para Extras & Daños
  const [extraReservaId, setExtraReservaId] = useState('');
  const [horasExtra, setHorasExtra] = useState(0);
  const [personasExtra, setPersonasExtra] = useState(0);
  const [otroConceptoExtra, setOtroConceptoExtra] = useState('');
  const [otroMontoExtra, setOtroMontoExtra] = useState('');
  const [metodoPagoExtras, setMetodoPagoExtras] = useState('Efectivo');

  // Mensajes de error / validación
  const [errorMensaje, setErrorMensaje] = useState('');

  // Reservaciones pendientes de cobro (creadas por Google Calendar o manuales con saldo)
  const reservacionesPendientes = useMemo(() => {
    return ventas.filter((v) => {
      if (!v.cabana_id) return false;
      const estado = String(v.estado_pago || '').toLowerCase();
      const saldo = Number(v.saldo_pendiente);
      const total = Number(v.total) || 0;
      const anticipo = Number(v.anticipo) || 0;
      return (
        estado === 'pendiente' ||
        estado === 'no pagado' ||
        estado === 'anticipo_pagado' ||
        estado === 'apartado' ||
        saldo > 0 ||
        (anticipo < total && estado !== 'liquidado')
      );
    });
  }, [ventas]);

  const semanaActual = useMemo(() => obtenerSemanaActual(), []);
  const proximaSemana = useMemo(() => obtenerProximaSemana(), []);

  const pendientesEstaSemana = useMemo(() => {
    if (!semanaActual) return [];
    return reservacionesPendientes.filter((r) => estaReservaEnSemana(r, semanaActual));
  }, [reservacionesPendientes, semanaActual]);

  const pendientesProximaSemana = useMemo(() => {
    if (!proximaSemana) return [];
    return reservacionesPendientes.filter((r) => estaReservaEnSemana(r, proximaSemana));
  }, [reservacionesPendientes, proximaSemana]);

  // Lista filtrada para la vista móvil
  const reservacionesMostradas = useMemo(() => {
    let lista = reservacionesPendientes;
    if (filtroSemana === 'actual') {
      lista = pendientesEstaSemana;
    } else if (filtroSemana === 'proxima') {
      lista = pendientesProximaSemana;
    }

    if (!busqueda.trim()) return lista;
    const q = busqueda.toLowerCase().trim();
    return lista.filter((r) => {
      const nom = (r.nombre_reservacion || '').toLowerCase();
      const cab = (r.cabana_nombre || '').toLowerCase();
      const fec = (r.fecha_checkin || r.fecha || '').toLowerCase();
      return nom.includes(q) || cab.includes(q) || fec.includes(q);
    });
  }, [reservacionesPendientes, filtroSemana, pendientesEstaSemana, pendientesProximaSemana, busqueda]);

  // Sincronización rápida
  const ejecutarSincronizacion = async () => {
    setSincronizandoGlobal(true);
    setMensajeSync(null);
    try {
      const res = await sincronizarCalendariosApi(null);
      setMensajeSync({
        tipo: 'exito',
        texto: res.mensaje || `Sincronización completada (${res.creadas || 0} creadas)`
      });
      if (alRecargarVentas) await alRecargarVentas();
    } catch (err) {
      setMensajeSync({ tipo: 'error', texto: err.message || 'Error al sincronizar' });
    } finally {
      setSincronizandoGlobal(false);
      setTimeout(() => setMensajeSync(null), 4000);
    }
  };

  // Manejar click en "Cobrar Check-in" de una tarjeta
  const iniciarCheckinDeReserva = (reserva) => {
    setReservaSeleccionada(reserva);
    const ant = Number(reserva.anticipo) || 0;
    setMontoAnticipoCheckin(ant);
    setMetodoPagoAnticipoCheckin(reserva.metodo_pago_anticipo || (ant > 0 ? 'Transferencia BBVA' : 'Transferencia BBVA'));
    setComprobanteAnticipoCheckin(reserva.comprobante_anticipo || '');
    setDescuentoCheckin(Number(reserva.descuento_especial) || 0);
    setMetodoPagoLiquidacion(reserva.metodo_pago_liquidacion || 'Efectivo');
    setComprobanteLiquidacion('');
    setErrorMensaje('');
  };

  // Confirmar cobro de Check-in (Registra Pago 1 de Anticipo y Pago 2 de Liquidación)
  const confirmarCobroCheckin = async () => {
    if (!reservaSeleccionada) return;
    setErrorMensaje('');

    const totalReserva = Number(reservaSeleccionada.total) || 0;
    const anticipoNum = Math.max(0, Number(montoAnticipoCheckin) || 0);
    const descNum = Math.max(0, Number(descuentoCheckin) || 0);
    const saldoFinal = Math.max(0, Math.round((totalReserva - anticipoNum - descNum) * 100) / 100);

    try {
      if (alLiquidarSaldo) {
        await alLiquidarSaldo(reservaSeleccionada.id, {
          anticipo: anticipoNum,
          metodo_pago_anticipo: anticipoNum > 0 ? metodoPagoAnticipoCheckin : null,
          comprobante_anticipo: comprobanteAnticipoCheckin.trim(),
          monto_liquidado: saldoFinal,
          metodo_pago_liquidacion: saldoFinal > 0 ? metodoPagoLiquidacion : null,
          metodo_pago: saldoFinal > 0 ? metodoPagoLiquidacion : (anticipoNum > 0 ? metodoPagoAnticipoCheckin : 'Efectivo'),
          comprobante_pago: comprobanteLiquidacion.trim(),
          descuento_especial: descNum,
          total: totalReserva,
          notas: `Check-in completado en recepción el ${fecha} ${hora} [Anticipo: $${anticipoNum} vía ${metodoPagoAnticipoCheckin}, Liquidación: $${saldoFinal} vía ${metodoPagoLiquidacion}${descNum > 0 ? `, Descuento: $${descNum}` : ''}]`
        }, () => {
          setReservaSeleccionada(null);
          if (alRecargarVentas) alRecargarVentas();
        });
      }
    } catch (err) {
      setErrorMensaje(err.message || 'Error al registrar el cobro de check-in');
    }
  };

  // Crear nueva reservación (con soporte de modalidades: Anticipo, Pago Total o Sin Anticipo)
  const crearNuevaReservacion = () => {
    setErrorMensaje('');
    if (!nuevaCabanaId) {
      setErrorMensaje('Selecciona una cabaña');
      return;
    }
    if (!nuevoNombreHuesped.trim()) {
      setErrorMensaje('Ingresa el nombre del huésped');
      return;
    }

    const cabanaObj = cabanas.find((c) => String(c.id) === String(nuevaCabanaId));
    if (!cabanaObj) return;

    const desglose = calcularDesgloseNoches(fecha, nuevasNoches, diasTemporadaAlta, cabanaObj);
    const totalEstancia = desglose.reduce((sum, n) => sum + (n.precio || 0), 0);
    const costoPromedioNoche = nuevasNoches > 0 ? Math.round(totalEstancia / nuevasNoches) : 0;

    let anticipoFinal = 0;
    let montoLiquidado = 0;
    let saldoPendiente = totalEstancia;
    let metodoPagoGeneral = nuevoMetodoPago || 'Transferencia BBVA';
    let metodoPagoAnticipoFinal = null;
    let metodoPagoLiquidacionFinal = null;
    let estadoPago = 'pendiente_liquidacion';

    if (modalidadCobroNueva === 'anticipo') {
      anticipoFinal = Number(nuevoAnticipo) || 0;
      saldoPendiente = Math.max(0, totalEstancia - anticipoFinal);
      montoLiquidado = 0;
      metodoPagoAnticipoFinal = anticipoFinal > 0 ? nuevoMetodoPago : null;
      metodoPagoGeneral = nuevoMetodoPago || 'Transferencia BBVA';
      estadoPago = saldoPendiente <= 0 ? 'liquidado' : (anticipoFinal > 0 ? 'anticipo_pagado' : 'pendiente_liquidacion');
    } else if (modalidadCobroNueva === 'total') {
      anticipoFinal = 0;
      montoLiquidado = totalEstancia;
      saldoPendiente = 0;
      metodoPagoGeneral = nuevoMetodoPago || 'Efectivo';
      metodoPagoLiquidacionFinal = nuevoMetodoPago || 'Efectivo';
      estadoPago = 'liquidado';
    } else if (modalidadCobroNueva === 'pendiente') {
      anticipoFinal = 0;
      montoLiquidado = 0;
      saldoPendiente = totalEstancia;
      metodoPagoGeneral = 'Pendiente';
      estadoPago = 'pendiente_liquidacion';
    }

    const checkoutCalculado = calcularFechaCheckout(fecha, nuevasNoches);

    const payload = {
      tipo: 'cabanas',
      fecha,
      hora,
      temporada,
      cabana_id: cabanaObj.id,
      nombre_reservacion: nuevoNombreHuesped.trim(),
      noches: nuevasNoches,
      fecha_checkin: fecha,
      fecha_checkout: checkoutCalculado,
      huespedes_totales: cabanaObj.capacidad,
      personas_extra: 0,
      horas_extra: 0,
      costo_noche: costoPromedioNoche,
      subtotal_estancia: totalEstancia,
      total: totalEstancia,
      deposito_garantia: cabanaObj.deposito,
      anticipo: anticipoFinal,
      metodo_pago_anticipo: metodoPagoAnticipoFinal,
      comprobante_anticipo: (modalidadCobroNueva === 'anticipo' && nuevoComprobante) ? nuevoComprobante.trim() : null,
      estado_pago: estadoPago,
      saldo_pendiente: saldoPendiente,
      monto_liquidado: montoLiquidado,
      metodo_pago_liquidacion: metodoPagoLiquidacionFinal,
      metodo_pago: metodoPagoGeneral,
      comprobante_pago: (modalidadCobroNueva === 'total' && nuevoComprobante) ? nuevoComprobante.trim() : null,
      descuento_especial: 0,
      notas: `Reservación creada desde móvil el ${fecha} (${modalidadCobroNueva === 'total' ? 'Pago Total Liquidado' : (modalidadCobroNueva === 'anticipo' ? `Anticipo de $${anticipoFinal} vía ${metodoPagoGeneral}` : 'Sin Anticipo')})`
    };

    if (alRegistrar) {
      alRegistrar(payload, () => {
        setNuevaCabanaId('');
        setNuevoNombreHuesped('');
        setNuevasNoches(1);
        setNuevoAnticipo('');
        setNuevoComprobante('');
        setModalidadCobroNueva('anticipo');
        setSubpestana('checkin');
      });
    }
  };

  return (
    <div className="karinga-mobile-page">
      {/* Selector de Modo / Sub-pestañas móviles */}
      <div className="karinga-mobile-segmented-tabs">
        <button
          type="button"
          className={`karinga-mobile-tab-btn ${subpestana === 'checkin' ? 'activo' : ''}`}
          onClick={() => {
            setSubpestana('checkin');
            setReservaSeleccionada(null);
          }}
        >
          <Icono nombre="calendar-check" tamano={16} color="currentColor" />
          <span>Llegadas ({pendientesEstaSemana.length})</span>
        </button>

        <button
          type="button"
          className={`karinga-mobile-tab-btn ${subpestana === 'nueva' ? 'activo' : ''}`}
          onClick={() => {
            setSubpestana('nueva');
            setReservaSeleccionada(null);
          }}
        >
          <Icono nombre="bed" tamano={16} color="currentColor" />
          <span>Nueva Reserva</span>
          <span>+ Nueva Reserva</span>
        </button>

        <button
          type="button"
          className={`karinga-mobile-tab-btn ${subpestana === 'extras' ? 'activo' : ''}`}
          onClick={() => {
            setSubpestana('extras');
            setReservaSeleccionada(null);
          }}
        >
          <Icono nombre="sparkles" tamano={16} color="currentColor" />
          <span>Extras</span>
        </button>
      </div>

      {/* AVISO TEMPORAL DE SINCRONIZACIÓN */}
      {mensajeSync && (
        <div className={`karinga-mobile-toast-inline ${mensajeSync.tipo}`}>
          <Icono nombre={mensajeSync.tipo === 'exito' ? 'check' : 'alert'} tamano={15} color="currentColor" />
          <span>{mensajeSync.texto}</span>
        </div>
      )}

      {/* ============================================================== */}
      {/* SUBPESTAÑA 1: LLEGADAS Y CHECK-IN                              */}
      {/* ============================================================== */}
      {subpestana === 'checkin' && !reservaSeleccionada && (
        <div className="karinga-mobile-section">
          {/* Barra de Sincronización y Búsqueda */}
          <div className="karinga-mobile-quick-actions">
            <button
              type="button"
              className="karinga-mobile-sync-hero-btn"
              onClick={ejecutarSincronizacion}
              disabled={sincronizandoGlobal}
            >
              <span className={`karinga-mobile-sync-icon ${sincronizandoGlobal ? 'anim-spin' : ''}`}>
                <Icono nombre="refresh" tamano={16} color="#FFFFFF" />
              </span>
              <span>{sincronizandoGlobal ? 'Sincronizando...' : 'Sincronizar Calendarios'}</span>
            </button>

            <button
              type="button"
              className="karinga-mobile-search-toggle"
              onClick={() => setModalSincronizarAbierto(true)}
              title="Ver modal detallado de Google Calendar"
            >
              <Icono nombre="calendar" tamano={16} color="var(--verde-oscuro)" />
              <span>Ver Google Calendar</span>
            </button>
          </div>

          {/* Filtros de Llegada por Semana */}
          <div className="karinga-mobile-filter-pills">
            <button
              type="button"
              className={`karinga-mobile-pill ${filtroSemana === 'actual' ? 'activo' : ''}`}
              onClick={() => setFiltroSemana('actual')}
            >
              <Icono nombre="calendar-check" tamano={13} color="currentColor" />
              <span>Esta Semana ({pendientesEstaSemana.length})</span>
            </button>

            <button
              type="button"
              className={`karinga-mobile-pill ${filtroSemana === 'proxima' ? 'activo' : ''}`}
              onClick={() => setFiltroSemana('proxima')}
            >
              <Icono nombre="calendar" tamano={13} color="currentColor" />
              <span>Próxima ({pendientesProximaSemana.length})</span>
            </button>

            <button
              type="button"
              className={`karinga-mobile-pill ${filtroSemana === 'todas' ? 'activo' : ''}`}
              onClick={() => setFiltroSemana('todas')}
            >
              <Icono nombre="calendar-days" tamano={13} color="currentColor" />
              <span>Todas ({reservacionesPendientes.length})</span>
            </button>
          </div>

          {/* Campo de búsqueda rápida */}
          <div className="karinga-mobile-search-box">
            <Icono nombre="search" tamano={14} color="#94A3B8" />
            <input
              type="text"
              placeholder="Buscar huésped o cabaña..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
            {busqueda && (
              <button type="button" onClick={() => setBusqueda('')}>
                <Icono nombre="close" tamano={12} color="#94A3B8" />
              </button>
            )}
          </div>

          {/* Listado de Tarjetas de Llegada Espaciosas */}
          <div className="karinga-mobile-cards-list">
            {reservacionesMostradas.length === 0 ? (
              <div className="karinga-mobile-empty-state">
                <Icono nombre="bed" tamano={32} color="#94A3B8" />
                <h4>No hay llegadas pendientes</h4>
                <p>
                  {filtroSemana === 'actual'
                    ? 'No hay reservaciones pendientes para esta semana.'
                    : 'No se encontraron reservaciones con el filtro seleccionado.'}
                </p>
                {filtroSemana !== 'todas' && (
                  <button
                    type="button"
                    className="karinga-mobile-empty-action"
                    onClick={() => setFiltroSemana('todas')}
                  >
                    Ver todas las semanas ({reservacionesPendientes.length})
                  </button>
                )}
                <button
                  type="button"
                  className="karinga-mobile-empty-action"
                  style={{
                    marginTop: '0.65rem',
                    background: '#15803D',
                    color: '#FFFFFF',
                    borderColor: '#15803D',
                    fontWeight: 600,
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.4rem'
                  }}
                  onClick={() => setSubpestana('nueva')}
                >
                  <Icono nombre="bed" tamano={15} color="#FFFFFF" />
                  <span>+ Registrar Nueva Reservación</span>
                </button>
              </div>
            ) : (
              reservacionesMostradas.map((reserva) => {
                const saldo = Number(reserva.saldo_pendiente) > 0
                  ? Number(reserva.saldo_pendiente)
                  : Number(reserva.total) - Number(reserva.anticipo || 0);

                const fechaIn = (reserva.fecha_checkin || reserva.fecha || '').split('T')[0];
                const fechaOut = (reserva.fecha_checkout || '').split('T')[0];
                const esDeGCal = (reserva.notas || '').includes('[GCAL_EVENT_ID:');

                return (
                  <article key={reserva.id} className="karinga-mobile-arrival-card">
                    <div className="karinga-mobile-card-top">
                      <span className="karinga-mobile-cabin-badge">
                        <Icono nombre="bed" tamano={12} color="#FFFFFF" />
                        {reserva.cabana_nombre}
                      </span>
                      {esDeGCal && (
                        <span className="karinga-mobile-gcal-tag">
                          Google Calendar
                        </span>
                      )}
                      <span className="karinga-mobile-nights-tag">
                        {reserva.noches} {reserva.noches === 1 ? 'noche' : 'noches'}
                      </span>
                    </div>

                    <h3 className="karinga-mobile-guest-name">
                      {reserva.nombre_reservacion}
                    </h3>

                    <div className="karinga-mobile-dates-row">
                      <span>Llegada: <strong>{formatearFechaConDia(fechaIn, 'media')}</strong></span>
                      <span>•</span>
                      <span>Salida: <strong>{formatearFechaConDia(fechaOut, 'media') || '12:00'}</strong></span>
                    </div>

                    <div className="karinga-mobile-card-footer">
                      <div className="karinga-mobile-balance-box">
                        <span className="karinga-mobile-balance-label">Por Cobrar:</span>
                        <strong className="karinga-mobile-balance-amount">
                          ${saldo.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN
                        </strong>
                      </div>

                      <button
                        type="button"
                        className="karinga-mobile-checkin-action-btn"
                        onClick={() => iniciarCheckinDeReserva(reserva)}
                      >
                        <Icono nombre="hand-coins" tamano={16} color="#FFFFFF" />
                        <span>Hacer Check-in</span>
                      </button>
                    </div>
                  </article>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* FORMULARIO DE COBRO Y CHECK-IN DIRECTO (CUANDO SE SELECCIONA)  */}
      {/* ============================================================== */}
      {subpestana === 'checkin' && reservaSeleccionada && (
        <div className="karinga-mobile-checkin-sheet">
          <div className="karinga-mobile-sheet-header">
            <div>
              <span className="karinga-mobile-sheet-sub">Registrar Check-in de Huésped</span>
              <h2 className="karinga-mobile-sheet-title">{reservaSeleccionada.nombre_reservacion}</h2>
            </div>
            <button
              type="button"
              className="karinga-mobile-sheet-close"
              onClick={() => setReservaSeleccionada(null)}
            >
              <Icono nombre="close" tamano={16} color="#334155" />
            </button>
          </div>

          <div className="karinga-mobile-sheet-summary">
            <div className="karinga-mobile-summary-pill">
              <span>Cabaña:</span>
              <strong>{reservaSeleccionada.cabana_nombre}</strong>
            </div>
            <div className="karinga-mobile-summary-pill">
              <span>Estancia:</span>
              <strong>{reservaSeleccionada.noches} noche(s)</strong>
            </div>
            <div className="karinga-mobile-summary-pill">
              <span>Total Estancia:</span>
              <strong>${(Number(reservaSeleccionada.total) || 0).toLocaleString('es-MX')} MXN</strong>
            </div>
          </div>

          {errorMensaje && (
            <div className="karinga-mobile-error-box">
              <Icono nombre="alert" tamano={15} color="#DC2626" />
              <span>{errorMensaje}</span>
            </div>
          )}

          {/* ============================================= */}
          {/* PAGO 1: ANTICIPO (Apartado Previo)           */}
          {/* ============================================= */}
          <div style={{
            background: '#F0FDF4',
            border: '1px solid #BBF7D0',
            borderRadius: '12px',
            padding: '0.85rem',
            marginBottom: '0.85rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.65rem', color: '#166534', fontWeight: 700, fontSize: '0.84rem' }}>
              <Icono nombre="building-bank" tamano={16} color="#16A34A" />
              <span>PAGO 1: Anticipo / Apartado Previo</span>
            </div>

            <div className="karinga-mobile-field-block">
              <label className="karinga-mobile-label">Monto de Anticipo ($ MXN):</label>
              <input
                type="number"
                className="karinga-mobile-input"
                placeholder="$0.00"
                value={montoAnticipoCheckin === 0 ? '' : montoAnticipoCheckin}
                onChange={(e) => setMontoAnticipoCheckin(e.target.value === '' ? 0 : Number(e.target.value))}
                inputMode="decimal"
              />
              <span style={{ fontSize: '0.71rem', color: '#64748B', marginTop: '0.2rem', display: 'block' }}>
                Si el cliente ya transfirió un anticipo, regístralo aquí para descontarlo del saldo en mano.
              </span>
            </div>

            {Number(montoAnticipoCheckin) > 0 && (
              <>
                <div className="karinga-mobile-field-block">
                  <label className="karinga-mobile-label">Forma de Pago del Anticipo:</label>
                  <div className="karinga-mobile-payment-options">
                    {METODOS_PAGO_ANTICIPO.map((met) => (
                      <button
                        key={met}
                        type="button"
                        className={`karinga-mobile-pay-btn ${metodoPagoAnticipoCheckin === met ? 'activo' : ''}`}
                        onClick={() => setMetodoPagoAnticipoCheckin(met)}
                      >
                        <Icono
                          nombre={obtenerIconoPago(met)}
                          tamano={15}
                          color="currentColor"
                        />
                        <span>{met}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="karinga-mobile-field-block">
                  <label className="karinga-mobile-label">Comprobante / Referencia de Anticipo:</label>
                  <input
                    type="text"
                    className="karinga-mobile-input"
                    placeholder="Referencia o folio de transferencia..."
                    value={comprobanteAnticipoCheckin}
                    onChange={(e) => setComprobanteAnticipoCheckin(e.target.value)}
                  />
                </div>
              </>
            )}
          </div>

          {/* ============================================= */}
          {/* PAGO 2: LIQUIDACIÓN DE SALDO EN MANO        */}
          {/* ============================================= */}
          <div style={{
            background: '#EFF6FF',
            border: '1px solid #BFDBFE',
            borderRadius: '12px',
            padding: '0.85rem',
            marginBottom: '0.85rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.65rem', color: '#1E40AF', fontWeight: 700, fontSize: '0.84rem' }}>
              <Icono nombre="hand-coins" tamano={16} color="#2563EB" />
              <span>PAGO 2: Liquidación de Saldo (Cobro en mano)</span>
            </div>

            {/* Descuento Opcional */}
            <div className="karinga-mobile-field-block">
              <label className="karinga-mobile-label">Descuento Especial (Opcional):</label>
              <input
                type="number"
                className="karinga-mobile-input"
                placeholder="$0.00"
                value={descuentoCheckin === 0 ? '' : descuentoCheckin}
                onChange={(e) => setDescuentoCheckin(Number(e.target.value) || 0)}
                inputMode="decimal"
              />
            </div>

            {/* Monto Final a Cobrar en Mano */}
            <div className="karinga-mobile-sheet-amount-highlight">
              <span className="karinga-mobile-amount-label">Saldo a Cobrar en Mano:</span>
              <span className="karinga-mobile-amount-val">
                ${Math.max(
                  0,
                  (Number(reservaSeleccionada.total) || 0) - (Number(montoAnticipoCheckin) || 0) - (Number(descuentoCheckin) || 0)
                ).toLocaleString('es-MX', { minimumFractionDigits: 2 })}{' '}
                MXN
              </span>
            </div>

            {/* Selector de Método de Pago de la Liquidación */}
            <div className="karinga-mobile-field-block">
              <label className="karinga-mobile-label">Método de Pago de la Liquidación:</label>
              <div className="karinga-mobile-payment-options">
                {METODOS_PAGO_LIQUIDACION.map((met) => (
                  <button
                    key={met}
                    type="button"
                    className={`karinga-mobile-pay-btn ${metodoPagoLiquidacion === met ? 'activo' : ''}`}
                    onClick={() => setMetodoPagoLiquidacion(met)}
                  >
                    <Icono
                      nombre={obtenerIconoPago(met)}
                      tamano={15}
                      color="currentColor"
                    />
                    <span>{met}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Comprobante / Referencia de liquidación */}
            {metodoPagoLiquidacion !== 'Efectivo' && (
              <div className="karinga-mobile-field-block">
                <label className="karinga-mobile-label">Número de Comprobante / Autorización:</label>
                <input
                  type="text"
                  className="karinga-mobile-input"
                  placeholder="Ej. TRANS-49102..."
                  value={comprobanteLiquidacion}
                  onChange={(e) => setComprobanteLiquidacion(e.target.value)}
                />
              </div>
            )}
          </div>

          {/* Botón de Confirmación Táctil Grande */}
          <button
            type="button"
            className="karinga-mobile-complete-checkin-btn"
            onClick={confirmarCobroCheckin}
            disabled={registrando}
          >
            <Icono nombre="check" tamano={18} color="#FFFFFF" />
            <span>{registrando ? 'Registrando...' : 'Cobrar y Completar Check-in'}</span>
          </button>
        </div>
      )}

      {/* ============================================================== */}
      {/* SUBPESTAÑA 2: NUEVA RESERVACIÓN FUTURA                        */}
      {/* ============================================================== */}
      {subpestana === 'nueva' && (
        <div className="karinga-mobile-section">
          <div className="karinga-mobile-form-card">
            <h3 className="karinga-mobile-form-title">
              <Icono nombre="calendar" tamano={18} color="var(--verde-oscuro)" />
              <span>Registrar Nueva Reservación</span>
            </h3>

            {errorMensaje && (
              <div className="karinga-mobile-error-box">
                <Icono nombre="alert" tamano={15} color="#DC2626" />
                <span>{errorMensaje}</span>
              </div>
            )}

            <div className="karinga-mobile-field-block">
              <label className="karinga-mobile-label">Seleccionar Cabaña:</label>
              <select
                className="karinga-mobile-select"
                value={nuevaCabanaId}
                onChange={(e) => setNuevaCabanaId(e.target.value)}
              >
                <option value="">-- Elija una cabaña --</option>
                {cabanas.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nombre} (Cap: {c.capacidad} pers. • ${Number(c.precio_fin).toLocaleString('es-MX')} Fin / ${Number(c.precio_semana).toLocaleString('es-MX')} Sem)
                  </option>
                ))}
              </select>
            </div>

            <div className="karinga-mobile-field-block">
              <label className="karinga-mobile-label">Nombre del Huésped:</label>
              <input
                type="text"
                className="karinga-mobile-input"
                placeholder="Nombre completo..."
                value={nuevoNombreHuesped}
                onChange={(e) => setNuevoNombreHuesped(e.target.value)}
              />
            </div>

            <div className="karinga-mobile-field-row">
              <div className="karinga-mobile-field-col">
                <label className="karinga-mobile-label">Fecha Llegada:</label>
                <input
                  type="date"
                  className="karinga-mobile-input"
                  value={fecha}
                  onChange={(e) => alCambiarFecha(e.target.value)}
                />
                <div style={{ marginTop: '0.35rem', fontSize: '0.74rem', color: '#047857', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <Icono nombre="calendar" tamano={12} color="currentColor" />
                  <span>{formatearFechaConDia(fecha, 'media')} • {formatearHora12(hora)}</span>
                </div>
              </div>

              <div className="karinga-mobile-field-col">
                <label className="karinga-mobile-label">Noches:</label>
                <div className="karinga-mobile-stepper">
                  <button
                    type="button"
                    onClick={() => setNuevasNoches(Math.max(1, nuevasNoches - 1))}
                  >
                    -
                  </button>
                  <span>{nuevasNoches}</span>
                  <button
                    type="button"
                    onClick={() => setNuevasNoches(nuevasNoches + 1)}
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            {/* Resumen de Tarifa de la Estancia */}
            {cabanaSeleccionadaObj && totalEstanciaNueva > 0 && (
              <div style={{
                background: '#F8FAFC',
                border: '1px solid #E2E8F0',
                borderRadius: '10px',
                padding: '0.75rem',
                marginBottom: '1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <div>
                  <span style={{ fontSize: '0.72rem', color: '#64748B', display: 'block', textTransform: 'uppercase', fontWeight: 700 }}>Total por Estancia:</span>
                  <strong style={{ fontSize: '1.05rem', color: '#1E293B' }}>
                    ${totalEstanciaNueva.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN
                  </strong>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '0.72rem', color: '#64748B', display: 'block' }}>Depósito de Garantía:</span>
                  <strong style={{ fontSize: '0.85rem', color: '#047857' }}>
                    +${(Number(cabanaSeleccionadaObj.deposito) || 250).toLocaleString('es-MX')} (en check-in)
                  </strong>
                </div>
              </div>
            )}

            {/* Modalidad de Cobro al Reservar */}
            <div className="karinga-mobile-field-block">
              <label className="karinga-mobile-label">Modalidad de Cobro:</label>
              <div className="karinga-mobile-filter-pills" style={{ marginBottom: '0.75rem' }}>
                <button
                  type="button"
                  className={`karinga-mobile-pill ${modalidadCobroNueva === 'anticipo' ? 'activo' : ''}`}
                  onClick={() => {
                    setModalidadCobroNueva('anticipo');
                    if (totalEstanciaNueva > 0 && !nuevoAnticipo) {
                      setNuevoAnticipo(Math.round(totalEstanciaNueva * 0.5));
                    }
                  }}
                >
                  <Icono nombre="building-bank" tamano={13} color="currentColor" />
                  <span>Anticipo</span>
                </button>

                <button
                  type="button"
                  className={`karinga-mobile-pill ${modalidadCobroNueva === 'total' ? 'activo' : ''}`}
                  onClick={() => setModalidadCobroNueva('total')}
                >
                  <Icono nombre="check" tamano={13} color="currentColor" />
                  <span>Pago Total (100%)</span>
                </button>

                <button
                  type="button"
                  className={`karinga-mobile-pill ${modalidadCobroNueva === 'pendiente' ? 'activo' : ''}`}
                  onClick={() => setModalidadCobroNueva('pendiente')}
                >
                  <Icono nombre="calendar" tamano={13} color="currentColor" />
                  <span>Sin Anticipo</span>
                </button>
              </div>
            </div>

            {/* Caso 1: Apartar con Anticipo */}
            {modalidadCobroNueva === 'anticipo' && (
              <>
                <div className="karinga-mobile-field-block">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                    <label className="karinga-mobile-label" style={{ margin: 0 }}>Monto de Anticipo ($ MXN):</label>
                    {totalEstanciaNueva > 0 && (
                      <button
                        type="button"
                        style={{
                          background: '#E0F2FE',
                          border: 'none',
                          color: '#0369A1',
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          borderRadius: '6px',
                          padding: '0.15rem 0.45rem',
                          cursor: 'pointer'
                        }}
                        onClick={() => setNuevoAnticipo(Math.round(totalEstanciaNueva * 0.5))}
                      >
                        Sugerir 50% (${Math.round(totalEstanciaNueva * 0.5).toLocaleString('es-MX')})
                      </button>
                    )}
                  </div>
                  <input
                    type="number"
                    className="karinga-mobile-input"
                    placeholder="$0.00"
                    value={nuevoAnticipo}
                    onChange={(e) => setNuevoAnticipo(e.target.value)}
                    inputMode="decimal"
                  />
                  {totalEstanciaNueva > 0 && (
                    <div style={{ marginTop: '0.35rem', fontSize: '0.74rem', color: '#475569' }}>
                      Saldo pendiente al check-in: <strong style={{ color: '#D97706' }}>${Math.max(0, totalEstanciaNueva - (Number(nuevoAnticipo) || 0)).toLocaleString('es-MX')} MXN</strong>
                    </div>
                  )}
                </div>

                <div className="karinga-mobile-field-block">
                  <label className="karinga-mobile-label">Forma de Pago del Anticipo:</label>
                  <div className="karinga-mobile-payment-options">
                    {METODOS_PAGO_ANTICIPO.map((met) => (
                      <button
                        key={met}
                        type="button"
                        className={`karinga-mobile-pay-btn ${nuevoMetodoPago === met ? 'activo' : ''}`}
                        onClick={() => setNuevoMetodoPago(met)}
                      >
                        <Icono
                          nombre={obtenerIconoPago(met)}
                          tamano={15}
                          color="currentColor"
                        />
                        <span>{met}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="karinga-mobile-field-block">
                  <label className="karinga-mobile-label">Comprobante / Folio de Anticipo:</label>
                  <input
                    type="text"
                    className="karinga-mobile-input"
                    placeholder="Referencia o folio..."
                    value={nuevoComprobante}
                    onChange={(e) => setNuevoComprobante(e.target.value)}
                  />
                </div>
              </>
            )}

            {/* Caso 2: Pago Total (100%) */}
            {modalidadCobroNueva === 'total' && (
              <>
                <div style={{
                  background: '#ECFDF5',
                  border: '1px solid #A7F3D0',
                  borderRadius: '10px',
                  padding: '0.75rem',
                  marginBottom: '0.85rem',
                  fontSize: '0.82rem',
                  color: '#065F46'
                }}>
                  Cobro total inmediato: <strong>${totalEstanciaNueva.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN</strong> (Saldo pendiente: $0.00).
                </div>

                <div className="karinga-mobile-field-block">
                  <label className="karinga-mobile-label">Forma de Pago del Total:</label>
                  <div className="karinga-mobile-payment-options">
                    {METODOS_PAGO_LIQUIDACION.map((met) => (
                      <button
                        key={met}
                        type="button"
                        className={`karinga-mobile-pay-btn ${nuevoMetodoPago === met ? 'activo' : ''}`}
                        onClick={() => setNuevoMetodoPago(met)}
                      >
                        <Icono
                          nombre={obtenerIconoPago(met)}
                          tamano={15}
                          color="currentColor"
                        />
                        <span>{met}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {nuevoMetodoPago !== 'Efectivo' && (
                  <div className="karinga-mobile-field-block">
                    <label className="karinga-mobile-label">Comprobante / Folio de Pago:</label>
                    <input
                      type="text"
                      className="karinga-mobile-input"
                      placeholder="Referencia o folio..."
                      value={nuevoComprobante}
                      onChange={(e) => setNuevoComprobante(e.target.value)}
                    />
                  </div>
                )}
              </>
            )}

            {/* Caso 3: Sin Anticipo */}
            {modalidadCobroNueva === 'pendiente' && (
              <div style={{
                background: '#FFFBEB',
                border: '1px solid #FDE68A',
                borderRadius: '10px',
                padding: '0.75rem',
                marginBottom: '0.85rem',
                fontSize: '0.82rem',
                color: '#92400E'
              }}>
                <Icono nombre="alert" tamano={15} color="#D97706" />
                <span style={{ marginLeft: '0.35rem' }}>
                  Se creará como reservación pendiente. El huésped liquidará el total de <strong>${totalEstanciaNueva.toLocaleString('es-MX')} MXN</strong> al llegar a hacer el Check-in.
                </span>
              </div>
            )}

            <button
              type="button"
              className="karinga-mobile-complete-checkin-btn"
              onClick={crearNuevaReservacion}
              disabled={registrando}
            >
              <Icono nombre="check" tamano={18} color="#FFFFFF" />
              <span>{registrando ? 'Creando...' : 'Crear Reservación'}</span>
            </button>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* SUBPESTAÑA 3: EXTRAS & DAÑOS                                   */}
      {/* ============================================================== */}
      {subpestana === 'extras' && (
        <div className="karinga-mobile-section">
          <div className="karinga-mobile-form-card">
            <h3 className="karinga-mobile-form-title">
              <Icono nombre="sparkles" tamano={18} color="var(--verde-oscuro)" />
              <span>Horas Libres y Extras</span>
            </h3>

            <div className="karinga-mobile-field-block">
              <label className="karinga-mobile-label">Reservación:</label>
              <select
                className="karinga-mobile-select"
                value={extraReservaId}
                onChange={(e) => setExtraReservaId(e.target.value)}
              >
                <option value="">-- Seleccionar de la lista --</option>
                {ventas.filter(v => v.cabana_id).slice(0, 30).map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.cabana_nombre} • {v.nombre_reservacion} ({v.fecha})
                  </option>
                ))}
              </select>
            </div>

            <div className="karinga-mobile-field-row">
              <div className="karinga-mobile-field-col">
                <label className="karinga-mobile-label">Horas Libres (+):</label>
                <div className="karinga-mobile-stepper">
                  <button type="button" onClick={() => setHorasExtra(Math.max(0, horasExtra - 1))}>-</button>
                  <span>{horasExtra}h</span>
                  <button type="button" onClick={() => setHorasExtra(horasExtra + 1)}>+</button>
                </div>
              </div>

              <div className="karinga-mobile-field-col">
                <label className="karinga-mobile-label">Personas Extra (+):</label>
                <div className="karinga-mobile-stepper">
                  <button type="button" onClick={() => setPersonasExtra(Math.max(0, personasExtra - 1))}>-</button>
                  <span>{personasExtra}</span>
                  <button type="button" onClick={() => setPersonasExtra(personasExtra + 1)}>+</button>
                </div>
              </div>
            </div>

            <div className="karinga-mobile-field-block">
              <label className="karinga-mobile-label">Método de Cobro Extra:</label>
              <select
                className="karinga-mobile-select"
                value={metodoPagoExtras}
                onChange={(e) => setMetodoPagoExtras(e.target.value)}
              >
                {METODOS_PAGO_LIQUIDACION.map((met) => (
                  <option key={met} value={met}>{met}</option>
                ))}
              </select>
            </div>

            <button
              type="button"
              className="karinga-mobile-complete-checkin-btn"
              onClick={() => {
                if (!extraReservaId) return;
                if (alAsignarHorasExtra) {
                  alAsignarHorasExtra(extraReservaId, {
                    horas_extra: horasExtra,
                    personas_extra: personasExtra,
                    metodo_pago: metodoPagoExtras,
                    notas: 'Cargos extras registrados desde versión móvil'
                  }, () => {
                    setHorasExtra(0);
                    setPersonasExtra(0);
                    setExtraReservaId('');
                  });
                }
              }}
              disabled={registrando || !extraReservaId || (horasExtra === 0 && personasExtra === 0)}
            >
              <Icono nombre="check" tamano={18} color="#FFFFFF" />
              <span>Registrar Cargos Extras</span>
            </button>
          </div>
        </div>
      )}

      {/* Modal de Google Calendar si se abre */}
      {modalSincronizarAbierto && (
        <ModalSincronizarCalendario
          abierto={modalSincronizarAbierto}
          alCerrar={() => setModalSincronizarAbierto(false)}
          alSeleccionarReservacion={(r) => {
            setModalSincronizarAbierto(false);
            setSubpestana('checkin');
            iniciarCheckinDeReserva(r);
          }}
          cabanas={cabanas}
        />
      )}
    </div>
  );
}
