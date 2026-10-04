import db from '../config/db.js';
import { calcularVenta } from '../services/calculosService.js';
import { generarExcelVentas } from '../services/reporteExcelService.js';

/**
 * Normaliza un registro de ventas_cabanas para respuesta uniforme
 */
function normalizarVentaCabana(registro) {
  if (!registro) return null;
  const hExtra = Number(registro.horas_extra) || 0;
  const costoHExtra = Number(registro.costo_horas_extra) || (hExtra * 250);
  const pExtra = Number(registro.personas_extra) || 0;
  const costoPExtra = Number(registro.costo_personas_extra) || (pExtra * 250);

  const cobrosExtraDetalle = [];
  if (hExtra > 0) cobrosExtraDetalle.push(`+${hExtra}h extra ($${costoHExtra.toLocaleString('es-MX')})`);
  if (pExtra > 0) cobrosExtraDetalle.push(`+${pExtra} pers. extra ($${costoPExtra.toLocaleString('es-MX')})`);

  let cargoDano = 0;
  if (registro.concepto && registro.concepto.includes('[Daño/Pérdida:')) {
    const regex = /\[Daño\/Pérdida:\s*([^(]+?)\s*\(\$([0-9.,]+)\)\]/gi;
    let m;
    while ((m = regex.exec(registro.concepto)) !== null) {
      const cant = parseFloat(m[2]) || 0;
      cargoDano += cant;
      cobrosExtraDetalle.push(`Daño: ${m[1].trim()} ($${cant.toLocaleString('es-MX')})`);
    }
  } else if (registro.notas && registro.notas.includes('[DAÑO CUBIERTO CON DEPÓSITO]')) {
    const regexNotas = /Se retuvo \$([0-9.,]+) MXN del depósito por:\s*"([^"]+)"/gi;
    let m;
    while ((m = regexNotas.exec(registro.notas)) !== null) {
      const cant = parseFloat(m[1]) || 0;
      cargoDano += cant;
      cobrosExtraDetalle.push(`Daño: ${m[2].trim()} ($${cant.toLocaleString('es-MX')})`);
    }
  }

  const cobrosExtraTotal = costoHExtra + costoPExtra + cargoDano;

  return {
    ...registro,
    tipo_venta: 'cabana',
    nombre_reservacion: registro.nombre_reservacion || 'Sin Nombre',
    cliente_nombre: registro.nombre_reservacion || 'Sin Nombre',
    costo_cabana: Number(registro.costo_cabana) || 0,
    cobros_extra_total: cobrosExtraTotal,
    cobros_extra_detalle: cobrosExtraDetalle
  };
}

/**
 * Normaliza un registro de ventas_actividades para respuesta uniforme
 */
function normalizarVentaActividad(registro) {
  if (!registro) return null;
  const nombre = registro.cliente_nombre || registro.nombre_reservacion || 'Público General';

  // Si el concepto es genérico ("Actividades", "Actividades ", null), armamos el nombre descriptivo
  let concepto = registro.concepto;
  if (!concepto || concepto.trim() === 'Actividades' || concepto.trim().startsWith('Actividades')) {
    const partes = [];
    if (Number(registro.camping_personas) > 0) partes.push(`Camping (${registro.camping_personas} pers.)`);
    if (Number(registro.visitas_personas) > 0) partes.push(`Entrada Visitas (${registro.visitas_personas})`);
    if (Number(registro.paquete_granja) > 0) partes.push(`Paquete Granja (${registro.paquete_granja})`);
    if (Number(registro.paquete_vive) > 0) partes.push(`Paquete Vive Karinga (${registro.paquete_vive})`);
    if (Number(registro.senderismo_personas) > 0) {
      const pUnit = Number(registro.senderismo_precio_unitario) || (Number(registro.senderismo_personas) >= 6 ? 70 : 100);
      partes.push(`Senderismo (${registro.senderismo_personas} pers. @ $${pUnit})`);
    }
    if (Number(registro.gotcha_paquetes) > 0) partes.push(`Gotcha (${registro.gotcha_paquetes})`);
    if (Number(registro.interaccion_animales) > 0) partes.push(`Interacción Animales (${registro.interaccion_animales})`);
    if (Number(registro.fresa_kilos) > 0) partes.push(`Fresa (${registro.fresa_kilos} Kg)`);
    if (Number(registro.fresa_medios) > 0) partes.push(`Fresa (${registro.fresa_medios} × ½ Kg)`);
    if (Number(registro.miel_litros) > 0) partes.push(`Miel (${registro.miel_litros} L)`);
    if (Number(registro.huevo_conos) > 0) partes.push(`Huevo (${registro.huevo_conos} conos)`);
    if (Number(registro.huevo_piezas) > 0) partes.push(`Huevo (${registro.huevo_piezas} pz)`);
    if (Number(registro.tirolesa_boletos) > 0) partes.push(`Tirolesa (${registro.tirolesa_boletos})`);
    if (Number(registro.cabalgata_30min) > 0) partes.push(`Cabalgata 30m (${registro.cabalgata_30min})`);
    if (Number(registro.cabalgata_1hora) > 0) partes.push(`Cabalgata 1h (${registro.cabalgata_1hora})`);
    if (partes.length > 0) {
      concepto = partes.join(', ');
    } else if (registro.detalles_actividades && registro.detalles_actividades !== 'Ninguna') {
      concepto = registro.detalles_actividades;
    } else {
      concepto = 'Actividades Recreativas';
    }
  }

  return {
    ...registro,
    concepto,
    tipo_venta: 'actividad',
    nombre_reservacion: nombre,
    cliente_nombre: nombre,
    cabana_id: registro.cabana_id || null,
    cabana_nombre: registro.cabana_nombre || null,
    noches: 0,
    precio_noche: 0.00,
    costo_cabana: 0.00,
    personas_extra: 0,
    costo_personas_extra: 0.00,
    horas_extra: 0,
    costo_horas_extra: 0.00,
    deposito_requerido: 0.00,
    cobros_extra_total: 0.00,
    cobros_extra_detalle: []
  };
}

