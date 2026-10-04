import * as XLSX from 'xlsx';

function obtenerInfoSemana(fechaInput) {
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

function formatearEstado(estado) {
  if (estado === 'pendiente_liquidacion') return 'Pendiente Liquidar';
  return 'Liquidado Completo';
}

function obtenerNombreConcepto(v) {
  if (v.cabana_id || v.tipo_venta === 'cabana') {
    return v.cabana_nombre ? `Cabaña ${v.cabana_nombre}` : (v.concepto || 'Hospedaje');
  }

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

  if (partes.length > 0) return partes.join(', ');
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
    const regex = /Se retuvo \$([0-9.,]+) MXN del depósito por:\s*"([^"]+)"/gi;
    let m;
    while ((m = regex.exec(v.notas)) !== null) {
      const cant = parseFloat(m[1]) || 0;
      monto += cant;
      conceptos.push(`${m[2].trim()} ($${cant})`);
    }
  }
  return { monto, concepto: conceptos.join(', ') || null };
}

function mapearFila(v) {
  const esCabana = Boolean(v.cabana_id);
  const anticipo = Number(v.anticipo) || 0;
  const saldoPendiente = Number(v.saldo_pendiente) || 0;
  const descuento = Number(v.descuento_especial) || 0;
  const montoLiquidado = Number(v.monto_liquidado) || 0;
  const infoSem = obtenerInfoSemana(v.fecha);

  const datosSemana = infoSem ? {
    'Semana': infoSem.etiquetaSemana,
    'Inicio Semana (Lunes)': infoSem.inicioMX,
    'Fin Semana (Domingo)': infoSem.finMX
  } : {
    'Semana': '-',
    'Inicio Semana (Lunes)': '-',
    'Fin Semana (Domingo)': '-'
  };

  if (esCabana) {
    const horasExtra = Number(v.horas_extra) || 0;
    const costoHorasExtra = Number(v.costo_horas_extra) || (horasExtra * 250);
    const personasExtra = Number(v.personas_extra) || 0;
    const costoPersonasExtra = Number(v.costo_personas_extra) || (personasExtra * 250);
    const costoNochesCabana = Number(v.costo_cabana) || 0;
    const dano = obtenerDanoDeposito(v);
    const totalCobrosExtra = costoHorasExtra + costoPersonasExtra + dano.monto;

    // TOTAL DE LA CABAÑA: noches + personas extra + horas extra
    const totalCabanaEstancia = costoNochesCabana + costoPersonasExtra + costoHorasExtra;

    // GRAN TOTAL GENERAL (Hospedaje + Horas Extra + Actividades + Daños - Descuento)
    const granTotalGeneral = Math.max(
      totalCabanaEstancia - descuento + dano.monto,
      Number(v.total) || 0,
      (Number(v.subtotal) || 0) - descuento,
      anticipo + montoLiquidado + saldoPendiente + dano.monto
    );

    return {
      'Fecha': formatearFecha(v.fecha),
      'Hora': v.hora || '',
      ...datosSemana,
      'Tipo de Venta': 'Hospedaje & Cabaña',
      'Cliente / Huésped': v.nombre_reservacion || '-',
      'Concepto / Cabaña': v.cabana_nombre ? `Cabaña ${v.cabana_nombre}` : (v.concepto || 'Hospedaje'),
      'Cabaña': v.cabana_nombre || '-',
      'Temporada': formatearTemporada(v.temporada),
      'Noches': Number(v.noches) || 1,
      'Check-in (Entrada)': v.fecha_checkin ? `${formatearFecha(v.fecha_checkin)} 15:00` : '-',
      'Check-out (Salida)': v.fecha_checkout ? `${formatearFecha(v.fecha_checkout)} ${v.hora_checkout || '12:00'}` : '-',
      'Costo Noches Hospedaje': costoNochesCabana,
      'Horas Extra': horasExtra > 0 ? `+${horasExtra}h` : '-',
      'Costo Horas Extra': costoHorasExtra > 0 ? costoHorasExtra : '-',
      'Personas Extra': personasExtra > 0 ? `+${personasExtra}` : '-',
      'Costo Personas Extra': costoPersonasExtra > 0 ? costoPersonasExtra : '-',
      'Daños Retenidos (Depósito)': dano.monto > 0 ? dano.concepto : '-',
      'Monto Daños Retenidos': dano.monto > 0 ? dano.monto : '-',
      'Total Cobros Extra': totalCobrosExtra > 0 ? totalCobrosExtra : '-',
      'Total Cabaña (Con Horas Extra)': totalCabanaEstancia,
      'Descuento': descuento > 0 ? descuento : '-',
      'Total General': granTotalGeneral,
      'Estado de Pago': formatearEstado(v.estado_pago),
      'Anticipo (Pago 1)': anticipo > 0 ? anticipo : '-',
      'Método Anticipo': v.metodo_pago_anticipo || (anticipo > 0 ? v.metodo_pago : '-'),
      'Comprobante Anticipo': v.comprobante_anticipo || '-',
      'Saldo Pendiente': saldoPendiente > 0 ? saldoPendiente : '-',
      'Liquidación (Pago 2)': montoLiquidado > 0 ? montoLiquidado : (saldoPendiente === 0 && anticipo === 0 ? granTotalGeneral : '-'),
      'Método Liquidación': v.metodo_pago_liquidacion || (v.estado_pago === 'liquidado' ? v.metodo_pago : '-')
    };
  }

  // Venta de Solo Actividades
  const granTotalActividades = Math.max(
    Number(v.costo_actividades) || Number(v.subtotal) || Number(v.total) || 0,
    anticipo + montoLiquidado + saldoPendiente
  );

  return {
    'Fecha': formatearFecha(v.fecha),
    'Hora': v.hora || '',
    ...datosSemana,
    'Tipo de Venta': 'Solo Actividades',
    'Cliente / Huésped': v.nombre_reservacion || 'Público General',
    'Concepto / Cabaña': obtenerNombreConcepto(v),
    'Cabaña': '-',
    'Temporada': '-',
    'Noches': '-',
    'Check-in (Entrada)': '-',
    'Check-out (Salida)': '-',
    'Costo Noches Hospedaje': '-',
    'Horas Extra': '-',
    'Costo Horas Extra': '-',
    'Personas Extra': '-',
    'Costo Personas Extra': '-',
    'Daños Retenidos (Depósito)': '-',
    'Monto Daños Retenidos': '-',
    'Total Cobros Extra': '-',
    'Total Cabaña (Con Horas Extra)': '-',
    'Descuento': descuento > 0 ? descuento : '-',
    'Total General': granTotalActividades,
    'Estado de Pago': formatearEstado(v.estado_pago),
    'Anticipo (Pago 1)': anticipo > 0 ? anticipo : '-',
    'Método Anticipo': v.metodo_pago_anticipo || (anticipo > 0 ? v.metodo_pago : '-'),
    'Comprobante Anticipo': v.comprobante_anticipo || '-',
    'Saldo Pendiente': saldoPendiente > 0 ? saldoPendiente : '-',
    'Liquidación (Pago 2)': montoLiquidado > 0 ? montoLiquidado : (saldoPendiente === 0 && anticipo === 0 ? granTotalActividades : '-'),
    'Método Liquidación': v.metodo_pago_liquidacion || (v.estado_pago === 'liquidado' ? v.metodo_pago : '-')
  };
}


