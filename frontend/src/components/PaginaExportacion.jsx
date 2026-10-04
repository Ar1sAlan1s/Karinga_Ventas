import { useState, useMemo } from 'react';
import Icono from './Icono';
import { exportarExcelCliente } from '../servicios/exportarExcel';
import { obtenerSemanasDeVentas, filtrarVentasPorSemana, obtenerInfoSemana, obtenerSemanaActual } from '../utilidades/gestorSemanas';

export default function PaginaExportacion({
  ventas = [],
  cargandoExcel,
  alCambiarPagina
}) {
  const [tipoReporte, setTipoReporte] = useState('todos'); // 'todos', 'cabanas', 'interacciones'
  const [filtroSemana, setFiltroSemana] = useState('todas'); // 'todas' o 'YYYY-Wnn'

  const semanaActual = useMemo(() => obtenerSemanaActual(), []);

  const semanasDisponibles = useMemo(() => {
    const semanas = obtenerSemanasDeVentas(ventas);
    if (!semanaActual) return semanas;
    return semanas.filter((s) => s.claveSemana <= semanaActual.claveSemana);
  }, [ventas, semanaActual]);

  const semanaSeleccionadaInfo = useMemo(() => {
    if (filtroSemana === 'todas') return null;
    return semanasDisponibles.find((s) => s.claveSemana === filtroSemana) || null;
  }, [filtroSemana, semanasDisponibles]);


  let ventasSeleccionadas = ventas;
  if (tipoReporte === 'cabanas') ventasSeleccionadas = ventas.filter((v) => Boolean(v.cabana_id));
  else if (tipoReporte === 'interacciones') ventasSeleccionadas = ventas.filter((v) => !v.cabana_id);

  // Excluir semanas futuras (solo semanas finalizadas o semana actual)
  if (semanaActual) {
    ventasSeleccionadas = ventasSeleccionadas.filter((v) => {
      const info = obtenerInfoSemana(v.fecha);
      return info && info.claveSemana <= semanaActual.claveSemana;
    });
  }

  // Filtrar por semana
  ventasSeleccionadas = filtrarVentasPorSemana(ventasSeleccionadas, filtroSemana);

  const totalMonto = ventasSeleccionadas.reduce((acc, v) => acc + (Number(v.total) || 0), 0);
  const totalAnticipos = ventasSeleccionadas.reduce((acc, v) => acc + (Number(v.anticipo) || 0), 0);

  const ejecutarDescarga = () => {
    exportarExcelCliente(ventas, tipoReporte, filtroSemana);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Cabecera Principal */}
      <section className="karinga-tarjeta" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ background: '#DCFCE7', padding: '0.65rem', borderRadius: '12px', display: 'flex', alignItems: 'center' }}>
              <Icono nombre="excel" tamano={28} color="#15803D" />
            </div>
            <div>
              <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                Centro de Exportación de Reportes Excel
              </h2>
              <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748B' }}>
                Genera hojas de cálculo oficiales con desglose de semanas, fechas de inicio/fin y canales de pago.
              </p>
            </div>
          </div>

          {alCambiarPagina && (
            <button
              type="button"
              className="karinga-btn-secundario"
              onClick={() => alCambiarPagina('reportes')}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
            >
              <Icono nombre="chart-bar" tamano={16} />
              <span>Ver Métricas en Pantalla</span>
            </button>
          )}
        </div>
      </section>

      {/* SELECTOR DE PERÍODO / SEMANA DE LA EMPRESA */}
      <section className="karinga-tarjeta" style={{ padding: '1.25rem' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#334155', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Icono nombre="calendar" tamano={18} color="var(--verde-oscuro)" />
          <span>Seleccione el Período / Semana de la Empresa</span>
        </h3>
        <p style={{ fontSize: '0.85rem', color: '#64748B', marginBottom: '1rem' }}>
          Por estándar operativo, las semanas inician los días Lunes y finalizan los días Domingo.
        </p>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <div style={{ minWidth: '300px', flex: '1', maxWidth: '450px' }}>
            <select
              className="karinga-select"
              value={filtroSemana}
              onChange={(e) => setFiltroSemana(e.target.value)}
              style={{ fontWeight: 600 }}
            >
              <option value="todas">Todas las Semanas Concluidas y Semana Actual</option>
              {semanasDisponibles.map((s) => {
                const esActual = s.claveSemana === semanaActual?.claveSemana;
                return (
                  <option key={s.claveSemana} value={s.claveSemana}>
                    {s.etiquetaCorta} {esActual ? '(Semana Actual)' : '(Concluida)'}: {s.inicioMX} al {s.finMX} ({s.totalVentas} ventas)
                  </option>
                );
              })}
            </select>
          </div>

          {semanaSeleccionadaInfo && (
            <div style={{ background: '#ECFDF5', border: '1px solid #A7F3D0', padding: '0.5rem 1rem', borderRadius: '8px', fontSize: '0.85rem', color: '#065F46' }}>
              <strong>{semanaSeleccionadaInfo.etiquetaCorta}:</strong> Inicia el {semanaSeleccionadaInfo.inicioMX} y termina el {semanaSeleccionadaInfo.finMX}
            </div>
          )}
        </div>
      </section>

      {/* Selector de Alcance */}
      <section className="karinga-tarjeta" style={{ padding: '1.25rem' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#334155', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Icono nombre="clipboard" tamano={18} color="var(--verde-oscuro)" />
          <span>Seleccione el Tipo de Reporte a Exportar</span>
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', marginTop: '0.85rem' }}>
          <div
            onClick={() => setTipoReporte('todos')}
            style={{
              padding: '1.25rem',
              borderRadius: '10px',
              border: `2px solid ${tipoReporte === 'todos' ? '#15803D' : '#E2E8F0'}`,
              background: tipoReporte === 'todos' ? '#F0FDF4' : '#FFFFFF',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <span style={{ fontWeight: 800, color: '#0F172A', fontSize: '1.05rem' }}>Todo el Historial</span>
              <Icono nombre="folder" tamano={22} color={tipoReporte === 'todos' ? '#15803D' : '#94A3B8'} />
            </div>
            <p style={{ margin: 0, fontSize: '0.82rem', color: '#64748B' }}>
              Consolidado completo de Hospedaje en Cabañas y Actividades ecoturísticas.
            </p>
          </div>

          <div
            onClick={() => setTipoReporte('cabanas')}
            style={{
              padding: '1.25rem',
              borderRadius: '10px',
              border: `2px solid ${tipoReporte === 'cabanas' ? '#0284C7' : '#E2E8F0'}`,
              background: tipoReporte === 'cabanas' ? '#F0F9FF' : '#FFFFFF',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <span style={{ fontWeight: 800, color: '#0F172A', fontSize: '1.05rem' }}>Solo Cabañas</span>
              <Icono nombre="bed" tamano={22} color={tipoReporte === 'cabanas' ? '#0284C7' : '#94A3B8'} />
            </div>
            <p style={{ margin: 0, fontSize: '0.82rem', color: '#64748B' }}>
              Solo hospedaje, huéspedes, check-in, check-out, horas extra y tarifas nocturnas.
            </p>
          </div>

          <div
            onClick={() => setTipoReporte('interacciones')}
            style={{
              padding: '1.25rem',
              borderRadius: '10px',
              border: `2px solid ${tipoReporte === 'interacciones' ? '#D97706' : '#E2E8F0'}`,
              background: tipoReporte === 'interacciones' ? '#FFFBEB' : '#FFFFFF',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <span style={{ fontWeight: 800, color: '#0F172A', fontSize: '1.05rem' }}>Solo Actividades</span>
              <Icono nombre="actividades" tamano={22} color={tipoReporte === 'interacciones' ? '#D97706' : '#94A3B8'} />
            </div>
            <p style={{ margin: 0, fontSize: '0.82rem', color: '#64748B' }}>
              Visitas guiadas, camping, fresas, tirolesas y paseos a caballo sin datos de estancia.
            </p>
          </div>
        </div>
      </section>

      {/* Tarjeta de Resumen y Botón de Descarga */}
      <section className="karinga-tarjeta" style={{ padding: '1.5rem', background: '#F8FAFC' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem' }}>
          <div>
            <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
              Resumen del Archivo a Descargar
            </h4>
            <div style={{ display: 'flex', gap: '1.5rem', marginTop: '0.5rem', flexWrap: 'wrap', fontSize: '0.88rem' }}>
              <span>Registros a incluir: <strong>{ventasSeleccionadas.length}</strong></span>
              <span>Período: <strong>{semanaSeleccionadaInfo ? semanaSeleccionadaInfo.etiquetaCompleta : 'Semanas concluidas y semana actual'}</strong></span>
              <span>Monto total: <strong style={{ color: '#15803D' }}>$${totalMonto.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</strong></span>
              <span>Anticipos: <strong style={{ color: '#1D4ED8' }}>$${totalAnticipos.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</strong></span>
            </div>
            <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.78rem', color: '#64748B' }}>
              El archivo incluirá pestañas para: Ventas detalladas con semanas, Hoja resumen por semanas y Hoja de canales de pago.
            </p>
          </div>

          <button
            type="button"
            className="karinga-btn-excel"
            onClick={ejecutarDescarga}
            disabled={cargandoExcel || ventasSeleccionadas.length === 0}
            style={{ padding: '0.75rem 1.5rem', fontSize: '0.95rem' }}
          >
            <Icono nombre="excel" tamano={20} />
            <span>{cargandoExcel ? 'Generando Excel...' : 'Descargar Archivo Excel (.xlsx)'}</span>
          </button>
        </div>
      </section>
    </div>
  );
}