/**
 * Registrar una nueva venta:
 * - Si es de cabaña (cabana_id presente o tipo === 'cabanas') -> Se guarda en 'ventas_cabanas'
 * - Si es de actividades (sin cabana_id o tipo === 'actividades') -> Se guarda en 'ventas_actividades'
 */
export async function crearVenta(req, res) {
  try {
    const {
      tipo, // 'cabanas' | 'actividades'
      fecha,
      hora,
      temporada,
      nombre_reservacion,
      cliente_nombre,
      cabana_id,
      noches,
      huespedes_totales,
      horas_extra,
      anticipo,
      metodo_pago_anticipo,
      comprobante_anticipo,
      estado_pago = 'liquidado', // 'pendiente_liquidacion' o 'liquidado'
      tipo_descuento,
      valor_descuento,
      descuento_especial,
      visitas_personas,
      camping_personas,
      camping_temporada_alta,
      fresa_kilos,
      fresa_medios,
      tirolesa_boletos,
      cabalgata_30min,
      cabalgata_1hora,
      gotcha_paquetes,
      interaccion_animales,
      miel_litros,
      huevo_conos,
      huevo_piezas,
      paquete_granja,
      paquete_vive,
      senderismo_personas,
      metodo_pago,
      metodo_pago_liquidacion,
      notas,
      concepto,
      reserva_cabana_id
    } = req.body;

    if (!fecha || !hora || !metodo_pago) {
      return res.status(400).json({
        exito: false,
        mensaje: 'Fecha, hora y método de pago son obligatorios.'
      });
    }

    const esVentaCabana = (tipo === 'cabanas') || (Boolean(cabana_id) && tipo !== 'actividades');

    if (esVentaCabana) {
      // ==========================================
      // 1. VENTA / RESERVACIÓN DE CABAÑA -> ventas_cabanas
      // ==========================================
      if (!cabana_id) {
        return res.status(400).json({
          exito: false,
          mensaje: 'Debe seleccionar una cabaña para registrar una reservación de hospedaje.'
        });
      }

      const cabana = await db('cabanas').where({ id: cabana_id, activo: true }).first();
      if (!cabana) {
        return res.status(404).json({
          exito: false,
          mensaje: 'La cabaña seleccionada no existe o no está activa.'
        });
      }

      const nombreHuesped = (nombre_reservacion || cliente_nombre || '').trim();
      if (!nombreHuesped) {
        return res.status(400).json({
          exito: false,
          mensaje: 'El nombre de quien hace la reservación es obligatorio para hospedaje.'
        });
      }

      const calculos = calcularVenta(
        {
          fecha,
          temporada: temporada || 'entre_semana',
          noches,
          huespedes_totales,
          horas_extra,
          anticipo,
          tipo_descuento,
          valor_descuento,
          descuento_especial,
          concepto
        },
        cabana
      );

      const montoAnticipo = calculos.anticipo;
      const granTotal = calculos.total;
      const esPendiente = estado_pago === 'pendiente_liquidacion' && montoAnticipo > 0;
      const saldoPendiente = esPendiente ? Math.max(0, Math.round((granTotal - montoAnticipo) * 100) / 100) : 0.00;
      const montoLiquidado = esPendiente 
        ? 0.00 
        : (Number(req.body.monto_liquidado) || Math.max(0, Math.round((granTotal - montoAnticipo) * 100) / 100));

      const nuevaVentaCabana = {
        fecha,
        hora,
        temporada: temporada || 'entre_semana',
        nombre_reservacion: nombreHuesped,
        cabana_id: cabana.id,
        cabana_nombre: calculos.cabanaNombre,
        noches: calculos.noches,
        precio_noche: calculos.precioNoche,
        huespedes_totales: calculos.noches > 0 ? (Number(huespedes_totales) || 0) : 0,
        personas_extra: calculos.personasExtra,
        costo_personas_extra: calculos.costoPersonasExtra,
        costo_cabana: calculos.costoCabana,
        deposito_requerido: calculos.depositoRequerido,
        horas_extra: calculos.horasExtra,
        costo_horas_extra: calculos.costoHorasExtra,
        fecha_checkin: calculos.fechaCheckin,
        hora_checkin: calculos.horaCheckin,
        fecha_checkout: calculos.fechaCheckout,
        hora_checkout: calculos.horaCheckout,
        anticipo: montoAnticipo,
        metodo_pago_anticipo: montoAnticipo > 0 ? (metodo_pago_anticipo || metodo_pago) : null,
        comprobante_anticipo: comprobante_anticipo ? comprobante_anticipo.trim() : null,
        estado_pago: esPendiente ? 'pendiente_liquidacion' : 'liquidado',
        saldo_pendiente: saldoPendiente,
        monto_liquidado: montoLiquidado,
        metodo_pago_liquidacion: esPendiente ? null : (metodo_pago_liquidacion || metodo_pago),
        tipo_descuento: calculos.tipoDescuento,
        valor_descuento: calculos.valorDescuento,
        descuento_especial: calculos.descuentoEspecial,
        subtotal: calculos.subtotal,
        total: calculos.total,
        metodo_pago,
        concepto: calculos.concepto,
        notas: notas ? notas.trim() : null
      };

      const [idGenerado] = await db('ventas_cabanas')
        .insert(nuevaVentaCabana)
        .returning('id');

      const ventaId = typeof idGenerado === 'object' ? idGenerado.id : idGenerado;
      const ventaRegistrada = await db('ventas_cabanas').where({ id: ventaId }).first();

      return res.status(201).json({
        exito: true,
        mensaje: esPendiente 
          ? `Reserva de cabaña registrada con anticipo de $${montoAnticipo.toLocaleString('es-MX')} MXN. Saldo a liquidar: $${saldoPendiente.toLocaleString('es-MX')} MXN` 
          : `Reservación de ${calculos.cabanaNombre} registrada y liquidada con éxito en Karinga`,
        datos: normalizarVentaCabana(ventaRegistrada)
      });

    } else {
      // ==========================================
      // 2. VENTA DE ACTIVIDADES -> ventas_actividades
      // ==========================================
      const partesAct = [];
      if (Number(camping_personas) > 0) partesAct.push(`Camping (${camping_personas} pers.)`);
      if (Number(visitas_personas) > 0) partesAct.push(`Entrada Visitas (${visitas_personas})`);
      if (Number(paquete_granja) > 0) partesAct.push(`Paquete Granja (${paquete_granja})`);
      if (Number(paquete_vive) > 0) partesAct.push(`Paquete Vive Karinga (${paquete_vive})`);
      if (Number(senderismo_personas) > 0) {
        const pUnit = Number(senderismo_personas) >= 6 ? 70 : 100;
        partesAct.push(`Senderismo (${senderismo_personas} pers. @ $${pUnit})`);
      }
      if (Number(gotcha_paquetes) > 0) partesAct.push(`Gotcha (${gotcha_paquetes})`);
      if (Number(interaccion_animales) > 0) partesAct.push(`Interacción Animales (${interaccion_animales})`);
      if (Number(fresa_kilos) > 0) partesAct.push(`Fresa (${fresa_kilos} Kg)`);
      if (Number(fresa_medios) > 0) partesAct.push(`Fresa (${fresa_medios} × ½ Kg)`);
      if (Number(miel_litros) > 0) partesAct.push(`Miel (${miel_litros} L)`);
      if (Number(huevo_conos) > 0) partesAct.push(`Huevo (${huevo_conos} conos)`);
      if (Number(huevo_piezas) > 0) partesAct.push(`Huevo (${huevo_piezas} pz)`);
      if (Number(tirolesa_boletos) > 0) partesAct.push(`Tirolesa (${tirolesa_boletos})`);
      if (Number(cabalgata_30min) > 0) partesAct.push(`Cabalgata 30m (${cabalgata_30min})`);
      if (Number(cabalgata_1hora) > 0) partesAct.push(`Cabalgata 1h (${cabalgata_1hora})`);
      const conceptoDescriptivo = partesAct.length > 0 ? partesAct.join(', ') : (concepto && !concepto.trim().startsWith('Actividades') ? concepto : 'Actividades Recreativas');

      const calculos = calcularVenta(
        {
          fecha,
          temporada: 'N/A',
          visitas_personas,
          camping_personas,
          camping_temporada_alta,
          fresa_kilos,
          fresa_medios,
          tirolesa_boletos,
          cabalgata_30min,
          cabalgata_1hora,
          gotcha_paquetes,
          interaccion_animales,
          miel_litros,
          huevo_conos,
          huevo_piezas,
          paquete_granja,
          paquete_vive,
          senderismo_personas,
          anticipo,
          tipo_descuento,
          valor_descuento,
          descuento_especial,
          concepto: conceptoDescriptivo
        },
        null
      );

      const montoAnticipo = calculos.anticipo;
      const granTotal = calculos.total;
      const esPendiente = estado_pago === 'pendiente_liquidacion' && montoAnticipo > 0;
      const saldoPendiente = esPendiente ? Math.max(0, Math.round((granTotal - montoAnticipo) * 100) / 100) : 0.00;
      const montoLiquidado = esPendiente 
        ? 0.00 
        : (Number(req.body.monto_liquidado) || Math.max(0, Math.round((granTotal - montoAnticipo) * 100) / 100));

      const nombreClienteFinal = (cliente_nombre || nombre_reservacion || 'Público General').trim() || 'Público General';

      let cabanaNombreVinculada = null;
      let cabanaIdVinculada = null;
      if (cabana_id) {
        const c = await db('cabanas').where({ id: cabana_id }).first();
        if (c) {
          cabanaNombreVinculada = c.nombre;
          cabanaIdVinculada = c.id;
        }
      }

      const nuevaVentaActividad = {
        fecha,
        hora,
        temporada: 'N/A',
        cliente_nombre: nombreClienteFinal,
        nombre_reservacion: nombreClienteFinal,
        reserva_cabana_id: reserva_cabana_id ? parseInt(reserva_cabana_id, 10) : null,
        cabana_id: cabanaIdVinculada,
        cabana_nombre: cabanaNombreVinculada,
        visitas_personas: calculos.visitasPersonas,
        costo_visitas: calculos.costoVisitas,
        camping_personas: calculos.campingPersonas,
        camping_precio_unitario: calculos.campingPrecioUnitario,
        costo_camping: calculos.costoCamping,
        fresa_kilos: calculos.fresaKilos,
        fresa_medios: calculos.fresaMedios,
        tirolesa_boletos: calculos.tirolesaBoletos,
        cabalgata_30min: calculos.cabalgata30min,
        cabalgata_1hora: calculos.cabalgata1hora,
        gotcha_paquetes: calculos.gotchaPaquetes,
        costo_gotcha: calculos.costoGotcha,
        interaccion_animales: calculos.interaccionAnimales,
        costo_interaccion_animales: calculos.costoInteraccionAnimales,
        miel_litros: calculos.mielLitros,
        costo_miel: calculos.costoMiel,
        huevo_conos: calculos.huevoConos,
        huevo_piezas: calculos.huevoPiezas,
        costo_huevo: calculos.costoHuevo,
        paquete_granja: calculos.paqueteGranja,
        costo_paquete_granja: calculos.costoPaqueteGranja,
        paquete_vive: calculos.paqueteVive,
        costo_paquete_vive: calculos.costoPaqueteVive,
        senderismo_personas: calculos.senderismoPersonas,
        senderismo_precio_unitario: calculos.senderismoPrecioUnitario,
        costo_senderismo: calculos.costoSenderismo,
        costo_actividades: calculos.costoActividades,
        tipo_descuento: calculos.tipoDescuento,
        valor_descuento: calculos.valorDescuento,
        descuento_especial: calculos.descuentoEspecial,
        subtotal: calculos.subtotal,
        total: calculos.total,
        metodo_pago,
        anticipo: montoAnticipo,
        metodo_pago_anticipo: montoAnticipo > 0 ? (metodo_pago_anticipo || metodo_pago) : null,
        comprobante_anticipo: comprobante_anticipo ? comprobante_anticipo.trim() : null,
        estado_pago: esPendiente ? 'pendiente_liquidacion' : 'liquidado',
        saldo_pendiente: saldoPendiente,
        monto_liquidado: montoLiquidado,
        metodo_pago_liquidacion: esPendiente ? null : (metodo_pago_liquidacion || metodo_pago),
        concepto: calculos.concepto,
        detalles_actividades: calculos.detallesActividades,
        notas: notas ? notas.trim() : null
      };

      const [idGenerado] = await db('ventas_actividades')
        .insert(nuevaVentaActividad)
        .returning('id');

      const ventaId = typeof idGenerado === 'object' ? idGenerado.id : idGenerado;
      const ventaRegistrada = await db('ventas_actividades').where({ id: ventaId }).first();

      return res.status(201).json({
        exito: true,
        mensaje: esPendiente 
          ? `Venta de actividades registrada con anticipo de $${montoAnticipo.toLocaleString('es-MX')} MXN. Saldo a liquidar: $${saldoPendiente.toLocaleString('es-MX')} MXN` 
          : `Venta registrada con éxito: ${calculos.concepto}`,
        datos: normalizarVentaActividad(ventaRegistrada)
      });
    }
  } catch (error) {
    console.error('Error al registrar venta:', error);
    return res.status(500).json({
      exito: false,
      mensaje: 'Error interno al registrar el movimiento',
      error: error.message
    });
  }
}

