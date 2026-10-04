import { useState, useMemo } from 'react';
import Icono from './Icono';
import { sincronizarCalendariosApi } from '../servicios/api';
import {
  obtenerSemanaActual,
  obtenerProximaSemana,
  estaReservaEnSemana,
  obtenerInfoSemana
} from '../utilidades/gestorSemanas';
import { formatearFechaConDia } from '../utilidades/gestorTemporadas';

export default function PanelSincronizacionCalendario({
  cabanas = [],
  ventas = [],
  alRecargarVentas,
  alCargarReservaEnCheckin
}) {
  const [sincronizandoGlobal, setSincronizandoGlobal] = useState(false);
  const [sincronizandoId, setSincronizandoId] = useState(null);
  const [mensajeResultado, setMensajeResultado] = useState(null);
  const [mostrarDetalleCabanas, setMostrarDetalleCabanas] = useState(false);
  const [mostrarPendientes, setMostrarPendientes] = useState(true);
  const [filtroSemana, setFiltroSemana] = useState('actual'); // 'actual' | 'proxima' | 'todas' | 'YYYY-Wnn'
  const [busqueda, setBusqueda] = useState('');

  const semanaActual = useMemo(() => obtenerSemanaActual(), []);
  const proximaSemana = useMemo(() => obtenerProximaSemana(), []);

  // Reservaciones con saldo pendiente de pago (incluyendo las recién importadas de Google Calendar)
  const reservacionesPendientes = useMemo(() => {
    return ventas.filter((v) => {
      const esCabana = Boolean(v.cabana_id);
      const esPendiente = v.estado_pago === 'pendiente_liquidacion' || Number(v.saldo_pendiente) > 0;
      return esCabana && esPendiente;
    });
  }, [ventas]);

  // Semanas únicas presentes en las reservaciones pendientes
  const semanasDisponibles = useMemo(() => {
    const mapa = {};
    reservacionesPendientes.forEach((r) => {
      const fechaIn = (r.fecha_checkin || r.fecha || '').split('T')[0];
      const info = obtenerInfoSemana(fechaIn);
      if (info && !mapa[info.claveSemana]) {
        mapa[info.claveSemana] = info;
      }
    });
    return Object.values(mapa).sort((a, b) => a.claveSemana.localeCompare(b.claveSemana));
  }, [reservacionesPendientes]);

  const pendientesSemanaActual = useMemo(() => {
    return reservacionesPendientes.filter((r) => estaReservaEnSemana(r, semanaActual));
  }, [reservacionesPendientes, semanaActual]);

  const pendientesProximaSemana = useMemo(() => {
    return reservacionesPendientes.filter((r) => estaReservaEnSemana(r, proximaSemana));
  }, [reservacionesPendientes, proximaSemana]);

  // Filtrar según la pestaña activa (Semana Actual por defecto) y búsqueda
  const reservacionesMostradas = useMemo(() => {
    let filtradas = reservacionesPendientes;

    if (filtroSemana === 'actual') {
      filtradas = pendientesSemanaActual;
    } else if (filtroSemana === 'proxima') {
      filtradas = pendientesProximaSemana;
    } else if (filtroSemana !== 'todas') {
      filtradas = reservacionesPendientes.filter((r) => estaReservaEnSemana(r, filtroSemana));
    }

    if (busqueda.trim()) {
      const q = busqueda.toLowerCase().trim();
      filtradas = filtradas.filter((r) => {
        const nom = (r.nombre_reservacion || '').toLowerCase();
        const cab = (r.cabana_nombre || '').toLowerCase();
        const fec = (r.fecha_checkin || r.fecha || '').toLowerCase();
        return nom.includes(q) || cab.includes(q) || fec.includes(q);
      });
    }

    // Ordenar cronológicamente por fecha de check-in
    return [...filtradas].sort((a, b) => {
      const fa = (a.fecha_checkin || a.fecha || '').split('T')[0];
      const fb = (b.fecha_checkin || b.fecha || '').split('T')[0];
      return fa.localeCompare(fb);
    });
  }, [reservacionesPendientes, filtroSemana, pendientesSemanaActual, pendientesProximaSemana, busqueda]);

  const totalSaldoPendiente = useMemo(() => {
    return reservacionesPendientes.reduce((acc, r) => acc + (Number(r.saldo_pendiente) || Number(r.total) || 0), 0);
  }, [reservacionesPendientes]);

  const totalSaldoMostrado = useMemo(() => {
    return reservacionesMostradas.reduce((acc, r) => acc + (Number(r.saldo_pendiente) || Number(r.total) || 0), 0);
  }, [reservacionesMostradas]);

  const ejecutarSincronizacion = async (cabanaId = null, nombreCabana = null) => {
    if (cabanaId === null) {
      setSincronizandoGlobal(true);
    } else {
      setSincronizandoId(cabanaId);
    }
    setMensajeResultado(null);

    try {
      const res = await sincronizarCalendariosApi(cabanaId);

      setMensajeResultado({
        tipo: res.exito ? 'exito' : 'aviso',
        texto: res.mensaje || 'Sincronización completada con éxito.',
        creadas: res.creadas || 0,
        omitidas: res.omitidas || 0
      });

      if (alRecargarVentas) {
        await alRecargarVentas();
      }
    } catch (err) {
      setMensajeResultado({
        tipo: 'error',
        texto: err.message || 'Error al comunicarse con Google Calendar.'
      });
    } finally {
      setSincronizandoGlobal(false);
      setSincronizandoId(null);
    }
  };

  return (
    <section
      className="karinga-tarjeta karinga-panel-sincronizacion"
      style={{
        marginBottom: '1.5rem',
        borderLeft: '5px solid var(--verde-oscuro)',
        background: '#FFFFFF'
      }}
    >
      {/* Cabecera del Panel */}
      <div
        className="karinga-sync-header"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          marginBottom: '1rem'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #1B4D3E 0%, #0F2D24 100%)',
              color: '#86EFAC',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
            }}
          >
            <Icono nombre="calendar" tamano={22} color="currentColor" />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.08rem', color: '#0F172A', fontWeight: 800 }}>
              Sincronización con Google Calendar
            </h3>
            <span style={{ fontSize: '0.8rem', color: '#64748B' }}>
              Importación automática a la Base de Datos • Semana 40 en adelante • Pagos en estado pendiente
            </span>
          </div>
        </div>

        {/* Botones Globales */}
        <div className="karinga-sync-btn-group" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => setMostrarDetalleCabanas((prev) => !prev)}
            style={{
              background: '#F1F5F9',
              border: '1px solid #CBD5E1',
              color: '#334155',
              padding: '0.55rem 0.9rem',
              borderRadius: '8px',
              fontSize: '0.82rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem'
            }}
          >
            <Icono nombre="bed" tamano={15} color="#475569" />
            <span>{mostrarDetalleCabanas ? 'Ocultar Cabañas' : 'Ver Cabañas Individuales'}</span>
          </button>

          <button
            type="button"
            onClick={() => ejecutarSincronizacion(null)}
            disabled={sincronizandoGlobal || sincronizandoId !== null}
            style={{
              background: 'linear-gradient(135deg, #1B4D3E 0%, #15803D 100%)',
              color: '#FFFFFF',
              border: 'none',
              padding: '0.6rem 1.15rem',
              borderRadius: '8px',
              fontSize: '0.86rem',
              fontWeight: 800,
              cursor: (sincronizandoGlobal || sincronizandoId !== null) ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              boxShadow: '0 2px 4px rgba(27, 77, 62, 0.25)',
              opacity: (sincronizandoGlobal || sincronizandoId !== null) ? 0.7 : 1
            }}
            title="Consultar todos los calendarios y crear automáticamente las nuevas reservaciones en la base de datos"
          >
            <span style={{ display: 'inline-flex', animation: sincronizandoGlobal ? 'spin 1s linear infinite' : 'none' }}>
              <Icono nombre="refresh" tamano={16} color="#FFFFFF" />
            </span>
            <span>{sincronizandoGlobal ? 'Sincronizando Todos...' : 'Sincronizar Todos'}</span>
          </button>
        </div>
      </div>

      {/* Notificación de Resultado */}
      {mensajeResultado && (
        <div
          style={{
            marginBottom: '1rem',
            padding: '0.85rem 1.1rem',
            borderRadius: '8px',
            fontSize: '0.86rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '0.75rem',
            background:
              mensajeResultado.tipo === 'exito'
                ? '#F0FDF4'
                : mensajeResultado.tipo === 'error'
                ? '#FEF2F2'
                : '#EFF6FF',
            border:
              mensajeResultado.tipo === 'exito'
                ? '1px solid #BBF7D0'
                : mensajeResultado.tipo === 'error'
                ? '1px solid #FECACA'
                : '1px solid #BFDBFE',
            color:
              mensajeResultado.tipo === 'exito'
                ? '#15803D'
                : mensajeResultado.tipo === 'error'
                ? '#991B1B'
                : '#1E40AF'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Icono
              nombre={mensajeResultado.tipo === 'exito' ? 'check' : 'alert'}
              tamano={18}
              color="currentColor"
            />
            <span>{mensajeResultado.texto}</span>
          </div>
          <button
            type="button"
            onClick={() => setMensajeResultado(null)}
            style={{ background: 'none', border: 'none', color: 'currentColor', cursor: 'pointer', padding: '0.2rem', display: 'flex', alignItems: 'center' }}
            title="Cerrar aviso"
          >
            <Icono nombre="close" tamano={16} color="currentColor" />
          </button>
        </div>
      )}

      {/* Grid de Botones Individuales por Cabaña (Expandible) */}
      {mostrarDetalleCabanas && (
        <div
          style={{
            background: '#F8FAFC',
            border: '1px solid #E2E8F0',
            borderRadius: '10px',
            padding: '1rem',
            marginBottom: '1.25rem'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <strong style={{ fontSize: '0.88rem', color: '#1E293B' }}>
              Sincronización Individual por Cabaña:
            </strong>
            <small style={{ color: '#64748B', fontSize: '0.78rem' }}>
              Consulta única y exclusivamente el calendario de la cabaña elegida
            </small>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
              gap: '0.65rem'
            }}
          >
            {cabanas.map((c) => {
              const estaSincronizando = sincronizandoId === c.id;
              return (
                <div
                  key={c.id}
                  style={{
                    background: '#FFFFFF',
                    border: '1px solid #CBD5E1',
                    borderRadius: '8px',
                    padding: '0.65rem 0.85rem',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}
                >
                  <div style={{ overflow: 'hidden' }}>
                    <strong style={{ fontSize: '0.84rem', color: '#0F172A', display: 'block', textOverflow: 'ellipsis', whiteSpace: 'nowrap', overflow: 'hidden' }}>
                      {c.nombre}
                    </strong>
                    <span style={{ fontSize: '0.73rem', color: '#64748B' }}>
                      Cap: {c.capacidad} pers. • Dep: ${Number(c.deposito).toLocaleString('es-MX')}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => ejecutarSincronizacion(c.id, c.nombre)}
                    disabled={sincronizandoGlobal || estaSincronizando}
                    style={{
                      background: estaSincronizando ? '#F1F5F9' : '#FFFFFF',
                      border: '1px solid #1B4D3E',
                      color: '#1B4D3E',
                      padding: '0.35rem 0.65rem',
                      borderRadius: '6px',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      cursor: (sincronizandoGlobal || estaSincronizando) ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.3rem',
                      flexShrink: 0
                    }}
                    title={`Sincronizar calendario exclusivo de ${c.nombre}`}
                  >
                    <span style={{ display: 'inline-flex', animation: estaSincronizando ? 'spin 1s linear infinite' : 'none' }}>
                      <Icono nombre="refresh" tamano={12} color="#1B4D3E" />
                    </span>
                    <span>{estaSincronizando ? '...' : 'Sincronizar'}</span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Lista de Reservaciones Pendientes de Cobro (Creadas automáticamente) */}
      <div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '0.5rem',
            paddingBottom: '0.6rem',
            borderBottom: '1px solid #E2E8F0'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span
              style={{
                background: '#FEF3C7',
                color: '#B45309',
                padding: '0.2rem 0.55rem',
                borderRadius: '6px',
                fontSize: '0.75rem',
                fontWeight: 800
              }}
            >
              {reservacionesPendientes.length} Pendiente(s)
            </span>
            <strong style={{ fontSize: '0.9rem', color: '#1E293B' }}>
              Reservaciones por Liquidar en Recepción
            </strong>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ fontSize: '0.82rem', color: '#64748B' }}>
              Saldo Total por Cobrar: <strong style={{ color: '#B45309', fontSize: '0.92rem' }}>${totalSaldoPendiente.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN</strong>
            </span>
            <button
              type="button"
              onClick={() => setMostrarPendientes((prev) => !prev)}
              style={{
                background: 'none',
                border: 'none',
                color: '#0284C7',
                fontSize: '0.78rem',
                fontWeight: 700,
                cursor: 'pointer',
                textDecoration: 'underline'
              }}
            >
              {mostrarPendientes ? 'Ocultar listado' : 'Mostrar listado'}
            </button>
          </div>
        </div>

        {mostrarPendientes && (
          <div style={{ marginTop: '0.85rem' }}>
            {/* Barra de Filtros por Semana y Búsqueda */}
            <div
              className="karinga-sync-filter-bar"
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '0.65rem',
                marginBottom: '0.85rem',
                background: '#F8FAFC',
                padding: '0.65rem 0.85rem',
                borderRadius: '8px',
                border: '1px solid #E2E8F0'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.78rem', color: '#475569', fontWeight: 800 }}>Llegada:</span>
                <button
                  type="button"
                  onClick={() => setFiltroSemana('actual')}
                  style={{
                    background: filtroSemana === 'actual' ? '#1B4D3E' : '#FFFFFF',
                    color: filtroSemana === 'actual' ? '#FFFFFF' : '#1E293B',
                    border: `1.5px solid ${filtroSemana === 'actual' ? '#1B4D3E' : '#CBD5E1'}`,
                    padding: '0.35rem 0.75rem',
                    borderRadius: '6px',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    boxShadow: filtroSemana === 'actual' ? '0 1px 3px rgba(27,77,62,0.25)' : 'none'
                  }}
                >
                  <Icono nombre="calendar-check" tamano={14} color="currentColor" />
                  <span>Esta Semana ({pendientesSemanaActual.length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFiltroSemana('proxima')}
                  style={{
                    background: filtroSemana === 'proxima' ? '#1B4D3E' : '#FFFFFF',
                    color: filtroSemana === 'proxima' ? '#FFFFFF' : '#1E293B',
                    border: `1.5px solid ${filtroSemana === 'proxima' ? '#1B4D3E' : '#CBD5E1'}`,
                    padding: '0.35rem 0.75rem',
                    borderRadius: '6px',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    boxShadow: filtroSemana === 'proxima' ? '0 1px 3px rgba(27,77,62,0.25)' : 'none'
                  }}
                >
                  <Icono nombre="calendar" tamano={14} color="currentColor" />
                  <span>Próx. Semana ({pendientesProximaSemana.length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFiltroSemana('todas')}
                  style={{
                    background: filtroSemana === 'todas' ? '#1B4D3E' : '#FFFFFF',
                    color: filtroSemana === 'todas' ? '#FFFFFF' : '#1E293B',
                    border: `1.5px solid ${filtroSemana === 'todas' ? '#1B4D3E' : '#CBD5E1'}`,
                    padding: '0.35rem 0.75rem',
                    borderRadius: '6px',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    boxShadow: filtroSemana === 'todas' ? '0 1px 3px rgba(27,77,62,0.25)' : 'none'
                  }}
                >
                  <Icono nombre="calendar-days" tamano={14} color="currentColor" />
                  <span>Ver Todas ({reservacionesPendientes.length})</span>
                </button>

                {semanasDisponibles.length > 0 && (
                  <select
                    value={filtroSemana}
                    onChange={(e) => setFiltroSemana(e.target.value)}
                    style={{
                      padding: '0.35rem 0.6rem',
                      fontSize: '0.78rem',
                      borderRadius: '6px',
                      border: '1px solid #CBD5E1',
                      background: '#FFFFFF',
                      color: '#334155',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    <option value="actual">Semana Actual ({semanaActual?.etiquetaCorta || ''})</option>
                    <option value="proxima">Próxima Semana ({proximaSemana?.etiquetaCorta || ''})</option>
                    <option value="todas">-- Todas las semanas ({reservacionesPendientes.length}) --</option>
                    {semanasDisponibles.map((sem) => (
                      <option key={sem.claveSemana} value={sem.claveSemana}>
                        {sem.etiquetaDetallada}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div style={{ position: 'relative', minWidth: '180px' }}>
                <input
                  type="text"
                  placeholder="Buscar huésped / cabaña..."
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.35rem 0.7rem 0.35rem 1.8rem',
                    fontSize: '0.8rem',
                    borderRadius: '6px',
                    border: '1px solid #CBD5E1',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
                <div style={{ position: 'absolute', left: '0.55rem', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }}>
                  <Icono nombre="search" tamano={13} color="currentColor" />
                </div>
                {busqueda && (
                  <button
                    type="button"
                    onClick={() => setBusqueda('')}
                    style={{
                      position: 'absolute',
                      right: '0.5rem',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      color: '#94A3B8',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                    title="Limpiar búsqueda"
                  >
                    <Icono nombre="close" tamano={12} color="#94A3B8" />
                  </button>
                )}
              </div>
            </div>

            {/* Aviso de Conteo y Rango Activo */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '0.65rem',
                fontSize: '0.78rem',
                color: '#64748B',
                flexWrap: 'wrap',
                gap: '0.35rem'
              }}
            >
              <span>
                Mostrando <strong>{reservacionesMostradas.length}</strong> reservación(es) {filtroSemana === 'actual' ? `de la Semana Actual (${semanaActual?.etiquetaRango})` : (filtroSemana === 'proxima' ? `de la Próxima Semana (${proximaSemana?.etiquetaRango})` : '')}
              </span>
              <span>
                Saldo por cobrar en esta vista: <strong style={{ color: '#B45309' }}>${totalSaldoMostrado.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN</strong>
              </span>
            </div>

            {reservacionesPendientes.length === 0 ? (
              <p style={{ margin: 0, fontSize: '0.82rem', color: '#94A3B8', fontStyle: 'italic', textAlign: 'center', padding: '1rem' }}>
                No hay reservaciones pendientes de liquidación. Presiona "Sincronizar Todos" para importar las nuevas reservaciones desde Google Calendar.
              </p>
            ) : reservacionesMostradas.length === 0 ? (
              <div
                style={{
                  textAlign: 'center',
                  padding: '1.75rem 1rem',
                  background: '#F8FAFC',
                  borderRadius: '8px',
                  border: '1px dashed #CBD5E1'
                }}
              >
                <p style={{ margin: '0 0 0.65rem 0', fontSize: '0.86rem', color: '#475569', fontWeight: 600 }}>
                  {filtroSemana === 'actual'
                    ? `No hay reservaciones pendientes para la Semana Actual (${semanaActual?.etiquetaRango}).`
                    : 'No se encontraron reservaciones para el filtro seleccionado.'}
                </p>
                <span style={{ fontSize: '0.78rem', color: '#64748B', display: 'block', marginBottom: '0.85rem' }}>
                  Hay {reservacionesPendientes.length} reservación(es) pendientes en otras semanas del año.
                </span>
                {filtroSemana !== 'todas' && (
                  <button
                    type="button"
                    onClick={() => setFiltroSemana('todas')}
                    style={{
                      background: '#1B4D3E',
                      color: '#FFFFFF',
                      border: 'none',
                      padding: '0.4rem 0.85rem',
                      borderRadius: '6px',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    Ver todas las {reservacionesPendientes.length} reservaciones
                  </button>
                )}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem', maxHeight: '280px', overflowY: 'auto', paddingRight: '0.25rem' }}>
                {reservacionesMostradas.map((r) => {
                  const saldoCobrar = Number(r.saldo_pendiente) > 0 ? Number(r.saldo_pendiente) : Number(r.total) || 0;
                  const esDeGoogle = (r.notas || '').includes('[GCAL_EVENT_ID:');

                  return (
                    <div
                      key={r.id}
                      className="karinga-sync-card-item"
                      style={{
                        background: '#FFFBEB',
                        border: '1px solid #FDE68A',
                        borderRadius: '8px',
                        padding: '0.65rem 0.95rem',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: '0.65rem'
                      }}
                    >
                      <div style={{ flex: 1, minWidth: '220px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.2rem' }}>
                          <span
                            style={{
                              background: '#1B4D3E',
                              color: '#FFFFFF',
                              fontSize: '0.7rem',
                              fontWeight: 800,
                              padding: '0.15rem 0.45rem',
                              borderRadius: '4px'
                            }}
                          >
                            {r.cabana_nombre}
                          </span>
                          {esDeGoogle && (
                            <span
                              style={{
                                background: '#E0F2FE',
                                color: '#0369A1',
                                fontSize: '0.68rem',
                                fontWeight: 700,
                                padding: '0.15rem 0.4rem',
                                borderRadius: '4px'
                              }}
                            >
                              Google Calendar
                            </span>
                          )}
                          <span style={{ fontSize: '0.75rem', color: '#78350F', fontWeight: 600 }}>
                            {r.noches} {r.noches === 1 ? 'noche' : 'noches'}
                          </span>
                        </div>

                        <strong style={{ fontSize: '0.92rem', color: '#1E293B', display: 'block' }}>
                          {r.nombre_reservacion}
                        </strong>

                        <div style={{ fontSize: '0.78rem', color: '#64748B', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                          <span>Entrada: <strong style={{ color: '#1E293B' }}>{formatearFechaConDia(r.fecha_checkin || r.fecha, 'media')}</strong></span>
                          <span>•</span>
                          <span>Salida: <strong style={{ color: '#1E293B' }}>{formatearFechaConDia(r.fecha_checkout, 'media') || '12:00'}</strong></span>
                        </div>
                      </div>

                      <div className="karinga-sync-card-right" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{ textAlign: 'right' }}>
                          <span style={{ fontSize: '0.7rem', color: '#92400E', display: 'block', fontWeight: 600 }}>
                            Por Cobrar al Llegar:
                          </span>
                          <strong style={{ fontSize: '1rem', color: '#B45309' }}>
                            ${saldoCobrar.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN
                          </strong>
                        </div>

                        {alCargarReservaEnCheckin && (
                          <button
                            type="button"
                            onClick={() => alCargarReservaEnCheckin(r)}
                            style={{
                              background: '#15803D',
                              color: '#FFFFFF',
                              border: 'none',
                              padding: '0.45rem 0.85rem',
                              borderRadius: '6px',
                              fontSize: '0.78rem',
                              fontWeight: 700,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.3rem'
                            }}
                            title="Cargar en el formulario de Recepción para cobrar en mano"
                          >
                            <Icono nombre="hand-coins" tamano={14} color="#FFFFFF" />
                            <span>Cobrar Check-in</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

