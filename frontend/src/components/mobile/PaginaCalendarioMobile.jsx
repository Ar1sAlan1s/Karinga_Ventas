import { useState, useMemo } from 'react';
import Icono from '../Icono';
import { formatearFechaConDia, formatearHora12 } from '../../utilidades/gestorTemporadas';

function extraerFechaStr(f) {
  if (!f) return null;
  if (f instanceof Date) return f.toISOString().split('T')[0];
  return String(f).split('T')[0];
}

export default function PaginaCalendarioMobile({ ventas = [], cabanas = [] }) {
  const [vista, setVista] = useState('agenda'); // 'agenda' | 'mes'
  const [filtroTiempo, setFiltroTiempo] = useState('semana'); // 'hoy' | 'semana' | 'todas'
  const [filtroCabana, setFiltroCabana] = useState('');

  const hoyStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  // Extraer todos los movimientos de cabañas
  const movimientos = useMemo(() => {
    const lista = [];

    ventas.forEach((v) => {
      if (!v.cabana_id) return;
      if (filtroCabana && String(v.cabana_id) !== String(filtroCabana)) return;

      const fechaIn = extraerFechaStr(v.fecha_checkin || v.fecha);
      let fechaOut = extraerFechaStr(v.fecha_checkout);

      if (!fechaOut && fechaIn && v.noches) {
        const partes = fechaIn.split('-');
        const d = new Date(parseInt(partes[0], 10), parseInt(partes[1], 10) - 1, parseInt(partes[2], 10));
        d.setDate(d.getDate() + Number(v.noches));
        const pad = (n) => String(n).padStart(2, '0');
        fechaOut = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
      }

      if (fechaIn) {
        lista.push({
          tipo: 'checkin',
          fecha: fechaIn,
          hora: '15:00',
          reserva: v
        });
      }

      if (fechaOut) {
        const horasEx = Number(v.horas_extra) || 0;
        const horaOut = v.hora_checkout || (horasEx > 0 ? `${12 + horasEx}:00` : '12:00');
        lista.push({
          tipo: 'checkout',
          fecha: fechaOut,
          hora: horaOut,
          reserva: v
        });
      }
    });

    // Ordenar cronológicamente
    lista.sort((a, b) => (a.fecha > b.fecha ? 1 : -1));
    return lista;
  }, [ventas, filtroCabana]);

  // Filtrar según el tiempo seleccionado
  const movimientosFiltrados = useMemo(() => {
    const ahora = new Date();
    const hoy = ahora.toISOString().split('T')[0];

    const sieteDiasDespues = new Date(ahora);
    sieteDiasDespues.setDate(sieteDiasDespues.getDate() + 7);
    const limite7 = sieteDiasDespues.toISOString().split('T')[0];

    if (filtroTiempo === 'hoy') {
      return movimientos.filter((m) => m.fecha === hoy);
    }
    if (filtroTiempo === 'semana') {
      return movimientos.filter((m) => m.fecha >= hoy && m.fecha <= limite7);
    }
    return movimientos;
  }, [movimientos, filtroTiempo]);

  // Agrupar movimientos por fecha para mostrar encabezados diarios claros
  const gruposPorFecha = useMemo(() => {
    const grupos = {};
    movimientosFiltrados.forEach((m) => {
      if (!grupos[m.fecha]) grupos[m.fecha] = [];
      grupos[m.fecha].push(m);
    });
    return Object.entries(grupos);
  }, [movimientosFiltrados]);

  return (
    <div className="karinga-mobile-page">
      {/* Selector de Filtros de Calendario */}
      <div className="karinga-mobile-segmented-tabs">
        <button
          type="button"
          className={`karinga-mobile-tab-btn ${filtroTiempo === 'hoy' ? 'activo' : ''}`}
          onClick={() => setFiltroTiempo('hoy')}
        >
          <Icono nombre="calendar-check" tamano={15} color="currentColor" />
          <span>Hoy</span>
        </button>

        <button
          type="button"
          className={`karinga-mobile-tab-btn ${filtroTiempo === 'semana' ? 'activo' : ''}`}
          onClick={() => setFiltroTiempo('semana')}
        >
          <Icono nombre="calendar" tamano={15} color="currentColor" />
          <span>Próx. 7 Días</span>
        </button>

        <button
          type="button"
          className={`karinga-mobile-tab-btn ${filtroTiempo === 'todas' ? 'activo' : ''}`}
          onClick={() => setFiltroTiempo('todas')}
        >
          <Icono nombre="calendar-days" tamano={15} color="currentColor" />
          <span>Todos ({movimientos.length})</span>
        </button>
      </div>

      {/* Selector de Cabaña */}
      <div className="karinga-mobile-section" style={{ paddingBottom: 0 }}>
        <select
          className="karinga-mobile-select"
          value={filtroCabana}
          onChange={(e) => setFiltroCabana(e.target.value)}
        >
          <option value="">-- Todas las Cabañas --</option>
          {cabanas.map((c) => (
            <option key={c.id} value={c.id}>{c.nombre}</option>
          ))}
        </select>
      </div>

      {/* Lista Tipo Agenda */}
      <div className="karinga-mobile-section">
        {gruposPorFecha.length === 0 ? (
          <div className="karinga-mobile-empty-state">
            <Icono nombre="calendar" tamano={32} color="#94A3B8" />
            <h4>Sin movimientos programados</h4>
            <p>No se encontraron entradas ni salidas para este rango de fechas.</p>
          </div>
        ) : (
          gruposPorFecha.map(([fechaDia, movs]) => {
            const esHoy = fechaDia === hoyStr;
            return (
              <div key={fechaDia} className="karinga-mobile-day-group">
                <div className={`karinga-mobile-day-header ${esHoy ? 'hoy' : ''}`}>
                  <span>{formatearFechaConDia(fechaDia, 'media')}</span>
                  {esHoy && <span className="karinga-mobile-today-badge">HOY</span>}
                  <span className="karinga-mobile-day-count">{movs.length} movimiento(s)</span>
                </div>

                <div className="karinga-mobile-day-items">
                  {movs.map((m, idx) => {
                    const esCheckin = m.tipo === 'checkin';
                    const r = m.reserva;
                    return (
                      <div
                        key={`${m.tipo}-${r.id}-${idx}`}
                        className={`karinga-mobile-movement-card ${esCheckin ? 'checkin' : 'checkout'}`}
                      >
                        <div className="karinga-mobile-mov-badge">
                          <Icono
                            nombre={esCheckin ? 'door-closed' : 'sparkles'}
                            tamano={14}
                            color={esCheckin ? '#15803D' : '#DC2626'}
                          />
                          <span>{esCheckin ? 'LLEGADA' : 'SALIDA'} • {formatearHora12(m.hora)} ({m.hora} hrs)</span>
                        </div>

                        <div className="karinga-mobile-mov-body">
                          <strong className="karinga-mobile-mov-guest">{r.nombre_reservacion}</strong>
                          <span className="karinga-mobile-mov-cabin">{r.cabana_nombre} • {r.noches} noche(s)</span>
                        </div>

                        <div className="karinga-mobile-mov-footer">
                          <span>Estado: <strong>{r.estado_pago || 'liquidado'}</strong></span>
                          {Number(r.saldo_pendiente) > 0 && (
                            <span className="karinga-mobile-mov-saldo">
                              Pendiente: ${Number(r.saldo_pendiente).toLocaleString('es-MX')} MXN
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

