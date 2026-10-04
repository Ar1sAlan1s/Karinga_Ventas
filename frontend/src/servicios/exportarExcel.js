import XLSX from 'xlsx-js-style';

// ============================================================================
// PALETA DE ALTO CONTRASTE OPTIMIZADA PARA IMPRESIÓN EN BLANCO Y NEGRO (B/W)
// Y LECTURA EJECUTIVA EN PANTALLA
// ============================================================================
const COLOR_NEGRO_SOLIDO    = '000000'; // Negro puro #000000 (máximo contraste impreso)
const COLOR_SLATE_OSCURO    = '0F172A'; // Slate 900 #0F172A (banner principal)
const COLOR_GRIS_ENCABEZADO = '1E293B'; // Slate 800 #1E293B (encabezados de columna generales)
const COLOR_GRIS_SECUNDARIO = '334155'; // Slate 700 #334155 (encabezados de costos/desgloses)
const COLOR_GRIS_CLARO_BG   = 'F1F5F9'; // Slate 100 #F1F5F9 (fondo subtítulos, KPI headers)
const COLOR_GRIS_TOTAL_BG   = 'E2E8F0'; // Slate 200 #E2E8F0 (fondo fila de totales)
const COLOR_ZEBRA_BG        = 'F8FAFC'; // Slate 50 #F8FAFC (zebra ultra suave que no mancha B/W)
const COLOR_BLANCO          = 'FFFFFF'; // Blanco puro #FFFFFF
const COLOR_BORDE_TABLA     = '64748B'; // Slate 500 #64748B (borde nítido para impresión)
const COLOR_BORDE_SUAVE     = '94A3B8'; // Slate 400 #94A3B8 (borde de celdas internas)

const bordeFino = {
  top: { style: 'thin', color: { rgb: COLOR_BORDE_SUAVE } },
  bottom: { style: 'thin', color: { rgb: COLOR_BORDE_SUAVE } },
  left: { style: 'thin', color: { rgb: COLOR_BORDE_SUAVE } },
  right: { style: 'thin', color: { rgb: COLOR_BORDE_SUAVE } }
};

const bordeTotal = {
  top: { style: 'thin', color: { rgb: COLOR_NEGRO_SOLIDO } },
  bottom: { style: 'double', color: { rgb: COLOR_NEGRO_SOLIDO } }, // Doble raya contable para impresión B/W
  left: { style: 'thin', color: { rgb: COLOR_BORDE_TABLA } },
  right: { style: 'thin', color: { rgb: COLOR_BORDE_TABLA } }
};

// ============================================================================
// FUNCIONES AUXILIARES DE FECHAS, SEMANAS Y DETALLES
// ============================================================================
export function obtenerInfoSemana(fechaInput) {
  if (!fechaInput) return null;
  let d;
  if (typeof fechaInput === 'string') {
    const partes = fechaInput.split('T')[0].split('-');
    if (partes.length === 3) {
      d = new Date(Number(partes[0]), Number(partes[1]) - 1, Number(partes[2]));
    } else {
      d = new Date(fechaInput);
    }
  } else {
    d = new Date(fechaInput);
  }
  if (isNaN(d.getTime())) return null;

  const diaSemana = d.getDay();
  const diffLunes = diaSemana === 0 ? -6 : 1 - diaSemana;
  const lunes = new Date(d);
  lunes.setDate(d.getDate() + diffLunes);
  const domingo = new Date(lunes);
  domingo.setDate(lunes.getDate() + 6);

  const jueves = new Date(lunes);
  jueves.setDate(lunes.getDate() + 3);
  const primerJueves = new Date(jueves.getFullYear(), 0, 4);
  const primerLunesDelAno = new Date(primerJueves);
  const diaPrimerJueves = primerJueves.getDay();
  primerLunesDelAno.setDate(primerJueves.getDate() - (diaPrimerJueves === 0 ? 6 : diaPrimerJueves - 1));

  const diffMs = jueves.getTime() - primerLunesDelAno.getTime();
  const numeroSemana = 1 + Math.round(diffMs / (7 * 86400000));
  const anoSemana = jueves.getFullYear();

  const formatearMX = (dt) => {
    const day = String(dt.getDate()).padStart(2, '0');
    const m = String(dt.getMonth() + 1).padStart(2, '0');
    const y = dt.getFullYear();
    return `${day}/${m}/${y}`;
  };

  return {
    numeroSemana,
    anoSemana,
    claveSemana: `${anoSemana}-W${String(numeroSemana).padStart(2, '0')}`,
    etiquetaSemana: `Semana ${numeroSemana}`,
    inicioMX: formatearMX(lunes),
    finMX: formatearMX(domingo),
    etiquetaCompleta: `Semana ${numeroSemana} (${formatearMX(lunes)} - ${formatearMX(domingo)})`
  };
}

function formatearTemporada(temporada) {
  switch (temporada) {
    case 'entre_semana': return 'Entre semana';
    case 'fin_semana': return 'Fin de semana';
    case 'temporada_alta': return 'Temporada alta';
    default: return '-';
  }
}

function formatearFecha(f) {
  if (!f) return '-';
  if (f instanceof Date) return f.toISOString().split('T')[0];
  return String(f).split('T')[0];
}

function obtenerNombreConcepto(v) {
  if (v.cabana_id || v.tipo_venta === 'cabana') {
    return v.cabana_nombre ? `Cabaña ${v.cabana_nombre}` : (v.concepto || 'Hospedaje');
  }
  if (v.detalles_actividades && v.detalles_actividades !== 'Ninguna') return v.detalles_actividades;
  if (v.concepto && !v.concepto.trim().startsWith('Actividades')) return v.concepto;
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
      conceptos.push(`${m[1].trim()} ($${cant})`);
    }
  } else if (v.notas && v.notas.includes('[DAÑO CUBIERTO CON DEPÓSITO]')) {
    const regexNotas = /Se retuvo \$([0-9.,]+) MXN del depósito por:\s*"([^"]+)"/gi;
    let m;
    while ((m = regexNotas.exec(v.notas)) !== null) {
      const cant = parseFloat(m[1]) || 0;
      monto += cant;
      conceptos.push(`${m[2].trim()} ($${cant})`);
    }
  }
  return { monto, concepto: conceptos.join(', ') || null };
}

// ============================================================================
// CONSTRUCTORES DE CELDAS ESTILIZADAS (ALTO CONTRASTE IMPRESIÓN B/W)
// ============================================================================
function celdaTexto(valor, align = 'left', bold = false, fondo = null, colorTexto = COLOR_NEGRO_SOLIDO, borde = bordeFino) {
  const texto = valor !== null && valor !== undefined && valor !== '' ? String(valor) : (valor === '' ? '' : '-');
  return {
    v: texto,
    t: 's',
    s: {
      font: { name: 'Calibri', sz: 10, bold, color: { rgb: colorTexto } },
      alignment: { horizontal: align, vertical: 'center' },
      fill: fondo ? { fgColor: { rgb: fondo } } : undefined,
      border: borde
    }
  };
}

function celdaNumero(valor, bold = false, fondo = null, borde = bordeFino) {
  const num = Number(valor) || 0;
  return {
    v: num,
    t: 'n',
    z: '#,##0',
    s: {
      numFmt: '#,##0',
      font: { name: 'Calibri', sz: 10, bold, color: { rgb: COLOR_NEGRO_SOLIDO } },
      alignment: { horizontal: 'center', vertical: 'center' },
      fill: fondo ? { fgColor: { rgb: fondo } } : undefined,
      border: borde
    }
  };
}

function celdaMoneda(valor, bold = false, fondo = null, colorTexto = COLOR_NEGRO_SOLIDO, estiloBorde = bordeFino, sz = 10) {
  const num = Math.round((Number(valor) || 0) * 100) / 100;
  return {
    v: num,
    t: 'n',
    z: '"$"#,##0.00;("$"#,##0.00);"-"',
    s: {
      numFmt: '"$"#,##0.00;("$"#,##0.00);"-"',
      font: { name: 'Calibri', sz, bold, color: { rgb: colorTexto } },
      alignment: { horizontal: 'right', vertical: 'center' },
      fill: fondo ? { fgColor: { rgb: fondo } } : undefined,
      border: estiloBorde
    }
  };
}

function celdaPorcentaje(valorDecimal, bold = false, fondo = null, estiloBorde = bordeFino, colorTexto = COLOR_NEGRO_SOLIDO) {
  const num = Math.round((Number(valorDecimal) || 0) * 1000) / 1000;
  return {
    v: num,
    t: 'n',
    z: '0.0%',
    s: {
      numFmt: '0.0%',
      font: { name: 'Calibri', sz: 10, bold, color: { rgb: colorTexto } },
      alignment: { horizontal: 'right', vertical: 'center' },
      fill: fondo ? { fgColor: { rgb: fondo } } : undefined,
      border: estiloBorde
    }
  };
}

function celdaHeader(titulo, fondo = COLOR_GRIS_ENCABEZADO, align = 'center') {
  return {
    v: titulo,
    t: 's',
    s: {
      fill: { fgColor: { rgb: fondo } },
      font: { name: 'Calibri', sz: 10, bold: true, color: { rgb: COLOR_BLANCO } },
      alignment: { horizontal: align, vertical: 'center', wrapText: true },
      border: {
        top: { style: 'medium', color: { rgb: fondo } },
        bottom: { style: 'medium', color: { rgb: fondo } },
        left: { style: 'thin', color: { rgb: COLOR_BORDE_TABLA } },
        right: { style: 'thin', color: { rgb: COLOR_BORDE_TABLA } }
      }
    }
  };
}