/**
 * Asignar Horas Libres, Personas Extra u Otros Servicios a una Cabaña (ventas_cabanas)
 */
export async function asignarHorasExtra(req, res) {
  try {
    const { id } = req.params;
    let {
      horas_extra = 0,
      personas_extra = 0,
      otro_extra_concepto,
      otro_extra_monto = 0,
      metodo_pago = 'Efectivo',
      notas
    } = req.body;

    if (typeof horas_extra === 'object' && horas_extra !== null) {
      if (horas_extra.personas_extra) personas_extra = horas_extra.personas_extra;
      if (horas_extra.otro_extra_concepto) otro_extra_concepto = horas_extra.otro_extra_concepto;
      if (horas_extra.otro_extra_monto) otro_extra_monto = horas_extra.otro_extra_monto;
      if (horas_extra.metodo_pago) metodo_pago = horas_extra.metodo_pago;
      if (horas_extra.notas) notas = horas_extra.notas;
      horas_extra = horas_extra.horas_extra || 0;
    }

    const numHoras = Math.max(0, parseInt(horas_extra, 10) || 0);
    const cargoHoras = numHoras * 250.0;

    const numPersonas = Math.max(0, parseInt(personas_extra, 10) || 0);
    const cargoPersonas = numPersonas * 250.0;

    const cargoOtro = Math.max(0, parseFloat(otro_extra_monto) || 0);
    const conceptoOtro = otro_extra_concepto ? otro_extra_concepto.trim() : null;

    const cargoTotalAdicional = cargoHoras + cargoPersonas + cargoOtro;

    if (cargoTotalAdicional <= 0) {
      return res.status(400).json({
        exito: false,
        mensaje: 'Debe especificar al menos un extra (horas libres, personas u otro servicio con precio mayor a $0).'
      });
    }

    const ventaExistente = await db('ventas_cabanas').where({ id }).first();
    if (!ventaExistente) {
      return res.status(404).json({
        exito: false,
        mensaje: 'La reservación de cabaña seleccionada no existe.'
      });
    }

    const horasPrevias = Number(ventaExistente.horas_extra) || 0;
    const totalHorasExtra = horasPrevias + numHoras;
    const nuevoCostoHorasExtra = totalHorasExtra * 250.0;
    const nuevaHoraCheckout = `${String(12 + totalHorasExtra).padStart(2, '0')}:00`;

    const personasPrevias = Number(ventaExistente.personas_extra) || 0;
    const totalPersonasExtra = personasPrevias + numPersonas;
    const nuevoCostoPersonasExtra = totalPersonasExtra * 250.0;

    const subtotalPrevio = Number(ventaExistente.subtotal) || 0;
    const nuevoSubtotal = subtotalPrevio + cargoTotalAdicional;
    const descuento = Number(ventaExistente.descuento_especial) || 0;
    const nuevoTotal = Math.max(0, nuevoSubtotal - descuento);

    const montoLiqPrevio = Number(ventaExistente.monto_liquidado) || 0;
    const nuevoMontoLiquidado = montoLiqPrevio + cargoTotalAdicional;

    const partesDesc = [];
    if (numHoras > 0) partesDesc.push(`+${numHoras}h extra ($${cargoHoras})`);
    if (numPersonas > 0) partesDesc.push(`+${numPersonas} pers. extra ($${cargoPersonas})`);
    if (cargoOtro > 0) partesDesc.push(`${conceptoOtro || 'Extra adicional'}: $${cargoOtro}`);
    const textoResumen = partesDesc.join(', ');

    const nuevoConcepto = `${ventaExistente.concepto || 'Hospedaje'} [${textoResumen}]`;
    const notaAdicional = `[Extras: ${textoResumen} pagado con ${metodo_pago}]${notas ? ' ' + notas : ''}`;
    const nuevasNotas = ventaExistente.notas ? `${ventaExistente.notas} | ${notaAdicional}` : notaAdicional;

    await db('ventas_cabanas')
      .where({ id })
      .update({
        horas_extra: totalHorasExtra,
        costo_horas_extra: nuevoCostoHorasExtra,
        hora_checkout: nuevaHoraCheckout,
        personas_extra: totalPersonasExtra,
        costo_personas_extra: nuevoCostoPersonasExtra,
        subtotal: nuevoSubtotal,
        total: nuevoTotal,
        monto_liquidado: nuevoMontoLiquidado,
        metodo_pago_liquidacion: metodo_pago,
        concepto: nuevoConcepto,
        notas: nuevasNotas,
        updated_at: new Date()
      });

    const ventaActualizada = await db('ventas_cabanas').where({ id }).first();

    return res.status(200).json({
      exito: true,
      mensaje: `Extras asignados con éxito a ${ventaExistente.cabana_nombre} (${textoResumen}). Cobro: $${cargoTotalAdicional.toLocaleString('es-MX')} MXN vía ${metodo_pago}.`,
      datos: normalizarVentaCabana(ventaActualizada)
    });
  } catch (error) {
    console.error('Error al asignar extras:', error);
    return res.status(500).json({
      exito: false,
      mensaje: 'Error interno al asignar extras',
      error: error.message
    });
  }
}

