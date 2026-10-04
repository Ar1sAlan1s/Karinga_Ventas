import XLSX from 'xlsx-js-style';

// ============================================================================
// PALETA DE COLORES CORPORATIVA RANCHO KARINGA
// ============================================================================
const COLOR_VERDE_PRIMARIO   = '1B4D3E'; // Forest green institucional #1B4D3E
const COLOR_VERDE_FINANZAS   = '15803D'; // Verde esmeralda #15803D (totales/ingresos)
const COLOR_VERDE_SAGE       = '2A6F54'; // Verde secundario #2A6F54 (extras/operación)
const COLOR_AZUL_PAGOS       = '1E3A8A'; // Azul marino #1E3A8A (liquidaciones/bancos)
const COLOR_AMBAR_SALDOS     = '92400E'; // Ámbar oscuro #92400E (pendientes)
const COLOR_ROJO_ALERTA      = '991B1B'; // Rojo #991B1B (descuentos/daños)

// Fondos suaves
const COLOR_BG_HEADER_INFO   = 'F1F5F9'; // Slate claro #F1F5F9
const COLOR_BG_CARD_TOTAL    = 'ECFDF5'; // Menta claro #ECFDF5
const COLOR_BG_CARD_ANTICIPO = 'EFF6FF'; // Azul claro #EFF6FF
const COLOR_BG_CARD_LIQUID   = 'F0FDF4'; // Esmeralda suave #F0FDF4
const COLOR_BG_CARD_SALDO    = 'FFFBEB'; // Ámbar suave #FFFBEB
const COLOR_BG_CARD_INFO     = 'F8FAFC'; // Gris claro #F8FAFC
const COLOR_BG_ZEBRA         = 'F8FAFC'; // Alternado suave

// Bordes y textos
const COLOR_BORDE_TABLA      = 'CBD5E1'; // Gris borde #CBD5E1
const COLOR_BORDE_SUAVE      = 'E2E8F0'; // Borde sutil #E2E8F0
const COLOR_TEXTO_TITULO     = '0F172A'; // Texto principal #0F172A
const COLOR_TEXTO_MUTED      = '64748B'; // Texto secundario #64748B
const COLOR_BLANCO           = 'FFFFFF'; // Blanco

const bordeFino = {
  top: { style: 'thin', color: { rgb: COLOR_BORDE_SUAVE } },
  bottom: { style: 'thin', color: { rgb: COLOR_BORDE_SUAVE } },
  left: { style: 'thin', color: { rgb: COLOR_BORDE_SUAVE } },
  right: { style: 'thin', color: { rgb: COLOR_BORDE_SUAVE } }
};

const bordeTotal = {
  top: { style: 'thin', color: { rgb: COLOR_VERDE_PRIMARIO } },
  bottom: { style: 'double', color: { rgb: COLOR_VERDE_PRIMARIO } },
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
// CONSTRUCTORES DE CELDAS ESTILIZADAS
// ============================================================================
function celdaTexto(valor, align = 'left', bold = false, fondo = null, colorTexto = COLOR_TEXTO_TITULO, borde = bordeFino) {
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
      font: { name: 'Calibri', sz: 10, bold, color: { rgb: COLOR_TEXTO_TITULO } },
      alignment: { horizontal: 'center', vertical: 'center' },
      fill: fondo ? { fgColor: { rgb: fondo } } : undefined,
      border: borde
    }
  };
}

function celdaMoneda(valor, bold = false, fondo = null, colorTexto = COLOR_TEXTO_TITULO, estiloBorde = bordeFino, sz = 10) {
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

function celdaPorcentaje(valorDecimal, bold = false, fondo = null, estiloBorde = bordeFino, colorTexto = COLOR_TEXTO_TITULO) {
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

function celdaHeader(titulo, fondo = COLOR_VERDE_PRIMARIO, align = 'center') {
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
        left: { style: 'thin', color: { rgb: '3D6B5A' } },
        right: { style: 'thin', color: { rgb: '3D6B5A' } }
      }
    }
  };
}

function celdaEstado(estado) {
  const esLiquidado = estado === 'liquidado';
  const texto = esLiquidado ? 'Liquidado Completo' : 'Pendiente Liquidar';
  const bg = esLiquidado ? 'DCFCE7' : 'FEF3C7';
  const txtColor = esLiquidado ? '15803D' : 'B45309';

  return {
    v: texto,
    t: 's',
    s: {
      fill: { fgColor: { rgb: bg } },
      font: { name: 'Calibri', sz: 9.5, bold: true, color: { rgb: txtColor } },
      alignment: { horizontal: 'center', vertical: 'center' },
      border: bordeFino
    }
  };
}