function celdaEstado(estado) {
  const esLiquidado = estado === 'liquidado';
  // Formato de alto contraste: corchetes e indicativo textual para impresión B/W
  const texto = esLiquidado ? '[✓ LIQUIDADO]' : '[ ! PENDIENTE ]';
  const bg = esLiquidado ? COLOR_GRIS_CLARO_BG : COLOR_BLANCO;
  const borde = esLiquidado
    ? bordeFino
    : {
        top: { style: 'medium', color: { rgb: COLOR_GRIS_SECUNDARIO } },
        bottom: { style: 'medium', color: { rgb: COLOR_GRIS_SECUNDARIO } },
        left: { style: 'medium', color: { rgb: COLOR_GRIS_SECUNDARIO } },
        right: { style: 'medium', color: { rgb: COLOR_GRIS_SECUNDARIO } }
      };

  return {
    v: texto,
    t: 's',
    s: {
      fill: { fgColor: { rgb: bg } },
      font: { name: 'Calibri', sz: 9.5, bold: true, color: { rgb: COLOR_NEGRO_SOLIDO } },
      alignment: { horizontal: 'center', vertical: 'center' },
      border: borde
    }
  };
}

function crearFilaBanner(titulo, totalColumnas) {
  const fila = [];
  fila.push({
    v: titulo,
    t: 's',
    s: {
      fill: { fgColor: { rgb: COLOR_SLATE_OSCURO } },
      font: { name: 'Calibri', sz: 13.5, bold: true, color: { rgb: COLOR_BLANCO } },
      alignment: { horizontal: 'center', vertical: 'center' }
    }
  });
  for (let c = 1; c < totalColumnas; c++) {
    fila.push({
      v: '',
      t: 's',
      s: { fill: { fgColor: { rgb: COLOR_SLATE_OSCURO } } }
    });
  }
  return fila;
}

function crearFilaSubtitulo(subtitulo, totalColumnas) {
  const fila = [];
  fila.push({
    v: subtitulo,
    t: 's',
    s: {
      fill: { fgColor: { rgb: COLOR_GRIS_CLARO_BG } },
      font: { name: 'Calibri', sz: 9.5, italic: true, color: { rgb: COLOR_GRIS_SECUNDARIO } },
      alignment: { horizontal: 'center', vertical: 'center' },
      border: {
        bottom: { style: 'thin', color: { rgb: COLOR_BORDE_TABLA } }
      }
    }
  });
  for (let c = 1; c < totalColumnas; c++) {
    fila.push({
      v: '',
      t: 's',
      s: {
        fill: { fgColor: { rgb: COLOR_GRIS_CLARO_BG } },
        border: {
          bottom: { style: 'thin', color: { rgb: COLOR_BORDE_TABLA } }
        }
      }
    });
  }
  return fila;
}

function crearFilaSeccion(titulo, totalColumnas) {
  const fila = [];
  fila.push({
    v: titulo,
    t: 's',
    s: {
      fill: { fgColor: { rgb: COLOR_GRIS_ENCABEZADO } },
      font: { name: 'Calibri', sz: 10.5, bold: true, color: { rgb: COLOR_BLANCO } },
      alignment: { horizontal: 'left', vertical: 'center' }
    }
  });
  for (let c = 1; c < totalColumnas; c++) {
    fila.push({
      v: '',
      t: 's',
      s: { fill: { fgColor: { rgb: COLOR_GRIS_ENCABEZADO } } }
    });
  }
  return fila;
}

function crearFilaVacia(totalColumnas) {
  const fila = [];
  for (let c = 0; c < totalColumnas; c++) {
    fila.push({ v: '', t: 's', s: {} });
  }
  return fila;
}

