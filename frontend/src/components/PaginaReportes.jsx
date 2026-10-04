import { useState, useMemo } from 'react';
import Icono from './Icono';
import {
  obtenerInfoSemana,
  obtenerSemanaActual,
  obtenerProximaSemana,
  obtenerSemanasDeVentas,
  filtrarVentasPorSemana,
  estaReservaEnSemana
} from '../utilidades/gestorSemanas';

function obtenerNombreConcepto(v) {
  if (v.cabana_id || v.tipo_venta === 'cabana') {
    return v.cabana_nombre ? `Cabaña ${v.cabana_nombre}` : (v.concepto || 'Hospedaje');
  }

  // Actividades: Armar siempre los nombres reales de las actividades vendidas
  const partes = [];
  if (Number(v.camping_personas) > 0) partes.push(`Camping (${v.camping_personas} pers.)`);
  if (Number(v.visitas_personas) > 0) partes.push(`Entrada Visitas (${v.visitas_personas})`);
  if (Number(v.paquete_granja) > 0) partes.push(`Paquete Granja (${v.paquete_granja})`);
  if (Number(v.paquete_vive) > 0) partes.push(`Paquete Vive Karinga (${v.paquete_vive})`);
  if (Number(v.senderismo_personas) > 0) {
    const pUnit = Number(v.senderismo_precio_unitario) || (Number(v.senderismo_personas) >= 6 ? 70 : 100);
    partes.push(`Senderismo (${v.senderismo_personas} pers. @ $${pUnit})`);
  }
  if (Number(v.gotcha_paquetes) > 0) partes.push(`Gotcha (${v.gotcha_paquetes})`);
  if (Number(v.interaccion_animales) > 0) partes.push(`Interacción Animales (${v.interaccion_animales})`);
  if (Number(v.fresa_kilos) > 0) partes.push(`Fresa (${v.fresa_kilos} Kg)`);
  if (Number(v.fresa_medios) > 0) partes.push(`Fresa (${v.fresa_medios} × ½ Kg)`);
  if (Number(v.miel_litros) > 0) partes.push(`Miel (${v.miel_litros} L)`);
  if (Number(v.huevo_conos) > 0) partes.push(`Huevo (${v.huevo_conos} conos)`);
  if (Number(v.huevo_piezas) > 0) partes.push(`Huevo (${v.huevo_piezas} pz)`);
  if (Number(v.tirolesa_boletos) > 0) partes.push(`Tirolesa (${v.tirolesa_boletos})`);
  if (Number(v.cabalgata_30min) > 0) partes.push(`Cabalgata 30m (${v.cabalgata_30min})`);
  if (Number(v.cabalgata_1hora) > 0) partes.push(`Cabalgata 1h (${v.cabalgata_1hora})`);

  if (partes.length > 0) {
    return partes.join(', ');
  }
  if (v.detalles_actividades && v.detalles_actividades !== 'Ninguna') {
    return v.detalles_actividades;
  }
  if (v.concepto && !v.concepto.trim().startsWith('Actividades')) {
    return v.concepto;
  }
  return 'Actividades Recreativas';
}

function obtenerDanoDeposito(v) {
  let monto = 0;
  const conceptos = [];
  if (v.concepto && v.concepto.includes('[Daño/Pérdida:')) {
    const regex = /\[Daño\/Pérdida:\s*([^(]+?)\s*\(\$([0-9.,]+)\)\]/gi;
    let m;
    while ((m = regex.exec(v.concepto)) !== null) {
      const cant = parseFloat(m[2]) || 0;
      monto += cant;
      conceptos.push(m[1].trim());
    }
  } else if (v.notas && v.notas.includes('[DAÑO CUBIERTO CON DEPÓSITO]')) {
    const regex = /Se retuvo \$([0-9.,]+) MXN del depósito por:\s*"([^"]+)"/gi;
    let m;
    while ((m = regex.exec(v.notas)) !== null) {
      const cant = parseFloat(m[1]) || 0;
      monto += cant;
      conceptos.push(m[2].trim());
    }
  }
  return { monto, concepto: conceptos.join(', ') || null };
}

