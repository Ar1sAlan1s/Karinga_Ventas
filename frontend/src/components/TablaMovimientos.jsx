import Icono from './Icono';
import { useState } from 'react';

function obtenerNombreConcepto(v) {
  if (v.cabana_id || v.tipo_venta === 'cabana') {
    return v.cabana_nombre ? `Cabaña ${v.cabana_nombre}` : (v.concepto || 'Hospedaje');
  }

  const partes = [];
  if (Number(v.camping_personas) > 0) partes.push(`Camping (${v.camping_personas} pers.)`);
  if (Number(v.visitas_personas) > 0) partes.push(`Entrada Visitas (${v.visitas_personas})`);
  if (Number(v.fresa_kilos) > 0) partes.push(`Fresa (${v.fresa_kilos} Kg)`);
  if (Number(v.fresa_medios) > 0) partes.push(`Fresa (${v.fresa_medios} × ½ Kg)`);
  if (Number(v.tirolesa_boletos) > 0) partes.push(`Tirolesa (${v.tirolesa_boletos})`);
  if (Number(v.cabalgata_30min) > 0) partes.push(`Cabalgata 30m (${v.cabalgata_30min})`);
  if (Number(v.cabalgata_1hora) > 0) partes.push(`Cabalgata 1h (${v.cabalgata_1hora})`);

  if (partes.length > 0) return partes.join(', ');
  if (v.detalles_actividades && v.detalles_actividades !== 'Ninguna') return v.detalles_actividades;
  if (v.concepto && !v.concepto.trim().startsWith('Actividades')) return v.concepto;
  return 'Actividades Recreativas';
}

function obtenerDesgloseCobrosExtra(v) {
  const extras = [];
  const hExtra = Number(v.horas_extra) || 0;
  const costoHExtra = Number(v.costo_horas_extra) || (hExtra * 250);
  if (hExtra > 0) {
    extras.push(`+${hExtra}h ($${costoHExtra.toLocaleString('es-MX')})`);
  }

  const pExtra = Number(v.personas_extra) || 0;
  const costoPExtra = Number(v.costo_personas_extra) || (pExtra * 250);
  if (pExtra > 0) {
    extras.push(`+${pExtra} pers. ($${costoPExtra.toLocaleString('es-MX')})`);
  }

  if (v.concepto && v.concepto.includes('[Daño/Pérdida:')) {
    const regex = /\[Daño\/Pérdida:\s*([^(]+?)\s*\(\$([0-9.,]+)\)\]/gi;
    let m;
    while ((m = regex.exec(v.concepto)) !== null) {
      const cant = parseFloat(m[2]) || 0;
      extras.push(`Daño: ${m[1].trim()} ($${cant.toLocaleString('es-MX')})`);
    }
  } else if (v.notas && v.notas.includes('[DAÑO CUBIERTO CON DEPÓSITO]')) {
    const regex = /Se retuvo \$([0-9.,]+) MXN del depósito por:\s*"([^"]+)"/gi;
    let m;
    while ((m = regex.exec(v.notas)) !== null) {
      const cant = parseFloat(m[1]) || 0;
      extras.push(`Daño: ${m[2].trim()} ($${cant.toLocaleString('es-MX')})`);
    }
  }

  return extras;
}