// ============================================================================
// HOJA 1: ESTADÍSTICAS DE LA SEMANA (O CONSOLIDADO SEMANAL)
// ============================================================================
function generarHojaEstadisticas(ventas, claveSemana, semanaActual, tipoFiltro = 'todos') {
  const TOTAL_COLS = 10;
  const hoyStr = new Date().toLocaleString('es-MX', { dateStyle: 'medium', timeStyle: 'short' });
  const rows = [];
  const merges = [];

  const periodoEtiqueta = claveSemana && claveSemana !== 'todas'
    ? `Semana: ${claveSemana}`
    : 'Consolidado de Semanas Concluidas y Semana Actual';

  // Fila 0: Banner
  rows.push(crearFilaBanner('RANCHO KARINGA • ESTADÍSTICAS Y MÉTRICAS OPERATIVAS', TOTAL_COLS));
  merges.push({ s: { r: 0, c: 0 }, e: { r: 0, c: TOTAL_COLS - 1 } });

  // Fila 1: Subtítulo
  rows.push(crearFilaSubtitulo(`${periodoEtiqueta}  |  Generado: ${hoyStr}  |  Moneda: MXN ($)  |  Sistema de Gestión Rancho Karinga`, TOTAL_COLS));
  merges.push({ s: { r: 1, c: 0 }, e: { r: 1, c: TOTAL_COLS - 1 } });

  // Fila 2: Separador
  rows.push(crearFilaVacia(TOTAL_COLS));

  // Acumulados Generales
  let totalGeneralSum = 0;
  let totalCabanasSum = 0;
  let totalActividadesSum = 0;
  let totalAnticiposSum = 0;
  let totalLiquidadoSum = 0;
  let totalSaldoPendienteSum = 0;
  let totalNochesSum = 0;
  let totalDescuentosSum = 0;
  let totalHorasExtraSum = 0;
  let totalPersonasExtraSum = 0;
  let totalDanosSum = 0;
  let totalBaseHospedajeSum = 0;
  let countCabanas = 0;
  let countActividades = 0;

  ventas.forEach((v) => {
    const esCabana = Boolean(v.cabana_id);
    const anticipo = Number(v.anticipo) || 0;
    const saldoPendiente = Number(v.saldo_pendiente) || 0;
    const descuento = Number(v.descuento_especial) || 0;
    const montoLiquidado = Number(v.monto_liquidado) || 0;

    let granTotal = 0;
    if (esCabana) {
      countCabanas += 1;
      const hExtra = Number(v.horas_extra) || 0;
      const cHExtra = Number(v.costo_horas_extra) || (hExtra * 250);
      const pExtra = Number(v.personas_extra) || 0;
      const cPExtra = Number(v.costo_personas_extra) || (pExtra * 250);
      const cNoches = Number(v.costo_cabana) || 0;
      const dano = obtenerDanoDeposito(v);
      const totCabana = cNoches + cPExtra + cHExtra;
      granTotal = Math.max(totCabana - descuento + dano.monto, Number(v.total) || 0, anticipo + montoLiquidado + saldoPendiente + dano.monto);

      totalCabanasSum += granTotal;
      totalNochesSum += (Number(v.noches) || 1);
      totalHorasExtraSum += cHExtra;
      totalPersonasExtraSum += cPExtra;
      totalDanosSum += dano.monto;
      totalBaseHospedajeSum += cNoches;
    } else {
      countActividades += 1;
      granTotal = Math.max(Number(v.costo_actividades) || Number(v.subtotal) || Number(v.total) || 0, anticipo + montoLiquidado + saldoPendiente);
      totalActividadesSum += granTotal;
    }

    const saldoEfectivo = v.estado_pago === 'liquidado' ? 0 : (saldoPendiente > 0 ? saldoPendiente : Math.max(0, granTotal - anticipo));
    const liqEfectiva = v.estado_pago === 'liquidado'
      ? (montoLiquidado > 0 ? montoLiquidado : (anticipo > 0 ? Math.max(0, granTotal - anticipo) : granTotal))
      : montoLiquidado;

    totalGeneralSum += granTotal;
    totalAnticiposSum += anticipo;
    totalLiquidadoSum += liqEfectiva;
    totalSaldoPendienteSum += saldoEfectivo;
    totalDescuentosSum += descuento;
  });

  // KPI CARDS EN ALTO CONTRASTE (OPTIMIZADAS B/W)
  const filaKpiLabel1 = [];
  const filaKpiVal1   = [];
  const rInicioKpi1   = rows.length;

  const agregarKpiCard = (filaL, filaV, rIdx, titulo, valor, colsSpan, esMoneda = true) => {
    const cInicio = filaL.length;
    const cFin = cInicio + colsSpan - 1;

    for (let c = 0; c < colsSpan; c++) {
      filaL.push({
        v: c === 0 ? titulo : '',
        t: 's',
        s: {
          fill: { fgColor: { rgb: COLOR_GRIS_CLARO_BG } },
          font: { name: 'Calibri', sz: 8.5, bold: true, color: { rgb: COLOR_GRIS_ENCABEZADO } },
          alignment: { horizontal: 'center', vertical: 'center' },
          border: {
            top: { style: 'thin', color: { rgb: COLOR_GRIS_SECUNDARIO } },
            left: c === 0 ? { style: 'thin', color: { rgb: COLOR_GRIS_SECUNDARIO } } : undefined,
            right: c === colsSpan - 1 ? { style: 'thin', color: { rgb: COLOR_GRIS_SECUNDARIO } } : undefined
          }
        }
      });

      filaV.push({
        v: c === 0 ? valor : '',
        t: esMoneda ? 'n' : 's',
        z: esMoneda ? '"$"#,##0.00' : undefined,
        s: {
          numFmt: esMoneda ? '"$"#,##0.00' : undefined,
          fill: { fgColor: { rgb: COLOR_BLANCO } },
          font: { name: 'Calibri', sz: 13, bold: true, color: { rgb: COLOR_NEGRO_SOLIDO } },
          alignment: { horizontal: 'center', vertical: 'center' },
          border: {
            bottom: { style: 'thin', color: { rgb: COLOR_GRIS_SECUNDARIO } },
            left: c === 0 ? { style: 'thin', color: { rgb: COLOR_GRIS_SECUNDARIO } } : undefined,
            right: c === colsSpan - 1 ? { style: 'thin', color: { rgb: COLOR_GRIS_SECUNDARIO } } : undefined
          }
        }
      });
    }

    merges.push({ s: { r: rIdx, c: cInicio }, e: { r: rIdx, c: cFin } });
    merges.push({ s: { r: rIdx + 1, c: cInicio }, e: { r: rIdx + 1, c: cFin } });
  };

  // Fila 1 de KPI Cards (Totales de Ingreso)
  agregarKpiCard(filaKpiLabel1, filaKpiVal1, rInicioKpi1, 'TOTAL GENERAL RECAUDADO', totalGeneralSum, 4, true);
  agregarKpiCard(filaKpiLabel1, filaKpiVal1, rInicioKpi1, 'INGRESOS HOSPEDAJE (CABAÑAS)', totalCabanasSum, 3, true);
  agregarKpiCard(filaKpiLabel1, filaKpiVal1, rInicioKpi1, 'INGRESOS ACTIVIDADES', totalActividadesSum, 3, true);
  rows.push(filaKpiLabel1);
  rows.push(filaKpiVal1);

  // Separador KPI
  rows.push(crearFilaVacia(TOTAL_COLS));

  // Fila 2 de KPI Cards (Pagos y Operación)
  const filaKpiLabel2 = [];
  const filaKpiVal2   = [];
  const rInicioKpi2   = rows.length;

  agregarKpiCard(filaKpiLabel2, filaKpiVal2, rInicioKpi2, 'ANTICIPOS RECIBIDOS (PAGO 1)', totalAnticiposSum, 3, true);
  agregarKpiCard(filaKpiLabel2, filaKpiVal2, rInicioKpi2, 'LIQUIDADO EN RECEPCIÓN (PAGO 2)', totalLiquidadoSum, 3, true);
  agregarKpiCard(filaKpiLabel2, filaKpiVal2, rInicioKpi2, 'SALDO PENDIENTE POR COBRAR', totalSaldoPendienteSum, 2, true);
  agregarKpiCard(filaKpiLabel2, filaKpiVal2, rInicioKpi2, 'OPERACIONES TOTALES', `${ventas.length} ventas (${totalNochesSum} noches)`, 2, false);
  rows.push(filaKpiLabel2);
  rows.push(filaKpiVal2);

  // Separador
  rows.push(crearFilaVacia(TOTAL_COLS));

  // ==========================================================================
  // TABLA 1: DESGLOSE COMPARATIVO CABAÑAS VS. ACTIVIDADES
  // ==========================================================================
  const rSecc1 = rows.length;
  rows.push(crearFilaSeccion('1. DESGLOSE FINANCIERO POR LÍNEA DE NEGOCIO', TOTAL_COLS));
  merges.push({ s: { r: rSecc1, c: 0 }, e: { r: rSecc1, c: TOTAL_COLS - 1 } });

  rows.push([
    celdaHeader('Línea de Negocio', COLOR_GRIS_ENCABEZADO, 'left'),
    celdaHeader('N° Operaciones', COLOR_GRIS_SECUNDARIO),
    celdaHeader('Base Hospedaje / Tarifa ($)', COLOR_GRIS_SECUNDARIO, 'right'),
    celdaHeader('Extras (Horas + Personas) ($)', COLOR_GRIS_SECUNDARIO, 'right'),
    celdaHeader('Daños Retenidos ($)', COLOR_GRIS_SECUNDARIO, 'right'),
    celdaHeader('Descuentos ($)', COLOR_GRIS_SECUNDARIO, 'right'),
    celdaHeader('TOTAL RECAUDADO ($ MXN)', COLOR_NEGRO_SOLIDO, 'right'),
    celdaHeader('% del Total', COLOR_GRIS_SECUNDARIO, 'right'),
    celdaHeader('Saldo Pendiente ($)', COLOR_GRIS_SECUNDARIO, 'right'),
    celdaHeader('Estado Financiero', COLOR_GRIS_ENCABEZADO, 'center')
  ]);

  const partCab = totalGeneralSum > 0 ? (totalCabanasSum / totalGeneralSum) : 0;
  const partAct = totalGeneralSum > 0 ? (totalActividadesSum / totalGeneralSum) : 0;

  // Fila Cabañas
  rows.push([
    celdaTexto('Cabañas y Hospedaje Ecoturístico', 'left', true, null),
    celdaNumero(countCabanas, false),
    celdaMoneda(totalBaseHospedajeSum, false),
    celdaMoneda(totalHorasExtraSum + totalPersonasExtraSum, false),
    celdaMoneda(totalDanosSum, false),
    celdaMoneda(ventas.filter(v => v.cabana_id).reduce((acc, v) => acc + (Number(v.descuento_especial) || 0), 0), false),
    celdaMoneda(totalCabanasSum, true, COLOR_GRIS_CLARO_BG, COLOR_NEGRO_SOLIDO),
    celdaPorcentaje(partCab, true),
    celdaMoneda(ventas.filter(v => v.cabana_id).reduce((acc, v) => acc + (v.estado_pago === 'liquidado' ? 0 : (Number(v.saldo_pendiente) || 0)), 0), false),
    celdaTexto('Hospedaje Oficial', 'center', false)
  ]);

  // Fila Actividades
  rows.push([
    celdaTexto('Actividades y Recreación', 'left', true, COLOR_ZEBRA_BG),
    celdaNumero(countActividades, false, COLOR_ZEBRA_BG),
    celdaMoneda(totalActividadesSum, false, COLOR_ZEBRA_BG),
    celdaMoneda(0, false, COLOR_ZEBRA_BG),
    celdaMoneda(0, false, COLOR_ZEBRA_BG),
    celdaMoneda(ventas.filter(v => !v.cabana_id).reduce((acc, v) => acc + (Number(v.descuento_especial) || 0), 0), false, COLOR_ZEBRA_BG),
    celdaMoneda(totalActividadesSum, true, COLOR_GRIS_CLARO_BG, COLOR_NEGRO_SOLIDO),
    celdaPorcentaje(partAct, true, COLOR_ZEBRA_BG),
    celdaMoneda(ventas.filter(v => !v.cabana_id).reduce((acc, v) => acc + (v.estado_pago === 'liquidado' ? 0 : (Number(v.saldo_pendiente) || 0)), 0), false, COLOR_ZEBRA_BG),
    celdaTexto('Ecoturismo Diario', 'center', false, COLOR_ZEBRA_BG)
  ]);

  // Fila Totales Línea de Negocio
  rows.push([
    celdaTexto('TOTALES GENERALES', 'left', true, COLOR_GRIS_TOTAL_BG, COLOR_NEGRO_SOLIDO, bordeTotal),
    celdaNumero(ventas.length, true, COLOR_GRIS_TOTAL_BG, bordeTotal),
    celdaMoneda(totalBaseHospedajeSum + totalActividadesSum, true, COLOR_GRIS_TOTAL_BG, COLOR_NEGRO_SOLIDO, bordeTotal),
    celdaMoneda(totalHorasExtraSum + totalPersonasExtraSum, true, COLOR_GRIS_TOTAL_BG, COLOR_NEGRO_SOLIDO, bordeTotal),
    celdaMoneda(totalDanosSum, true, COLOR_GRIS_TOTAL_BG, COLOR_NEGRO_SOLIDO, bordeTotal),
    celdaMoneda(totalDescuentosSum, true, COLOR_GRIS_TOTAL_BG, COLOR_NEGRO_SOLIDO, bordeTotal),
    celdaMoneda(totalGeneralSum, true, COLOR_NEGRO_SOLIDO, COLOR_BLANCO, bordeTotal, 11),
    celdaPorcentaje(totalGeneralSum > 0 ? 1 : 0, true, COLOR_GRIS_TOTAL_BG, bordeTotal),
    celdaMoneda(totalSaldoPendienteSum, true, COLOR_GRIS_TOTAL_BG, COLOR_NEGRO_SOLIDO, bordeTotal),
    celdaTexto('Consolidado 100%', 'center', true, COLOR_GRIS_TOTAL_BG, COLOR_NEGRO_SOLIDO, bordeTotal)
  ]);

  // Separador
  rows.push(crearFilaVacia(TOTAL_COLS));

  // ==========================================================================
  // TABLA 2: ARQUEO DE INGRESOS POR CANAL DE PAGO
  // ==========================================================================
  const rSecc2 = rows.length;
  rows.push(crearFilaSeccion('2. ARQUEO DE INGRESOS POR CANAL Y MÉTODO DE PAGO', TOTAL_COLS));
  merges.push({ s: { r: rSecc2, c: 0 }, e: { r: rSecc2, c: TOTAL_COLS - 1 } });

  const rHead2 = rows.length;
  rows.push([
    celdaHeader('Canal / Método de Pago', COLOR_GRIS_ENCABEZADO, 'left'),
    celdaHeader('', COLOR_GRIS_ENCABEZADO),
    celdaHeader('', COLOR_GRIS_ENCABEZADO),
    celdaHeader('N° Transacciones', COLOR_GRIS_SECUNDARIO),
    celdaHeader('', COLOR_GRIS_SECUNDARIO),
    celdaHeader('Monto Recaudado ($ MXN)', COLOR_NEGRO_SOLIDO, 'right'),
    celdaHeader('', COLOR_NEGRO_SOLIDO),
    celdaHeader('', COLOR_NEGRO_SOLIDO),
    celdaHeader('% Participación', COLOR_GRIS_SECUNDARIO, 'right'),
    celdaHeader('', COLOR_GRIS_SECUNDARIO)
  ]);
  merges.push({ s: { r: rHead2, c: 0 }, e: { r: rHead2, c: 2 } });
  merges.push({ s: { r: rHead2, c: 3 }, e: { r: rHead2, c: 4 } });
  merges.push({ s: { r: rHead2, c: 5 }, e: { r: rHead2, c: 7 } });
  merges.push({ s: { r: rHead2, c: 8 }, e: { r: rHead2, c: 9 } });

  const metodosValidos = [
    'Efectivo',
    'Transferencia BBVA',
    'Transferencia Bajío',
    'Tarjeta Zettle',
    'Web',
    'Airbnb'
  ];
  const conteoMetodos = {};
  metodosValidos.forEach(m => { conteoMetodos[m] = { metodo: m, total: 0, trans: 0 }; });

  ventas.forEach((v) => {
    const ant = Number(v.anticipo) || 0;
    const metAnt = v.metodo_pago_anticipo || v.metodo_pago;
    if (ant > 0 && metAnt) {
      if (!conteoMetodos[metAnt]) conteoMetodos[metAnt] = { metodo: metAnt, total: 0, trans: 0 };
      conteoMetodos[metAnt].total += ant;
      conteoMetodos[metAnt].trans += 1;
    }

    const montoLiq = Number(v.monto_liquidado) || (ant === 0 ? Number(v.total) : 0);
    const metLiq = v.metodo_pago_liquidacion || v.metodo_pago;
    if (montoLiq > 0 && metLiq) {
      if (!conteoMetodos[metLiq]) conteoMetodos[metLiq] = { metodo: metLiq, total: 0, trans: 0 };
      conteoMetodos[metLiq].total += montoLiq;
      conteoMetodos[metLiq].trans += 1;
    }

    const dano = obtenerDanoDeposito(v);
    if (dano.monto > 0) {
      const metDano = 'Efectivo';
      if (!conteoMetodos[metDano]) conteoMetodos[metDano] = { metodo: metDano, total: 0, trans: 0 };
      conteoMetodos[metDano].total += dano.monto;
      conteoMetodos[metDano].trans += 1;
    }
  });

  const listaMetodos = Object.values(conteoMetodos);
  let sumTransMet = 0;
  let sumTotMet = 0;

  listaMetodos.forEach((item, idx) => {
    const fondoZ = idx % 2 === 1 ? COLOR_ZEBRA_BG : null;
    sumTransMet += item.trans;
    sumTotMet += item.total;
    const part = totalGeneralSum > 0 ? (item.total / totalGeneralSum) : 0;
    const rIdx = rows.length;

    rows.push([
      celdaTexto(item.metodo, 'left', true, fondoZ),
      celdaTexto('', 'left', false, fondoZ),
      celdaTexto('', 'left', false, fondoZ),
      celdaNumero(item.trans, false, fondoZ),
      celdaTexto('', 'center', false, fondoZ),
      celdaMoneda(item.total, true, fondoZ, COLOR_NEGRO_SOLIDO),
      celdaTexto('', 'right', false, fondoZ),
      celdaTexto('', 'right', false, fondoZ),
      celdaPorcentaje(part, false, fondoZ),
      celdaTexto('', 'right', false, fondoZ)
    ]);
    merges.push({ s: { r: rIdx, c: 0 }, e: { r: rIdx, c: 2 } });
    merges.push({ s: { r: rIdx, c: 3 }, e: { r: rIdx, c: 4 } });
    merges.push({ s: { r: rIdx, c: 5 }, e: { r: rIdx, c: 7 } });
    merges.push({ s: { r: rIdx, c: 8 }, e: { r: rIdx, c: 9 } });
  });

  // Fila Total Arqueo
  const rTotMet = rows.length;
  rows.push([
    celdaTexto('TOTAL ARQUEADO', 'left', true, COLOR_GRIS_TOTAL_BG, COLOR_NEGRO_SOLIDO, bordeTotal),
    celdaTexto('', 'left', true, COLOR_GRIS_TOTAL_BG, COLOR_NEGRO_SOLIDO, bordeTotal),
    celdaTexto('', 'left', true, COLOR_GRIS_TOTAL_BG, COLOR_NEGRO_SOLIDO, bordeTotal),
    celdaNumero(sumTransMet, true, COLOR_GRIS_TOTAL_BG, bordeTotal),
    celdaTexto('', 'center', true, COLOR_GRIS_TOTAL_BG, COLOR_NEGRO_SOLIDO, bordeTotal),
    celdaMoneda(sumTotMet, true, COLOR_NEGRO_SOLIDO, COLOR_BLANCO, bordeTotal, 11),
    celdaTexto('', 'right', true, COLOR_NEGRO_SOLIDO, COLOR_BLANCO, bordeTotal),
    celdaTexto('', 'right', true, COLOR_NEGRO_SOLIDO, COLOR_BLANCO, bordeTotal),
    celdaPorcentaje(totalGeneralSum > 0 ? 1 : 0, true, COLOR_GRIS_TOTAL_BG, bordeTotal),
    celdaTexto('', 'right', true, COLOR_GRIS_TOTAL_BG, COLOR_NEGRO_SOLIDO, bordeTotal)
  ]);
  merges.push({ s: { r: rTotMet, c: 0 }, e: { r: rTotMet, c: 2 } });
  merges.push({ s: { r: rTotMet, c: 3 }, e: { r: rTotMet, c: 4 } });
  merges.push({ s: { r: rTotMet, c: 5 }, e: { r: rTotMet, c: 7 } });
  merges.push({ s: { r: rTotMet, c: 8 }, e: { r: rTotMet, c: 9 } });

  // Separador
  rows.push(crearFilaVacia(TOTAL_COLS));

  // ==========================================================================
  // TABLA 3: HISTÓRICO DE SEMANAS CONCLUIDAS Y SEMANA ACTUAL
  // ==========================================================================
  const rSecc3 = rows.length;
  rows.push(crearFilaSeccion('3. CONSOLIDADO DE SEMANAS OPERATIVAS (LUNES A DOMINGO)', TOTAL_COLS));
  merges.push({ s: { r: rSecc3, c: 0 }, e: { r: rSecc3, c: TOTAL_COLS - 1 } });

  rows.push([
    celdaHeader('Semana Operativa', COLOR_GRIS_ENCABEZADO),
    celdaHeader('Fecha Inicio (Lunes)', COLOR_GRIS_ENCABEZADO),
    celdaHeader('Fecha Fin (Domingo)', COLOR_GRIS_ENCABEZADO),
    celdaHeader('Total Movimientos', COLOR_GRIS_SECUNDARIO),
    celdaHeader('Cabañas', COLOR_GRIS_SECUNDARIO),
    celdaHeader('Actividades', COLOR_GRIS_SECUNDARIO),
    celdaHeader('Anticipos ($ MXN)', COLOR_GRIS_SECUNDARIO, 'right'),
    celdaHeader('Liquidaciones ($ MXN)', COLOR_GRIS_SECUNDARIO, 'right'),
    celdaHeader('Daños Retenidos ($ MXN)', COLOR_GRIS_SECUNDARIO, 'right'),
    celdaHeader('TOTAL RECAUDADO ($ MXN)', COLOR_NEGRO_SOLIDO, 'right')
  ]);

  const mapaSemanas = {};
  ventas.forEach((v) => {
    const info = obtenerInfoSemana(v.fecha);
    if (!info) return;
    if (semanaActual && info.claveSemana > semanaActual.claveSemana) return; // Excluir futuras

    if (!mapaSemanas[info.claveSemana]) {
      mapaSemanas[info.claveSemana] = {
        claveSemana: info.claveSemana,
        semana: info.etiquetaSemana,
        inicioMX: info.inicioMX,
        finMX: info.finMX,
        totalMovimientos: 0,
        cabanas: 0,
        actividades: 0,
        anticipos: 0,
        liquidaciones: 0,
        danos: 0,
        totalRecaudado: 0
      };
    }
    const item = mapaSemanas[info.claveSemana];
    item.totalMovimientos += 1;
    if (v.cabana_id) item.cabanas += 1;
    else item.actividades += 1;

    const ant = Number(v.anticipo) || 0;
    const montoLiq = Number(v.monto_liquidado) || (ant === 0 ? Number(v.total) : 0);
    const dano = obtenerDanoDeposito(v);

    item.anticipos += ant;
    item.liquidaciones += montoLiq;
    item.danos += dano.monto;
    item.totalRecaudado += (Number(v.total) || (ant + montoLiq + dano.monto));
  });

  const datosSemanas = Object.values(mapaSemanas).sort((a, b) => b.claveSemana.localeCompare(a.claveSemana));
  let sMov = 0; let sCab = 0; let sAct = 0; let sAnt = 0; let sLiq = 0; let sDan = 0; let sTot = 0;

  datosSemanas.forEach((s, idx) => {
    const fondoZ = idx % 2 === 1 ? COLOR_ZEBRA_BG : null;
    sMov += s.totalMovimientos;
    sCab += s.cabanas;
    sAct += s.actividades;
    sAnt += s.anticipos;
    sLiq += s.liquidaciones;
    sDan += s.danos;
    sTot += s.totalRecaudado;

    rows.push([
      celdaTexto(s.semana, 'center', true, fondoZ),
      celdaTexto(s.inicioMX, 'center', false, fondoZ),
      celdaTexto(s.finMX, 'center', false, fondoZ),
      celdaNumero(s.totalMovimientos, false, fondoZ),
      celdaNumero(s.cabanas, false, fondoZ),
      celdaNumero(s.actividades, false, fondoZ),
      celdaMoneda(s.anticipos, false, fondoZ),
      celdaMoneda(s.liquidaciones, false, fondoZ),
      celdaMoneda(s.danos, false, fondoZ),
      celdaMoneda(s.totalRecaudado, true, COLOR_GRIS_CLARO_BG, COLOR_NEGRO_SOLIDO)
    ]);
  });

  // Totales de Semanas
  const rTotSem = rows.length;
  rows.push([
    celdaTexto('TOTALES SEMANALES', 'center', true, COLOR_GRIS_TOTAL_BG, COLOR_NEGRO_SOLIDO, bordeTotal),
    celdaTexto('', 'center', true, COLOR_GRIS_TOTAL_BG, COLOR_NEGRO_SOLIDO, bordeTotal),
    celdaTexto('', 'center', true, COLOR_GRIS_TOTAL_BG, COLOR_NEGRO_SOLIDO, bordeTotal),
    celdaNumero(sMov, true, COLOR_GRIS_TOTAL_BG, bordeTotal),
    celdaNumero(sCab, true, COLOR_GRIS_TOTAL_BG, bordeTotal),
    celdaNumero(sAct, true, COLOR_GRIS_TOTAL_BG, bordeTotal),
    celdaMoneda(sAnt, true, COLOR_GRIS_TOTAL_BG, COLOR_NEGRO_SOLIDO, bordeTotal),
    celdaMoneda(sLiq, true, COLOR_GRIS_TOTAL_BG, COLOR_NEGRO_SOLIDO, bordeTotal),
    celdaMoneda(sDan, true, COLOR_GRIS_TOTAL_BG, COLOR_NEGRO_SOLIDO, bordeTotal),
    celdaMoneda(sTot, true, COLOR_NEGRO_SOLIDO, COLOR_BLANCO, bordeTotal, 11)
  ]);
  merges.push({ s: { r: rTotSem, c: 0 }, e: { r: rTotSem, c: 2 } });

  const ws = XLSX.utils.aoa_to_sheet(rows);
  ws['!merges'] = merges;
  ws['!cols'] = [
    { wch: 28 }, // Col 0: Concepto / Semana / Canal
    { wch: 18 }, // Col 1: Inicio / Transacciones
    { wch: 18 }, // Col 2: Fin / Base
    { wch: 16 }, // Col 3: Movimientos / Extras
    { wch: 16 }, // Col 4: Cabañas / Daños
    { wch: 16 }, // Col 5: Actividades / Descuentos
    { wch: 20 }, // Col 6: Anticipos
    { wch: 20 }, // Col 7: Liquidaciones
    { wch: 18 }, // Col 8: Daños / % Participación
    { wch: 24 }  // Col 9: TOTAL RECAUDADO
  ];

  // Configuración de impresión horizontal y carta
  ws['!pageSetup'] = { orientation: 'landscape', paperSize: 1 };
  ws['!views'] = [{ state: 'frozen', xSplit: 0, ySplit: 3 }];

  return ws;
}