/**
 * Liquidar Saldo Pendiente al llegar el cliente (Pago 2)
 */
export async function liquidarSaldo(req, res) {
  try {
    const { id } = req.params;
    const body = req.body || {};

    let tabla = 'ventas_cabanas';
    let ventaExistente = null;

    if (body.tipo === 'actividades') {
      ventaExistente = await db('ventas_actividades').where({ id }).first();
      tabla = 'ventas_actividades';
    } else if (body.tipo === 'cabanas') {
      ventaExistente = await db('ventas_cabanas').where({ id }).first();
      tabla = 'ventas_cabanas';
    } else {
      ventaExistente = await db('ventas_cabanas').where({ id }).first();
      if (!ventaExistente) {
        ventaExistente = await db('ventas_actividades').where({ id }).first();
        if (ventaExistente) {
          tabla = 'ventas_actividades';
        }
      }
    }

    if (!ventaExistente) {
      return res.status(404).json({
        exito: false,
        mensaje: 'La reservación o movimiento seleccionado no existe.'
      });
    }

    // Método de pago de liquidación (soporta nombres directos o alias)
    const metodo_pago_liquidacion =
      body.metodo_pago_liquidacion ||
      body.metodo_pago ||
      body.metodo_liquidacion ||
      'Efectivo';

    // 1. Horas Extra
    const horasAdicionales =
      tabla === 'ventas_cabanas'
        ? Math.max(0, parseInt(body.horas_extra ?? body.horas_extra_adicionales ?? 0, 10) || 0)
        : 0;
    const cargoHorasExtra = horasAdicionales * 250.0;

    // 2. Subtotal base y costos adicionales
    const costoCabanaBase = body.costo_cabana !== undefined && Number(body.costo_cabana) > 0
      ? Number(body.costo_cabana)
      : (Number(ventaExistente.costo_cabana) || Number(ventaExistente.subtotal) || 0);

    const personasExtra = body.personas_extra !== undefined
      ? Math.max(0, parseInt(body.personas_extra, 10) || 0)
      : (Number(ventaExistente.personas_extra) || 0);

    const costoPersonasExtra = body.costo_personas_extra !== undefined
      ? Math.max(0, parseFloat(body.costo_personas_extra) || 0)
      : (personasExtra * 250.0);

    const nuevoSubtotal = body.subtotal !== undefined && Number(body.subtotal) > 0
      ? Number(body.subtotal)
      : (costoCabanaBase + costoPersonasExtra + cargoHorasExtra);

    // 3. Descuento aplicado
    let descuentoFinal = Number(ventaExistente.descuento_especial) || 0;
    if (body.descuento_especial !== undefined && body.descuento_especial !== null) {
      descuentoFinal = Math.max(0, parseFloat(body.descuento_especial) || 0);
    }
    const nuevoTotal = body.total !== undefined && Number(body.total) >= 0
      ? Number(body.total)
      : Math.max(0, nuevoSubtotal - descuentoFinal);

    // 4. Anticipo registrado (ej. web / previo)
    let anticipoFinal = Number(ventaExistente.anticipo) || 0;
    if (body.anticipo !== undefined && body.anticipo !== null) {
      anticipoFinal = Math.max(0, parseFloat(body.anticipo) || 0);
    }
    const metodoPagoAnticipoFinal =
      anticipoFinal > 0
        ? (body.metodo_pago_anticipo || ventaExistente.metodo_pago_anticipo || 'Transferencia BBVA')
        : null;
    const comprobanteAnticipoFinal =
      body.comprobante_anticipo !== undefined
        ? body.comprobante_anticipo
        : ventaExistente.comprobante_anticipo;

    // 5. Monto Liquidado en Recepción (Cobro en mano)
    let montoLiquidadoFinal = 0;
    if (body.monto_liquidado !== undefined && body.monto_liquidado !== null) {
      montoLiquidadoFinal = Math.max(0, parseFloat(body.monto_liquidado) || 0);
    } else {
      montoLiquidadoFinal = Math.max(0, nuevoTotal - anticipoFinal);
    }

    // 6. Saldo Pendiente y Estado
    const saldoPendiente = Math.max(0, Math.round((nuevoTotal - anticipoFinal - montoLiquidadoFinal) * 100) / 100);
    const estadoPago =
      saldoPendiente <= 0
        ? 'liquidado'
        : (anticipoFinal > 0 || montoLiquidadoFinal > 0 ? 'anticipo_pagado' : 'pendiente_liquidacion');

    // 7. Método de pago representativo
    const metodoPagoGeneral =
      body.metodo_pago ||
      (montoLiquidadoFinal > 0
        ? metodo_pago_liquidacion
        : (metodoPagoAnticipoFinal || ventaExistente.metodo_pago || 'Pendiente'));

    // 8. Notas de liquidación
    let notasActualizadas = ventaExistente.notas || '';
    const detalleLiquidacion = `[Check-in liquidado: $${montoLiquidadoFinal} vía ${metodo_pago_liquidacion}${anticipoFinal > 0 ? ` (Anticipo: $${anticipoFinal} vía ${metodoPagoAnticipoFinal})` : ''}${descuentoFinal > 0 ? ` (Descuento: $${descuentoFinal})` : ''}]`;
    if (!notasActualizadas.includes('Check-in liquidado')) {
      notasActualizadas = notasActualizadas ? `${notasActualizadas} ${detalleLiquidacion}` : detalleLiquidacion;
    }
    if (body.notas) {
      notasActualizadas += ` (${body.notas.trim()})`;
    }

    const camposUpdate = {
      estado_pago: estadoPago,
      saldo_pendiente: saldoPendiente,
      monto_liquidado: montoLiquidadoFinal,
      metodo_pago_liquidacion: montoLiquidadoFinal > 0 ? metodo_pago_liquidacion : null,
      anticipo: anticipoFinal,
      metodo_pago_anticipo: metodoPagoAnticipoFinal,
      comprobante_anticipo: comprobanteAnticipoFinal,
      subtotal: nuevoSubtotal,
      total: nuevoTotal,
      descuento_especial: descuentoFinal,
      tipo_descuento: body.tipo_descuento || ventaExistente.tipo_descuento || 'monto',
      valor_descuento: body.valor_descuento !== undefined && body.valor_descuento !== null ? Number(body.valor_descuento) : ventaExistente.valor_descuento,
      metodo_pago: metodoPagoGeneral,
      notas: notasActualizadas,
      updated_at: new Date()
    };

    if (tabla === 'ventas_cabanas') {
      camposUpdate.horas_extra = horasAdicionales;
      camposUpdate.costo_horas_extra = cargoHorasExtra;
      camposUpdate.costo_cabana = costoCabanaBase;
      camposUpdate.personas_extra = personasExtra;
      camposUpdate.costo_personas_extra = costoPersonasExtra;
      camposUpdate.hora_checkout = `${String(12 + horasAdicionales).padStart(2, '0')}:00`;
      if (body.huespedes_totales !== undefined && Number(body.huespedes_totales) > 0) {
        camposUpdate.huespedes_totales = Number(body.huespedes_totales);
      }
      if (body.nombre_reservacion && body.nombre_reservacion.trim()) {
        camposUpdate.nombre_reservacion = body.nombre_reservacion.trim();
      }
    }

    await db(tabla).where({ id }).update(camposUpdate);

    const ventaActualizada = await db(tabla).where({ id }).first();
    const normalizada =
      tabla === 'ventas_cabanas'
        ? normalizarVentaCabana(ventaActualizada)
        : normalizarVentaActividad(ventaActualizada);

    return res.status(200).json({
      exito: true,
      mensaje: `Movimiento liquidado con éxito por $${montoLiquidadoFinal.toLocaleString('es-MX')} MXN vía ${metodo_pago_liquidacion}.`,
      datos: normalizada
    });
  } catch (error) {
    console.error('Error al liquidar saldo:', error);
    return res.status(500).json({
      exito: false,
      mensaje: 'Error interno al liquidar la reservación',
      error: error.message
    });
  }
}