export default function TablaMovimientos({
  ventas,
  alExportarExcel,
  cargandoExcel,
  alRecargar
}) {
  const [busqueda, setBusqueda] = useState('');

  const ventasFiltradas = ventas.filter((v) => {
    const texto = `${v.nombre_reservacion || ''} ${v.concepto || ''} ${v.metodo_pago || ''} ${v.cabana_nombre || ''}`.toLowerCase();
    return texto.includes(busqueda.toLowerCase());
  });

  const totalCobradoGeneral = ventasFiltradas.reduce(
    (acum, v) => acum + (Number(v.total) || 0),
    0
  );

  const formatearFecha = (fecha) => {
    if (!fecha) return '';
    if (fecha instanceof Date) return fecha.toISOString().split('T')[0];
    return String(fecha).split('T')[0];
  };

  const formatearTemporadaClase = (temporada) => {
    switch (temporada) {
      case 'entre_semana':
        return 'badge-entre-semana';
      case 'fin_semana':
        return 'badge-fin-semana';
      case 'temporada_alta':
        return 'badge-temporada-alta';
      default:
        return 'badge-entre-semana';
    }
  };

  const formatearTemporadaTexto = (temporada) => {
    switch (temporada) {
      case 'entre_semana':
        return 'Entre semana';
      case 'fin_semana':
        return 'Fin de semana';
      case 'temporada_alta':
        return 'Temporada alta';
      default:
        return temporada;
    }
  };

  return (
    <section className="karinga-tarjeta" style={{ marginTop: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
        <div>
          <h2 className="karinga-tarjeta-titulo" style={{ margin: 0, padding: 0, border: 'none' }}>
            <Icono nombre="receipt" tamano={20} color="var(--verde-oscuro)" />
            <span>Historial de Movimientos y Reservas</span>
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--gris-medio)', marginTop: '0.2rem' }}>
            {ventasFiltradas.length} registro(s) encontrado(s) • Total Acumulado:{' '}
            <strong style={{ color: 'var(--verde-oscuro)' }}>
              ${totalCobradoGeneral.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN
            </strong>
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <input
            type="text"
            className="karinga-input"
            style={{ width: '230px', padding: '0.5rem 0.8rem', fontSize: '0.85rem' }}
            placeholder="Buscar por nombre o concepto..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />

          <button
            type="button"
            className="karinga-btn-excel"
            onClick={alExportarExcel}
            disabled={cargandoExcel || ventas.length === 0}
            title="Exportar estos movimientos a Microsoft Excel"
          >
            <Icono nombre="excel" tamano={17} />
            <span>{cargandoExcel ? 'Descargando...' : 'Descargar Excel (.xlsx)'}</span>
          </button>

          {alRecargar && (
            <button
              type="button"
              onClick={alRecargar}
              style={{
                background: 'transparent',
                border: '1px solid var(--gris-claro)',
                borderRadius: 'var(--radio-md)',
                padding: '0.55rem 0.75rem',
                cursor: 'pointer',
                fontSize: '0.9rem'
              }}
              title="Actualizar listado"
            >
              Recargar
            </button>
          )}
        </div>
      </div>

      <div className="karinga-tabla-contenedor">
        <table className="karinga-tabla">
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Hora</th>
              <th>Temporada</th>
              <th>Nombre de Reservación</th>
              <th>Concepto</th>
              <th>Noches</th>
              <th>Cobros Extra</th>
              <th>Actividades</th>
              <th>Método de Pago</th>
              <th>Anticipos</th>
              <th>Total Cobrado</th>
            </tr>
          </thead>
          <tbody>
            {ventasFiltradas.length === 0 ? (
              <tr>
                <td colSpan="11" style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--gris-medio)' }}>
                  {ventas.length === 0
                    ? 'No hay movimientos registrados todavía. Realice el primer registro en el formulario superior.'
                    : 'No se encontraron resultados para la búsqueda actual.'}
                </td>
              </tr>
            ) : (
              ventasFiltradas.map((v) => (
                <tr key={v.id || `${v.fecha}-${v.hora}-${v.nombre_reservacion}`}>
                  <td>{formatearFecha(v.fecha)}</td>
                  <td>{v.hora}</td>
                  <td>
                    <span className={`badge-temporada ${formatearTemporadaClase(v.temporada)}`}>
                      {formatearTemporadaTexto(v.temporada)}
                    </span>
                  </td>
                  <td><strong>{v.nombre_reservacion || 'Sin reserva'}</strong></td>
                  <td><strong>{obtenerNombreConcepto(v)}</strong></td>
                  <td style={{ textAlign: 'center' }}>
                    {v.cabana_id ? `${Number(v.noches) || 1} n.` : '-'}
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    {(() => {
                      const extras = obtenerDesgloseCobrosExtra(v);
                      if (extras.length === 0) return <span style={{ color: '#94A3B8' }}>-</span>;
                      return (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', alignItems: 'center' }}>
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
                    {!v.cabana_id ? (
                      <span style={{ color: '#0369A1', fontWeight: 600, fontSize: '0.8rem' }}>
                        {obtenerNombreConcepto(v)}
                      </span>
                    ) : (
                      <small style={{ color: 'var(--gris-oscuro)' }}>
                        {v.detalles_actividades || 'Ninguna'}
                      </small>
                    )}
                  </td>
                  <td>
                    <span className="badge-pago">{v.metodo_pago}</span>
                  </td>
                  <td style={{ color: Number(v.anticipo) > 0 ? 'var(--rojo-alerta)' : 'inherit' }}>
                    ${Number(v.anticipo || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                  </td>
                  <td>
                    <strong style={{ color: 'var(--verde-oscuro)', fontSize: '0.95rem' }}>
                      ${Number(v.total || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                    </strong>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