// ============================================================================
// HOJA 2: VENTAS DE CABAÑAS (HOSPEDAJE COMPLETO)
// ============================================================================
function generarHojaCabanas(ventasCabanas, claveSemana) {
  const TOTAL_COLS = 27;
  const hoyStr = new Date().toLocaleString('es-MX', { dateStyle: 'medium', timeStyle: 'short' });
  const periodoEtiqueta = claveSemana && claveSemana !== 'todas' ? `Período: ${claveSemana}` : 'Semanas Concluidas y Semana Actual';
  const rows = [];
  const merges = [];

  // Fila 0: Banner
  rows.push(crearFilaBanner('RANCHO KARINGA • REPORTE OPERATIVO DE CABAÑAS Y HOSPEDAJE', TOTAL_COLS));
  merges.push({ s: { r: 0, c: 0 }, e: { r: 0, c: TOTAL_COLS - 1 } });

  // Fila 1: Subtítulo
  rows.push(crearFilaSubtitulo(`${periodoEtiqueta}  |  Generado: ${hoyStr}  |  Moneda: MXN ($)  |  Sistema de Gestión Rancho Karinga`, TOTAL_COLS));
  merges.push({ s: { r: 1, c: 0 }, e: { r: 1, c: TOTAL_COLS - 1 } });

  // Fila 2: Separador
  rows.push(crearFilaVacia(TOTAL_COLS));

  // Acumulados
  let totalGeneralSum = 0;
  let totalAnticiposSum = 0;
  let totalLiquidadoSum = 0;
  let totalSaldoPendienteSum = 0;
  let totalNochesSum = 0;
  let totalHorasExtraSum = 0;
  let totalPersonasExtraSum = 0;
  let totalDanosSum = 0;
  let totalDescuentosSum = 0;

  ventasCabanas.forEach((v) => {
    const anticipo = Number(v.anticipo) || 0;
    const saldoPendiente = Number(v.saldo_pendiente) || 0;
    const descuento = Number(v.descuento_especial) || 0;
    const montoLiquidado = Number(v.monto_liquidado) || 0;

    const hExtra = Number(v.horas_extra) || 0;
    const cHExtra = Number(v.costo_horas_extra) || (hExtra * 250);
    const pExtra = Number(v.personas_extra) || 0;
    const cPExtra = Number(v.costo_personas_extra) || (pExtra * 250);
    const cNoches = Number(v.costo_cabana) || 0;
    const dano = obtenerDanoDeposito(v);
    const totCabana = cNoches + cPExtra + cHExtra;
    const granTotal = Math.max(totCabana - descuento + dano.monto, Number(v.total) || 0, anticipo + montoLiquidado + saldoPendiente + dano.monto);

    const saldoEfectivo = v.estado_pago === 'liquidado' ? 0 : (saldoPendiente > 0 ? saldoPendiente : Math.max(0, granTotal - anticipo));
    const liqEfectiva = v.estado_pago === 'liquidado'
      ? (montoLiquidado > 0 ? montoLiquidado : (anticipo > 0 ? Math.max(0, granTotal - anticipo) : granTotal))
      : montoLiquidado;

    totalGeneralSum += granTotal;
    totalAnticiposSum += anticipo;
    totalLiquidadoSum += liqEfectiva;
    totalSaldoPendienteSum += saldoEfectivo;
    totalNochesSum += (Number(v.noches) || 1);
    totalHorasExtraSum += cHExtra;
    totalPersonasExtraSum += cPExtra;
    totalDanosSum += dano.monto;
    totalDescuentosSum += descuento;
  });

  // KPI CARDS CABAÑAS (ALTO CONTRASTE B/W)
  const filaKpiL = [];
  const filaKpiV = [];
  const rKpi = rows.length;

  const agregarKpiCard = (titulo, valor, colsSpan, esMoneda = true) => {
    const cInicio = filaKpiL.length;
    const cFin = cInicio + colsSpan - 1;

    for (let c = 0; c < colsSpan; c++) {
      filaKpiL.push({
        v: c === 0 ? titulo : '',
        t: 's',
        s: {
          fill: { fgColor: { rgb: COLOR_GRIS_CLARO_BG } },
          font: { name: 'Calibri', sz: 8.5, bold: true, color: { rgb: COLOR_GRIS_ENCABEZADO } },
          alignment: { horizontal: 'center', vertical: 'center' },
          border: {
            top: { style: 'thin', color: { rgb: COLOR_GRIS_SECUNDARIO } },
            left: c === 0 ? { style: 'thin', color: { rgb: COLOR_GRIS_SECUNDARIO } } : undefined,
            right: c === colsSpan - 1 ? { style: 'thin', color: { rgb: COLOR_GRIS_SECUNDARIO } } : undefined
          }
        }
      });

      filaKpiV.push({
        v: c === 0 ? valor : '',
        t: esMoneda ? 'n' : 's',
        z: esMoneda ? '"$"#,##0.00' : undefined,
        s: {
          numFmt: esMoneda ? '"$"#,##0.00' : undefined,
          fill: { fgColor: { rgb: COLOR_BLANCO } },
          font: { name: 'Calibri', sz: 13, bold: true, color: { rgb: COLOR_NEGRO_SOLIDO } },
          alignment: { horizontal: 'center', vertical: 'center' },
          border: {
            bottom: { style: 'thin', color: { rgb: COLOR_GRIS_SECUNDARIO } },
            left: c === 0 ? { style: 'thin', color: { rgb: COLOR_GRIS_SECUNDARIO } } : undefined,
            right: c === colsSpan - 1 ? { style: 'thin', color: { rgb: COLOR_GRIS_SECUNDARIO } } : undefined
          }
        }
      });
    }

    merges.push({ s: { r: rKpi, c: cInicio }, e: { r: rKpi, c: cFin } });
    merges.push({ s: { r: rKpi + 1, c: cInicio }, e: { r: rKpi + 1, c: cFin } });
  };

  agregarKpiCard('TOTAL RECAUDADO CABAÑAS', totalGeneralSum, 5, true);
  agregarKpiCard('ANTICIPOS (P1)', totalAnticiposSum, 5, true);
  agregarKpiCard('LIQUIDACIÓN RECEPCIÓN (P2)', totalLiquidadoSum, 5, true);
  agregarKpiCard('SALDO PENDIENTE', totalSaldoPendienteSum, 4, true);
  agregarKpiCard('RESERVACIONES REGISTRADAS', `${ventasCabanas.length} (${totalNochesSum} Noches)`, 8, false);

  rows.push(filaKpiL);
  rows.push(filaKpiV);
  rows.push(crearFilaVacia(TOTAL_COLS));

  // Fila Encabezados de Tabla (27 columnas)
  const filaEncabezados = [
    celdaHeader('#', COLOR_GRIS_ENCABEZADO),
    celdaHeader('Fecha', COLOR_GRIS_ENCABEZADO),
    celdaHeader('Hora', COLOR_GRIS_ENCABEZADO),
    celdaHeader('Semana', COLOR_GRIS_ENCABEZADO),
    celdaHeader('Cliente / Huésped', COLOR_GRIS_ENCABEZADO, 'left'),
    celdaHeader('Cabaña Reservada', COLOR_GRIS_ENCABEZADO, 'left'),
    celdaHeader('Temporada', COLOR_GRIS_ENCABEZADO),
    celdaHeader('Noches', COLOR_GRIS_ENCABEZADO),
    celdaHeader('Check-in (Entrada)', COLOR_GRIS_ENCABEZADO),
    celdaHeader('Check-out (Salida)', COLOR_GRIS_ENCABEZADO),
    celdaHeader('Costo Hospedaje', COLOR_GRIS_SECUNDARIO, 'right'),
    celdaHeader('Horas Extra', COLOR_GRIS_SECUNDARIO),
    celdaHeader('Costo H. Extra', COLOR_GRIS_SECUNDARIO, 'right'),
    celdaHeader('Personas Extra', COLOR_GRIS_SECUNDARIO),
    celdaHeader('Costo P. Extra', COLOR_GRIS_SECUNDARIO, 'right'),
    celdaHeader('Daños Retenidos', COLOR_GRIS_SECUNDARIO, 'right'),
    celdaHeader('Descuento (%)', COLOR_GRIS_SECUNDARIO, 'right'),
    celdaHeader('TOTAL GENERAL', COLOR_NEGRO_SOLIDO, 'right'), // Destacado negro sólido
    celdaHeader('Estado de Pago', COLOR_GRIS_ENCABEZADO),
    celdaHeader('Anticipo (P1)', COLOR_GRIS_SECUNDARIO, 'right'),
    celdaHeader('Método Anticipo', COLOR_GRIS_SECUNDARIO),
    celdaHeader('Folio Anticipo', COLOR_GRIS_SECUNDARIO, 'left'),
    celdaHeader('Saldo Pendiente', COLOR_GRIS_SECUNDARIO, 'right'),
    celdaHeader('Liquidación (P2)', COLOR_GRIS_SECUNDARIO, 'right'),
    celdaHeader('Método Liquidación', COLOR_GRIS_SECUNDARIO),
    celdaHeader('Folio Liquidación', COLOR_GRIS_SECUNDARIO, 'left'),
    celdaHeader('Observaciones', COLOR_GRIS_ENCABEZADO, 'left')
  ];
  rows.push(filaEncabezados);

  // Filas de Registros de Cabañas
  ventasCabanas.forEach((v, idx) => {
    const anticipo = Number(v.anticipo) || 0;
    const saldoPendiente = Number(v.saldo_pendiente) || 0;
    const descuento = Number(v.descuento_especial) || 0;
    const montoLiquidado = Number(v.monto_liquidado) || 0;
    const infoSem = obtenerInfoSemana(v.fecha);
    const fondoZebra = idx % 2 === 1 ? COLOR_ZEBRA_BG : null;

    const hExtra = Number(v.horas_extra) || 0;
    const cHExtra = Number(v.costo_horas_extra) || (hExtra * 250);
    const pExtra = Number(v.personas_extra) || 0;
    const cPExtra = Number(v.costo_personas_extra) || (pExtra * 250);
    const cNoches = Number(v.costo_cabana) || 0;
    const danoObj = obtenerDanoDeposito(v);
    const montoDano = danoObj.monto;
    const totCabana = cNoches + cPExtra + cHExtra;
    const granTotal = Math.max(totCabana - descuento + montoDano, Number(v.total) || 0, anticipo + montoLiquidado + saldoPendiente + montoDano);

    const saldoEfectivo = v.estado_pago === 'liquidado' ? 0 : (saldoPendiente > 0 ? saldoPendiente : Math.max(0, granTotal - anticipo));
    const liqEfectiva = v.estado_pago === 'liquidado'
      ? (montoLiquidado > 0 ? montoLiquidado : (anticipo > 0 ? Math.max(0, granTotal - anticipo) : granTotal))
      : montoLiquidado;

    let porcentajeDescuento = 0;
    if (v.tipo_descuento === 'porcentaje' && Number(v.valor_descuento) > 0) {
      porcentajeDescuento = Number(v.valor_descuento) / 100;
    } else if (descuento > 0) {
      const subtotalBase = granTotal + descuento;
      porcentajeDescuento = subtotalBase > 0 ? (descuento / subtotalBase) : 0;
    }

    const fechaCheckinStr = v.fecha_checkin ? `${formatearFecha(v.fecha_checkin)} 15:00` : `${formatearFecha(v.fecha)} 15:00`;
    const fechaCheckoutStr = v.fecha_checkout ? `${formatearFecha(v.fecha_checkout)} ${v.hora_checkout || '12:00'}` : '-';

    rows.push([
      celdaNumero(idx + 1, false, fondoZebra),
      celdaTexto(formatearFecha(v.fecha), 'center', false, fondoZebra),
      celdaTexto(v.hora || '', 'center', false, fondoZebra),
      celdaTexto(infoSem ? infoSem.etiquetaSemana : '-', 'center', false, fondoZebra),
      celdaTexto(v.nombre_reservacion || '-', 'left', true, fondoZebra),
      celdaTexto(obtenerNombreConcepto(v), 'left', false, fondoZebra),
      celdaTexto(formatearTemporada(v.temporada), 'center', false, fondoZebra),
      celdaNumero(Number(v.noches) || 1, false, fondoZebra),
      celdaTexto(fechaCheckinStr, 'center', false, fondoZebra),
      celdaTexto(fechaCheckoutStr, 'center', false, fondoZebra),
      celdaMoneda(cNoches, false, fondoZebra),
      celdaTexto(hExtra > 0 ? `+${hExtra}h` : '-', 'center', false, fondoZebra),
      celdaMoneda(cHExtra, false, fondoZebra),
      celdaTexto(pExtra > 0 ? `+${pExtra}` : '-', 'center', false, fondoZebra),
      celdaMoneda(cPExtra, false, fondoZebra),
      celdaMoneda(montoDano, false, fondoZebra),
      porcentajeDescuento > 0
        ? celdaPorcentaje(porcentajeDescuento, true, fondoZebra, bordeFino, COLOR_NEGRO_SOLIDO)
        : celdaTexto('-', 'center', false, fondoZebra),
      celdaMoneda(granTotal, true, COLOR_GRIS_CLARO_BG, COLOR_NEGRO_SOLIDO),
      celdaEstado(v.estado_pago),
      celdaMoneda(anticipo, anticipo > 0, fondoZebra),
      celdaTexto(v.metodo_pago_anticipo || (anticipo > 0 ? v.metodo_pago : '-'), 'center', false, fondoZebra),
      celdaTexto(v.comprobante_anticipo || '-', 'left', false, fondoZebra),
      celdaMoneda(saldoEfectivo, saldoEfectivo > 0, fondoZebra),
      celdaMoneda(liqEfectiva, liqEfectiva > 0, fondoZebra),
      celdaTexto(v.metodo_pago_liquidacion || (v.estado_pago === 'liquidado' ? v.metodo_pago : '-'), 'center', false, fondoZebra),
      celdaTexto(v.comprobante_pago || '-', 'left', false, fondoZebra),
      celdaTexto('', 'left', false, fondoZebra) // Observaciones vacía
    ]);
  });

  // Fila Final de Totales Cabañas
  const filaTotalIdx = rows.length;
  const filaTotales = [];

  for (let c = 0; c < 10; c++) {
    filaTotales.push({
      v: c === 0 ? 'TOTALES CABAÑAS' : '',
      t: 's',
      s: {
        fill: { fgColor: { rgb: COLOR_GRIS_TOTAL_BG } },
        font: { name: 'Calibri', sz: 10.5, bold: true, color: { rgb: COLOR_NEGRO_SOLIDO } },
        alignment: { horizontal: 'center', vertical: 'center' },
        border: bordeTotal
      }
    });
  }
  merges.push({ s: { r: filaTotalIdx, c: 0 }, e: { r: filaTotalIdx, c: 9 } });

  const totalBaseConDescuento = totalGeneralSum + totalDescuentosSum;
  const porcentajeDescuentoGlobal = totalBaseConDescuento > 0 ? (totalDescuentosSum / totalBaseConDescuento) : 0;

  filaTotales.push(celdaMoneda(totalGeneralSum > 0 ? (totalGeneralSum - totalHorasExtraSum - totalPersonasExtraSum - totalDanosSum + totalDescuentosSum) : 0, true, COLOR_GRIS_TOTAL_BG, COLOR_NEGRO_SOLIDO, bordeTotal));
  filaTotales.push(celdaTexto('-', 'center', true, COLOR_GRIS_TOTAL_BG, COLOR_NEGRO_SOLIDO, bordeTotal));
  filaTotales.push(celdaMoneda(totalHorasExtraSum, true, COLOR_GRIS_TOTAL_BG, COLOR_NEGRO_SOLIDO, bordeTotal));
  filaTotales.push(celdaTexto('-', 'center', true, COLOR_GRIS_TOTAL_BG, COLOR_NEGRO_SOLIDO, bordeTotal));
  filaTotales.push(celdaMoneda(totalPersonasExtraSum, true, COLOR_GRIS_TOTAL_BG, COLOR_NEGRO_SOLIDO, bordeTotal));
  filaTotales.push(celdaMoneda(totalDanosSum, true, COLOR_GRIS_TOTAL_BG, COLOR_NEGRO_SOLIDO, bordeTotal));
  filaTotales.push(porcentajeDescuentoGlobal > 0 ? celdaPorcentaje(porcentajeDescuentoGlobal, true, COLOR_GRIS_TOTAL_BG, bordeTotal, COLOR_NEGRO_SOLIDO) : celdaTexto('-', 'center', true, COLOR_GRIS_TOTAL_BG, COLOR_NEGRO_SOLIDO, bordeTotal));
  filaTotales.push(celdaMoneda(totalGeneralSum, true, COLOR_NEGRO_SOLIDO, COLOR_BLANCO, bordeTotal, 11)); // Total destacado negro
  filaTotales.push(celdaTexto('-', 'center', true, COLOR_GRIS_TOTAL_BG, COLOR_NEGRO_SOLIDO, bordeTotal));
  filaTotales.push(celdaMoneda(totalAnticiposSum, true, COLOR_GRIS_TOTAL_BG, COLOR_NEGRO_SOLIDO, bordeTotal, 10.5));
  filaTotales.push(celdaTexto('-', 'center', true, COLOR_GRIS_TOTAL_BG, COLOR_NEGRO_SOLIDO, bordeTotal));
  filaTotales.push(celdaTexto('-', 'center', true, COLOR_GRIS_TOTAL_BG, COLOR_NEGRO_SOLIDO, bordeTotal));
  filaTotales.push(celdaMoneda(totalSaldoPendienteSum, true, COLOR_GRIS_TOTAL_BG, COLOR_NEGRO_SOLIDO, bordeTotal, 10.5));
  filaTotales.push(celdaMoneda(totalLiquidadoSum, true, COLOR_GRIS_TOTAL_BG, COLOR_NEGRO_SOLIDO, bordeTotal, 10.5));
  filaTotales.push(celdaTexto('-', 'center', true, COLOR_GRIS_TOTAL_BG, COLOR_NEGRO_SOLIDO, bordeTotal));
  filaTotales.push(celdaTexto('-', 'center', true, COLOR_GRIS_TOTAL_BG, COLOR_NEGRO_SOLIDO, bordeTotal));
  filaTotales.push(celdaTexto('', 'left', false, COLOR_GRIS_TOTAL_BG, COLOR_NEGRO_SOLIDO, bordeTotal)); // Observaciones vacía

  rows.push(filaTotales);

  const ws = XLSX.utils.aoa_to_sheet(rows);
  ws['!merges'] = merges;
  ws['!cols'] = [
    { wch: 6 },  // #
    { wch: 13 }, // Fecha
    { wch: 9 },  // Hora
    { wch: 14 }, // Semana
    { wch: 28 }, // Cliente / Huésped
    { wch: 24 }, // Cabaña
    { wch: 15 }, // Temporada
    { wch: 9 },  // Noches
    { wch: 19 }, // Check-in
    { wch: 19 }, // Check-out
    { wch: 16 }, // Costo Hospedaje
    { wch: 12 }, // Horas Extra
    { wch: 15 }, // Costo H. Extra
    { wch: 13 }, // Personas Extra
    { wch: 15 }, // Costo P. Extra
    { wch: 15 }, // Daños Retenidos
    { wch: 15 }, // Descuento (%)
    { wch: 19 }, // TOTAL GENERAL
    { wch: 18 }, // Estado de Pago
    { wch: 17 }, // Anticipo (P1)
    { wch: 20 }, // Método Anticipo
    { wch: 18 }, // Folio Anticipo
    { wch: 17 }, // Saldo Pendiente
    { wch: 18 }, // Liquidación (P2)
    { wch: 20 }, // Método Liquidación
    { wch: 18 }, // Folio Liquidación
    { wch: 32 }  // Observaciones
  ];

  ws['!pageSetup'] = { orientation: 'landscape', paperSize: 1 };
  ws['!views'] = [{ state: 'frozen', xSplit: 0, ySplit: 6 }];

  return ws;
}

