import { useState } from 'react';
import { OPCIONES_TEMPORADA } from '../constantes/datosIniciales';
import {
  determinarInfoFecha,
  formatearFechaConDia,
  formatearHora12
} from '../utilidades/gestorTemporadas';
import ModalGestionTemporadaAlta from './ModalGestionTemporadaAlta';
import Icono from './Icono';

export default function ConfiguracionRegistro({
  fecha,
  alCambiarFecha,
  hora,
  alCambiarHora,
  temporada,
  alCambiarTemporada,
  diasTemporadaAlta = [],
  alGuardarDiasTemporadaAlta
}) {
  const [modalAbierto, setModalAbierto] = useState(false);

  const infoFecha = determinarInfoFecha(fecha, diasTemporadaAlta);

  const ponerHoy = () => {
    const ahora = new Date();
    const y = ahora.getFullYear();
    const m = String(ahora.getMonth() + 1).padStart(2, '0');
    const d = String(ahora.getDate()).padStart(2, '0');
    alCambiarFecha(`${y}-${m}-${d}`);
  };

  const ponerManana = () => {
    const manana = new Date();
    manana.setDate(manana.getDate() + 1);
    const y = manana.getFullYear();
    const m = String(manana.getMonth() + 1).padStart(2, '0');
    const d = String(manana.getDate()).padStart(2, '0');
    alCambiarFecha(`${y}-${m}-${d}`);
  };

  const ponerHoraActual = () => {
    const ahora = new Date();
    const hh = String(ahora.getHours()).padStart(2, '0');
    const mm = String(ahora.getMinutes()).padStart(2, '0');
    alCambiarHora(`${hh}:${mm}`);
  };

  const manejarToggleTemporadaAltaDia = () => {
    if (infoFecha.esTemporadaAlta) {
      const actualizada = diasTemporadaAlta.filter((f) => f !== fecha);
      if (alGuardarDiasTemporadaAlta) alGuardarDiasTemporadaAlta(actualizada);
      alCambiarTemporada(infoFecha.esFinSemana ? 'fin_semana' : 'entre_semana');
    } else {
      const actualizada = Array.from(new Set([...diasTemporadaAlta, fecha])).sort();
      if (alGuardarDiasTemporadaAlta) alGuardarDiasTemporadaAlta(actualizada);
      alCambiarTemporada('temporada_alta');
    }
  };

  const opcionActiva = OPCIONES_TEMPORADA.find((o) => o.id === temporada);
  const opcionSugerida = OPCIONES_TEMPORADA.find((o) => o.id === infoFecha.temporadaSugerida);
  const esAjusteManual = temporada !== infoFecha.temporadaSugerida;

  return (
    <>
      <section className="karinga-tarjeta karinga-seccion-bloque">
        <div className="karinga-seccion-header">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', flexWrap: 'wrap', gap: '0.5rem' }}>
            <h2 className="karinga-tarjeta-titulo" style={{ margin: 0, padding: 0, border: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Icono nombre="calendar" tamano={20} color="var(--verde-oscuro)" />
              <span>Configuración de Fecha & Tarifas</span>
            </h2>
            <button
              type="button"
              onClick={() => setModalAbierto(true)}
              style={{
                background: '#FEF3C7',
                border: '1px solid #FCD34D',
                color: '#92400E',
                borderRadius: '8px',
                padding: '0.35rem 0.75rem',
                fontSize: '0.8rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem'
              }}
              title="Administrar qué días o periodos cobran como Temporada Alta"
            >
              <Icono nombre="gear" tamano={15} color="#92400E" />
              <span>Configurar Temporada Alta ({diasTemporadaAlta.length})</span>
            </button>
          </div>
        </div>

        {/* Tarjeta Visual Destacada de Fecha, Día y Hora */}
        <div className="karinga-visual-fecha-hora-card">
          <div className="karinga-visual-fecha-dia">
            <div className="karinga-visual-dia-badge">
              <Icono nombre="calendar" tamano={18} color="#FFFFFF" />
              <span>{infoFecha.diaNombre ? infoFecha.diaNombre.toUpperCase() : 'FECHA'}</span>
            </div>
            <div className="karinga-visual-fecha-texto">
              <strong className="karinga-visual-fecha-grande">
                {formatearFechaConDia(fecha, 'completo') || fecha}
              </strong>
              <span className="karinga-visual-temporada-subtexto">
                {infoFecha.esTemporadaAlta ? 'Temporada Alta (Festivo / Vacaciones)' : (infoFecha.esFinSemana ? 'Tarifa Fin de Semana (Viernes a Domingo)' : 'Tarifa Entre Semana (Lunes a Jueves)')}
              </span>
            </div>
          </div>

          <div className="karinga-visual-hora-box">
            <div className="karinga-visual-hora-badge">
              <Icono nombre="clock" tamano={16} color="var(--verde-oscuro)" />
              <strong className="karinga-visual-hora-12h">{formatearHora12(hora)}</strong>
              <small className="karinga-visual-hora-24h">({hora} hrs)</small>
            </div>
          </div>
        </div>

        <div className="karinga-fila-campos">
          <div className="karinga-campo" style={{ flex: 1.2 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label htmlFor="input-fecha" style={{ margin: 0 }}>
                Fecha de la Venta / Check-in <span className="requerido">*</span>
              </label>
              <div className="karinga-quick-dates">
                <button type="button" className="karinga-quick-btn" onClick={ponerHoy} title="Poner fecha de hoy">
                  Hoy
                </button>
                <button type="button" className="karinga-quick-btn" onClick={ponerManana} title="Poner fecha de mañana">
                  Mañana
                </button>
              </div>
            </div>
            <input
              id="input-fecha"
              type="date"
              className="karinga-input"
              value={fecha}
              onChange={(e) => alCambiarFecha(e.target.value)}
              title="Permite registrar fechas pasadas, actuales o futuras"
              required
              style={{ fontWeight: 700, fontSize: '1rem', letterSpacing: '0.02em' }}
            />
            {infoFecha.diaNombre && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.45rem', flexWrap: 'wrap' }}>
                <span className={"karinga-temporada-info-badge " + infoFecha.temporadaSugerida}>
                  <Icono nombre={infoFecha.esTemporadaAlta ? 'star' : 'calendar'} tamano={14} color="currentColor" />
                  <span>{infoFecha.diaNombre} • {infoFecha.esTemporadaAlta ? 'Temporada Alta' : (infoFecha.esFinSemana ? 'Fin de semana' : 'Entre semana')}</span>
                </span>
                <button
                  type="button"
                  onClick={manejarToggleTemporadaAltaDia}
                  style={{
                    background: infoFecha.esTemporadaAlta ? '#FEE2E2' : '#EFF6FF',
                    border: "1px solid " + (infoFecha.esTemporadaAlta ? '#FECACA' : '#BFDBFE'),
                    color: infoFecha.esTemporadaAlta ? '#B91C1C' : '#1D4ED8',
                    borderRadius: '6px',
                    padding: '0.2rem 0.55rem',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem'
                  }}
                  title={infoFecha.esTemporadaAlta ? 'Quitar esta fecha de temporada alta' : 'Marcar esta fecha específica como temporada alta'}
                >
                  <Icono nombre="star" tamano={12} color="currentColor" />
                  <span>{infoFecha.esTemporadaAlta ? 'Quitar de Temporada Alta' : 'Marcar como Temporada Alta'}</span>
                </button>
              </div>
            )}
          </div>

          <div className="karinga-campo">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label htmlFor="input-hora" style={{ margin: 0 }}>
                Hora de la Venta <span className="requerido">*</span>
              </label>
              <div className="karinga-quick-dates">
                <button type="button" className="karinga-quick-btn" onClick={ponerHoraActual} title="Poner hora exacta actual">
                  Hora Actual
                </button>
              </div>
            </div>
            <input
              id="input-hora"
              type="time"
              className="karinga-input"
              value={hora}
              onChange={(e) => alCambiarHora(e.target.value)}
              required
              style={{ fontWeight: 700, fontSize: '1rem' }}
            />
          </div>
        </div>

        <div className="karinga-campo" style={{ marginTop: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '0.4rem' }}>
            <label style={{ margin: 0 }}>
              Tarifa Activa <span className="requerido">*</span>
            </label>
            <span style={{ fontSize: '0.8rem', color: '#64748B' }}>
              Calculada automáticamente por fecha • Puedes cambiarla libremente si lo requieres
            </span>
          </div>

          <div className="karinga-selector-botones">
            {OPCIONES_TEMPORADA.map((opcion) => {
              const esActivo = temporada === opcion.id;
              return (
                <button
                  key={opcion.id}
                  type="button"
                  className={"karinga-boton-opcion " + (esActivo ? 'activo-temporada' : '')}
                  onClick={() => alCambiarTemporada(opcion.id)}
                >
                  <span>{opcion.etiqueta}</span>
                  <small style={{ fontSize: '0.75rem', opacity: 0.85 }}>{opcion.descripcion}</small>
                </button>
              );
            })}
          </div>

          {esAjusteManual ? (
            <div className="karinga-temporada-aviso-manual">
              <Icono nombre="info" tamano={18} color="#92400E" />
              <div>
                <strong>Ajuste manual aplicado:</strong> Se cobrará tarifa de <u>{opcionActiva?.etiqueta}</u> para este {infoFecha.diaNombre} (Tarifa sugerida por fecha: {opcionSugerida?.etiqueta}).
              </div>
            </div>
          ) : (
            <div className="karinga-temporada-aviso-auto">
              <Icono nombre="check" tamano={15} color="#047857" />
              <span>Tarifa sugerida aplicada automáticamente según la fecha seleccionada ({infoFecha.diaNombre}).</span>
            </div>
          )}
        </div>
      </section>

      <ModalGestionTemporadaAlta
        abierto={modalAbierto}
        alCerrar={() => setModalAbierto(false)}
        diasTemporadaAlta={diasTemporadaAlta}
        alGuardarDias={alGuardarDiasTemporadaAlta}
        fechaActual={fecha}
      />
    </>
  );
}
