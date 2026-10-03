import { useState, useEffect, useMemo } from 'react';
import Icono from './Icono';
import { obtenerReservacionesGoogleApi } from '../servicios/api';
import {
  obtenerSemanaActual,
  obtenerProximaSemana,
  estaReservaEnSemana,
  obtenerInfoSemana
} from '../utilidades/gestorSemanas';

export default function ModalSincronizarCalendario({
  abierto,
  alCerrar,
  alSeleccionarReservacion
}) {
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);
  const [reservaciones, setReservaciones] = useState([]);
  const [avisoConfig, setAvisoConfig] = useState(null);
  const [busqueda, setBusqueda] = useState('');
  const [filtroCabana, setFiltroCabana] = useState('todas');
  const [filtroSemana, setFiltroSemana] = useState('actual'); // 'actual' | 'proxima' | 'todas' | 'YYYY-Wnn'

  const semanaActual = useMemo(() => obtenerSemanaActual(), []);
  const proximaSemana = useMemo(() => obtenerProximaSemana(), []);

  const cargarReservaciones = async () => {
    setCargando(true);
    setError(null);
    try {
      const res = await obtenerReservacionesGoogleApi();
      setReservaciones(res.datos || []);
      setAvisoConfig(res.aviso || null);
    } catch (err) {
      setError(err.message || 'No se pudo conectar con el servicio de Google Calendar.');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    if (abierto) {
      cargarReservaciones();
      setBusqueda('');
      setFiltroCabana('todas');
      setFiltroSemana('actual');
    }
  }, [abierto]);

  // Lista de cabañas únicas presentes en los resultados
  const cabanasDisponibles = useMemo(() => {
    const nombres = new Set();
    reservaciones.forEach((r) => {
      if (r.cabana_nombre) nombres.add(r.cabana_nombre);
    });
    return Array.from(nombres).sort();
  }, [reservaciones]);

  // Semanas únicas presentes en los resultados
  const semanasDisponibles = useMemo(() => {
    const mapa = {};
    reservaciones.forEach((r) => {
      const info = obtenerInfoSemana(r.fecha_inicio);
      if (info && !mapa[info.claveSemana]) {
        mapa[info.claveSemana] = info;
      }
    });
    return Object.values(mapa).sort((a, b) => a.claveSemana.localeCompare(b.claveSemana));
  }, [reservaciones]);

  const conteoSemanaActual = useMemo(() => {
    return reservaciones.filter((r) => estaReservaEnSemana(r, semanaActual)).length;
  }, [reservaciones, semanaActual]);

  const conteoProximaSemana = useMemo(() => {
    return reservaciones.filter((r) => estaReservaEnSemana(r, proximaSemana)).length;
  }, [reservaciones, proximaSemana]);

  // Filtrar reservaciones por texto de búsqueda, cabaña y semana seleccionada
  const reservacionesFiltradas = useMemo(() => {
    return reservaciones.filter((r) => {
      // 1. Filtro por semana
      if (filtroSemana === 'actual') {
        if (!estaReservaEnSemana(r, semanaActual)) return false;
      } else if (filtroSemana === 'proxima') {
        if (!estaReservaEnSemana(r, proximaSemana)) return false;
      } else if (filtroSemana !== 'todas') {
        if (!estaReservaEnSemana(r, filtroSemana)) return false;
      }

      // 2. Filtro por cabaña
      const coincideCabana = filtroCabana === 'todas' || r.cabana_nombre === filtroCabana;
      if (!coincideCabana) return false;

      // 3. Filtro por búsqueda de texto
      if (!busqueda.trim()) return true;
      const q = busqueda.toLowerCase().trim();
      const nombre = (r.nombre_reservacion || '').toLowerCase();
      const cabana = (r.cabana_nombre || '').toLowerCase();
      const fecha = (r.fecha_inicio || '').toLowerCase();
      return nombre.includes(q) || cabana.includes(q) || fecha.includes(q);
    });
  }, [reservaciones, filtroSemana, filtroCabana, busqueda, semanaActual, proximaSemana]);

  if (!abierto) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(4px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
        animation: 'fadeIn 0.2s ease-out'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) alCerrar();
      }}
    >
      <div
        className="karinga-modal-gcal-dialog"
        style={{
          background: '#FFFFFF',
          borderRadius: '16px',
          width: '100%',
          maxWidth: '750px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          overflow: 'hidden',
          border: '1px solid #E2E8F0'
        }}
      >
        {/* Cabecera del Modal */}
        <div
          className="karinga-modal-gcal-header"
          style={{
            padding: '1.25rem 1.5rem',
            background: 'linear-gradient(135deg, #1B4D3E 0%, #0F2D24 100%)',
            color: '#FFFFFF',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: 'rgba(255, 255, 255, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#86EFAC'
              }}
            >
              <Icono nombre="calendar" tamano={22} color="currentColor" />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, letterSpacing: '-0.01em' }}>
                Sincronizar Google Calendar
              </h3>
              <span style={{ fontSize: '0.8rem', opacity: 0.85 }}>
                Multi-calendario por Cabaña • Filtrado desde Semana 40
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button
              type="button"
              onClick={cargarReservaciones}
              disabled={cargando}
              title="Volver a consultar calendarios de Google"
              style={{
                background: 'rgba(255, 255, 255, 0.15)',
                border: 'none',
                color: '#FFFFFF',
                borderRadius: '8px',
                padding: '0.45rem 0.75rem',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                transition: 'background 0.2s'
              }}
            >
              <Icono nombre="refresh" tamano={14} color="#FFFFFF" />
              <span>{cargando ? 'Consultando...' : 'Actualizar'}</span>
            </button>

            <button
              type="button"
              onClick={alCerrar}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'rgba(255, 255, 255, 0.8)',
                cursor: 'pointer',
                padding: '0.35rem',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              title="Cerrar ventana"
            >
              <Icono nombre="close" tamano={20} color="#FFFFFF" />
            </button>
          </div>
        </div>

        {/* Barra de Filtros y Búsqueda */}
        <div
          className="karinga-modal-gcal-filters"
          style={{
            padding: '1rem 1.5rem',
            background: '#F8FAFC',
            borderBottom: '1px solid #E2E8F0',
            display: 'flex',
            flexWrap: 'wrap',
            gap: '0.75rem',
            alignItems: 'center'
          }}
        >
          <div style={{ flex: 1, minWidth: '220px', position: 'relative' }}>
            <input
              type="text"
              placeholder="Buscar por huésped o cabaña..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              style={{
                width: '100%',
                padding: '0.55rem 0.85rem 0.55rem 2.2rem',
                fontSize: '0.88rem',
                borderRadius: '8px',
                border: '1px solid #CBD5E1',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
            <div style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }}>
              <Icono nombre="search" tamano={15} color="currentColor" />
            </div>
            {busqueda && (
              <button
                type="button"
                onClick={() => setBusqueda('')}
                style={{
                  position: 'absolute',
                  right: '0.65rem',
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
                <Icono nombre="close" tamano={13} color="#94A3B8" />
              </button>
            )}
          </div>

          {cabanasDisponibles.length > 0 && (
            <div style={{ minWidth: '180px' }}>
              <select
                value={filtroCabana}
                onChange={(e) => setFiltroCabana(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.55rem 0.85rem',
                  fontSize: '0.88rem',
                  borderRadius: '8px',
                  border: '1px solid #CBD5E1',
                  background: '#FFFFFF',
                  outline: 'none',
                  cursor: 'pointer'
                }}
              >
                <option value="todas">Todas las cabañas ({reservaciones.length})</option>
                {cabanasDisponibles.map((cab) => (
                  <option key={cab} value={cab}>
                    {cab}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Fila de Selección de Semana (Semana Actual por Defecto) */}
          <div
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '0.5rem',
              paddingTop: '0.6rem',
              borderTop: '1px dashed #E2E8F0'
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
                <span>Esta Semana ({conteoSemanaActual})</span>
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
                <span>Próx. Semana ({conteoProximaSemana})</span>
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
                <span>Ver Todas ({reservaciones.length})</span>
              </button>
            </div>

            {semanasDisponibles.length > 0 && (
              <select
                value={filtroSemana}
                onChange={(e) => setFiltroSemana(e.target.value)}
                style={{
                  padding: '0.35rem 0.65rem',
                  fontSize: '0.8rem',
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
                <option value="todas">-- Todas las semanas ({reservaciones.length}) --</option>
                {semanasDisponibles.map((sem) => (
                  <option key={sem.claveSemana} value={sem.claveSemana}>
                    {sem.etiquetaDetallada}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* Cuerpo del Modal / Lista de Reservaciones */}
        <div style={{ padding: '1.25rem 1.5rem', overflowY: 'auto', flex: 1, minHeight: '300px' }}>
          {cargando && (
            <div style={{ textAlign: 'center', padding: '3.5rem 1rem', color: '#64748B' }}>
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  border: '3px solid #E2E8F0',
                  borderTopColor: '#1B4D3E',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite',
                  margin: '0 auto 1rem auto'
                }}
              />
              <p style={{ margin: 0, fontWeight: 600, fontSize: '0.95rem', color: '#1E293B' }}>
                Consultando calendarios de Google simultáneamente...
              </p>
              <p style={{ margin: '0.35rem 0 0 0', fontSize: '0.8rem' }}>
                Filtrando eventos a partir de la semana 40 del año en curso
              </p>
            </div>
          )}

          {!cargando && error && (
            <div
              style={{
                background: '#FEF2F2',
                border: '1px solid #FECACA',
                borderRadius: '10px',
                padding: '1.25rem',
                color: '#991B1B'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <Icono nombre="alert" tamano={20} color="#DC2626" />
                <strong style={{ fontSize: '0.95rem' }}>Error de Conexión</strong>
              </div>
              <p style={{ margin: '0 0 0.85rem 0', fontSize: '0.88rem' }}>{error}</p>
              <button
                type="button"
                onClick={cargarReservaciones}
                style={{
                  background: '#DC2626',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '0.45rem 0.9rem',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Reintentar
              </button>
            </div>
          )}

          {!cargando && !error && reservacionesFiltradas.length === 0 && (
            <div
              style={{
                textAlign: 'center',
                padding: '2.5rem 1rem',
                background: '#F8FAFC',
                borderRadius: '12px',
                border: '1px dashed #CBD5E1'
              }}
            >
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '50%',
                  background: '#E2E8F0',
                  color: '#64748B',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 1rem auto'
                }}
              >
                <Icono nombre="calendar" tamano={24} color="currentColor" />
              </div>
              <h4 style={{ margin: '0 0 0.35rem 0', color: '#1E293B', fontSize: '1rem' }}>
                {reservaciones.length > 0
                  ? `No hay reservaciones en ${filtroSemana === 'actual' ? 'la Semana Actual' : (filtroSemana === 'proxima' ? 'la Próxima Semana' : 'el filtro seleccionado')}`
                  : 'No se encontraron reservaciones en Google Calendar'}
              </h4>
              <p style={{ margin: '0 0 1rem 0', fontSize: '0.84rem', color: '#64748B', maxWidth: '480px', marginInline: 'auto' }}>
                {reservaciones.length > 0
                  ? `Hay ${reservaciones.length} reservaciones registradas en otras semanas del año. Puedes pulsar el botón abajo para verlas todas.`
                  : (avisoConfig || 'No hay eventos agendados a partir de la semana 40 en los calendarios configurados.')}
              </p>

              {reservaciones.length > 0 && filtroSemana !== 'todas' && (
                <button
                  type="button"
                  onClick={() => setFiltroSemana('todas')}
                  style={{
                    background: '#1B4D3E',
                    color: '#FFFFFF',
                    border: 'none',
                    padding: '0.45rem 0.9rem',
                    borderRadius: '6px',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  Ver todas las {reservaciones.length} reservaciones
                </button>
              )}

              {avisoConfig && (
                <div
                  style={{
                    textAlign: 'left',
                    background: '#EFF6FF',
                    border: '1px solid #BFDBFE',
                    borderRadius: '8px',
                    padding: '0.85rem 1rem',
                    fontSize: '0.8rem',
                    color: '#1E40AF',
                    maxWidth: '520px',
                    margin: '0 auto'
                  }}
                >
                  <strong>Configuración requerida en <code>backend/.env</code>:</strong>
                  <ul style={{ margin: '0.4rem 0 0 1.2rem', padding: 0 }}>
                    <li><code>GOOGLE_CLIENT_ID</code>, <code>GOOGLE_CLIENT_SECRET</code>, <code>GOOGLE_REFRESH_TOKEN</code></li>
                    <li>IDs individuales por cabaña: <code>CALENDAR_BUENAVISTA_ID</code>, <code>CALENDAR_CHUPICUARO_ID</code>, etc.</li>
                  </ul>
                </div>
              )}
            </div>
          )}

          {!cargando && !error && reservacionesFiltradas.length > 0 && (
            <div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '0.85rem',
                  fontSize: '0.84rem',
                  color: '#64748B',
                  flexWrap: 'wrap',
                  gap: '0.4rem'
                }}
              >
                <span>
                  Mostrando <strong>{reservacionesFiltradas.length}</strong> reservación(es) {filtroSemana === 'actual' ? `de la Semana Actual (${semanaActual?.etiquetaRango})` : (filtroSemana === 'proxima' ? `de la Próxima Semana (${proximaSemana?.etiquetaRango})` : '')}
                </span>
                <span style={{ fontSize: '0.78rem', color: '#0284C7' }}>
                  Haz clic en una reservación para autocompletar el check-in
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {reservacionesFiltradas.map((reserva) => (
                  <div
                    key={reserva.id}
                    className="karinga-modal-gcal-item"
                    onClick={() => {
                      alSeleccionarReservacion(reserva);
                      alCerrar();
                    }}
                    style={{
                      background: '#FFFFFF',
                      border: '1px solid #E2E8F0',
                      borderRadius: '10px',
                      padding: '1rem',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: '1rem',
                      flexWrap: 'wrap'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = '#1B4D3E';
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(27, 77, 62, 0.12)';
                      e.currentTarget.style.transform = 'translateY(-1px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = '#E2E8F0';
                      e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.05)';
                      e.currentTarget.style.transform = 'translateY(0)';
                    }}
                  >
                    <div style={{ flex: 1, minWidth: '240px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                        <span
                          style={{
                            background: '#DCFCE7',
                            color: '#15803D',
                            fontWeight: 700,
                            fontSize: '0.74rem',
                            padding: '0.2rem 0.55rem',
                            borderRadius: '6px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.3rem'
                          }}
                        >
                          <Icono nombre="bed" tamano={12} color="currentColor" />
                          {reserva.cabana_nombre}
                        </span>

                        <span
                          style={{
                            background: '#FEF3C7',
                            color: '#B45309',
                            fontWeight: 700,
                            fontSize: '0.74rem',
                            padding: '0.2rem 0.55rem',
                            borderRadius: '6px'
                          }}
                        >
                          {reserva.noches} {reserva.noches === 1 ? 'noche' : 'noches'}
                        </span>
                      </div>

                      <h4 style={{ margin: '0 0 0.35rem 0', fontSize: '0.98rem', color: '#0F172A', fontWeight: 700 }}>
                        {reserva.nombre_reservacion}
                      </h4>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', fontSize: '0.8rem', color: '#64748B' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <Icono nombre="calendar" tamano={13} color="currentColor" />
                          Llegada: <strong>{reserva.fecha_inicio}</strong>
                        </span>
                        <span>→</span>
                        <span>
                          Salida: <strong>{reserva.fecha_fin}</strong>
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      className="karinga-modal-gcal-btn"
                      style={{
                        background: '#1B4D3E',
                        color: '#FFFFFF',
                        border: 'none',
                        borderRadius: '8px',
                        padding: '0.55rem 1rem',
                        fontSize: '0.82rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        flexShrink: 0
                      }}
                    >
                      <Icono nombre="check" tamano={14} color="#FFFFFF" />
                      <span>Autocompletar</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Pie del modal */}
        <div
          style={{
            padding: '0.85rem 1.5rem',
            background: '#F8FAFC',
            borderTop: '1px solid #E2E8F0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '0.78rem',
            color: '#64748B'
          }}
        >
          <span>
            Google Calendar API • OAuth 2.0
          </span>
          <button
            type="button"
            onClick={alCerrar}
            style={{
              background: '#E2E8F0',
              border: 'none',
              borderRadius: '6px',
              padding: '0.4rem 0.85rem',
              color: '#334155',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}

