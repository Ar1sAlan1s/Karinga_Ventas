import { useState } from 'react';
import {
  generarRangoFechas,
  formatearFechaAmigable,
  DIAS_TEMPORADA_ALTA_DEFAULT
} from '../utilidades/gestorTemporadas';
import Icono from './Icono';

export default function ModalGestionTemporadaAlta({
  abierto,
  alCerrar,
  diasTemporadaAlta = [],
  alGuardarDias,
  fechaActual
}) {
  const [nuevaFecha, setNuevaFecha] = useState(fechaActual || '');
  const [rangoInicio, setRangoInicio] = useState('');
  const [rangoFin, setRangoFin] = useState('');
  const [filtroTexto, setFiltroTexto] = useState('');
  const [mensajeExito, setMensajeExito] = useState('');

  if (!abierto) return null;

  const mostrarAviso = (msg) => {
    setMensajeExito(msg);
    setTimeout(() => setMensajeExito(''), 3000);
  };

  const agregarFechaIndividual = (e) => {
    e.preventDefault();
    if (!nuevaFecha) return;
    if (diasTemporadaAlta.includes(nuevaFecha)) {
      mostrarAviso('La fecha ' + nuevaFecha + ' ya está registrada como Temporada Alta.');
      return;
    }
    const actualizada = [...diasTemporadaAlta, nuevaFecha].sort();
    alGuardarDias(actualizada);
    mostrarAviso('Fecha ' + nuevaFecha + ' agregada como Temporada Alta.');
  };

  const agregarPeriodo = (e) => {
    e.preventDefault();
    if (!rangoInicio || !rangoFin) return;
    const fechas = generarRangoFechas(rangoInicio, rangoFin);
    if (fechas.length === 0) {
      mostrarAviso('La fecha de inicio debe ser anterior o igual a la fecha de fin.');
      return;
    }
    const combinadas = Array.from(new Set([...diasTemporadaAlta, ...fechas])).sort();
    alGuardarDias(combinadas);
    mostrarAviso('Se agregaron ' + fechas.length + ' días al periodo de Temporada Alta.');
    setRangoInicio('');
    setRangoFin('');
  };

  const eliminarFecha = (fechaAEliminar) => {
    const actualizada = diasTemporadaAlta.filter((f) => f !== fechaAEliminar);
    alGuardarDias(actualizada);
    mostrarAviso('Fecha ' + fechaAEliminar + ' eliminada de Temporada Alta.');
  };

  const restablecerPorDefecto = () => {
    if (window.confirm('¿Deseas restablecer la lista a los días festivos recomendados?')) {
      alGuardarDias([...DIAS_TEMPORADA_ALTA_DEFAULT].sort());
      mostrarAviso('Lista restablecida a los días festivos recomendados.');
    }
  };

  const fechasFiltradas = diasTemporadaAlta.filter((f) => {
    if (!filtroTexto) return true;
    const amigable = formatearFechaAmigable(f).toLowerCase();
    return f.includes(filtroTexto) || amigable.includes(filtroTexto.toLowerCase());
  });

  return (
    <div className="karinga-modal-overlay" onClick={alCerrar}>
      <div
        className="karinga-modal-contenido"
        style={{ maxWidth: '650px', maxHeight: '90vh', overflowY: 'auto' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid #E2E8F0', paddingBottom: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{ background: '#FEF3C7', padding: '0.4rem', borderRadius: '8px', display: 'flex', alignItems: 'center' }}>
              <Icono nombre="star" tamano={22} color="#D97706" />
            </div>
            <div>
              <h3 style={{ margin: 0, color: 'var(--verde-oscuro)', fontSize: '1.25rem', fontWeight: 800 }}>
                Calendario de Días de Temporada Alta
              </h3>
              <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.82rem', color: '#64748B' }}>
                Define qué días aplican automáticamente la tarifa de Temporada Alta en cabañas y camping.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={alCerrar}
            style={{ background: '#F1F5F9', border: 'none', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748B' }}
          >
            <Icono nombre="close" tamano={16} />
          </button>
        </div>

        {mensajeExito && (
          <div style={{ background: '#ECFDF5', border: '1px solid #A7F3D0', color: '#065F46', padding: '0.6rem 0.85rem', borderRadius: '8px', fontSize: '0.85rem', marginBottom: '1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Icono nombre="check" tamano={16} color="#065F46" />
            <span>{mensajeExito}</span>
          </div>
        )}

        <div style={{ background: '#F8FAFC', border: '1px solid #CBD5E1', borderRadius: '8px', padding: '0.75rem', marginBottom: '1.25rem', fontSize: '0.82rem', color: '#334155' }}>
          <strong>Reglas del Sistema Karinga:</strong>
          <ul style={{ margin: '0.4rem 0 0 1.2rem', padding: 0, lineHeight: 1.5 }}>
            <li><strong>Lunes a Viernes:</strong> Aplica tarifa <em>Entre semana</em> automáticamente.</li>
            <li><strong>Sábado y Domingo:</strong> Aplica tarifa <em>Fin de semana</em> automáticamente.</li>
            <li><strong>Fechas de esta lista:</strong> Aplica tarifa <em>Temporada alta</em> automáticamente.</li>
            <li><strong>Siempre modificable:</strong> En cualquier reserva puedes cambiar la tarifa manualmente (ej. dar precio de entre semana en sábado o domingo).</li>
          </ul>
        </div>

        {/* Formulario 1: Agregar día individual */}
        <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: '10px', padding: '1rem', marginBottom: '1rem' }}>
          <h4 style={{ margin: '0 0 0.6rem 0', color: '#92400E', fontSize: '0.92rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Icono nombre="calendar" tamano={16} color="#92400E" />
            <span>Agregar Día Específico como Temporada Alta</span>
          </h4>
          <form onSubmit={agregarFechaIndividual} style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <input
              type="date"
              className="karinga-input"
              style={{ flex: 1, minWidth: '160px' }}
              value={nuevaFecha}
              onChange={(e) => setNuevaFecha(e.target.value)}
              required
            />
            <button
              type="submit"
              className="karinga-boton karinga-boton-secundario"
              style={{ padding: '0.55rem 1rem', fontSize: '0.85rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
            >
              <Icono nombre="plus" tamano={15} />
              <span>Agregar Día</span>
            </button>
          </form>
        </div>

        {/* Formulario 2: Agregar Periodo de Vacaciones / Rango */}
        <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: '10px', padding: '1rem', marginBottom: '1.25rem' }}>
          <h4 style={{ margin: '0 0 0.6rem 0', color: '#1E40AF', fontSize: '0.92rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Icono nombre="calendar" tamano={16} color="#1E40AF" />
            <span>Agregar Periodo de Vacaciones (Rango de Fechas)</span>
          </h4>
          <form onSubmit={agregarPeriodo} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flex: 1, minWidth: '140px' }}>
              <span style={{ fontSize: '0.8rem', color: '#475569', fontWeight: 600 }}>Desde:</span>
              <input
                type="date"
                className="karinga-input"
                value={rangoInicio}
                onChange={(e) => setRangoInicio(e.target.value)}
                required
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flex: 1, minWidth: '140px' }}>
              <span style={{ fontSize: '0.8rem', color: '#475569', fontWeight: 600 }}>Hasta:</span>
              <input
                type="date"
                className="karinga-input"
                value={rangoFin}
                onChange={(e) => setRangoFin(e.target.value)}
                required
              />
            </div>
            <button
              type="submit"
              className="karinga-boton karinga-boton-primario"
              style={{ padding: '0.55rem 1rem', fontSize: '0.85rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
            >
              <Icono nombre="plus" tamano={15} />
              <span>Agregar Periodo</span>
            </button>
          </form>
        </div>

        {/* Lista de Días Registrados */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <h4 style={{ margin: 0, color: 'var(--negro-carbon)', fontSize: '0.95rem', fontWeight: 700 }}>
              Días Registrados ({diasTemporadaAlta.length} fechas)
            </h4>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                placeholder="Buscar fecha o mes..."
                className="karinga-input"
                style={{ width: '180px', padding: '0.35rem 0.65rem 0.35rem 1.75rem', fontSize: '0.8rem' }}
                value={filtroTexto}
                onChange={(e) => setFiltroTexto(e.target.value)}
              />
              <span style={{ position: 'absolute', left: '0.5rem', top: '50%', transform: 'translateY(-50%)', opacity: 0.5, pointerEvents: 'none' }}>
                <Icono nombre="search" tamano={13} />
              </span>
            </div>
          </div>

          <div
            style={{
              maxHeight: '220px',
              overflowY: 'auto',
              border: '1px solid #E2E8F0',
              borderRadius: '8px',
              padding: '0.5rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.4rem',
              background: '#FFFFFF'
            }}
          >
            {fechasFiltradas.length === 0 ? (
              <div style={{ padding: '1.5rem', textAlign: 'center', color: '#94A3B8', fontSize: '0.85rem' }}>
                No se encontraron fechas de Temporada Alta.
              </div>
            ) : (
              fechasFiltradas.map((f) => (
                <div
                  key={f}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '0.45rem 0.75rem',
                    background: '#F8FAFC',
                    borderRadius: '6px',
                    border: '1px solid #F1F5F9',
                    fontSize: '0.85rem'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontWeight: 700, color: '#DC2626', fontFamily: 'monospace' }}>{f}</span>
                    <span style={{ color: '#475569' }}>• {formatearFechaAmigable(f)}</span>
                  </div>
                  <button
                    type="button"
                    title="Eliminar de temporada alta"
                    onClick={() => eliminarFecha(f)}
                    style={{
                      background: '#FEE2E2',
                      border: 'none',
                      color: '#DC2626',
                      borderRadius: '4px',
                      padding: '0.2rem 0.5rem',
                      cursor: 'pointer',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.25rem'
                    }}
                  >
                    <Icono nombre="trash" tamano={12} color="#DC2626" />
                    <span>Eliminar</span>
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid #E2E8F0' }}>
          <button
            type="button"
            onClick={restablecerPorDefecto}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#64748B',
              textDecoration: 'underline',
              cursor: 'pointer',
              fontSize: '0.82rem'
            }}
          >
            Restablecer días festivos recomendados
          </button>
          <button
            type="button"
            className="karinga-boton karinga-boton-primario"
            onClick={alCerrar}
            style={{ padding: '0.5rem 1.25rem', fontSize: '0.88rem' }}
          >
            Listo / Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