function obtenerDesgloseCobrosExtra(v) {
  if (Array.isArray(v.cobros_extra_detalle) && v.cobros_extra_detalle.length > 0) {
    return v.cobros_extra_detalle;
  }
  const extras = [];
  const hExtra = Number(v.horas_extra) || 0;
  const costoHExtra = Number(v.costo_horas_extra) || (hExtra * 250);
  if (hExtra > 0) {
    extras.push(`+${hExtra}h extra ($${costoHExtra.toLocaleString('es-MX')})`);
  }

  const pExtra = Number(v.personas_extra) || 0;
  const costoPExtra = Number(v.costo_personas_extra) || (pExtra * 250);
  if (pExtra > 0) {
    extras.push(`+${pExtra} pers. extra ($${costoPExtra.toLocaleString('es-MX')})`);
  }

  const dano = obtenerDanoDeposito(v);
  if (dano.monto > 0) {
    extras.push(`Daño: ${dano.concepto} ($${dano.monto.toLocaleString('es-MX')})`);
  }

  return extras;
}

export default function PaginaReportes({
  ventas = [],
  alRecargar,
  alCambiarPagina
}) {
  const semanaActual = useMemo(() => obtenerSemanaActual(), []);
  const proximaSemana = useMemo(() => obtenerProximaSemana(), []);

  const [filtroTipo, setFiltroTipo] = useState('todos'); // 'todos', 'cabanas', 'interacciones'
  const [filtroSemana, setFiltroSemana] = useState('actual'); // 'actual', 'proxima', 'todas' o 'YYYY-Wnn'
  const [busqueda, setBusqueda] = useState('');

  // Clave de semana efectiva para filtrado uniforme
  const claveSemanaEfectiva = useMemo(() => {
    if (filtroSemana === 'actual') return semanaActual?.claveSemana;
    if (filtroSemana === 'proxima') return proximaSemana?.claveSemana;
    return filtroSemana; // 'todas' o 'YYYY-Wnn'
  }, [filtroSemana, semanaActual, proximaSemana]);

  // Lista de semanas calculada a partir de las ventas
  const semanasDisponibles = useMemo(() => {
    return obtenerSemanasDeVentas(ventas);
  }, [ventas]);

  // Contadores para los botones de acceso rápido de semanas
  const conteoSemanaActual = useMemo(() => {
    return ventas.filter((v) => estaReservaEnSemana(v, semanaActual)).length;
  }, [ventas, semanaActual]);

  const conteoProximaSemana = useMemo(() => {
    return ventas.filter((v) => estaReservaEnSemana(v, proximaSemana)).length;
  }, [ventas, proximaSemana]);

  const conteoTodasSemanas = ventas.length;

  // Info de la semana actualmente seleccionada (para el banner informativo)
  const semanaSeleccionadaInfo = useMemo(() => {
    if (filtroSemana === 'todas') return null;
    if (filtroSemana === 'actual') return semanaActual;
    if (filtroSemana === 'proxima') return proximaSemana;
    return semanasDisponibles.find((s) => s.claveSemana === claveSemanaEfectiva) || obtenerInfoSemana(claveSemanaEfectiva);
  }, [filtroSemana, claveSemanaEfectiva, semanaActual, proximaSemana, semanasDisponibles]);

  // Ventas filtradas por tipo, semana y término de búsqueda
  const ventasFiltradas = useMemo(() => {
    // 1. Filtrar por tipo
    let resultado = ventas;
    if (filtroTipo === 'cabanas') resultado = resultado.filter((v) => Boolean(v.cabana_id));
    else if (filtroTipo === 'interacciones') resultado = resultado.filter((v) => !v.cabana_id);

    // 2. Filtrar por semana efectiva
    resultado = filtrarVentasPorSemana(resultado, claveSemanaEfectiva);

    // 3. Filtrar por búsqueda
    if (busqueda) {
      const b = busqueda.toLowerCase();
      resultado = resultado.filter((v) => {
        const nom = (v.nombre_reservacion || '').toLowerCase();
        const conc = (v.concepto || '').toLowerCase();
        const cab = (v.cabana_nombre || '').toLowerCase();
        const comp = (v.comprobante_anticipo || '').toLowerCase();
        return nom.includes(b) || conc.includes(b) || cab.includes(b) || comp.includes(b);
      });
    }

    return resultado;
  }, [ventas, filtroTipo, claveSemanaEfectiva, busqueda]);

  const totalCobrado = ventasFiltradas.reduce((acc, v) => acc + (Number(v.total) || 0), 0);
  const totalAnticipos = ventasFiltradas.reduce((acc, v) => acc + (Number(v.anticipo) || 0), 0);
  const totalDescuentos = ventasFiltradas.reduce((acc, v) => acc + (Number(v.descuento_especial) || 0), 0);
  const numDescuentos = ventasFiltradas.filter((v) => (Number(v.descuento_especial) || 0) > 0).length;

  // Ventas con el filtro de semana actual activo (para contadores dinámicos de los pills 'todos', 'cabanas', 'actividades')
  const ventasSemanaActual = useMemo(() => {
    return filtrarVentasPorSemana(ventas, claveSemanaEfectiva);
  }, [ventas, claveSemanaEfectiva]);

  const conteoTodos = ventasSemanaActual.length;
  const conteoCabanas = ventasSemanaActual.filter((v) => Boolean(v.cabana_id)).length;
  const conteoInteracciones = ventasSemanaActual.filter((v) => !v.cabana_id).length;

  // DESGLOSE POR TIPOS DE PAGO Y CANTIDADES (INCLUYENDO 'Web')
  const desgloseMetodosPago = useMemo(() => {
    const metodosConfig = [
      { id: 'Efectivo', nombre: 'Efectivo', icono: 'cash', color: '#16A34A' },
      { id: 'Transferencia BBVA', nombre: 'Transferencia BBVA', icono: 'bank', color: '#1E40AF' },
      { id: 'Transferencia Bajío', nombre: 'Transferencia Bajío', icono: 'bank', color: '#D97706' },
      { id: 'Tarjeta Zettle', nombre: 'Tarjeta Zettle', icono: 'credit-card', color: '#0284C7' },
      { id: 'Web', nombre: 'Web', icono: 'web', color: '#0D9488' },
      { id: 'Airbnb', nombre: 'Airbnb', icono: 'bed', color: '#E11D48' }
    ];

    const mapa = {};
    metodosConfig.forEach((m) => {
      mapa[m.id] = { ...m, total: 0, cantidad: 0 };
    });

    ventasFiltradas.forEach((v) => {
      const ant = Number(v.anticipo) || 0;
      const metAnt = v.metodo_pago_anticipo || v.metodo_pago;
      if (ant > 0 && metAnt) {
        if (!mapa[metAnt]) {
          mapa[metAnt] = { id: metAnt, nombre: metAnt, icono: 'bank', color: '#475569', total: 0, cantidad: 0 };
        }
        mapa[metAnt].total += ant;
        mapa[metAnt].cantidad += 1;
      }

      const montoLiq = Number(v.monto_liquidado) || (ant === 0 ? Number(v.total) : 0);
      const metLiq = v.metodo_pago_liquidacion || v.metodo_pago || 'Efectivo';
      if (montoLiq > 0 && metLiq) {
        if (!mapa[metLiq]) {
          mapa[metLiq] = { id: metLiq, nombre: metLiq, icono: 'cash', color: '#475569', total: 0, cantidad: 0 };
        }
        mapa[metLiq].total += montoLiq;
        mapa[metLiq].cantidad += 1;
      }

      // Daño retenido del depósito en garantía (siempre ingresa en Efectivo)
      let montoDano = 0;
      if (v.concepto && v.concepto.includes('[Daño/Pérdida:')) {
        const regex = /\[Daño\/Pérdida:\s*([^(]+?)\s*\(\$([0-9.,]+)\)\]/gi;
        let m;
        while ((m = regex.exec(v.concepto)) !== null) {
          montoDano += parseFloat(m[2]) || 0;
        }
      } else if (v.notas && v.notas.includes('[DAÑO CUBIERTO CON DEPÓSITO]')) {
        const regexNotas = /Se retuvo \$([0-9.,]+) MXN del depósito por:\s*"([^"]+)"/gi;
        let m;
        while ((m = regexNotas.exec(v.notas)) !== null) {
          montoDano += parseFloat(m[1]) || 0;
        }
      }
      if (montoDano > 0) {
        const metDano = 'Efectivo';
        if (!mapa[metDano]) {
          mapa[metDano] = { id: metDano, nombre: metDano, icono: 'cash', color: '#16A34A', total: 0, cantidad: 0 };
        }
        mapa[metDano].total += montoDano;
        mapa[metDano].cantidad += 1;
      }
    });

    return Object.values(mapa);
  }, [ventasFiltradas]);

  const formatearFecha = (fecha) => {
    if (!fecha) return '-';
    if (fecha instanceof Date) return fecha.toISOString().split('T')[0];
    return String(fecha).split('T')[0];
  };

  return (
    <div className="karinga-reportes-contenedor">
      {/* Tarjetas de Métricas Generales */}
      <div className="karinga-metricas-grid">
        <div className="karinga-metrica-card">
          <div className="karinga-metrica-icono" style={{ background: '#DCFCE7' }}>
            <Icono nombre="cash" tamano={22} color="#15803D" />
          </div>
          <div className="karinga-metrica-info">
            <span className="karinga-metrica-etiqueta">
              {semanaSeleccionadaInfo ? `Recaudado ${semanaSeleccionadaInfo.etiquetaCorta}` : 'Total Recaudado'}
            </span>
            <strong className="karinga-metrica-valor" style={{ color: '#15803D' }}>
              ${`${totalCobrado.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`}
            </strong>
            <small style={{ color: '#64748B', fontSize: '0.75rem' }}>{ventasFiltradas.length} transacciones registradas</small>
          </div>
        </div>

        <div className="karinga-metrica-card">
          <div className="karinga-metrica-icono" style={{ background: '#EFF6FF' }}>
            <Icono nombre="bank" tamano={22} color="#1D4ED8" />
          </div>
          <div className="karinga-metrica-info">
            <span className="karinga-metrica-etiqueta">Anticipos Previos</span>
            <strong className="karinga-metrica-valor" style={{ color: '#1D4ED8' }}>
              ${`${totalAnticipos.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`}
            </strong>
            <small style={{ color: '#64748B', fontSize: '0.75rem' }}>Pagos confirmados anticipados</small>
          </div>
        </div>

        <div className="karinga-metrica-card">
          <div className="karinga-metrica-icono" style={{ background: '#FEE2E2' }}>
            <Icono nombre="tag" tamano={22} color="#DC2626" />
          </div>
          <div className="karinga-metrica-info">
            <span className="karinga-metrica-etiqueta">Descuentos Otorgados</span>
            <strong className="karinga-metrica-valor" style={{ color: '#DC2626' }}>
              ${`${totalDescuentos.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`}
            </strong>
            <small style={{ color: '#64748B', fontSize: '0.75rem' }}>
              {numDescuentos} {numDescuentos === 1 ? 'descuento aplicado' : 'descuentos aplicados'}
            </small>
          </div>
        </div>

        <div className="karinga-metrica-card">
          <div className="karinga-metrica-icono" style={{ background: '#FEF3C7' }}>
            <Icono nombre="bed" tamano={22} color="#B45309" />
          </div>
          <div className="karinga-metrica-info">
            <span className="karinga-metrica-etiqueta">Hospedaje & Cabañas</span>
            <strong className="karinga-metrica-valor">
              {ventasFiltradas.filter((v) => Boolean(v.cabana_id)).length} reservas
            </strong>
            <small style={{ color: '#64748B', fontSize: '0.75rem' }}>
              ${`${ventasFiltradas.filter((v) => Boolean(v.cabana_id)).reduce((a, v) => a + (Number(v.total) || 0), 0).toLocaleString('es-MX')} MXN`}
            </small>
          </div>
        </div>

        <div className="karinga-metrica-card">
          <div className="karinga-metrica-icono" style={{ background: '#F3E8FF' }}>
            <Icono nombre="actividades" tamano={22} color="#7E22CE" />
          </div>
          <div className="karinga-metrica-info">
            <span className="karinga-metrica-etiqueta">Actividades & Visitas</span>
            <strong className="karinga-metrica-valor">
              {ventasFiltradas.filter((v) => !v.cabana_id).length} ventas
            </strong>
            <small style={{ color: '#64748B', fontSize: '0.75rem' }}>
              ${`${ventasFiltradas.filter((v) => !v.cabana_id).reduce((a, v) => a + (Number(v.total) || 0), 0).toLocaleString('es-MX')} MXN`}
            </small>
          </div>
        </div>
      </div>

      {/* Tarjeta de Desglose por Método de Pago */}
      <section className="karinga-tarjeta" style={{ padding: '1.25rem' }}>
        <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#334155', marginBottom: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Icono nombre="credit-card" tamano={18} color="var(--verde-oscuro)" />
          <span>Desglose Financiero por Canal y Método de Pago</span>
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem' }}>
          {desgloseMetodosPago.map((m) => (
            <div
              key={m.id}
              style={{
                background: '#F8FAFC',
                border: '1px solid #E2E8F0',
                borderRadius: '8px',
                padding: '0.75rem 1rem',
                borderLeft: `4px solid ${m.color}`
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <Icono nombre={m.icono} tamano={15} color={m.color} />
                  {m.nombre}
                </span>
                <span style={{ fontSize: '0.72rem', background: '#E2E8F0', padding: '0.1rem 0.4rem', borderRadius: '10px', fontWeight: 700, color: '#334155' }}>
                  {m.cantidad}
                </span>
              </div>
              <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0F172A' }}>
                ${`${m.total.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Banner Informativo de Semana si está activa */}
      {semanaSeleccionadaInfo && (
        <div className="karinga-semana-banner">
          <div className="karinga-semana-banner-info">
            <div style={{ background: '#D1FAE5', padding: '0.5rem', borderRadius: '8px', display: 'flex', alignItems: 'center' }}>
              <Icono nombre="calendar" tamano={22} color="#065F46" />
            </div>
            <div>
              <h4 className="karinga-semana-banner-titulo">
                {semanaSeleccionadaInfo.etiquetaCorta} del Año {semanaSeleccionadaInfo.anoSemana}
                {filtroSemana === 'actual' ? ' (Semana en Curso)' : filtroSemana === 'proxima' ? ' (Próxima Semana)' : ''}
              </h4>
              <p className="karinga-semana-banner-fechas">
                Inicia: <strong>{semanaSeleccionadaInfo.inicioTexto}</strong> • Termina: <strong>{semanaSeleccionadaInfo.finTexto}</strong>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setFiltroSemana('todas')}
            style={{
              background: '#FFFFFF',
              border: '1px solid #A7F3D0',
              color: '#065F46',
              padding: '0.35rem 0.75rem',
              borderRadius: '6px',
              fontSize: '0.82rem',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            Ver todas las semanas
          </button>
        </div>
      )}

      {/* Historial Detallado de Movimientos */}
      <section className="karinga-tarjeta" style={{ padding: '1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1rem' }}>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0F172A', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Icono nombre="clipboard" tamano={20} color="var(--verde-oscuro)" />
              <span>Historial Detallado de Ventas</span>
            </h3>
            <p style={{ margin: 0, fontSize: '0.82rem', color: '#64748B' }}>
              Registro de movimientos, estado de pagos, método de anticipo y liquidación.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {alRecargar && (
              <button
                type="button"
                className="karinga-btn-secundario"
                onClick={alRecargar}
                style={{ padding: '0.45rem 0.85rem', fontSize: '0.82rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
                title="Actualizar datos desde la base de datos"
              >
                <Icono nombre="refresh" tamano={16} />
                <span>Recargar</span>
              </button>
            )}

            {alCambiarPagina && (
              <button
                type="button"
                className="karinga-btn-secundario"
                onClick={() => alCambiarPagina('exportacion')}
                style={{ padding: '0.45rem 0.85rem', fontSize: '0.82rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem', borderColor: '#CBD5E1' }}
                title="Ir al Centro de Exportación a Excel"
              >
                <Icono nombre="excel" tamano={16} color="#15803D" />
                <span>Exportar a Excel</span>
              </button>
            )}
          </div>
        </div>

        {/* BARRA DE FILTROS AVANZADA: PILLS DE TIPO, SELECTOR DE SEMANA Y BÚSQUEDA */}
        <div className="karinga-barra-filtros-avanzada">
          {/* Pills de Segmento: Todos, Cabañas, Actividades (Con diseño limpio) */}
          <div className="karinga-grupo-pills">
            <button
              type="button"
              className={`karinga-filtro-btn ${filtroTipo === 'todos' ? 'activo' : ''}`}
              onClick={() => setFiltroTipo('todos')}
            >
              <span>Todos</span>
              <span className="contador-badge">{conteoTodos}</span>
            </button>
            <button
              type="button"
              className={`karinga-filtro-btn ${filtroTipo === 'cabanas' ? 'activo' : ''}`}
              onClick={() => setFiltroTipo('cabanas')}
            >
              <span>Cabañas</span>
              <span className="contador-badge">{conteoCabanas}</span>
            </button>
            <button
              type="button"
              className={`karinga-filtro-btn ${filtroTipo === 'interacciones' ? 'activo' : ''}`}
              onClick={() => setFiltroTipo('interacciones')}
            >
              <span>Actividades</span>
              <span className="contador-badge">{conteoInteracciones}</span>
            </button>
          </div>

          {/* Selector y Botones Rápidos de Semanas */}
          <div className="karinga-filtro-semana-box" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
            <label htmlFor="filtro-semana-select" style={{ marginRight: '0.15rem' }}>
              <Icono nombre="calendar" tamano={16} color="#1F5F3E" />
              <span>Semana:</span>
            </label>

            <button
              type="button"
              onClick={() => setFiltroSemana('actual')}
              style={{
                background: filtroSemana === 'actual' ? '#1B4D3E' : '#FFFFFF',
                color: filtroSemana === 'actual' ? '#FFFFFF' : '#1E293B',
                border: `1.5px solid ${filtroSemana === 'actual' ? '#1B4D3E' : '#CBD5E1'}`,
                padding: '0.35rem 0.7rem',
                borderRadius: '6px',
                fontSize: '0.8rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                boxShadow: filtroSemana === 'actual' ? '0 1px 3px rgba(27,77,62,0.25)' : 'none',
                transition: 'all 0.15s ease'
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
                padding: '0.35rem 0.7rem',
                borderRadius: '6px',
                fontSize: '0.8rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                boxShadow: filtroSemana === 'proxima' ? '0 1px 3px rgba(27,77,62,0.25)' : 'none',
                transition: 'all 0.15s ease'
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
                padding: '0.35rem 0.7rem',
                borderRadius: '6px',
                fontSize: '0.8rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                boxShadow: filtroSemana === 'todas' ? '0 1px 3px rgba(27,77,62,0.25)' : 'none',
                transition: 'all 0.15s ease'
              }}
            >
              <Icono nombre="calendar-days" tamano={14} color="currentColor" />
              <span>Todas ({conteoTodasSemanas})</span>
            </button>

            <select
              id="filtro-semana-select"
              className="karinga-select-semana"
              value={filtroSemana}
              onChange={(e) => setFiltroSemana(e.target.value)}
              title="Seleccionar otra semana específica"
            >
              <option value="actual">Semana Actual ({semanaActual?.etiquetaCorta || ''})</option>
              <option value="proxima">Próxima Semana ({proximaSemana?.etiquetaCorta || ''})</option>
              <option value="todas">-- Todas las semanas ({conteoTodasSemanas}) --</option>
              {semanasDisponibles.map((s) => (
                <option key={s.claveSemana} value={s.claveSemana}>
                  {s.etiquetaCorta} ({s.inicioMX} al {s.finMX}) - {s.totalVentas} mov.
                </option>
              ))}
            </select>
          </div>

          {/* Campo de Búsqueda */}
          <div style={{ position: 'relative', minWidth: '220px', flex: '1', maxWidth: '300px' }}>
            <div style={{ position: 'absolute', left: '0.65rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#94A3B8' }}>
              <Icono nombre="search" tamano={16} />
            </div>
            <input
              type="text"
              className="karinga-input"
              placeholder="Buscar cliente, cabaña..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              style={{
                paddingLeft: '2.1rem',
                paddingRight: busqueda ? '2rem' : '0.75rem',
                fontSize: '0.85rem',
                width: '100%',
                borderRadius: '9999px',
                height: '36px'
              }}
            />
            {busqueda && (
              <button
                type="button"
                onClick={() => setBusqueda('')}
                style={{
                  position: 'absolute',
                  right: '0.6rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#94A3B8',
                  padding: 0,
                  display: 'flex',
                  alignItems: 'center'
                }}
                title="Limpiar búsqueda"
              >
                <Icono nombre="close" tamano={14} />
              </button>
            )}
          </div>
        </div>

        {/* Tabla de Resultados */}
        {ventasFiltradas.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#64748B' }}>
            <div style={{ marginBottom: '0.5rem', display: 'flex', justifyContent: 'center' }}>
              <Icono nombre="clipboard" tamano={40} color="#CBD5E1" />
            </div>
            <p style={{ margin: 0, fontWeight: 600 }}>No hay movimientos que coincidan con los filtros aplicados.</p>
            <small style={{ color: '#94A3B8' }}>Pruebe seleccionando otra semana o borrando el término de búsqueda.</small>
          </div>
        ) : (
          <div className="karinga-tabla-contenedor" style={{ overflowX: 'auto' }}>
            <table className="karinga-tabla" style={{ width: '100%', fontSize: '0.84rem' }}>
              <thead>
                <tr>
                  <th>Fecha & Hora</th>
                  <th>Semana</th>
                  <th>Tipo</th>
                  <th>Cliente / Huésped</th>
                  <th>Concepto / Cabaña</th>
                  <th>Noches & Hospedaje</th>
                  <th>Cobros Extra</th>
                  <th>Estado</th>
                  <th>Descuento</th>
                  <th>Anticipo (P1)</th>
                  <th>Método Anticipo</th>
                  <th>Liquidación (P2)</th>
                  <th>Método Liquidación</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {ventasFiltradas.map((v) => {
                  const esCabana = Boolean(v.cabana_id);
                  const ant = Number(v.anticipo) || 0;
                  const saldoPend = Number(v.saldo_pendiente) || 0;
                  const montoLiq = Number(v.monto_liquidado) || (saldoPend === 0 && ant === 0 ? Number(v.total) : 0);
                  const nombreCliente = v.nombre_reservacion || (esCabana ? 'Sin Huésped' : 'Público General');
                  const metodoAnticipo = v.metodo_pago_anticipo || (ant > 0 ? v.metodo_pago : '-');
                  const metodoLiquidacion = v.metodo_pago_liquidacion || (v.estado_pago === 'liquidado' ? v.metodo_pago : '-');
                  const infoSem = obtenerInfoSemana(v.fecha);

                  return (
                    <tr key={v.id || `${v.fecha}-${v.hora}-${v.nombre_reservacion}`}>
                      <td>
                        <strong>{formatearFecha(v.fecha)}</strong>
                        <small style={{ display: 'block', color: '#64748B', fontSize: '0.75rem' }}>{v.hora || ''}</small>
                      </td>
                      <td>
                        {infoSem ? (
                          <div className="karinga-badge-semana" title={infoSem.etiquetaDetallada}>
                            <span>{infoSem.etiquetaCorta}</span>
                            <small>{infoSem.inicioMX.slice(0, 5)} - {infoSem.finMX.slice(0, 5)}</small>
                          </div>
                        ) : '-'}
                      </td>
                      <td>
                        <span style={{
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          padding: '0.2rem 0.5rem',
                          borderRadius: '4px',
                          background: esCabana ? '#E0F2FE' : '#FEF3C7',
                          color: esCabana ? '#0369A1' : '#92400E'
                        }}>
                          {esCabana ? 'Hospedaje' : 'Actividad'}
                        </span>
                      </td>
                      <td>
                        <strong style={{ color: '#0F172A' }}>{nombreCliente}</strong>
                        {esCabana && v.noches && (
                          <small style={{ display: 'block', color: '#64748B', fontSize: '0.75rem' }}>
                            {v.noches} noche(s) • {v.huespedes_totales || 0} pers.
                          </small>
                        )}
                      </td>
                      <td>
                        <strong style={{ color: '#0F172A' }}>{obtenerNombreConcepto(v)}</strong>
                        {esCabana && v.cabana_nombre && (
                          <small style={{ display: 'block', color: '#64748B', fontSize: '0.75rem' }}>
                            Cabaña {v.cabana_nombre}
                          </small>
                        )}
                      </td>
                      <td>
                        {esCabana ? (
                          <div>
                            <strong style={{ color: '#0F172A' }}>{Number(v.noches) || 1} {Number(v.noches) === 1 ? 'noche' : 'noches'}</strong>
                            <small style={{ display: 'block', color: '#475569', fontSize: '0.75rem' }}>
                              ${(Number(v.costo_cabana) || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                            </small>
                          </div>
                        ) : (
                          <span style={{ color: '#94A3B8' }}>-</span>
                        )}
                      </td>
                      <td>
                        {(() => {
                          const extras = obtenerDesgloseCobrosExtra(v);
                          if (extras.length === 0) return <span style={{ color: '#94A3B8' }}>-</span>;
                          return (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                              {extras.map((ex, idx) => (
                                <span
                                  key={idx}
                                  style={{
                                    fontSize: '0.72rem',
                                    fontWeight: 600,
                                    background: ex.startsWith('Daño') ? '#FEE2E2' : '#FEF3C7',
                                    color: ex.startsWith('Daño') ? '#991B1B' : '#92400E',
                                    padding: '0.15rem 0.4rem',
                                    borderRadius: '4px',
                                    width: 'fit-content',
                                    whiteSpace: 'nowrap'
                                  }}
                                >
                                  {ex}
                                </span>
                              ))}
                            </div>
                          );
                        })()}
                      </td>
                      <td>
                        {v.estado_pago === 'pendiente_liquidacion' ? (
                          <span style={{ background: '#FEF3C7', color: '#92400E', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 700 }}>
                            Pendiente (${saldoPend.toLocaleString('es-MX')})
                          </span>
                        ) : (
                          <span style={{ background: '#D1FAE5', color: '#065F46', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 700 }}>
                            Liquidado
                          </span>
                        )}
                      </td>
                      <td>
                        {(() => {
                          const descMonto = Number(v.descuento_especial) || 0;
                          const tipoDesc = v.tipo_descuento || 'monto';
                          const valDesc = Number(v.valor_descuento) || 0;
                          if (descMonto <= 0) {
                            return <span style={{ color: '#94A3B8' }}>-</span>;
                          }
                          const subtotalEst = (Number(v.costo_cabana) || 0) +
                            (Number(v.costo_horas_extra) || (Number(v.horas_extra) * 250) || 0) +
                            (Number(v.costo_personas_extra) || 0) +
                            (Number(v.costo_actividades) || 0) ||
                            (Number(v.total) + descMonto);
                          const porcentajeCalculado = subtotalEst > 0
                            ? Math.round((descMonto / subtotalEst) * 100)
                            : (tipoDesc === 'porcentaje' ? valDesc : 0);

                          return (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                              <span style={{
                                color: '#B91C1C',
                                fontWeight: 700,
                                background: '#FEE2E2',
                                padding: '0.2rem 0.5rem',
                                borderRadius: '4px',
                                fontSize: '0.78rem',
                                display: 'inline-block',
                                width: 'fit-content'
                              }}>
                                -${descMonto.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                              </span>
                              <small style={{ color: '#0369A1', fontSize: '0.72rem', fontWeight: 600 }}>
                                {tipoDesc === 'porcentaje'
                                  ? `${valDesc}% desc.`
                                  : `${porcentajeCalculado}% equiv.`}
                              </small>
                            </div>
                          );
                        })()}
                      </td>
                      <td style={{ color: ant > 0 ? '#1E40AF' : 'inherit', fontWeight: ant > 0 ? 700 : 'normal' }}>
                        {ant > 0 ? `$${ant.toLocaleString('es-MX', { minimumFractionDigits: 2 })}` : '-'}
                      </td>
                      <td>
                        {ant > 0 ? (
                          <span className="badge-pago" style={{ background: '#EFF6FF', color: '#1D4ED8', border: '1px solid #BFDBFE' }}>
                            {metodoAnticipo}
                            {v.comprobante_anticipo ? ` (${v.comprobante_anticipo})` : ''}
                          </span>
                        ) : '-'}
                      </td>
                      <td style={{ color: montoLiq > 0 ? '#15803D' : 'inherit', fontWeight: montoLiq > 0 ? 700 : 'normal' }}>
                        {montoLiq > 0 ? `$${montoLiq.toLocaleString('es-MX', { minimumFractionDigits: 2 })}` : '-'}
                      </td>
                      <td>
                        {montoLiq > 0 ? (
                          <span className="badge-pago" style={{ background: '#F0FDF4', color: '#15803D', border: '1px solid #BBF7D0' }}>
                            {metodoLiquidacion}
                          </span>
                        ) : '-'}
                      </td>
                      <td>
                        <strong style={{ fontSize: '0.95rem', color: '#0F172A' }}>
                          ${`${(Number(v.total) || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}`}
                        </strong>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