// ============================================================================
// HOJA 3: VENTAS DE ACTIVIDADES RECREATIVAS (ENFOCADA Y LIMPIA)
// ============================================================================
function generarHojaActividades(ventasActividades, claveSemana) {
  const TOTAL_COLS = 20;
  const hoyStr = new Date().toLocaleString('es-MX', { dateStyle: 'medium', timeStyle: 'short' });
  const periodoEtiqueta = claveSemana && claveSemana !== 'todas' ? `Período: ${claveSemana}` : 'Semanas Concluidas y Semana Actual';
  const rows = [];
  const merges = [];

  // Fila 0: Banner
  rows.push(crearFilaBanner('RANCHO KARINGA • REPORTE OPERATIVO DE ACTIVIDADES RECREATIVAS', TOTAL_COLS));
  merges.push({ s: { r: 0, c: 0 }, e: { r: 0, c: TOTAL_COLS - 1 } });

  // Fila 1: Subtítulo
  rows.push(crearFilaSubtitulo(`${periodoEtiqueta}  |  Generado: ${hoyStr}  |  Moneda: MXN ($)  |  Sistema de Gestión Rancho Karinga`, TOTAL_COLS));
  merges.push({ s: { r: 1, c: 0 }, e: { r: 1, c: TOTAL_COLS - 1 } });

  // Fila 2: Separador
  rows.push(crearFilaVacia(TOTAL_COLS));

  // Acumulados Actividades
  let totalGeneralSum = 0;
  let totalAnticiposSum = 0;
  let totalLiquidadoSum = 0;
  let totalSaldoPendienteSum = 0;
  let totalDescuentosSum = 0;

  ventasActividades.forEach((v) => {
    const anticipo = Number(v.anticipo) || 0;
    const saldoPendiente = Number(v.saldo_pendiente) || 0;
    const descuento = Number(v.descuento_especial) || 0;
    const montoLiquidado = Number(v.monto_liquidado) || 0;

    const granTotal = Math.max(Number(v.costo_actividades) || Number(v.subtotal) || Number(v.total) || 0, anticipo + montoLiquidado + saldoPendiente);
    const saldoEfectivo = v.estado_pago === 'liquidado' ? 0 : (saldoPendiente > 0 ? saldoPendiente : Math.max(0, granTotal - anticipo));
    const liqEfectiva = v.estado_pago === 'liquidado'
      ? (montoLiquidado > 0 ? montoLiquidado : (anticipo > 0 ? Math.max(0, granTotal - anticipo) : granTotal))
      : montoLiquidado;

    totalGeneralSum += granTotal;
    totalAnticiposSum += anticipo;
    totalLiquidadoSum += liqEfectiva;
    totalSaldoPendienteSum += saldoEfectivo;
    totalDescuentosSum += descuento;
  });

  // KPI CARDS ACTIVIDADES (ALTO CONTRASTE B/W)
  const filaKpiL = [];
  const filaKpiV = [];
  const rKpi = rows.length;

  const agregarKpiCard = (titulo, valor, colsSpan, esMoneda = true) => {
    const cInicio = filaKpiL.length;
    const cFin = cInicio + colsSpan - 1;

    for (let c = 0; c < colsSpan; c++) {
      filaKpiL.push({
        v: c === 0 ? titulo : '',
        t: 's',
        s: {
          fill: { fgColor: { rgb: COLOR_GRIS_CLARO_BG } },
          font: { name: 'Calibri', sz: 8.5, bold: true, color: { rgb: COLOR_GRIS_ENCABEZADO } },
          alignment: { horizontal: 'center', vertical: 'center' },
          border: {
            top: { style: 'thin', color: { rgb: COLOR_GRIS_SECUNDARIO } },
            left: c === 0 ? { style: 'thin', color: { rgb: COLOR_GRIS_SECUNDARIO } } : undefined,
            right: c === colsSpan - 1 ? { style: 'thin', color: { rgb: COLOR_GRIS_SECUNDARIO } } : undefined
          }
        }
      });

      filaKpiV.push({
        v: c === 0 ? valor : '',
        t: esMoneda ? 'n' : 's',
        z: esMoneda ? '"$"#,##0.00' : undefined,
        s: {
          numFmt: esMoneda ? '"$"#,##0.00' : undefined,
          fill: { fgColor: { rgb: COLOR_BLANCO } },
          font: { name: 'Calibri', sz: 13, bold: true, color: { rgb: COLOR_NEGRO_SOLIDO } },
          alignment: { horizontal: 'center', vertical: 'center' },
          border: {
            bottom: { style: 'thin', color: { rgb: COLOR_GRIS_SECUNDARIO } },
            left: c === 0 ? { style: 'thin', color: { rgb: COLOR_GRIS_SECUNDARIO } } : undefined,
            right: c === colsSpan - 1 ? { style: 'thin', color: { rgb: COLOR_GRIS_SECUNDARIO } } : undefined
          }
        }
      });
    }

    merges.push({ s: { r: rKpi, c: cInicio }, e: { r: rKpi, c: cFin } });
    merges.push({ s: { r: rKpi + 1, c: cInicio }, e: { r: rKpi + 1, c: cFin } });
  };

  agregarKpiCard('TOTAL RECAUDADO ACTIVIDADES', totalGeneralSum, 4, true);
  agregarKpiCard('ANTICIPOS (P1)', totalAnticiposSum, 4, true);
  agregarKpiCard('LIQUIDADO RECEPCIÓN (P2)', totalLiquidadoSum, 4, true);
  agregarKpiCard('SALDO PENDIENTE', totalSaldoPendienteSum, 4, true);
  agregarKpiCard('OPERACIONES REALIZADAS', `${ventasActividades.length} Actividades`, 4, false);

  rows.push(filaKpiL);
  rows.push(filaKpiV);
  rows.push(crearFilaVacia(TOTAL_COLS));

  // Fila Encabezados de Tabla Actividades (20 columnas limpias)
  const filaEncabezados = [
    celdaHeader('#', COLOR_GRIS_ENCABEZADO),
    celdaHeader('Fecha', COLOR_GRIS_ENCABEZADO),
    celdaHeader('Hora', COLOR_GRIS_ENCABEZADO),
    celdaHeader('Semana', COLOR_GRIS_ENCABEZADO),
    celdaHeader('Cliente / Visitante', COLOR_GRIS_ENCABEZADO, 'left'),
    celdaHeader('Actividad / Concepto', COLOR_GRIS_ENCABEZADO, 'left'),
    celdaHeader('Detalles Adicionales', COLOR_GRIS_ENCABEZADO, 'left'),
    celdaHeader('Temporada', COLOR_GRIS_ENCABEZADO),
    celdaHeader('Costo Actividad ($)', COLOR_GRIS_SECUNDARIO, 'right'),
    celdaHeader('Descuento (%)', COLOR_GRIS_SECUNDARIO, 'right'),
    celdaHeader('TOTAL GENERAL', COLOR_NEGRO_SOLIDO, 'right'), // Destacado negro sólido
    celdaHeader('Estado de Pago', COLOR_GRIS_ENCABEZADO),
    celdaHeader('Anticipo (P1)', COLOR_GRIS_SECUNDARIO, 'right'),
    celdaHeader('Método Anticipo', COLOR_GRIS_SECUNDARIO),
    celdaHeader('Folio Anticipo', COLOR_GRIS_SECUNDARIO, 'left'),
    celdaHeader('Saldo Pendiente', COLOR_GRIS_SECUNDARIO, 'right'),
    celdaHeader('Liquidación (P2)', COLOR_GRIS_SECUNDARIO, 'right'),
    celdaHeader('Método Liquidación', COLOR_GRIS_SECUNDARIO),
    celdaHeader('Folio Liquidación', COLOR_GRIS_SECUNDARIO, 'left'),
    celdaHeader('Observaciones', COLOR_GRIS_ENCABEZADO, 'left')
  ];
  rows.push(filaEncabezados);

  // Filas de Registros de Actividades
  ventasActividades.forEach((v, idx) => {
    const anticipo = Number(v.anticipo) || 0;
    const saldoPendiente = Number(v.saldo_pendiente) || 0;
    const descuento = Number(v.descuento_especial) || 0;
    const montoLiquidado = Number(v.monto_liquidado) || 0;
    const infoSem = obtenerInfoSemana(v.fecha);
    const fondoZebra = idx % 2 === 1 ? COLOR_ZEBRA_BG : null;

    const costoBase = Number(v.costo_actividades) || Number(v.subtotal) || Number(v.total) || 0;
    const granTotal = Math.max(costoBase, anticipo + montoLiquidado + saldoPendiente);

    const saldoEfectivo = v.estado_pago === 'liquidado' ? 0 : (saldoPendiente > 0 ? saldoPendiente : Math.max(0, granTotal - anticipo));
    const liqEfectiva = v.estado_pago === 'liquidado'
      ? (montoLiquidado > 0 ? montoLiquidado : (anticipo > 0 ? Math.max(0, granTotal - anticipo) : granTotal))
      : montoLiquidado;

    let porcentajeDescuento = 0;
    if (v.tipo_descuento === 'porcentaje' && Number(v.valor_descuento) > 0) {
      porcentajeDescuento = Number(v.valor_descuento) / 100;
    } else if (descuento > 0) {
      const subtotalBase = granTotal + descuento;
      porcentajeDescuento = subtotalBase > 0 ? (descuento / subtotalBase) : 0;
    }

    rows.push([
      celdaNumero(idx + 1, false, fondoZebra),
      celdaTexto(formatearFecha(v.fecha), 'center', false, fondoZebra),
      celdaTexto(v.hora || '', 'center', false, fondoZebra),
      celdaTexto(infoSem ? infoSem.etiquetaSemana : '-', 'center', false, fondoZebra),
      celdaTexto(v.nombre_reservacion || 'Público General', 'left', true, fondoZebra),
      celdaTexto(obtenerNombreConcepto(v), 'left', false, fondoZebra),
      celdaTexto(v.detalles_actividades && v.detalles_actividades !== 'Ninguna' ? v.detalles_actividades : '-', 'left', false, fondoZebra),
      celdaTexto(formatearTemporada(v.temporada), 'center', false, fondoZebra),
      celdaMoneda(costoBase, false, fondoZebra),
      porcentajeDescuento > 0
        ? celdaPorcentaje(porcentajeDescuento, true, fondoZebra, bordeFino, COLOR_NEGRO_SOLIDO)
        : celdaTexto('-', 'center', false, fondoZebra),
      celdaMoneda(granTotal, true, COLOR_GRIS_CLARO_BG, COLOR_NEGRO_SOLIDO),
      celdaEstado(v.estado_pago),
      celdaMoneda(anticipo, anticipo > 0, fondoZebra),
      celdaTexto(v.metodo_pago_anticipo || (anticipo > 0 ? v.metodo_pago : '-'), 'center', false, fondoZebra),
      celdaTexto(v.comprobante_anticipo || '-', 'left', false, fondoZebra),
      celdaMoneda(saldoEfectivo, saldoEfectivo > 0, fondoZebra),
      celdaMoneda(liqEfectiva, liqEfectiva > 0, fondoZebra),
      celdaTexto(v.metodo_pago_liquidacion || (v.estado_pago === 'liquidado' ? v.metodo_pago : '-'), 'center', false, fondoZebra),
      celdaTexto(v.comprobante_pago || '-', 'left', false, fondoZebra),
      celdaTexto('', 'left', false, fondoZebra) // Observaciones vacía
    ]);
  });

  // Fila Totales Actividades
  const filaTotalIdx = rows.length;
  const filaTotales = [];

  for (let c = 0; c < 8; c++) {
    filaTotales.push({
      v: c === 0 ? 'TOTALES ACTIVIDADES' : '',
      t: 's',
      s: {
        fill: { fgColor: { rgb: COLOR_GRIS_TOTAL_BG } },
        font: { name: 'Calibri', sz: 10.5, bold: true, color: { rgb: COLOR_NEGRO_SOLIDO } },
        alignment: { horizontal: 'center', vertical: 'center' },
        border: bordeTotal
      }
    });
  }
  merges.push({ s: { r: filaTotalIdx, c: 0 }, e: { r: filaTotalIdx, c: 7 } });

  const totalBaseConDescuento = totalGeneralSum + totalDescuentosSum;
  const porcentajeDescuentoGlobal = totalBaseConDescuento > 0 ? (totalDescuentosSum / totalBaseConDescuento) : 0;

  filaTotales.push(celdaMoneda(totalGeneralSum + totalDescuentosSum, true, COLOR_GRIS_TOTAL_BG, COLOR_NEGRO_SOLIDO, bordeTotal));
  filaTotales.push(porcentajeDescuentoGlobal > 0 ? celdaPorcentaje(porcentajeDescuentoGlobal, true, COLOR_GRIS_TOTAL_BG, bordeTotal, COLOR_NEGRO_SOLIDO) : celdaTexto('-', 'center', true, COLOR_GRIS_TOTAL_BG, COLOR_NEGRO_SOLIDO, bordeTotal));
  filaTotales.push(celdaMoneda(totalGeneralSum, true, COLOR_NEGRO_SOLIDO, COLOR_BLANCO, bordeTotal, 11)); // Destacado negro sólido
  filaTotales.push(celdaTexto('-', 'center', true, COLOR_GRIS_TOTAL_BG, COLOR_NEGRO_SOLIDO, bordeTotal));
  filaTotales.push(celdaMoneda(totalAnticiposSum, true, COLOR_GRIS_TOTAL_BG, COLOR_NEGRO_SOLIDO, bordeTotal, 10.5));
  filaTotales.push(celdaTexto('-', 'center', true, COLOR_GRIS_TOTAL_BG, COLOR_NEGRO_SOLIDO, bordeTotal));
  filaTotales.push(celdaTexto('-', 'center', true, COLOR_GRIS_TOTAL_BG, COLOR_NEGRO_SOLIDO, bordeTotal));
  filaTotales.push(celdaMoneda(totalSaldoPendienteSum, true, COLOR_GRIS_TOTAL_BG, COLOR_NEGRO_SOLIDO, bordeTotal, 10.5));
  filaTotales.push(celdaMoneda(totalLiquidadoSum, true, COLOR_GRIS_TOTAL_BG, COLOR_NEGRO_SOLIDO, bordeTotal, 10.5));
  filaTotales.push(celdaTexto('-', 'center', true, COLOR_GRIS_TOTAL_BG, COLOR_NEGRO_SOLIDO, bordeTotal));
  filaTotales.push(celdaTexto('-', 'center', true, COLOR_GRIS_TOTAL_BG, COLOR_NEGRO_SOLIDO, bordeTotal));
  filaTotales.push(celdaTexto('', 'left', false, COLOR_GRIS_TOTAL_BG, COLOR_NEGRO_SOLIDO, bordeTotal)); // Observaciones vacía

  rows.push(filaTotales);

  const ws = XLSX.utils.aoa_to_sheet(rows);
  ws['!merges'] = merges;
  ws['!cols'] = [
    { wch: 6 },  // #
    { wch: 13 }, // Fecha
    { wch: 9 },  // Hora
    { wch: 14 }, // Semana
    { wch: 28 }, // Cliente / Visitante
    { wch: 30 }, // Actividad / Concepto
    { wch: 26 }, // Detalles Adicionales
    { wch: 15 }, // Temporada
    { wch: 18 }, // Costo Actividad ($)
    { wch: 15 }, // Descuento (%)
    { wch: 19 }, // TOTAL GENERAL
    { wch: 18 }, // Estado de Pago
    { wch: 17 }, // Anticipo (P1)
    { wch: 20 }, // Método Anticipo
    { wch: 18 }, // Folio Anticipo
    { wch: 17 }, // Saldo Pendiente
    { wch: 18 }, // Liquidación (P2)
    { wch: 20 }, // Método Liquidación
    { wch: 18 }, // Folio Liquidación
    { wch: 32 }  // Observaciones
  ];

  ws['!pageSetup'] = { orientation: 'landscape', paperSize: 1 };
  ws['!views'] = [{ state: 'frozen', xSplit: 0, ySplit: 6 }];

  return ws;
}