function generarResumenSemanas(ventas) {
  const mapaSemanas = {};

  ventas.forEach((v) => {
    const info = obtenerInfoSemana(v.fecha);
    if (!info) return;

    if (!mapaSemanas[info.claveSemana]) {
      mapaSemanas[info.claveSemana] = {
        'Semana': info.etiquetaSemana,
        'Fecha Inicio (Lunes)': info.inicioMX,
        'Fecha Término (Domingo)': info.finMX,
        'Total Movimientos': 0,
        'Cabañas': 0,
        'Actividades': 0,
        'Anticipos ($ MXN)': 0,
        'Liquidaciones ($ MXN)': 0,
        'Daños Retenidos ($ MXN)': 0,
        'Total Recaudado ($ MXN)': 0
      };
    }

    const item = mapaSemanas[info.claveSemana];
    item['Total Movimientos'] += 1;
    if (v.cabana_id) item['Cabañas'] += 1;
    else item['Actividades'] += 1;

    const ant = Number(v.anticipo) || 0;
    const montoLiq = Number(v.monto_liquidado) || (ant === 0 ? Number(v.total) : 0);
    const dano = obtenerDanoDeposito(v);
    item['Anticipos ($ MXN)'] += ant;
    item['Liquidaciones ($ MXN)'] += montoLiq;
    item['Daños Retenidos ($ MXN)'] += dano.monto;
    item['Total Recaudado ($ MXN)'] += (Number(v.total) || (ant + montoLiq + dano.monto));
  });

  return Object.values(mapaSemanas);
}

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

    // Daño retenido del depósito en garantía (siempre ingresa en Efectivo)
    const dano = obtenerDanoDeposito(v);
    if (dano.monto > 0) {
      const metDano = 'Efectivo';
      if (!conteo[metDano]) conteo[metDano] = { metodo: metDano, totalRecaudado: 0, transacciones: 0 };
      conteo[metDano].totalRecaudado += dano.monto;
      conteo[metDano].transacciones += 1;
      totalGeneral += dano.monto;
    }
  });

  return Object.values(conteo).map((item) => ({
    'Método de Pago': item.metodo,
    'Número de Transacciones': item.transacciones,
    'Total Recaudado ($ MXN)': item.totalRecaudado,
    '% Participación': totalGeneral > 0 ? `${((item.totalRecaudado / totalGeneral) * 100).toFixed(1)}%` : '0.0%'
  }));
}

