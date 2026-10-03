export const TARIFAS = {
  COSTO_PERSONA_EXTRA: 250.0,
  HORA_EXTRA: 250.0,
  VISITA_PERSONA: 95.0,
  CAMPING_NORMAL: 140.0,
  CAMPING_ALTA: 160.0,
  TIROLESA_BOLETO: 250.0,
  CABALGATA_30MIN: 150.0,
  CABALGATA_1HORA: 200.0,
  GOTCHA: 2900.0,
  INTERACCION_ANIMALES: 200.0,
  FRESA_KILO: 120.0,
  FRESA_MEDIO: 60.0,
  MIEL_LITRO: 200.0,
  HUEVO_CONO: 110.0,
  HUEVO_PIEZA: 4.0,
  PAQUETE_GRANJA: 220.0,
  PAQUETE_VIVE: 450.0,
  SENDERISMO_MIN_6: 70.0,
  SENDERISMO_HASTA_5: 100.0
};

export function calcularFechasEstancia(fechaCheckinStr, numNoches = 1, horasExtra = 0) {
  if (!fechaCheckinStr) return { fechaCheckin: null, fechaCheckout: null, horaCheckin: null, horaCheckout: null };

  const partes = String(fechaCheckinStr).split('T')[0].split('-');
  const anio = parseInt(partes[0], 10);
  const mes = parseInt(partes[1], 10) - 1;
  const dia = parseInt(partes[2], 10);

  const fechaOut = new Date(anio, mes, dia);
  fechaOut.setDate(fechaOut.getDate() + Math.max(1, Number(numNoches) || 1));

  const pad = (n) => String(n).padStart(2, '0');
  const fechaCheckoutStr = `${fechaOut.getFullYear()}-${pad(fechaOut.getMonth() + 1)}-${pad(fechaOut.getDate())}`;

  const horaCheckin = '15:00'; // Entrada fija a las 3:00 PM
  const horas = Math.max(0, parseInt(horasExtra, 10) || 0);
  const horaSalidaNum = 12 + horas; // Salida 12:00 PM estándar si no hay horas extra
  const horaCheckout = `${pad(horaSalidaNum)}:00`;

  return {
    fechaCheckin: String(fechaCheckinStr).split('T')[0],
    horaCheckin,
    fechaCheckout: fechaCheckoutStr,
    horaCheckout
  };
}

