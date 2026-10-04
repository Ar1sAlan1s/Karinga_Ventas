import { useState, useMemo } from 'react';
import XLSX from 'xlsx-js-style';
import Icono from './Icono';

/**
 * Parsea una hoja SheetJS (Worksheet) a una estructura renderizable en HTML
 * con soporte para spans de celdas combinadas y estilos visuales de celda.
 */
function parsearHojaExcel(ws) {
  if (!ws || !ws['!ref']) return { filas: [], totalFilas: 0, totalCols: 0 };

  const range = XLSX.utils.decode_range(ws['!ref']);
  const merges = ws['!merges'] || [];
  const cols = ws['!cols'] || [];

  const mergeOrigin = new Map();
  const mergeCovered = new Set();

  merges.forEach((m) => {
    const originKey = `${m.s.r},${m.s.c}`;
    const rowSpan = m.e.r - m.s.r + 1;
    const colSpan = m.e.c - m.s.c + 1;
    mergeOrigin.set(originKey, { rowSpan, colSpan });

    for (let r = m.s.r; r <= m.e.r; r++) {
      for (let c = m.s.c; c <= m.e.c; c++) {
        if (r !== m.s.r || c !== m.s.c) {
          mergeCovered.add(`${r},${c}`);
        }
      }
    }
  });

  const filas = [];

  for (let r = range.s.r; r <= range.e.r; r++) {
    const celdas = [];
    for (let c = range.s.c; c <= range.e.c; c++) {
      const coordKey = `${r},${c}`;
      if (mergeCovered.has(coordKey)) {
        continue;
      }

      const cellRef = XLSX.utils.encode_cell({ r, c });
      const cell = ws[cellRef];

      const mergeInfo = mergeOrigin.get(coordKey);
      const rowSpan = mergeInfo ? mergeInfo.rowSpan : 1;
      const colSpan = mergeInfo ? mergeInfo.colSpan : 1;

      let valorTexto = '';
      let esNumero = false;
      let esMoneda = false;
      let esPorcentaje = false;

      if (cell && cell.v !== undefined && cell.v !== null) {
        if (cell.t === 'n') {
          esNumero = true;
          const num = Number(cell.v);
          if (cell.z && cell.z.includes('$')) {
            esMoneda = true;
            valorTexto = `$${num.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
          } else if (cell.z && cell.z.includes('%')) {
            esPorcentaje = true;
            valorTexto = `${(num * 100).toFixed(1)}%`;
          } else {
            valorTexto = num.toLocaleString('es-MX');
          }
        } else {
          valorTexto = String(cell.v);
        }
      }

      const estilo = {};
      const s = cell?.s;

      if (s) {
        if (s.fill?.fgColor?.rgb) {
          estilo.backgroundColor = `#${s.fill.fgColor.rgb}`;
        }
        if (s.font?.color?.rgb) {
          estilo.color = `#${s.font.color.rgb}`;
        }
        if (s.font?.bold) {
          estilo.fontWeight = '700';
        }
        if (s.font?.sz) {
          estilo.fontSize = `${Math.max(11, s.font.sz)}px`;
        }
        if (s.alignment?.horizontal) {
          estilo.textAlign = s.alignment.horizontal;
        } else if (esMoneda || esNumero) {
          estilo.textAlign = 'right';
        }
        if (s.alignment?.vertical) {
          estilo.verticalAlign = s.alignment.vertical;
        }
        if (s.border?.bottom?.style === 'double') {
          estilo.borderBottom = '3px double #0F172A';
        }
      }

      celdas.push({
        r,
        c,
        valor: valorTexto,
        rowSpan,
        colSpan,
        estilo,
        colWidth: cols[c]?.wch ? `${Math.max(60, cols[c].wch * 8.5)}px` : 'auto'
      });
    }

    filas.push({ r, celdas });
  }

  return {
    filas,
    totalFilas: range.e.r - range.s.r + 1,
    totalCols: range.e.c - range.s.c + 1
  };
}

export default function VisorExcel({
  libro,
  archivoNombre,
  alDescargar,
  cargandoDescarga = false
}) {
  const nombresHojas = useMemo(() => {
    if (!libro || !libro.SheetNames) return [];
    return libro.SheetNames;
  }, [libro]);

  const [hojaActiva, setHojaActiva] = useState(() => (nombresHojas[0] || 'Métricas'));
  const [modoExpandido, setModoExpandido] = useState(false);

  // Asegurar que si cambian las hojas, la hoja activa sea válida
  const nombreHojaValido = nombresHojas.includes(hojaActiva) ? hojaActiva : (nombresHojas[0] || '');

  const datosHoja = useMemo(() => {
    if (!libro || !nombreHojaValido || !libro.Sheets[nombreHojaValido]) {
      return { filas: [], totalFilas: 0, totalCols: 0 };
    }
    return parsearHojaExcel(libro.Sheets[nombreHojaValido]);
  }, [libro, nombreHojaValido]);

  if (!libro || nombresHojas.length === 0) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', background: '#F8FAFC', borderRadius: '12px', border: '1px dashed #CBD5E1', color: '#64748B' }}>
        No hay datos para previsualizar en el período seleccionado.
      </div>
    );
  }

  const obtenerIconoHoja = (nombre) => {
    if (nombre.toLowerCase().includes('métrica')) return '📊';
    if (nombre.toLowerCase().includes('cabaña')) return '🏡';
    if (nombre.toLowerCase().includes('actividad')) return '🎯';
    return '📄';
  };

  const contenedorEstilo = modoExpandido
    ? {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 99999,
        background: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        flexDirection: 'column',
        padding: '1.5rem',
        boxSizing: 'border-box'
      }
    : {
        background: '#FFFFFF',
        borderRadius: '12px',
        border: '1.5px solid #CBD5E1',
        overflow: 'hidden',
        boxShadow: '0 4px 12px rgba(0,0,0,0.06)'
      };

  const tarjetaContenidoEstilo = modoExpandido
    ? {
        background: '#FFFFFF',
        borderRadius: '14px',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflow: 'hidden',
        boxShadow: '0 20px 40px rgba(0,0,0,0.25)'
      }
    : {
        display: 'flex',
        flexDirection: 'column'
      };

  return (
    <div style={contenedorEstilo}>
      <div style={tarjetaContenidoEstilo}>
        {/* BARRA SUPERIOR DE HERRAMIENTAS DEL VISOR */}
        <div
          style={{
            background: '#0F172A',
            color: '#FFFFFF',
            padding: '0.85rem 1.25rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '0.75rem',
            borderBottom: '1px solid #334155'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ background: '#15803D', padding: '0.35rem 0.5rem', borderRadius: '6px', display: 'flex', alignItems: 'center' }}>
              <Icono nombre="excel" tamano={18} color="#FFFFFF" />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: '0.98rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span>Vista Previa del Libro Excel</span>
                <span style={{ fontSize: '0.75rem', background: '#334155', padding: '0.15rem 0.5rem', borderRadius: '10px', color: '#94A3B8' }}>
                  {nombresHojas.length} {nombresHojas.length === 1 ? 'Hoja' : 'Hojas'}
                </span>
              </div>
              <div style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: '2px' }}>
                Mostrando: <strong style={{ color: '#E2E8F0' }}>{nombreHojaValido}</strong> ({datosHoja.totalCols} columnas × {datosHoja.totalFilas} filas)
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <button
              type="button"
              onClick={() => setModoExpandido(!modoExpandido)}
              style={{
                background: '#1E293B',
                color: '#E2E8F0',
                border: '1px solid #475569',
                padding: '0.45rem 0.85rem',
                borderRadius: '6px',
                fontSize: '0.82rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                transition: 'all 0.15s ease'
              }}
              title={modoExpandido ? 'Restaurar tamaño normal' : 'Expandir vista previa a pantalla completa'}
            >
              <span>{modoExpandido ? '✕ Cerrar Pantalla Completa' : '⛶ Pantalla Completa'}</span>
            </button>

            {alDescargar && (
              <button
                type="button"
                className="karinga-btn-excel"
                onClick={alDescargar}
                disabled={cargandoDescarga}
                style={{
                  padding: '0.45rem 1rem',
                  fontSize: '0.86rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.45rem'
                }}
              >
                <Icono nombre="excel" tamano={16} />
                <span>{cargandoDescarga ? 'Descargando...' : 'Descargar Excel'}</span>
              </button>
            )}
          </div>
        </div>

        {/* PESTAÑAS TIPO EXCEL (SHEET TABS) */}
        <div
          style={{
            background: '#F1F5F9',
            borderBottom: '1.5px solid #CBD5E1',
            padding: '0.4rem 0.85rem 0 0.85rem',
            display: 'flex',
            alignItems: 'flex-end',
            gap: '0.35rem',
            overflowX: 'auto',
            whiteSpace: 'nowrap'
          }}
        >
          {nombresHojas.map((nombre) => {
            const estaActiva = nombre === nombreHojaValido;
            return (
              <button
                key={nombre}
                type="button"
                onClick={() => setHojaActiva(nombre)}
                style={{
                  background: estaActiva ? '#FFFFFF' : '#E2E8F0',
                  color: estaActiva ? '#0F172A' : '#64748B',
                  fontWeight: estaActiva ? 800 : 600,
                  fontSize: '0.84rem',
                  padding: '0.55rem 0.95rem',
                  borderTopLeftRadius: '8px',
                  borderTopRightRadius: '8px',
                  border: estaActiva ? '1.5px solid #CBD5E1' : '1px solid transparent',
                  borderBottom: estaActiva ? '2.5px solid #15803D' : 'none',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  marginBottom: estaActiva ? '-1.5px' : '0px',
                  boxShadow: estaActiva ? '0 -2px 6px rgba(0,0,0,0.04)' : 'none',
                  transition: 'background 0.15s ease'
                }}
              >
                <span>{obtenerIconoHoja(nombre)}</span>
                <span>{nombre}</span>
              </button>
            );
          })}
        </div>

        {/* CONTENEDOR DE LA CUADRÍCULA EXCEL */}
        <div
          style={{
            flex: 1,
            overflow: 'auto',
            background: '#FFFFFF',
            position: 'relative',
            maxHeight: modoExpandido ? 'calc(100vh - 120px)' : '520px',
            borderBottom: '1px solid #E2E8F0'
          }}
        >
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: '11px',
              fontFamily: 'Calibri, Segoe UI, sans-serif',
              color: '#0F172A'
            }}
          >
            <tbody>
              {datosHoja.filas.map((fila) => {
                const esSeparadorVacio = fila.celdas.every((c) => !c.valor || c.valor.trim() === '');
                const altoFila = esSeparadorVacio ? '12px' : 'auto';

                return (
                  <tr key={fila.r} style={{ height: altoFila }}>
                    {fila.celdas.map((celda) => {
                      const tieneFondo = Boolean(celda.estilo.backgroundColor);
                      const esHeaderNegro = celda.estilo.backgroundColor === '#000000' || celda.estilo.backgroundColor === '#0F172A';

                      return (
                        <td
                          key={`${celda.r}-${celda.c}`}
                          rowSpan={celda.rowSpan > 1 ? celda.rowSpan : undefined}
                          colSpan={celda.colSpan > 1 ? celda.colSpan : undefined}
                          style={{
                            padding: esSeparadorVacio ? '0' : '6px 9px',
                            border: '1px solid #CBD5E1',
                            minWidth: celda.colWidth,
                            whiteSpace: celda.colSpan > 2 ? 'normal' : 'nowrap',
                            lineHeight: '1.25',
                            ...celda.estilo,
                            // Asegurar alto contraste B/W si tiene fondo negro
                            ...(esHeaderNegro ? { color: '#FFFFFF' } : {})
                          }}
                        >
                          {celda.valor}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* PIE DEL VISOR */}
        <div
          style={{
            background: '#F8FAFC',
            padding: '0.6rem 1.25rem',
            borderTop: '1px solid #E2E8F0',
            fontSize: '0.78rem',
            color: '#64748B',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '0.5rem'
          }}
        >
          <span>
            📋 Previsualización exacta de los datos que se escribirán en el archivo <strong>{archivoNombre}</strong>.
          </span>
          <span style={{ fontWeight: 600, color: '#334155' }}>
            Formato: XLSX • Optimizado para impresión monocromática (B/N)
          </span>
        </div>
      </div>
    </div>
  );
}