function crearFilaBanner(titulo, totalColumnas) {
  const fila = [];
  fila.push({
    v: titulo,
    t: 's',
    s: {
      fill: { fgColor: { rgb: COLOR_VERDE_PRIMARIO } },
      font: { name: 'Calibri', sz: 14, bold: true, color: { rgb: COLOR_BLANCO } },
      alignment: { horizontal: 'center', vertical: 'center' }
    }
  });
  for (let c = 1; c < totalColumnas; c++) {
    fila.push({
      v: '',
      t: 's',
      s: {
        fill: { fgColor: { rgb: COLOR_VERDE_PRIMARIO } }
      }
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
      fill: { fgColor: { rgb: COLOR_BG_HEADER_INFO } },
      font: { name: 'Calibri', sz: 9.5, italic: true, color: { rgb: COLOR_TEXTO_MUTED } },
      alignment: { horizontal: 'center', vertical: 'center' }
    }
  });
  for (let c = 1; c < totalColumnas; c++) {
    fila.push({
      v: '',
      t: 's',
      s: {
        fill: { fgColor: { rgb: COLOR_BG_HEADER_INFO } }
      }
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
// HOJA 1: DETALLE DE VENTAS Y HOSPEDAJE
// ============================================================================
function generarHojaDetalle(filtradas, tipo, claveSemana) {
  const TOTAL_COLS = 28;
  const hoyStr = new Date().toLocaleString('es-MX', { dateStyle: 'medium', timeStyle: 'short' });
  const tipoEtiqueta = tipo === 'cabanas' ? 'CABAÑAS Y HOSPEDAJE' : (tipo === 'interacciones' ? 'ACTIVIDADES RECREATIVAS' : 'TODAS LAS VENTAS');
  const periodoEtiqueta = claveSemana && claveSemana !== 'todas' ? `Período: ${claveSemana}` : 'Semanas Concluidas y Semana Actual';

  const rows = [];
  const merges = [];

  // Fila 0: Banner Principal
  rows.push(crearFilaBanner(`RANCHO KARINGA • REPORTE OPERATIVO DE ${tipoEtiqueta}`, TOTAL_COLS));
  merges.push({ s: { r: 0, c: 0 }, e: { r: 0, c: TOTAL_COLS - 1 } });

  // Fila 1: Subtítulo con metadata
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
  let countCabanas = 0;
  let countActividades = 0;

  filtradas.forEach((v) => {
    const esCabana = Boolean(v.cabana_id);
    if (esCabana) countCabanas += 1;
    else countActividades += 1;

    const anticipo = Number(v.anticipo) || 0;
    const saldoPendiente = Number(v.saldo_pendiente) || 0;
    const descuento = Number(v.descuento_especial) || 0;
    const montoLiquidado = Number(v.monto_liquidado) || 0;

    let granTotal = 0;
    if (esCabana) {
      const hExtra = Number(v.horas_extra) || 0;
      const cHExtra = Number(v.costo_horas_extra) || (hExtra * 250);
      const pExtra = Number(v.personas_extra) || 0;
      const cPExtra = Number(v.costo_personas_extra) || (pExtra * 250);
      const cNoches = Number(v.costo_cabana) || 0;
      const dano = obtenerDanoDeposito(v);
      const totCabana = cNoches + cPExtra + cHExtra;
      granTotal = Math.max(totCabana - descuento + dano.monto, Number(v.total) || 0, anticipo + montoLiquidado + saldoPendiente + dano.monto);

      totalNochesSum += (Number(v.noches) || 1);
      totalHorasExtraSum += cHExtra;
      totalPersonasExtraSum += cPExtra;
      totalDanosSum += dano.monto;
    } else {
      granTotal = Math.max(Number(v.costo_actividades) || Number(v.subtotal) || Number(v.total) || 0, anticipo + montoLiquidado + saldoPendiente);
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

  // Filas 3 y 4: KPI Cards
  const filaKpiLabel = [];
  const filaKpiVal = [];

  const agregarKpiCard = (titulo, valor, bg, borderCol, txtColor, colsSpan, esMoneda = true) => {
    const cInicio = filaKpiLabel.length;
    const cFin = cInicio + colsSpan - 1;

    for (let c = 0; c < colsSpan; c++) {
      filaKpiLabel.push({
        v: c === 0 ? titulo : '',
        t: 's',
        s: {
          fill: { fgColor: { rgb: bg } },
          font: { name: 'Calibri', sz: 8.5, bold: true, color: { rgb: txtColor } },
          alignment: { horizontal: 'center', vertical: 'center' },
          border: {
            top: { style: 'thin', color: { rgb: borderCol } },
            left: c === 0 ? { style: 'thin', color: { rgb: borderCol } } : undefined,
            right: c === colsSpan - 1 ? { style: 'thin', color: { rgb: borderCol } } : undefined
          }
        }
      });

      filaKpiVal.push({
        v: c === 0 ? valor : '',
        t: esMoneda ? 'n' : 's',
        z: esMoneda ? '"$"#,##0.00' : undefined,
        s: {
          numFmt: esMoneda ? '"$"#,##0.00' : undefined,
          fill: { fgColor: { rgb: bg } },
          font: { name: 'Calibri', sz: 13, bold: true, color: { rgb: txtColor } },
          alignment: { horizontal: 'center', vertical: 'center' },
          border: {
            bottom: { style: 'thin', color: { rgb: borderCol } },
            left: c === 0 ? { style: 'thin', color: { rgb: borderCol } } : undefined,
            right: c === colsSpan - 1 ? { style: 'thin', color: { rgb: borderCol } } : undefined
          }
        }
      });
    }

    merges.push({ s: { r: 3, c: cInicio }, e: { r: 3, c: cFin } });
    merges.push({ s: { r: 4, c: cInicio }, e: { r: 4, c: cFin } });
  };

  agregarKpiCard('TOTAL RECAUDADO / FACTURADO', totalGeneralSum, COLOR_BG_CARD_TOTAL, 'A7F3D0', COLOR_VERDE_FINANZAS, 5, true);
  agregarKpiCard('ANTICIPOS RECIBIDOS (PAGO 1)', totalAnticiposSum, COLOR_BG_CARD_ANTICIPO, 'BFDBFE', COLOR_AZUL_PAGOS, 5, true);
  agregarKpiCard('LIQUIDACIONES EN RECEPCIÓN (PAGO 2)', totalLiquidadoSum, COLOR_BG_CARD_LIQUID, 'BBF7D0', COLOR_VERDE_FINANZAS, 5, true);
  agregarKpiCard('SALDO PENDIENTE POR COBRAR', totalSaldoPendienteSum, COLOR_BG_CARD_SALDO, 'FDE68A', COLOR_AMBAR_SALDOS, 5, true);
  agregarKpiCard('TOTAL OPERACIONES', `${filtradas.length} Ventas (${countCabanas} Cabañas • ${countActividades} Act.)`, COLOR_BG_CARD_INFO, COLOR_BORDE_TABLA, COLOR_TEXTO_TITULO, 8, false);

  rows.push(filaKpiLabel);
  rows.push(filaKpiVal);

  // Fila 5: Separador
  rows.push(crearFilaVacia(TOTAL_COLS));

  // Fila 6: Encabezados de Tabla (Descuento en %, Observaciones limpias)
  const filaEncabezados = [
    celdaHeader('#', COLOR_VERDE_PRIMARIO),
    celdaHeader('Fecha', COLOR_VERDE_PRIMARIO),
    celdaHeader('Hora', COLOR_VERDE_PRIMARIO),
    celdaHeader('Semana', COLOR_VERDE_PRIMARIO),
    celdaHeader('Tipo de Venta', COLOR_VERDE_PRIMARIO),
    celdaHeader('Cliente / Huésped', COLOR_VERDE_PRIMARIO, 'left'),
    celdaHeader('Concepto / Cabaña', COLOR_VERDE_PRIMARIO, 'left'),
    celdaHeader('Temporada', COLOR_VERDE_PRIMARIO),
    celdaHeader('Noches', COLOR_VERDE_PRIMARIO),
    celdaHeader('Check-in (Entrada)', COLOR_VERDE_PRIMARIO),
    celdaHeader('Check-out (Salida)', COLOR_VERDE_PRIMARIO),
    celdaHeader('Costo Hospedaje', COLOR_VERDE_SAGE, 'right'),
    celdaHeader('Horas Extra', COLOR_VERDE_SAGE),
    celdaHeader('Costo H. Extra', COLOR_VERDE_SAGE, 'right'),
    celdaHeader('Personas Extra', COLOR_VERDE_SAGE),
    celdaHeader('Costo P. Extra', COLOR_VERDE_SAGE, 'right'),
    celdaHeader('Daños Retenidos', COLOR_VERDE_SAGE, 'right'),
    celdaHeader('Descuento (%)', COLOR_ROJO_ALERTA, 'right'),
    celdaHeader('TOTAL GENERAL', COLOR_VERDE_FINANZAS, 'right'),
    celdaHeader('Estado de Pago', COLOR_AZUL_PAGOS),
    celdaHeader('Anticipo (P1)', COLOR_AZUL_PAGOS, 'right'),
    celdaHeader('Método Anticipo', COLOR_AZUL_PAGOS),
    celdaHeader('Folio Anticipo', COLOR_AZUL_PAGOS, 'left'),
    celdaHeader('Saldo Pendiente', COLOR_AMBAR_SALDOS, 'right'),
    celdaHeader('Liquidación (P2)', COLOR_AZUL_PAGOS, 'right'),
    celdaHeader('Método Liquidación', COLOR_AZUL_PAGOS),
    celdaHeader('Folio Liquidación', COLOR_AZUL_PAGOS, 'left'),
    celdaHeader('Observaciones', COLOR_VERDE_PRIMARIO, 'left')
  ];
  rows.push(filaEncabezados);

  // Filas 7+: Registros de Ventas
  filtradas.forEach((v, idx) => {
    const esCabana = Boolean(v.cabana_id);
    const anticipo = Number(v.anticipo) || 0;
    const saldoPendiente = Number(v.saldo_pendiente) || 0;
    const descuento = Number(v.descuento_especial) || 0;
    const montoLiquidado = Number(v.monto_liquidado) || 0;
    const infoSem = obtenerInfoSemana(v.fecha);
    const fondoZebra = idx % 2 === 1 ? COLOR_BG_ZEBRA : null;

    let cNoches = 0;
    let hExtra = 0;
    let cHExtra = 0;
    let pExtra = 0;
    let cPExtra = 0;
    let montoDano = 0;
    let granTotal = 0;

    if (esCabana) {
      hExtra = Number(v.horas_extra) || 0;
      cHExtra = Number(v.costo_horas_extra) || (hExtra * 250);
      pExtra = Number(v.personas_extra) || 0;
      cPExtra = Number(v.costo_personas_extra) || (pExtra * 250);
      cNoches = Number(v.costo_cabana) || 0;
      const danoObj = obtenerDanoDeposito(v);
      montoDano = danoObj.monto;
      const totCabana = cNoches + cPExtra + cHExtra;
      granTotal = Math.max(totCabana - descuento + montoDano, Number(v.total) || 0, anticipo + montoLiquidado + saldoPendiente + montoDano);
    } else {
      granTotal = Math.max(Number(v.costo_actividades) || Number(v.subtotal) || Number(v.total) || 0, anticipo + montoLiquidado + saldoPendiente);
    }

    const saldoEfectivo = v.estado_pago === 'liquidado' ? 0 : (saldoPendiente > 0 ? saldoPendiente : Math.max(0, granTotal - anticipo));
    const liqEfectiva = v.estado_pago === 'liquidado'
      ? (montoLiquidado > 0 ? montoLiquidado : (anticipo > 0 ? Math.max(0, granTotal - anticipo) : granTotal))
      : montoLiquidado;

    // Cálculo de Descuento en Porcentaje (%)
    let porcentajeDescuento = 0;
    if (v.tipo_descuento === 'porcentaje' && Number(v.valor_descuento) > 0) {
      porcentajeDescuento = Number(v.valor_descuento) / 100;
    } else if (descuento > 0) {
      const subtotalBase = granTotal + descuento;
      porcentajeDescuento = subtotalBase > 0 ? (descuento / subtotalBase) : 0;
    }

    const fechaCheckinStr = v.fecha_checkin ? `${formatearFecha(v.fecha_checkin)} 15:00` : (esCabana ? `${formatearFecha(v.fecha)} 15:00` : '-');
    const fechaCheckoutStr = v.fecha_checkout ? `${formatearFecha(v.fecha_checkout)} ${v.hora_checkout || '12:00'}` : '-';

    const filaData = [
      celdaNumero(idx + 1, false, fondoZebra),
      celdaTexto(formatearFecha(v.fecha), 'center', false, fondoZebra),
      celdaTexto(v.hora || '', 'center', false, fondoZebra),
      celdaTexto(infoSem ? infoSem.etiquetaSemana : '-', 'center', false, fondoZebra),
      celdaTexto(esCabana ? 'Hospedaje & Cabaña' : 'Solo Actividades', 'center', false, fondoZebra),
      celdaTexto(v.nombre_reservacion || (esCabana ? '-' : 'Público General'), 'left', true, fondoZebra),
      celdaTexto(obtenerNombreConcepto(v), 'left', false, fondoZebra),
      celdaTexto(formatearTemporada(v.temporada), 'center', false, fondoZebra),
      celdaNumero(esCabana ? (Number(v.noches) || 1) : 0, false, fondoZebra),
      celdaTexto(fechaCheckinStr, 'center', false, fondoZebra),
      celdaTexto(fechaCheckoutStr, 'center', false, fondoZebra),
      celdaMoneda(cNoches, false, fondoZebra),
      celdaTexto(hExtra > 0 ? `+${hExtra}h` : '-', 'center', false, fondoZebra),
      celdaMoneda(cHExtra, false, fondoZebra),
      celdaTexto(pExtra > 0 ? `+${pExtra}` : '-', 'center', false, fondoZebra),
      celdaMoneda(cPExtra, false, fondoZebra),
      celdaMoneda(montoDano, false, fondoZebra),
      porcentajeDescuento > 0
        ? celdaPorcentaje(porcentajeDescuento, true, fondoZebra, bordeFino, COLOR_ROJO_ALERTA)
        : celdaTexto('-', 'center', false, fondoZebra),
      celdaMoneda(granTotal, true, COLOR_BG_CARD_TOTAL, COLOR_VERDE_FINANZAS),
      celdaEstado(v.estado_pago),
      celdaMoneda(anticipo, anticipo > 0, fondoZebra, anticipo > 0 ? COLOR_AZUL_PAGOS : COLOR_TEXTO_TITULO),
      celdaTexto(v.metodo_pago_anticipo || (anticipo > 0 ? v.metodo_pago : '-'), 'center', false, fondoZebra),
      celdaTexto(v.comprobante_anticipo || '-', 'left', false, fondoZebra),
      celdaMoneda(saldoEfectivo, saldoEfectivo > 0, fondoZebra, saldoEfectivo > 0 ? COLOR_AMBAR_SALDOS : COLOR_TEXTO_TITULO),
      celdaMoneda(liqEfectiva, liqEfectiva > 0, fondoZebra, liqEfectiva > 0 ? COLOR_VERDE_FINANZAS : COLOR_TEXTO_TITULO),
      celdaTexto(v.metodo_pago_liquidacion || (v.estado_pago === 'liquidado' ? v.metodo_pago : '-'), 'center', false, fondoZebra),
      celdaTexto(v.comprobante_pago || '-', 'left', false, fondoZebra),
      celdaTexto('', 'left', false, fondoZebra) // Observaciones siempre vacías por requerimiento
    ];

    rows.push(filaData);
  });

  // Fila Final: Totales del Período
  const filaTotalIdx = rows.length;
  const filaTotales = [];

  for (let c = 0; c < 11; c++) {
    filaTotales.push({
      v: c === 0 ? 'TOTALES GENERALES DEL PERÍODO' : '',
      t: 's',
      s: {
        fill: { fgColor: { rgb: COLOR_VERDE_PRIMARIO } },
        font: { name: 'Calibri', sz: 10.5, bold: true, color: { rgb: COLOR_BLANCO } },
        alignment: { horizontal: 'center', vertical: 'center' },
        border: bordeTotal
      }
    });
  }
  merges.push({ s: { r: filaTotalIdx, c: 0 }, e: { r: filaTotalIdx, c: 10 } });

  const totalBaseConDescuento = totalGeneralSum + totalDescuentosSum;
  const porcentajeDescuentoGlobal = totalBaseConDescuento > 0 ? (totalDescuentosSum / totalBaseConDescuento) : 0;

  filaTotales.push(celdaMoneda(totalGeneralSum > 0 ? (totalGeneralSum - totalHorasExtraSum - totalPersonasExtraSum - totalDanosSum + totalDescuentosSum) : 0, true, COLOR_BG_CARD_TOTAL, COLOR_VERDE_FINANZAS, bordeTotal));
  filaTotales.push(celdaTexto('-', 'center', true, null, COLOR_TEXTO_MUTED, bordeTotal));
  filaTotales.push(celdaMoneda(totalHorasExtraSum, true, null, COLOR_TEXTO_TITULO, bordeTotal));
  filaTotales.push(celdaTexto('-', 'center', true, null, COLOR_TEXTO_MUTED, bordeTotal));
  filaTotales.push(celdaMoneda(totalPersonasExtraSum, true, null, COLOR_TEXTO_TITULO, bordeTotal));
  filaTotales.push(celdaMoneda(totalDanosSum, true, null, COLOR_TEXTO_TITULO, bordeTotal));
  filaTotales.push(porcentajeDescuentoGlobal > 0 ? celdaPorcentaje(porcentajeDescuentoGlobal, true, null, bordeTotal, COLOR_ROJO_ALERTA) : celdaTexto('-', 'center', true, null, COLOR_TEXTO_MUTED, bordeTotal));
  filaTotales.push(celdaMoneda(totalGeneralSum, true, COLOR_VERDE_FINANZAS, COLOR_BLANCO, bordeTotal, 11));
  filaTotales.push(celdaTexto('-', 'center', true, null, COLOR_TEXTO_MUTED, bordeTotal));
  filaTotales.push(celdaMoneda(totalAnticiposSum, true, COLOR_BG_CARD_ANTICIPO, COLOR_AZUL_PAGOS, bordeTotal, 10.5));
  filaTotales.push(celdaTexto('-', 'center', true, null, COLOR_TEXTO_MUTED, bordeTotal));
  filaTotales.push(celdaTexto('-', 'center', true, null, COLOR_TEXTO_MUTED, bordeTotal));
  filaTotales.push(celdaMoneda(totalSaldoPendienteSum, true, COLOR_BG_CARD_SALDO, COLOR_AMBAR_SALDOS, bordeTotal, 10.5));
  filaTotales.push(celdaMoneda(totalLiquidadoSum, true, COLOR_BG_CARD_LIQUID, COLOR_VERDE_FINANZAS, bordeTotal, 10.5));
  filaTotales.push(celdaTexto('-', 'center', true, null, COLOR_TEXTO_MUTED, bordeTotal));
  filaTotales.push(celdaTexto('-', 'center', true, null, COLOR_TEXTO_MUTED, bordeTotal));
  filaTotales.push(celdaTexto('', 'left', false, null, COLOR_TEXTO_MUTED, bordeTotal)); // Observaciones vacía

  rows.push(filaTotales);

  const ws = XLSX.utils.aoa_to_sheet(rows);
  ws['!merges'] = merges;

  ws['!cols'] = [
    { wch: 6 },  // #
    { wch: 13 }, // Fecha
    { wch: 9 },  // Hora
    { wch: 14 }, // Semana
    { wch: 20 }, // Tipo de Venta
    { wch: 28 }, // Cliente / Huésped
    { wch: 30 }, // Concepto / Cabaña
    { wch: 16 }, // Temporada
    { wch: 9 },  // Noches
    { wch: 19 }, // Check-in
    { wch: 19 }, // Check-out
    { wch: 17 }, // Costo Hospedaje
    { wch: 13 }, // Horas Extra
    { wch: 16 }, // Costo H. Extra
    { wch: 14 }, // Personas Extra
    { wch: 17 }, // Costo P. Extra
    { wch: 16 }, // Daños Retenidos
    { wch: 16 }, // Descuento (%)
    { wch: 20 }, // TOTAL GENERAL
    { wch: 20 }, // Estado de Pago
    { wch: 18 }, // Anticipo (P1)
    { wch: 22 }, // Método Anticipo
    { wch: 20 }, // Folio Anticipo
    { wch: 18 }, // Saldo Pendiente
    { wch: 19 }, // Liquidación (P2)
    { wch: 22 }, // Método Liquidación
    { wch: 20 }, // Folio Liquidación
    { wch: 36 }  // Observaciones
  ];

  const rowHeights = [
    { hpt: 36 }, // 0: Banner
    { hpt: 22 }, // 1: Subtítulo
    { hpt: 8 },  // 2: Separador
    { hpt: 18 }, // 3: KPI Label
    { hpt: 26 }, // 4: KPI Valor
    { hpt: 10 }, // 5: Separador
    { hpt: 28 }  // 6: Header tabla
  ];
  for (let i = 7; i < rows.length; i++) {
    rowHeights.push({ hpt: i === rows.length - 1 ? 26 : 21 });
  }
  ws['!rows'] = rowHeights;

  if (rows.length > 7) {
    ws['!autofilter'] = {
      ref: XLSX.utils.encode_range({ s: { r: 6, c: 0 }, e: { r: rows.length - 2, c: TOTAL_COLS - 1 } })
    };
  }

  ws['!views'] = [{ state: 'frozen', xSplit: 0, ySplit: 7 }];

  return ws;
}

// ============================================================================
// HOJA 2: RESUMEN POR SEMANAS (SOLO SEMANAS CONCLUIDAS O ACTUAL)
// ============================================================================
function generarResumenSemanas(ventas) {
  const mapaSemanas = {};
  const semanaActual = obtenerInfoSemana(new Date());

  ventas.forEach((v) => {
    const info = obtenerInfoSemana(v.fecha);
    if (!info) return;

    // Excluir semanas futuras: solo semanas finalizadas o semana actual
    if (semanaActual && info.claveSemana > semanaActual.claveSemana) return;

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

  return Object.values(mapaSemanas).sort((a, b) => b.claveSemana.localeCompare(a.claveSemana));
}

function generarHojaSemanas(ventas, claveSemana) {
  const TOTAL_COLS = 10;
  const hoyStr = new Date().toLocaleString('es-MX', { dateStyle: 'medium', timeStyle: 'short' });
  const rows = [];
  const merges = [];

  rows.push(crearFilaBanner('RANCHO KARINGA • CONSOLIDADO OPERATIVO POR SEMANAS', TOTAL_COLS));
  merges.push({ s: { r: 0, c: 0 }, e: { r: 0, c: TOTAL_COLS - 1 } });

  rows.push(crearFilaSubtitulo(`Semanas concluidas y semana actual (Lunes a Domingo)  |  Generado: ${hoyStr}  |  Moneda: MXN ($)`, TOTAL_COLS));
  merges.push({ s: { r: 1, c: 0 }, e: { r: 1, c: TOTAL_COLS - 1 } });

  rows.push(crearFilaVacia(TOTAL_COLS));

  rows.push([
    celdaHeader('Semana Operativa', COLOR_VERDE_PRIMARIO),
    celdaHeader('Fecha Inicio (Lunes)', COLOR_VERDE_PRIMARIO),
    celdaHeader('Fecha Fin (Domingo)', COLOR_VERDE_PRIMARIO),
    celdaHeader('Total Movimientos', COLOR_VERDE_SAGE),
    celdaHeader('Cabañas', COLOR_VERDE_SAGE),
    celdaHeader('Actividades', COLOR_VERDE_SAGE),
    celdaHeader('Anticipos ($ MXN)', COLOR_AZUL_PAGOS, 'right'),
    celdaHeader('Liquidaciones ($ MXN)', COLOR_AZUL_PAGOS, 'right'),
    celdaHeader('Daños Retenidos ($ MXN)', COLOR_AZUL_PAGOS, 'right'),
    celdaHeader('TOTAL RECAUDADO ($ MXN)', COLOR_VERDE_FINANZAS, 'right')
  ]);

  const datosSemanas = generarResumenSemanas(ventas);
  let sumMov = 0;
  let sumCab = 0;
  let sumAct = 0;
  let sumAnt = 0;
  let sumLiq = 0;
  let sumDan = 0;
  let sumTot = 0;

  datosSemanas.forEach((s, idx) => {
    const fondoZebra = idx % 2 === 1 ? COLOR_BG_ZEBRA : null;
    sumMov += s.totalMovimientos;
    sumCab += s.cabanas;
    sumAct += s.actividades;
    sumAnt += s.anticipos;
    sumLiq += s.liquidaciones;
    sumDan += s.danos;
    sumTot += s.totalRecaudado;

    rows.push([
      celdaTexto(s.semana, 'center', true, fondoZebra),
      celdaTexto(s.inicioMX, 'center', false, fondoZebra),
      celdaTexto(s.finMX, 'center', false, fondoZebra),
      celdaNumero(s.totalMovimientos, false, fondoZebra),
      celdaNumero(s.cabanas, false, fondoZebra),
      celdaNumero(s.actividades, false, fondoZebra),
      celdaMoneda(s.anticipos, false, fondoZebra, COLOR_AZUL_PAGOS),
      celdaMoneda(s.liquidaciones, false, fondoZebra, COLOR_VERDE_FINANZAS),
      celdaMoneda(s.danos, false, fondoZebra),
      celdaMoneda(s.totalRecaudado, true, COLOR_BG_CARD_TOTAL, COLOR_VERDE_FINANZAS)
    ]);
  });

  const filaTotalIdx = rows.length;
  const filaTot = [
    celdaTexto('TOTALES CONSOLIDADOS', 'center', true, COLOR_VERDE_PRIMARIO, COLOR_BLANCO, bordeTotal),
    celdaTexto('', 'center', true, COLOR_VERDE_PRIMARIO, COLOR_BLANCO, bordeTotal),
    celdaTexto('', 'center', true, COLOR_VERDE_PRIMARIO, COLOR_BLANCO, bordeTotal),
    celdaNumero(sumMov, true, null, bordeTotal),
    celdaNumero(sumCab, true, null, bordeTotal),
    celdaNumero(sumAct, true, null, bordeTotal),
    celdaMoneda(sumAnt, true, COLOR_BG_CARD_ANTICIPO, COLOR_AZUL_PAGOS, bordeTotal, 10.5),
    celdaMoneda(sumLiq, true, COLOR_BG_CARD_LIQUID, COLOR_VERDE_FINANZAS, bordeTotal, 10.5),
    celdaMoneda(sumDan, true, null, COLOR_TEXTO_TITULO, bordeTotal, 10.5),
    celdaMoneda(sumTot, true, COLOR_VERDE_FINANZAS, COLOR_BLANCO, bordeTotal, 11)
  ];
  merges.push({ s: { r: filaTotalIdx, c: 0 }, e: { r: filaTotalIdx, c: 2 } });
  rows.push(filaTot);

  const ws = XLSX.utils.aoa_to_sheet(rows);
  ws['!merges'] = merges;
  ws['!cols'] = [
    { wch: 18 }, { wch: 22 }, { wch: 22 }, { wch: 18 },
    { wch: 14 }, { wch: 14 }, { wch: 20 }, { wch: 22 }, { wch: 22 }, { wch: 26 }
  ];
  ws['!rows'] = [{ hpt: 36 }, { hpt: 22 }, { hpt: 10 }, { hpt: 26 }];
  for (let i = 4; i < rows.length; i++) {
    ws['!rows'].push({ hpt: i === rows.length - 1 ? 26 : 21 });
  }
  ws['!views'] = [{ state: 'frozen', xSplit: 0, ySplit: 4 }];

  return ws;
}

// ============================================================================
// HOJA 3: RESUMEN DE MÉTODOS Y CANALES DE PAGO
// ============================================================================
function generarResumenMetodosPago(ventas) {
  const metodosValidos = [
    'Efectivo',
    'Transferencia BBVA',
    'Transferencia Bajío',
    'Tarjeta Zettle',
    'Web',
    'Airbnb'
  ];

  const conteo = {};
  metodosValidos.forEach((m) => {
    conteo[m] = { metodo: m, totalRecaudado: 0, transacciones: 0 };
  });

  let totalGeneral = 0;

  ventas.forEach((v) => {
    const ant = Number(v.anticipo) || 0;
    const metAnt = v.metodo_pago_anticipo || v.metodo_pago;
    if (ant > 0 && metAnt) {
      if (!conteo[metAnt]) conteo[metAnt] = { metodo: metAnt, totalRecaudado: 0, transacciones: 0 };
      conteo[metAnt].totalRecaudado += ant;
      conteo[metAnt].transacciones += 1;
      totalGeneral += ant;
    }

    const montoLiq = Number(v.monto_liquidado) || (ant === 0 ? Number(v.total) : 0);
    const metLiq = v.metodo_pago_liquidacion || v.metodo_pago;
    if (montoLiq > 0 && metLiq) {
      if (!conteo[metLiq]) conteo[metLiq] = { metodo: metLiq, totalRecaudado: 0, transacciones: 0 };
      conteo[metLiq].totalRecaudado += montoLiq;
      conteo[metLiq].transacciones += 1;
      totalGeneral += montoLiq;
    }

    const dano = obtenerDanoDeposito(v);
    if (dano.monto > 0) {
      const metDano = 'Efectivo';
      if (!conteo[metDano]) conteo[metDano] = { metodo: metDano, totalRecaudado: 0, transacciones: 0 };
      conteo[metDano].totalRecaudado += dano.monto;
      conteo[metDano].transacciones += 1;
      totalGeneral += dano.monto;
    }
  });

  return {
    lista: Object.values(conteo),
    totalGeneral
  };
}

function generarHojaMetodos(ventas) {
  const TOTAL_COLS = 4;
  const hoyStr = new Date().toLocaleString('es-MX', { dateStyle: 'medium', timeStyle: 'short' });
  const rows = [];
  const merges = [];

  rows.push(crearFilaBanner('RANCHO KARINGA • ARQUEO Y CANALES DE PAGO', TOTAL_COLS));
  merges.push({ s: { r: 0, c: 0 }, e: { r: 0, c: TOTAL_COLS - 1 } });

  rows.push(crearFilaSubtitulo(`Desglose de ingresos por canal financiero de cobro  |  Generado: ${hoyStr}  |  Moneda: MXN ($)`, TOTAL_COLS));
  merges.push({ s: { r: 1, c: 0 }, e: { r: 1, c: TOTAL_COLS - 1 } });

  rows.push(crearFilaVacia(TOTAL_COLS));

  rows.push([
    celdaHeader('Canal / Método de Pago', COLOR_VERDE_PRIMARIO, 'left'),
    celdaHeader('Número de Transacciones', COLOR_VERDE_SAGE),
    celdaHeader('Total Recaudado ($ MXN)', COLOR_VERDE_FINANZAS, 'right'),
    celdaHeader('% de Participación', COLOR_AZUL_PAGOS, 'right')
  ]);

  const { lista, totalGeneral } = generarResumenMetodosPago(ventas);
  let sumTrans = 0;
  let sumTot = 0;

  lista.forEach((item, idx) => {
    const fondoZebra = idx % 2 === 1 ? COLOR_BG_ZEBRA : null;
    sumTrans += item.transacciones;
    sumTot += item.totalRecaudado;
    const participacion = totalGeneral > 0 ? (item.totalRecaudado / totalGeneral) : 0;

    rows.push([
      celdaTexto(item.metodo, 'left', true, fondoZebra),
      celdaNumero(item.transacciones, false, fondoZebra),
      celdaMoneda(item.totalRecaudado, true, fondoZebra, COLOR_VERDE_FINANZAS),
      celdaPorcentaje(participacion, false, fondoZebra)
    ]);
  });

  const filaTot = [
    celdaTexto('TOTAL ARQUEADO', 'left', true, COLOR_VERDE_PRIMARIO, COLOR_BLANCO, bordeTotal),
    celdaNumero(sumTrans, true, null, bordeTotal),
    celdaMoneda(sumTot, true, COLOR_VERDE_FINANZAS, COLOR_BLANCO, bordeTotal, 11),
    celdaPorcentaje(totalGeneral > 0 ? 1 : 0, true, COLOR_AZUL_PAGOS, COLOR_BLANCO)
  ];
  rows.push(filaTot);

  const ws = XLSX.utils.aoa_to_sheet(rows);
  ws['!merges'] = merges;
  ws['!cols'] = [
    { wch: 28 }, // Método
    { wch: 24 }, // Transacciones
    { wch: 28 }, // Total $
    { wch: 20 }  // %
  ];
  ws['!rows'] = [{ hpt: 36 }, { hpt: 22 }, { hpt: 10 }, { hpt: 26 }];
  for (let i = 4; i < rows.length; i++) {
    ws['!rows'].push({ hpt: i === rows.length - 1 ? 26 : 22 });
  }
  ws['!views'] = [{ state: 'frozen', xSplit: 0, ySplit: 4 }];

  return ws;
}

// ============================================================================
// FUNCIÓN PRINCIPAL DE EXPORTACIÓN (CLIENTE)
// ============================================================================
export function exportarExcelCliente(ventas, tipo = 'todos', claveSemana = 'todas') {
  let filtradas = ventas;

  // 1. Filtro por tipo
  if (tipo === 'cabanas') {
    filtradas = filtradas.filter((v) => Boolean(v.cabana_id));
  } else if (tipo === 'interacciones') {
    filtradas = filtradas.filter((v) => !v.cabana_id);
  }

  // 2. Solo exportar semanas ya finalizadas o la semana actual (excluir semanas futuras)
  const semanaActual = obtenerInfoSemana(new Date());
  if (semanaActual) {
    filtradas = filtradas.filter((v) => {
      const info = obtenerInfoSemana(v.fecha);
      return info && info.claveSemana <= semanaActual.claveSemana;
    });
  }

  // 3. Filtro por semana específica (si no es 'todas')
  if (claveSemana && claveSemana !== 'todas') {
    filtradas = filtradas.filter((v) => {
      const info = obtenerInfoSemana(v.fecha);
      return info && info.claveSemana === claveSemana;
    });
  }

  const libro = XLSX.utils.book_new();

  // Pestaña 1: Detalle Completo
  const nombreHojaPrincipal = tipo === 'cabanas' ? 'Cabañas y Hospedaje' : (tipo === 'interacciones' ? 'Actividades Recreativas' : 'Todas las Ventas');
  const hojaPrincipal = generarHojaDetalle(filtradas, tipo, claveSemana);
  XLSX.utils.book_append_sheet(libro, hojaPrincipal, nombreHojaPrincipal);

  // Pestaña 2: Resumen por Semanas (concluidas o actual)
  const hojaSemanas = generarHojaSemanas(filtradas, claveSemana);
  XLSX.utils.book_append_sheet(libro, hojaSemanas, 'Resumen por Semanas');

  // Pestaña 3: Métodos de Pago
  const hojaMetodos = generarHojaMetodos(filtradas);
  XLSX.utils.book_append_sheet(libro, hojaMetodos, 'Resumen Métodos de Pago');

  const sufijoSemana = claveSemana && claveSemana !== 'todas' ? `-${claveSemana}` : '';
  const fechaHoy = new Date().toISOString().split('T')[0];
  XLSX.writeFile(libro, `karinga-reporte-${tipo}${sufijoSemana}-${fechaHoy}.xlsx`);
}