/**
 * Obtener listado de ventas:
 * - tipo === 'cabanas' -> únicamente ventas_cabanas
 * - tipo === 'actividades' | 'interacciones' -> únicamente ventas_actividades
 * - tipo === 'todos' | undefined -> ambas tablas unificadas y ordenadas cronológicamente
 */
export async function obtenerVentas(req, res) {
  try {
    const { limite = 300, fecha_inicio, fecha_fin, tipo } = req.query;

    const incluirCabanas = !tipo || tipo === 'todos' || tipo === 'cabanas';
    const incluirActividades = !tipo || tipo === 'todos' || tipo === 'actividades' || tipo === 'interacciones';

    let registrosCabanas = [];
    let registrosActividades = [];

    if (incluirCabanas) {
      let qCab = db('ventas_cabanas').select('*');
      if (fecha_inicio) qCab = qCab.where('fecha', '>=', fecha_inicio);
      if (fecha_fin) qCab = qCab.where('fecha', '<=', fecha_fin);
      const cabResult = await qCab
        .orderBy('fecha', 'desc')
        .orderBy('hora', 'desc')
        .orderBy('id', 'desc')
        .limit(Number(limite));
      registrosCabanas = cabResult.map(normalizarVentaCabana);
    }

    if (incluirActividades) {
      let qAct = db('ventas_actividades').select('*');
      if (fecha_inicio) qAct = qAct.where('fecha', '>=', fecha_inicio);
      if (fecha_fin) qAct = qAct.where('fecha', '<=', fecha_fin);
      const actResult = await qAct
        .orderBy('fecha', 'desc')
        .orderBy('hora', 'desc')
        .orderBy('id', 'desc')
        .limit(Number(limite));

      registrosActividades = actResult.map(normalizarVentaActividad);
      
      // Auto-sanar en base de datos registros que tengan concepto genérico "Actividades"
      for (const act of actResult) {
        if (!act.concepto || act.concepto.trim() === 'Actividades' || act.concepto.trim().startsWith('Actividades')) {
          const norm = normalizarVentaActividad(act);
          if (norm.concepto && !norm.concepto.startsWith('Actividades')) {
            db('ventas_actividades').where({ id: act.id }).update({ concepto: norm.concepto }).catch(() => {});
          }
        }
      }
    }

    let todas = [...registrosCabanas, ...registrosActividades];

    // Ordenar cronológicamente descendente
    todas.sort((a, b) => {
      const fechaA = new Date(a.fecha).getTime() || 0;
      const fechaB = new Date(b.fecha).getTime() || 0;
      if (fechaB !== fechaA) return fechaB - fechaA;
      const horaA = a.hora || '';
      const horaB = b.hora || '';
      if (horaB !== horaA) return horaB.localeCompare(horaA);
      return (b.id || 0) - (a.id || 0);
    });

    if (todas.length > Number(limite)) {
      todas = todas.slice(0, Number(limite));
    }

    return res.status(200).json({
      exito: true,
      totalRegistros: todas.length,
      datos: todas
    });
  } catch (error) {
    console.error('Error al obtener ventas:', error);
    return res.status(500).json({
      exito: false,
      mensaje: 'Error interno al consultar las ventas',
      error: error.message
    });
  }
}

