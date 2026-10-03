import { useState, useMemo } from 'react';
import Icono from '../Icono';
import ModalSincronizarCalendario from '../ModalSincronizarCalendario';
import { sincronizarCalendariosApi } from '../../servicios/api';
import { METODOS_PAGO } from '../../constantes/datosIniciales';
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

  // Estado de Reservación en proceso de Check-in
  const [reservaSeleccionada, setReservaSeleccionada] = useState(null);
  const [metodoPagoLiquidacion, setMetodoPagoLiquidacion] = useState('Efectivo');
  const [comprobanteLiquidacion, setComprobanteLiquidacion] = useState('');
  const [descuentoCheckin, setDescuentoCheckin] = useState(0);

  // Estado para Nueva Reservación
  const [nuevaCabanaId, setNuevaCabanaId] = useState('');
  const [nuevoNombreHuesped, setNuevoNombreHuesped] = useState('');
  const [nuevasNoches, setNuevasNoches] = useState(1);
  const [nuevoAnticipo, setNuevoAnticipo] = useState('');
  const [nuevoMetodoAnticipo, setNuevoMetodoAnticipo] = useState('Transferencia BBVA');
  const [nuevoComprobante, setNuevoComprobante] = useState('');

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
    setDescuentoCheckin(Number(reserva.descuento_especial) || 0);
    setMetodoPagoLiquidacion('Efectivo');
    setComprobanteLiquidacion('');
    setErrorMensaje('');
  };

  // Confirmar cobro de Check-in
  const confirmarCobroCheckin = async () => {
    if (!reservaSeleccionada) return;
    setErrorMensaje('');

    const saldoOriginal = Number(reservaSeleccionada.saldo_pendiente) > 0
      ? Number(reservaSeleccionada.saldo_pendiente)
      : Number(reservaSeleccionada.total) - Number(reservaSeleccionada.anticipo || 0);

    const saldoFinal = Math.max(0, saldoOriginal - Number(descuentoCheckin || 0));

    try {
      if (alLiquidarSaldo) {
        await alLiquidarSaldo(reservaSeleccionada.id, {
          monto_liquidado: saldoFinal,
          metodo_pago_liquidacion: metodoPagoLiquidacion,
          metodo_pago: metodoPagoLiquidacion,
          descuento_especial: Number(descuentoCheckin) || 0,
          anticipo: Number(reservaSeleccionada.anticipo) || 0,
          metodo_pago_anticipo: reservaSeleccionada.metodo_pago_anticipo,
          comprobante_anticipo: reservaSeleccionada.comprobante_anticipo,
          comprobante_pago: comprobanteLiquidacion.trim(),
          notas: `Check-in completado en recepción el ${fecha} ${hora}`
        }, () => {
          setReservaSeleccionada(null);
          if (alRecargarVentas) alRecargarVentas();
        });
      }
    } catch (err) {
      setErrorMensaje(err.message || 'Error al registrar el cobro de check-in');
    }
  };

  // Crear nueva reservación
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
    const anticipoNum = Number(nuevoAnticipo) || 0;
    const saldoPendiente = Math.max(0, totalEstancia - anticipoNum);

    const checkoutCalculado = calcularFechaCheckout(fecha, nuevasNoches);

    const payload = {
      tipo: 'cabana',
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
      anticipo: anticipoNum,
      metodo_pago_anticipo: anticipoNum > 0 ? nuevoMetodoAnticipo : null,
      comprobante_anticipo: nuevoComprobante.trim(),
      estado_pago: saldoPendiente <= 0 ? 'liquidado' : (anticipoNum > 0 ? 'anticipo_pagado' : 'pendiente'),
      saldo_pendiente: saldoPendiente,
      monto_liquidado: 0,
      metodo_pago_liquidacion: null,
      descuento_especial: 0,
      notas: `Reservación creada desde móvil el ${fecha}`
    };

    if (alRegistrar) {
      alRegistrar(payload, () => {
        setNuevaCabanaId('');
        setNuevoNombreHuesped('');
        setNuevasNoches(1);
        setNuevoAnticipo('');
        setNuevoComprobante('');
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
              <span>Anticipo Pagado:</span>
              <strong>${Number(reservaSeleccionada.anticipo || 0).toLocaleString('es-MX')} MXN</strong>
            </div>
          </div>

          {errorMensaje && (
            <div className="karinga-mobile-error-box">
              <Icono nombre="alert" tamano={15} color="#DC2626" />
              <span>{errorMensaje}</span>
            </div>
          )}

          {/* Monto Final a Cobrar */}
          <div className="karinga-mobile-sheet-amount-highlight">
            <span className="karinga-mobile-amount-label">Saldo a Liquidar en Mano:</span>
            <span className="karinga-mobile-amount-val">
              ${Math.max(
                0,
                (Number(reservaSeleccionada.saldo_pendiente) || Number(reservaSeleccionada.total)) - Number(descuentoCheckin || 0)
              ).toLocaleString('es-MX', { minimumFractionDigits: 2 })}{' '}
              MXN
            </span>
          </div>

          {/* Selector de Método de Pago */}
          <div className="karinga-mobile-field-block">
            <label className="karinga-mobile-label">Método de Pago de la Liquidación:</label>
            <div className="karinga-mobile-payment-options">
              {['Efectivo', 'Tarjeta en Terminal', 'Transferencia BBVA', 'Transferencia Bajío'].map((met) => (
                <button
                  key={met}
                  type="button"
                  className={`karinga-mobile-pay-btn ${metodoPagoLiquidacion === met ? 'activo' : ''}`}
                  onClick={() => setMetodoPagoLiquidacion(met)}
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

          {/* Descuento Opcional */}
          <div className="karinga-mobile-field-block">
            <label className="karinga-mobile-label">Descuento Especial (Opcional):</label>
            <input
              type="number"
              className="karinga-mobile-input"
              placeholder="$0.00"
              value={descuentoCheckin || ''}
              onChange={(e) => setDescuentoCheckin(Number(e.target.value) || 0)}
              inputMode="decimal"
            />
          </div>

          {/* Comprobante / Referencia */}
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

            <div className="karinga-mobile-field-block">
              <label className="karinga-mobile-label">Anticipo Recibido ($):</label>
              <input
                type="number"
                className="karinga-mobile-input"
                placeholder="$0.00"
                value={nuevoAnticipo}
                onChange={(e) => setNuevoAnticipo(e.target.value)}
                inputMode="decimal"
              />
            </div>

            {Number(nuevoAnticipo) > 0 && (
              <>
                <div className="karinga-mobile-field-block">
                  <label className="karinga-mobile-label">Método de Pago Anticipo:</label>
                  <select
                    className="karinga-mobile-select"
                    value={nuevoMetodoAnticipo}
                    onChange={(e) => setNuevoMetodoAnticipo(e.target.value)}
                  >
                    {METODOS_PAGO.map((m) => {
                      const idVal = typeof m === 'object' ? m.id : m;
                      const txtVal = typeof m === 'object' ? m.etiqueta : m;
                      return (
                        <option key={idVal} value={idVal}>{txtVal}</option>
                      );
                    })}
                  </select>
                </div>

                <div className="karinga-mobile-field-block">
                  <label className="karinga-mobile-label">Comprobante de Anticipo:</label>
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
                {METODOS_PAGO.map((m) => (
                  <option key={m} value={m}>{m}</option>
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