export function exportarExcelCliente(ventas, tipo = 'todos', claveSemana = 'todas') {
  let filtradas = ventas;

  // Filtro por tipo
  if (tipo === 'cabanas') {
    filtradas = filtradas.filter((v) => Boolean(v.cabana_id));
  } else if (tipo === 'interacciones') {
    filtradas = filtradas.filter((v) => !v.cabana_id);
  }

  // Filtro por semana
  if (claveSemana && claveSemana !== 'todas') {
    filtradas = filtradas.filter((v) => {
      const info = obtenerInfoSemana(v.fecha);
      return info && info.claveSemana === claveSemana;
    });
  }

  const datosFilas = filtradas.map(mapearFila);
  const hojaPrincipal = XLSX.utils.json_to_sheet(datosFilas);

  const colWidths = [
    { wch: 12 }, { wch: 8 }, { wch: 14 }, { wch: 16 }, { wch: 16 },
    { wch: 18 }, { wch: 24 }, { wch: 20 }, { wch: 14 }, { wch: 8 },
    { wch: 18 }, { wch: 18 }, { wch: 18 }, { wch: 16 }, { wch: 16 },
    { wch: 26 }, { wch: 12 }, { wch: 16 }, { wch: 18 }, { wch: 16 },
    { wch: 18 }, { wch: 22 }, { wch: 16 }, { wch: 18 }, { wch: 18 }
  ];
  hojaPrincipal['!cols'] = colWidths;

  const libro = XLSX.utils.book_new();
  const nombreHoja = tipo === 'cabanas' ? 'Cabañas' : (tipo === 'interacciones' ? 'Actividades' : 'Todas las Ventas');
  XLSX.utils.book_append_sheet(libro, hojaPrincipal, nombreHoja);

  // Hoja de Resumen por Semanas
  const datosResumenSemanas = generarResumenSemanas(filtradas);
  const hojaSemanas = XLSX.utils.json_to_sheet(datosResumenSemanas);
  hojaSemanas['!cols'] = [
    { wch: 14 }, { wch: 20 }, { wch: 22 }, { wch: 16 },
    { wch: 12 }, { wch: 14 }, { wch: 18 }, { wch: 20 }, { wch: 22 }, { wch: 22 }
  ];
  XLSX.utils.book_append_sheet(libro, hojaSemanas, 'Resumen por Semanas');

  // Hoja de Métodos de Pago
  const datosResumenMetodos = generarResumenMetodosPago(filtradas);
  const hojaMetodos = XLSX.utils.json_to_sheet(datosResumenMetodos);
  hojaMetodos['!cols'] = [{ wch: 25 }, { wch: 22 }, { wch: 24 }, { wch: 16 }];
  XLSX.utils.book_append_sheet(libro, hojaMetodos, 'Resumen Métodos de Pago');

  const sufijoSemana = claveSemana && claveSemana !== 'todas' ? `-${claveSemana}` : '';
  const fechaHoy = new Date().toISOString().split('T')[0];
  XLSX.writeFile(libro, `karinga-reporte-${tipo}${sufijoSemana}-${fechaHoy}.xlsx`);
}