/**
 * Obtener reservas para el Calendario (exclusivo de ventas_cabanas)
 */
export async function obtenerReservasCalendario(req, res) {
  try {
    const { mes, anio } = req.query;

    let consulta = db('ventas_cabanas').select('*');

    if (anio && mes) {
      const inicio = `${anio}-${String(mes).padStart(2, '0')}-01`;
      const fin = `${anio}-${String(mes).padStart(2, '0')}-31`;
      consulta = consulta.where(function() {
        this.whereBetween('fecha_checkin', [inicio, fin])
          .orWhereBetween('fecha_checkout', [inicio, fin])
          .orWhereBetween('fecha', [inicio, fin]);
      });
    }

    const reservas = await consulta.orderBy('fecha_checkin', 'asc');

    return res.status(200).json({
      exito: true,
      total: reservas.length,
      datos: reservas.map(normalizarVentaCabana)
    });
  } catch (error) {
    console.error('Error al obtener reservas para calendario:', error);
    return res.status(500).json({
      exito: false,
      mensaje: 'Error al consultar calendario de reservas',
      error: error.message
    });
  }
}

/**
 * Descargar reporte en Excel según tipo solicitado
 */
export async function descargarReporteExcel(req, res) {
  try {
    const { fecha_inicio, fecha_fin, tipo = 'todos' } = req.query;

    const incluirCabanas = tipo === 'todos' || tipo === 'cabanas';
    const incluirActividades = tipo === 'todos' || tipo === 'actividades' || tipo === 'interacciones';

    let registrosCabanas = [];
    let registrosActividades = [];

    if (incluirCabanas) {
      let qCab = db('ventas_cabanas').select('*');
      if (fecha_inicio) qCab = qCab.where('fecha', '>=', fecha_inicio);
      if (fecha_fin) qCab = qCab.where('fecha', '<=', fecha_fin);
      const cabResult = await qCab.orderBy('fecha', 'desc').orderBy('hora', 'desc');
      registrosCabanas = cabResult.map(normalizarVentaCabana);
    }

    if (incluirActividades) {
      let qAct = db('ventas_actividades').select('*');
      if (fecha_inicio) qAct = qAct.where('fecha', '>=', fecha_inicio);
      if (fecha_fin) qAct = qAct.where('fecha', '<=', fecha_fin);
      const actResult = await qAct.orderBy('fecha', 'desc').orderBy('hora', 'desc');
      registrosActividades = actResult.map(normalizarVentaActividad);
    }

    let ventas = [...registrosCabanas, ...registrosActividades];
    ventas.sort((a, b) => {
      const fechaA = new Date(a.fecha).getTime() || 0;
      const fechaB = new Date(b.fecha).getTime() || 0;
      if (fechaB !== fechaA) return fechaB - fechaA;
      const horaA = a.hora || '';
      const horaB = b.hora || '';
      if (horaB !== horaA) return horaB.localeCompare(horaA);
      return (b.id || 0) - (a.id || 0);
    });

    const bufferExcel = generarExcelVentas(ventas, tipo);
    const fechaActual = new Date().toISOString().split('T')[0];
    const sufijoTipo = tipo === 'todos' ? 'Completo' : (tipo === 'cabanas' ? 'Cabanas' : 'Solo_Actividades');
    const nombreArchivo = `Reporte_Ventas_Karinga_${sufijoTipo}_${fechaActual}.xlsx`;

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${nombreArchivo}"`);
    return res.send(bufferExcel);
  } catch (error) {
    console.error('Error al generar Excel de ventas:', error);
    return res.status(500).json({
      exito: false,
      mensaje: 'Error al generar el archivo Excel de ventas',
      error: error.message
    });
  }
}