// ============================================================================
// FUNCIÓN PRINCIPAL DE EXPORTACIÓN (CLIENTE)
// ============================================================================
export function exportarExcelCliente(ventas, tipo = 'todos', claveSemana = 'todas') {
  const semanaActual = obtenerInfoSemana(new Date());
  let filtradas = ventas;

  // 1. Solo exportar semanas ya concluidas o la semana actual (excluir semanas futuras)
  if (semanaActual) {
    filtradas = filtradas.filter((v) => {
      const info = obtenerInfoSemana(v.fecha);
      return info && info.claveSemana <= semanaActual.claveSemana;
    });
  }

  // 2. Filtro por semana específica (si aplica)
  if (claveSemana && claveSemana !== 'todas') {
    filtradas = filtradas.filter((v) => {
      const info = obtenerInfoSemana(v.fecha);
      return info && info.claveSemana === claveSemana;
    });
  }

  const libro = XLSX.utils.book_new();
  const sufijoSemana = claveSemana && claveSemana !== 'todas' ? ` ${claveSemana}` : '';
  const nombreHojaStats = `Estadísticas${sufijoSemana}`;

  if (tipo === 'cabanas') {
    const cabanas = filtradas.filter((v) => Boolean(v.cabana_id));
    const hojaStats = generarHojaEstadisticas(cabanas, claveSemana, semanaActual, 'cabanas');
    XLSX.utils.book_append_sheet(libro, hojaStats, nombreHojaStats);

    const hojaCab = generarHojaCabanas(cabanas, claveSemana);
    XLSX.utils.book_append_sheet(libro, hojaCab, 'Ventas Cabañas');
  } else if (tipo === 'interacciones' || tipo === 'actividades') {
    const actividades = filtradas.filter((v) => !v.cabana_id);
    const hojaStats = generarHojaEstadisticas(actividades, claveSemana, semanaActual, 'actividades');
    XLSX.utils.book_append_sheet(libro, hojaStats, nombreHojaStats);

    const hojaAct = generarHojaActividades(actividades, claveSemana);
    XLSX.utils.book_append_sheet(libro, hojaAct, 'Ventas Actividades');
  } else {
    // Estructura oficial solicitada:
    // Hoja 1: Estadísticas de la semana (o del período)
    // Hoja 2: Todas las ventas de cabañas
    // Hoja 3: Todas las ventas de actividades
    const cabanas = filtradas.filter((v) => Boolean(v.cabana_id));
    const actividades = filtradas.filter((v) => !v.cabana_id);

    const hojaStats = generarHojaEstadisticas(filtradas, claveSemana, semanaActual, 'todos');
    XLSX.utils.book_append_sheet(libro, hojaStats, nombreHojaStats);

    const hojaCab = generarHojaCabanas(cabanas, claveSemana);
    XLSX.utils.book_append_sheet(libro, hojaCab, 'Ventas Cabañas');

    const hojaAct = generarHojaActividades(actividades, claveSemana);
    XLSX.utils.book_append_sheet(libro, hojaAct, 'Ventas Actividades');
  }

  const fechaHoy = new Date().toISOString().split('T')[0];
  const archivoNombre = claveSemana && claveSemana !== 'todas'
    ? `karinga-reporte-${claveSemana}-${fechaHoy}.xlsx`
    : `karinga-reporte-${tipo}-${fechaHoy}.xlsx`;

  XLSX.writeFile(libro, archivoNombre);
}
