import Icono from './Icono';
import { useState, useMemo } from 'react';
import { formatearFechaConDia, formatearHora12 } from '../utilidades/gestorTemporadas';

const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

const DIAS_SEMANA = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

function extraerFechaStr(f) {
  if (!f) return null;
  if (f instanceof Date) return f.toISOString().split('T')[0];
  return String(f).split('T')[0];
}

export default function PaginaCalendario({ ventas = [], cabanas = [] }) {
  const hoy = new Date();
  const [anio, setAnio] = useState(hoy.getFullYear());
  const [mes, setMes] = useState(hoy.getMonth());
  const [filtroCabana, setFiltroCabana] = useState('');
  const [diaSeleccionado, setDiaSeleccionado] = useState(hoy.getDate());

  const reservasCabanas = useMemo(() => {
    return ventas.filter((v) => {
      if (!v.cabana_id) return false;
      if (filtroCabana && String(v.cabana_id) !== String(filtroCabana)) return false;
      return true;
    });
  }, [ventas, filtroCabana]);

  const mapaMovimientos = useMemo(() => {
    const mapa = {};

    reservasCabanas.forEach((r) => {
      const fechaIn = extraerFechaStr(r.fecha_checkin || r.fecha);
      if (fechaIn) {
        if (!mapa[fechaIn]) mapa[fechaIn] = { checkins: [], checkouts: [] };
        mapa[fechaIn].checkins.push(r);
      }

      let fechaOut = extraerFechaStr(r.fecha_checkout);
      if (!fechaOut && fechaIn && r.noches) {
        const partes = fechaIn.split('-');
        const d = new Date(parseInt(partes[0], 10), parseInt(partes[1], 10) - 1, parseInt(partes[2], 10));
        d.setDate(d.getDate() + Number(r.noches));
        const pad = (n) => String(n).padStart(2, '0');
        fechaOut = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
      }

      if (fechaOut) {
        if (!mapa[fechaOut]) mapa[fechaOut] = { checkins: [], checkouts: [] };
        mapa[fechaOut].checkouts.push(r);
      }
    });

    return mapa;
  }, [reservasCabanas]);

  const cambiarMes = (delta) => {
    let nuevoMes = mes + delta;
    let nuevoAnio = anio;
    if (nuevoMes < 0) {
      nuevoMes = 11;
      nuevoAnio -= 1;
    } else if (nuevoMes > 11) {
      nuevoMes = 0;
      nuevoAnio += 1;
    }
    setMes(nuevoMes);
    setAnio(nuevoAnio);
    setDiaSeleccionado(1);
  };

  const primerDiaMes = new Date(anio, mes, 1);
  const totalDiasMes = new Date(anio, mes + 1, 0).getDate();
  
  let diaInicioSemana = primerDiaMes.getDay() - 1;
  if (diaInicioSemana < 0) diaInicioSemana = 6;

  const pad = (n) => String(n).padStart(2, '0');
  const fechaSeleccionadaStr = `${anio}-${pad(mes + 1)}-${pad(diaSeleccionado)}`;
  const movimientosDelDia = mapaMovimientos[fechaSeleccionadaStr] || { checkins: [], checkouts: [] };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <section className="karinga-tarjeta" style={{ padding: '1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h2 className="karinga-tarjeta-titulo" style={{ margin: 0, padding: 0, border: 'none' }}>
              <Icono nombre="calendar" tamano={20} color="var(--verde-oscuro)" />
              <span>Calendario de Entradas y Salidas</span>
            </h2>
            <p style={{ margin: '0.25rem 0 0', fontSize: '0.85rem', color: 'var(--gris-medio)' }}>
              Entrada fija 15:00 hrs • Salida estándar 12:00 hrs (extendida automáticamente si se asignan horas extra).
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <select
              className="karinga-select"
              style={{ width: 'auto', minWidth: '220px' }}
              value={filtroCabana}
              onChange={(e) => setFiltroCabana(e.target.value)}
            >
              <option value="">-- Todas las Cabañas ({cabanas.length}) --</option>
              {cabanas.map((c) => (
                <option key={c.id} value={c.id}>{c.nombre}</option>
              ))}
            </select>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: '#F1F5F9', padding: '0.25rem', borderRadius: '8px' }}>
              <button
                type="button"
                className="karinga-btn-contador"
                style={{ width: '32px', height: '32px' }}
                onClick={() => cambiarMes(-1)}
                title="Mes anterior"
              >
                ◀
              </button>
              <span style={{ fontWeight: 700, fontSize: '0.95rem', minWidth: '140px', textAlign: 'center', color: 'var(--verde-oscuro)' }}>
                {MESES[mes]} {anio}
              </span>
              <button
                type="button"
                className="karinga-btn-contador"
                style={{ width: '32px', height: '32px' }}
                onClick={() => cambiarMes(1)}
                title="Mes siguiente"
              >
                ▶
              </button>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '1.25rem', marginTop: '1.25rem', padding: '0.75rem 1rem', background: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0', flexWrap: 'wrap', fontSize: '0.85rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#10B981', display: 'inline-block' }} />
            <span><strong>Entrada (Check-in):</strong> Siempre a las <strong>3:00 PM (15:00 hrs)</strong></span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#EF4444', display: 'inline-block' }} />
            <span><strong>Salida (Check-out):</strong> Estándar <strong>12:00 PM</strong> (o posterior si tiene horas extra)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#F59E0B', display: 'inline-block' }} />
            <span><strong>Saldo Pendiente:</strong> Cobro de Pago 2 al llegar</span>
          </div>
        </div>
      </section>

      <section className="karinga-tarjeta" style={{ padding: '1.25rem' }}>
        <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch', paddingBottom: '0.5rem' }}>
          <div style={{ minWidth: '650px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.5rem', marginBottom: '0.5rem', textAlign: 'center' }}>
              {DIAS_SEMANA.map((dia) => (
                <div key={dia} style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--gris-medio)', textTransform: 'uppercase', padding: '0.4rem 0' }}>
                  {dia}
                </div>
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.5rem' }}>
          {Array.from({ length: diaInicioSemana }).map((_, i) => (
            <div key={`vacio-${i}`} style={{ minHeight: '90px', background: '#F8FAFC', borderRadius: '8px', opacity: 0.4 }} />
          ))}

          {Array.from({ length: totalDiasMes }).map((_, i) => {
            const numeroDia = i + 1;
            const fechaStr = `${anio}-${pad(mes + 1)}-${pad(numeroDia)}`;
            const movs = mapaMovimientos[fechaStr] || { checkins: [], checkouts: [] };
            const tieneMovimientos = movs.checkins.length > 0 || movs.checkouts.length > 0;
            const esHoy = hoy.getFullYear() === anio && hoy.getMonth() === mes && hoy.getDate() === numeroDia;
            const esSeleccionado = diaSeleccionado === numeroDia;

            return (
              <div
                key={numeroDia}
                onClick={() => setDiaSeleccionado(numeroDia)}
                style={{
                  minHeight: '95px',
                  padding: '0.4rem',
                  borderRadius: '8px',
                  border: esSeleccionado 
                    ? '2px solid var(--verde-medio)' 
                    : (esHoy ? '2px solid var(--amarillo-sol)' : '1px solid #E2E8F0'),
                  background: esSeleccionado ? '#ECFDF5' : (esHoy ? '#FFFBEB' : '#FFFFFF'),
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.25rem',
                  transition: 'all 0.15s ease'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{
                    fontWeight: esHoy || esSeleccionado ? 800 : 600,
                    fontSize: '0.85rem',
                    color: esHoy ? '#B45309' : (esSeleccionado ? 'var(--verde-oscuro)' : '#334155')
                  }}>
                    {numeroDia}
                  </span>
                  {esHoy && (
                    <span style={{ fontSize: '0.65rem', background: '#FDE68A', color: '#92400E', padding: '0.1rem 0.35rem', borderRadius: '4px', fontWeight: 700 }}>
                      HOY
                    </span>
                  )}
                </div>

                {movs.checkins.map((chk, idx) => (
                  <div
                    key={`in-${idx}`}
                    style={{
                      background: '#D1FAE5',
                      color: '#065F46',
                      fontSize: '0.7rem',
                      padding: '0.15rem 0.3rem',
                      borderRadius: '4px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      borderLeft: '3px solid #10B981'
                    }}
                    title={`Check-in 15:00: ${chk.cabana_nombre} - ${chk.nombre_reservacion}`}
                  >
                    Check-in 15:00 {chk.cabana_nombre}
                  </div>
                ))}

                {movs.checkouts.map((chk, idx) => {
                  const horasEx = Number(chk.horas_extra) || 0;
                  const horaOut = chk.hora_checkout || (horasEx > 0 ? `${12 + horasEx}:00` : '12:00');
                  return (
                    <div
                      key={`out-${idx}`}
                      style={{
                        background: '#FEE2E2',
                        color: '#991B1B',
                        fontSize: '0.7rem',
                        padding: '0.15rem 0.3rem',
                        borderRadius: '4px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        borderLeft: '3px solid #EF4444'
                      }}
                      title={`Check-out ${horaOut}: ${chk.cabana_nombre} - ${chk.nombre_reservacion}${horasEx > 0 ? ` (+${horasEx}h)` : ''}`}
                    >
                      Check-out {horaOut} {chk.cabana_nombre} {horasEx > 0 ? `(+${horasEx}h)` : ''}
                    </div>
                  );
                })}

                {!tieneMovimientos && (
                  <span style={{ fontSize: '0.7rem', color: '#94A3B8', marginTop: 'auto' }}>
                    Disponible
                  </span>
                )}
              </div>
            );
          })}
            </div>
          </div>
        </div>
      </section>

      {/* Detalle del Día Seleccionado */}
      <section className="karinga-tarjeta" style={{ padding: '1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid #E2E8F0', paddingBottom: '0.75rem' }}>
          <h3 style={{ margin: 0, fontSize: '1.15rem', color: 'var(--verde-oscuro)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span>Movimientos del día:</span>
            <span style={{ color: 'var(--verde-claro)', fontWeight: 800 }}>
              {formatearFechaConDia(fechaSeleccionadaStr, 'completo')}
            </span>
          </h3>
          <span style={{ fontSize: '0.85rem', color: 'var(--gris-medio)' }}>
            {movimientosDelDia.checkins.length} entrada(s) • {movimientosDelDia.checkouts.length} salida(s)
          </span>
        </div>

        {movimientosDelDia.checkins.length === 0 && movimientosDelDia.checkouts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem 1rem', color: '#64748B' }}>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: "0.5rem" }}><Icono nombre="nature" tamano={32} color="#15803D" /></div>
            No hay entradas ni salidas programadas para este día. Las cabañas se encuentran disponibles.
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1rem' }}>
            <div>
              <h4 style={{ margin: '0 0 0.75rem 0', color: '#065F46', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.95rem' }}>
                <Icono nombre="door-closed" tamano={18} color="#15803D" />
                <span>Entradas Programadas (Check-in 15:00 hrs)</span>
              </h4>
              {movimientosDelDia.checkins.length === 0 ? (
                <p style={{ fontSize: '0.85rem', color: '#94A3B8', fontStyle: 'italic' }}>Sin llegadas hoy.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {movimientosDelDia.checkins.map((chk) => (
                    <div key={`detalle-in-${chk.id}`} style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', padding: '0.85rem', borderRadius: '8px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <strong style={{ fontSize: '0.95rem', color: '#14532D' }}>{chk.cabana_nombre}</strong>
                        <span style={{ background: '#10B981', color: '#FFF', fontSize: '0.75rem', fontWeight: 700, padding: '0.15rem 0.4rem', borderRadius: '4px' }}>
                          Check-in 15:00
                        </span>
                      </div>
                      <div style={{ marginTop: '0.4rem', fontSize: '0.85rem', color: '#334155' }}>
                        <div><strong>Huésped:</strong> {chk.nombre_reservacion}</div>
                        <div><strong>Huéspedes / Pulseras:</strong> {chk.huespedes_totales || '-'}</div>
                        <div><Icono nombre="clock" tamano={15} /> <strong>Estancia:</strong> {chk.noches} noche(s)</div>
                        {chk.estado_pago === 'pendiente_liquidacion' ? (
                          <div style={{ color: '#D97706', fontWeight: 700, marginTop: '0.2rem' }}>
                            <span style={{ display: "inline-block", width: 8, height: 8, borderRadius: "50%", background: "#F59E0B", marginRight: 6 }}></span><strong>Saldo Pendiente a Cobrar:</strong> ${Number(chk.saldo_pendiente || chk.total).toLocaleString('es-MX')} MXN
                          </div>
                        ) : (
                          <div style={{ color: '#059669', fontWeight: 600, marginTop: '0.2rem' }}>
                            <span style={{ display: "inline-block", width: 8, height: 8, borderRadius: "50%", background: "#10B981", marginRight: 6 }}></span><strong>Hospedaje Liquidado Completo</strong>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <h4 style={{ margin: '0 0 0.75rem 0', color: '#991B1B', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.95rem' }}>
                <Icono nombre="door-open" tamano={18} color="#B91C1C" />
                <span>Salidas Programadas (Check-out)</span>
              </h4>
              {movimientosDelDia.checkouts.length === 0 ? (
                <p style={{ fontSize: '0.85rem', color: '#94A3B8', fontStyle: 'italic' }}>Sin salidas hoy.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {movimientosDelDia.checkouts.map((chk) => {
                    const horasEx = Number(chk.horas_extra) || 0;
                    const horaOut = chk.hora_checkout || (horasEx > 0 ? `${12 + horasEx}:00` : '12:00');
                    return (
                      <div key={`detalle-out-${chk.id}`} style={{ background: '#FEF2F2', border: '1px solid #FECACA', padding: '0.85rem', borderRadius: '8px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <strong style={{ fontSize: '0.95rem', color: '#7F1D1D' }}>{chk.cabana_nombre}</strong>
                          <span style={{ background: '#EF4444', color: '#FFF', fontSize: '0.75rem', fontWeight: 700, padding: '0.15rem 0.4rem', borderRadius: '4px' }}>
                            Salida {horaOut} hrs
                          </span>
                        </div>
                        <div style={{ marginTop: '0.4rem', fontSize: '0.85rem', color: '#334155' }}>
                          <div><Icono nombre="user" tamano={15} /> <strong>Huésped:</strong> {chk.nombre_reservacion}</div>
                          {horasEx > 0 ? (
                            <div style={{ color: '#B45309', fontWeight: 700 }}>
                              ⏱️ <strong>Horas Extra Asignadas:</strong> +{horasEx} hr (${chk.costo_horas_extra || horasEx * 250} MXN)
                            </div>
                          ) : (
                            <div style={{ color: '#64748B' }}>
                              ⏱️ <strong>Salida Estándar:</strong> 12:00 PM (Sin horas extra)
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