/**
 * Registrar Daño / Pérdida descontado del Depósito de Garantía (exclusivo de ventas_cabanas)
 */
export async function registrarDanoDeposito(req, res) {
  try {
    const { id } = req.params;
    const { monto_dano, concepto_dano, notas } = req.body;

    const monto = parseFloat(monto_dano);
    if (!monto || monto <= 0) {
      return res.status(400).json({
        exito: false,
        mensaje: 'Debe especificar el monto a descontar del depósito.'
      });
    }

    if (!concepto_dano || concepto_dano.trim() === '') {
      return res.status(400).json({
        exito: false,
        mensaje: 'Debe especificar el artículo u objeto dañado o perdido.'
      });
    }

    const ventaExistente = await db('ventas_cabanas').where({ id }).first();
    if (!ventaExistente) {
      return res.status(404).json({
        exito: false,
        mensaje: 'La reservación de cabaña no existe.'
      });
    }

    const subtotalPrevio = Number(ventaExistente.subtotal) || 0;
    const nuevoSubtotal = subtotalPrevio + monto;
    const descuento = Number(ventaExistente.descuento_especial) || 0;
    const nuevoTotal = Math.max(0, nuevoSubtotal - descuento);
    // El depósito en garantía siempre se deja y retiene en EFECTIVO.
    // Por lo tanto, no se debe sumar al monto liquidado (que mantiene su método original como Tarjeta/Transferencia).
    const nuevoMontoLiquidado = Number(ventaExistente.monto_liquidado) || 0;

    const depositoOriginal = Number(ventaExistente.deposito_requerido) || 500.0;
    const depositoDevolver = Math.max(0, depositoOriginal - monto);

    const conceptoDanoTexto = `[Daño/Pérdida: ${concepto_dano.trim()} ($${monto.toFixed(2)})]`;
    const nuevoConcepto = `${ventaExistente.concepto || 'Hospedaje'} ${conceptoDanoTexto}`;

    const detalleRetencion = `[DAÑO CUBIERTO CON DEPÓSITO]: Se retuvo $${monto.toFixed(2)} MXN del depósito por: "${concepto_dano.trim()}". Resto a devolver al huésped: $${depositoDevolver.toFixed(2)} MXN.${notas ? ` (${notas.trim()})` : ''}`;
    const notasPrevias = ventaExistente.notas ? `${ventaExistente.notas} | ` : '';
    const nuevasNotas = notasPrevias + detalleRetencion;

    await db('ventas_cabanas').where({ id }).update({
      subtotal: nuevoSubtotal,
      total: nuevoTotal,
      monto_liquidado: nuevoMontoLiquidado,
      saldo_pendiente: 0,
      concepto: nuevoConcepto,
      notas: nuevasNotas,
      updated_at: new Date()
    });

    const ventaActualizada = await db('ventas_cabanas').where({ id }).first();

    return res.json({
      exito: true,
      mensaje: `Retención registrada: $${monto.toFixed(2)} MXN agregados a la cabaña por concepto de daño (${concepto_dano.trim()}). Resto a devolver del depósito: $${depositoDevolver.toFixed(2)} MXN.`,
      datos: normalizarVentaCabana(ventaActualizada)
    });
  } catch (error) {
    console.error('Error al registrar daño de depósito:', error);
    return res.status(500).json({
      exito: false,
      mensaje: 'Error interno al registrar el daño o pérdida.',
      error: error.message
    });
  }
}