export function calcularVenta(datos, cabana = null) {
  const esSoloActividades = !cabana;
  const temporada = esSoloActividades ? 'N/A' : (datos.temporada || 'entre_semana');
  const noches = esSoloActividades ? 0 : (Number(datos.noches) > 0 ? Number(datos.noches) : 1);
  const huespedesTotales = esSoloActividades ? 0 : (Number(datos.huespedes_totales) || 0);

  let precioNoche = 0;
  let costoCabana = 0;
  let personasExtra = 0;
  let costoPersonasExtra = 0;
  let depositoRequerido = 0;
  let cabanaNombre = null;
  let horasExtra = 0;
  let costoHorasExtra = 0;
  let fechasEstancia = { fechaCheckin: null, horaCheckin: null, fechaCheckout: null, horaCheckout: null };

  if (cabana) {
    cabanaNombre = cabana.nombre;
    depositoRequerido = Number(cabana.deposito) || 0;

    switch (temporada) {
      case 'fin_semana':
        precioNoche = Number(cabana.precio_fin_semana);
        break;
      case 'temporada_alta':
        precioNoche = Number(cabana.precio_temporada_alta);
        break;
      case 'entre_semana':
      default:
        precioNoche = Number(cabana.precio_entre_semana);
        break;
    }

    costoCabana = precioNoche * noches;

    if (huespedesTotales > cabana.capacidad) {
      personasExtra = huespedesTotales - cabana.capacidad;
      costoPersonasExtra = personasExtra * TARIFAS.COSTO_PERSONA_EXTRA;
    }

    horasExtra = Math.max(0, parseInt(datos.horas_extra, 10) || 0);
    costoHorasExtra = horasExtra * TARIFAS.HORA_EXTRA;

    fechasEstancia = calcularFechasEstancia(datos.fecha_checkin || datos.fecha, noches, horasExtra);
  }

  // Actividades, Visitas y Camping
  const visitasPersonas = Math.max(0, Number(datos.visitas_personas) || 0);
  const campingPersonas = Math.max(0, Number(datos.camping_personas) || 0);
  const campingPrecioUnitario = (temporada === 'temporada_alta' || datos.camping_temporada_alta)
    ? TARIFAS.CAMPING_ALTA
    : TARIFAS.CAMPING_NORMAL;

  const costoVisitas = visitasPersonas * TARIFAS.VISITA_PERSONA;
  const costoCamping = campingPersonas * campingPrecioUnitario;

  const fresaKilos = Math.max(0, Number(datos.fresa_kilos) || 0);
  const fresaMedios = Math.max(0, Number(datos.fresa_medios) || 0);
  const tirolesaBoletos = Math.max(0, Number(datos.tirolesa_boletos) || 0);
  const cabalgata30min = Math.max(0, Number(datos.cabalgata_30min) || 0);
  const cabalgata1hora = Math.max(0, Number(datos.cabalgata_1hora) || 0);

  // Nuevas actividades y productos
  const gotchaPaquetes = Math.max(0, Number(datos.gotcha_paquetes) || 0);
  const costoGotcha = gotchaPaquetes * TARIFAS.GOTCHA;

  const interaccionAnimales = Math.max(0, Number(datos.interaccion_animales) || 0);
  const costoInteraccionAnimales = interaccionAnimales * TARIFAS.INTERACCION_ANIMALES;

  const mielLitros = Math.max(0, Number(datos.miel_litros) || 0);
  const costoMiel = mielLitros * TARIFAS.MIEL_LITRO;

  const huevoConos = Math.max(0, Number(datos.huevo_conos) || 0);
  const huevoPiezas = Math.max(0, Number(datos.huevo_piezas) || 0);
  const costoHuevo = (huevoConos * TARIFAS.HUEVO_CONO) + (huevoPiezas * TARIFAS.HUEVO_PIEZA);

  // Paquetes especiales
  const paqueteGranja = Math.max(0, Number(datos.paquete_granja) || 0);
  const costoPaqueteGranja = paqueteGranja * TARIFAS.PAQUETE_GRANJA;

  const paqueteVive = Math.max(0, Number(datos.paquete_vive) || 0);
  const costoPaqueteVive = paqueteVive * TARIFAS.PAQUETE_VIVE;

  // Senderismo guiado: $70 si >= 6 personas, $100 si <= 5 personas
  const senderismoPersonas = Math.max(0, Number(datos.senderismo_personas) || 0);
  let senderismoPrecioUnitario = 0;
  if (senderismoPersonas >= 6) {
    senderismoPrecioUnitario = TARIFAS.SENDERISMO_MIN_6;
  } else if (senderismoPersonas > 0) {
    senderismoPrecioUnitario = TARIFAS.SENDERISMO_HASTA_5;
  }
  const costoSenderismo = senderismoPersonas * senderismoPrecioUnitario;

  const costoActividades =
    costoVisitas +
    costoCamping +
    (fresaKilos * TARIFAS.FRESA_KILO) +
    (fresaMedios * TARIFAS.FRESA_MEDIO) +
    (tirolesaBoletos * TARIFAS.TIROLESA_BOLETO) +
    (cabalgata30min * TARIFAS.CABALGATA_30MIN) +
    (cabalgata1hora * TARIFAS.CABALGATA_1HORA) +
    costoGotcha +
    costoInteraccionAnimales +
    costoMiel +
    costoHuevo +
    costoPaqueteGranja +
    costoPaqueteVive +
    costoSenderismo;

  const subtotal = costoCabana + costoPersonasExtra + costoHorasExtra + costoActividades;

  // Soporta descuentos y anticipos tanto en cabañas como en actividades
  const tipoDescuento = datos.tipo_descuento === 'porcentaje' ? 'porcentaje' : 'monto';
  const valorDescuento = Math.max(0, Number(datos.valor_descuento) || Number(datos.descuento_especial) || 0);
  let descuentoEspecial = 0;

  if (tipoDescuento === 'porcentaje') {
    descuentoEspecial = (subtotal * valorDescuento) / 100;
  } else {
    descuentoEspecial = valorDescuento;
  }
  descuentoEspecial = Math.min(subtotal, Math.round(descuentoEspecial * 100) / 100);
  const anticipo = Math.max(0, Number(datos.anticipo) || 0);

  const total = Math.max(0, Math.round((subtotal - descuentoEspecial) * 100) / 100);

  const partesActividades = [];
  const listaDescriptiva = [];
  if (campingPersonas > 0) {
    partesActividades.push(`Camping ($${campingPrecioUnitario}): ${campingPersonas}`);
    listaDescriptiva.push(`Camping (${campingPersonas} pers.)`);
  }
  if (visitasPersonas > 0) {
    partesActividades.push(`Visitas ($95): ${visitasPersonas}`);
    listaDescriptiva.push(`Entrada Visitas (${visitasPersonas})`);
  }
  if (fresaKilos > 0) {
    partesActividades.push(`Fresa Kg: ${fresaKilos}`);
    listaDescriptiva.push(`Fresa (${fresaKilos} Kg)`);
  }
  if (fresaMedios > 0) {
    partesActividades.push(`Fresa 1/2 Kg: ${fresaMedios}`);
    listaDescriptiva.push(`Fresa (${fresaMedios} × ½ Kg)`);
  }
  if (tirolesaBoletos > 0) {
    partesActividades.push(`Tirolesa: ${tirolesaBoletos}`);
    listaDescriptiva.push(`Tirolesa (${tirolesaBoletos})`);
  }
  if (cabalgata30min > 0) {
    partesActividades.push(`Cabalgata 30m: ${cabalgata30min}`);
    listaDescriptiva.push(`Cabalgata 30m (${cabalgata30min})`);
  }
  if (cabalgata1hora > 0) {
    partesActividades.push(`Cabalgata 1h: ${cabalgata1hora}`);
    listaDescriptiva.push(`Cabalgata 1h (${cabalgata1hora})`);
  }
  if (paqueteGranja > 0) {
    partesActividades.push(`Paquete Granja Karinga ($220): ${paqueteGranja}`);
    listaDescriptiva.push(`Paquete Granja Karinga (${paqueteGranja})`);
  }
  if (paqueteVive > 0) {
    partesActividades.push(`Paquete Vive Karinga ($450): ${paqueteVive}`);
    listaDescriptiva.push(`Paquete Vive Karinga (${paqueteVive})`);
  }
  if (senderismoPersonas > 0) {
    partesActividades.push(`Senderismo Guiado ($${senderismoPrecioUnitario}): ${senderismoPersonas} pers.`);
    listaDescriptiva.push(`Senderismo Guiado (${senderismoPersonas} pers. @ $${senderismoPrecioUnitario})`);
  }
  if (gotchaPaquetes > 0) {
    partesActividades.push(`Gotcha ($2900): ${gotchaPaquetes}`);
    listaDescriptiva.push(`Gotcha (${gotchaPaquetes})`);
  }
  if (interaccionAnimales > 0) {
    partesActividades.push(`Interacción Animales ($200): ${interaccionAnimales}`);
    listaDescriptiva.push(`Interacción Animales (${interaccionAnimales})`);
  }
  if (mielLitros > 0) {
    partesActividades.push(`Miel ($200): ${mielLitros} L`);
    listaDescriptiva.push(`Miel Natural (${mielLitros} L)`);
  }
  if (huevoConos > 0) {
    partesActividades.push(`Huevo Conos ($110): ${huevoConos}`);
    listaDescriptiva.push(`Huevo Rancho (${huevoConos} conos)`);
  }
  if (huevoPiezas > 0) {
    partesActividades.push(`Huevo Piezas ($4): ${huevoPiezas}`);
    listaDescriptiva.push(`Huevo Rancho (${huevoPiezas} pz)`);
  }
  const detallesActividades = partesActividades.length > 0 ? partesActividades.join(', ') : 'Ninguna';
  const resumenActividades = listaDescriptiva.length > 0 ? listaDescriptiva.join(', ') : '';

  let concepto = datos.concepto;
  const esGenerico = !concepto || concepto.trim() === 'Actividades' || concepto.trim().startsWith('Actividades') || concepto === 'Movimiento General' || concepto === 'Venta';

  if (!cabanaNombre) {
    concepto = resumenActividades || (esGenerico ? 'Actividades Recreativas' : concepto);
  } else {
    if (esGenerico) {
      concepto = `Check-in ${cabanaNombre} (${noches}n)`;
      if (horasExtra > 0) concepto += ` + ${horasExtra}h extra`;
      if (resumenActividades) concepto += ` + ${resumenActividades}`;
    }
  }

  return {
    cabanaNombre,
    noches,
    precioNoche,
    costoCabana,
    personasExtra,
    costoPersonasExtra,
    horasExtra,
    costoHorasExtra,
    depositoRequerido,
    fechaCheckin: fechasEstancia.fechaCheckin,
    horaCheckin: fechasEstancia.horaCheckin,
    fechaCheckout: fechasEstancia.fechaCheckout,
    horaCheckout: fechasEstancia.horaCheckout,
    visitasPersonas,
    costoVisitas,
    campingPersonas,
    campingPrecioUnitario,
    costoCamping,
    fresaKilos,
    fresaMedios,
    tirolesaBoletos,
    cabalgata30min,
    cabalgata1hora,
    gotchaPaquetes,
    costoGotcha,
    interaccionAnimales,
    costoInteraccionAnimales,
    mielLitros,
    costoMiel,
    huevoConos,
    huevoPiezas,
    costoHuevo,
    paqueteGranja,
    costoPaqueteGranja,
    paqueteVive,
    costoPaqueteVive,
    senderismoPersonas,
    senderismoPrecioUnitario,
    costoSenderismo,
    costoActividades,
    subtotal,
    tipoDescuento,
    valorDescuento,
    descuentoEspecial,
    anticipo,
    total,
    detallesActividades,
    concepto
  };
}
