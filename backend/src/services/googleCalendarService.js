/**
 * Servicio de Integración con Google Calendar vía OAuth 2.0 y Creación Automática en Base de Datos
 * Karinga Resort Ecoturístico
 *
 * Autenticación:
 * Usa OAuth 2.0 (GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN)
 * para actuar en nombre de la cuenta de usuario que tiene acceso de lectura.
 */

import dotenv from 'dotenv';
import db from '../config/db.js';
dotenv.config();

/**
 * Diccionario maestro que mapea identificadores de cabañas con sus respectivas
 * variables de entorno de Google Calendar IDs.
 */
export const DICCIONARIO_CALENDARIOS_CABANAS = {
  IREKANI: {
    cabanaId: 1,
    nombre: 'Glamping Irekani',
    aliases: ['Glamping Irekani', 'Irekani'],
    variableEnv: 'CALENDAR_IREKANI_ID',
    variablesAlternas: ['CALENDAR_GLAMPING_IREKANI_ID', 'GOOGLE_CALENDAR_IREKANI_ID']
  },
  JARACUARO: {
    cabanaId: 2,
    nombre: 'Glamping Jaracuaro',
    aliases: ['Glamping Jaracuaro', 'Jaracuaro', 'Jarácuaro'],
    variableEnv: 'CALENDAR_JARACUARO_ID',
    variablesAlternas: ['CALENDAR_GLAMPING_JARACUARO_ID', 'GOOGLE_CALENDAR_JARACUARO_ID']
  },
  TECUENITA: {
    cabanaId: 3,
    nombre: 'Tecuenita',
    aliases: ['Tecuenita'],
    variableEnv: 'CALENDAR_TECUENITA_ID',
    variablesAlternas: ['GOOGLE_CALENDAR_TECUENITA_ID']
  },
  BUENAVISTA: {
    cabanaId: 4,
    nombre: 'Buena Vista',
    aliases: ['Buena Vista', 'Buenavista'],
    variableEnv: 'CALENDAR_BUENAVISTA_ID',
    variablesAlternas: ['GOOGLE_CALENDAR_BUENAVISTA_ID']
  },
  TECUEN: {
    cabanaId: 5,
    nombre: 'Tecuen',
    aliases: ['Tecuen', 'Tecuén'],
    variableEnv: 'CALENDAR_TECUEN_ID',
    variablesAlternas: ['GOOGLE_CALENDAR_TECUEN_ID']
  },
  PACANDA: {
    cabanaId: 6,
    nombre: 'Pacanda',
    aliases: ['Pacanda'],
    variableEnv: 'CALENDAR_PACANDA_ID',
    variablesAlternas: ['GOOGLE_CALENDAR_PACANDA_ID']
  },
  YUNUEN: {
    cabanaId: 7,
    nombre: 'Yunuen',
    aliases: ['Yunuen', 'Yunuén'],
    variableEnv: 'CALENDAR_YUNUEN_ID',
    variablesAlternas: ['GOOGLE_CALENDAR_YUNUEN_ID']
  },
  SANTAFE: {
    cabanaId: 8,
    nombre: 'Santa Fe',
    aliases: ['Santa Fe', 'Santafe'],
    variableEnv: 'CALENDAR_SANTAFE_ID',
    variablesAlternas: ['GOOGLE_CALENDAR_SANTAFE_ID']
  },
  JANITZIO: {
    cabanaId: 9,
    nombre: 'Janitzio',
    aliases: ['Janitzio'],
    variableEnv: 'CALENDAR_JANITZIO_ID',
    variablesAlternas: ['GOOGLE_CALENDAR_JANITZIO_ID']
  },
  CHUPICUARO: {
    cabanaId: 10,
    nombre: 'Chupicuaro',
    aliases: ['Chupicuaro', 'Chupícuaro'],
    variableEnv: 'CALENDAR_CHUPICUARO_ID',
    variablesAlternas: ['GOOGLE_CALENDAR_CHUPICUARO_ID']
  },
  URANDEN: {
    cabanaId: 11,
    nombre: 'Hostal Uranden',
    aliases: ['Hostal Uranden', 'Uranden', 'Urandén'],
    variableEnv: 'CALENDAR_URANDEN_ID',
    variablesAlternas: ['CALENDAR_HOSTAL_URANDEN_ID', 'GOOGLE_CALENDAR_URANDEN_ID']
  },
  SANTACLARA: {
    cabanaId: 12,
    nombre: 'HH Santa Clara',
    aliases: ['HH Santa Clara', 'Santa Clara'],
    variableEnv: 'CALENDAR_SANTACLARA_ID',
    variablesAlternas: ['CALENDAR_HH_SANTACLARA_ID', 'GOOGLE_CALENDAR_SANTACLARA_ID']
  },
  ERANDINI: {
    cabanaId: 13,
    nombre: 'Glamping Erandini',
    aliases: ['Glamping Erandini', 'Erandini'],
    variableEnv: 'CALENDAR_ERANDINI_ID',
    variablesAlternas: ['CALENDAR_GLAMPING_ERANDINI_ID', 'GOOGLE_CALENDAR_ERANDINI_ID']
  }
};

/**
 * Calcula dinámicamente la fecha y hora de inicio de la Semana 40 del año en curso
 * en formato ISO 8601 UTC (ej. 2026-09-28T00:00:00.000Z).
 * Sigue la norma ISO 8601 (el 4 de enero siempre cae en la semana 1).
 */
export function calcularInicioSemana40(anio = new Date().getFullYear()) {
  const cuatroEnero = new Date(Date.UTC(anio, 0, 4));
  const diaIso = cuatroEnero.getUTCDay() === 0 ? 7 : cuatroEnero.getUTCDay();

  // Lunes de la semana 1
  const lunesSemana1 = new Date(cuatroEnero);
  lunesSemana1.setUTCDate(cuatroEnero.getUTCDate() - (diaIso - 1));
  lunesSemana1.setUTCHours(0, 0, 0, 0);

  // La semana 40 inicia sumando 39 semanas completas (39 * 7 = 273 días)
  const lunesSemana40 = new Date(lunesSemana1);
  lunesSemana40.setUTCDate(lunesSemana1.getUTCDate() + (39 * 7));

  return lunesSemana40.toISOString();
}

/**
 * Obtiene el mapa de calendarios configurados con sus respectivas cabañas.
 * Permite filtrar por una cabaña específica si se proporciona cabanaId.
 */
export function obtenerCalendariosConfigurados(filtroCabanaId = null) {
  const configurados = [];

  for (const [clave, def] of Object.entries(DICCIONARIO_CALENDARIOS_CABANAS)) {
    // Si se especificó un filtro de cabaña, saltar las demás
    if (filtroCabanaId !== null && filtroCabanaId !== undefined && filtroCabanaId !== '') {
      const matchId = String(def.cabanaId) === String(filtroCabanaId);
      const matchClave = clave.toLowerCase() === String(filtroCabanaId).toLowerCase();
      if (!matchId && !matchClave) continue;
    }

    // Buscar el Calendar ID en la variable principal o alternas
    let calendarId = process.env[def.variableEnv];
    if (!calendarId && def.variablesAlternas) {
      for (const alt of def.variablesAlternas) {
        if (process.env[alt]) {
          calendarId = process.env[alt];
          break;
        }
      }
    }

    if (calendarId && calendarId.trim()) {
      configurados.push({
        clave,
        cabanaId: def.cabanaId,
        cabanaNombre: def.nombre,
        calendarId: calendarId.trim(),
        variableEnv: def.variableEnv
      });
    }
  }

  return configurados;
}

/**
 * Calcula el número de noches y fechas legibles a partir del inicio y fin de un evento
 */
export function calcularDetallesEstancia(start, end) {
  let fechaInicio = '';
  let fechaFin = '';
  let noches = 1;

  if (start?.date && end?.date) {
    fechaInicio = start.date;
    fechaFin = end.date;

    const msInicio = new Date(start.date + 'T00:00:00Z').getTime();
    const msFin = new Date(end.date + 'T00:00:00Z').getTime();
    const diffDias = Math.round((msFin - msInicio) / (1000 * 60 * 60 * 24));
    noches = Math.max(1, diffDias);
  } else if (start?.dateTime && end?.dateTime) {
    fechaInicio = start.dateTime.split('T')[0];
    fechaFin = end.dateTime.split('T')[0];

    const d1 = new Date(start.dateTime);
    const d2 = new Date(end.dateTime);
    const diffDias = Math.round((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24));
    noches = Math.max(1, diffDias);
  } else if (start?.dateTime) {
    fechaInicio = start.dateTime.split('T')[0];
    fechaFin = fechaInicio;
    noches = 1;
  } else if (start?.date) {
    fechaInicio = start.date;
    fechaFin = start.date;
    noches = 1;
  }

  return {
    fechaInicio,
    fechaFin,
    noches
  };
}

/**
 * Obtiene el cliente de googleapis con OAuth2, o fallback a fetch nativo si la librería no está instalada
 */
async function obtenerClienteGoogleApi() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;

  if (!clientId || !clientSecret || !refreshToken) {
    return {
      cliente: null,
      errorCredenciales: 'Faltan variables OAuth 2.0: GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET o GOOGLE_REFRESH_TOKEN.'
    };
  }

  try {
    const { google } = await import('googleapis');
    const oauth2Client = new google.auth.OAuth2(clientId, clientSecret);
    oauth2Client.setCredentials({ refresh_token: refreshToken });
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
    return { cliente: calendar, tipo: 'googleapis' };
  } catch (errImport) {
    return { cliente: null, tipo: 'fetch_fallback' };
  }
}

/**
 * Fallback nativo con fetch para renovar token y llamar a Google Calendar API
 */
async function consultarCalendarConFetch(calendarId, timeMin) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;

  const tokenResp = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token'
    })
  });

  const tokenData = await tokenResp.json();
  if (!tokenResp.ok || !tokenData.access_token) {
    throw new Error(tokenData.error_description || tokenData.error || 'Error al renovar token OAuth 2.0');
  }

  const params = new URLSearchParams({
    timeMin,
    singleEvents: 'true',
    orderBy: 'startTime',
    maxResults: '250'
  });

  const url = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?${params.toString()}`;
  const eventsResp = await fetch(url, {
    headers: {
      Authorization: `Bearer ${tokenData.access_token}`,
      Accept: 'application/json'
    }
  });

  const eventsData = await eventsResp.json();
  if (!eventsResp.ok) {
    throw new Error(eventsData.error?.message || `Error Google API: HTTP ${eventsResp.status}`);
  }

  return eventsData.items || [];
}

/**
 * Determina la temporada sugerida a partir de una fecha YYYY-MM-DD
 * Lunes a Jueves -> entre_semana
 * Viernes a Domingo -> fin_semana
 */
function determinarTemporadaFecha(fechaStr) {
  if (!fechaStr) return 'entre_semana';
  const partes = fechaStr.split('-');
  const d = new Date(parseInt(partes[0], 10), parseInt(partes[1], 10) - 1, parseInt(partes[2], 10));
  const diaSemana = d.getDay(); // 0: Domingo, 5: Viernes, 6: Sábado
  if (diaSemana === 0 || diaSemana === 5 || diaSemana === 6) {
    return 'fin_semana';
  }
  return 'entre_semana';
}

/**
 * Consulta la API de Google Calendar y CREA automáticamente en la base de datos
 * las nuevas reservaciones encontradas que no existan previamente.
 *
 * Reglas de negocio:
 * - Filtra a partir de la semana 40 del año en curso (timeMin).
 * - Asigna la cabaña correspondiente al evento basándose en el calendario de origen.
 * - Título del evento (summary) -> Nombre de la reservación.
 * - Fechas de inicio/fin -> Calculan número de noches.
 * - "Pago de inicio" (anticipo) y "Pago de liquidación": se guardan en 0.00 / Pendiente.
 * - "saldo_pendiente": igual al costo total de la cabaña (monto por cobrar al llegar).
 * - "estado_pago": 'pendiente_liquidacion'.
 * - Evita duplicados identificando [GCAL_EVENT_ID:...] o cabaña + checkin + nombre.
 *
 * @param {Object} opciones
 * @param {string|number|null} opciones.cabanaId - ID o clave de cabaña específica, o null para todas
 */
export async function sincronizarYCrearReservacionesEnDb({ cabanaId = null } = {}) {
  const timeMin = calcularInicioSemana40();
  const calendarios = obtenerCalendariosConfigurados(cabanaId);

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;
  const credencialesPresentes = Boolean(clientId && clientSecret && refreshToken);

  if (!credencialesPresentes || calendarios.length === 0) {
    return {
      exito: false,
      mensaje: !credencialesPresentes
        ? 'Faltan credenciales de Google OAuth 2.0 (GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET o GOOGLE_REFRESH_TOKEN en .env).'
        : 'No se encontraron calendarios configurados en .env para la cabaña seleccionada.',
      creadas: 0,
      omitidas: 0,
      totalEventos: 0,
      detalles: []
    };
  }

  const { cliente: calendarClient, tipo } = await obtenerClienteGoogleApi();

  let totalCreadas = 0;
  let totalActualizadas = 0;
  let totalOmitidas = 0;
  let totalEventosEncontrados = 0;
  const detalleCalendarios = [];
  const reservacionesCreadas = [];
  const reservacionesActualizadas = [];

  // Consultar los calendarios requeridos simultáneamente
  const promesas = calendarios.map(async (cal) => {
    try {
      let items = [];

      if (calendarClient && tipo === 'googleapis') {
        const respuesta = await calendarClient.events.list({
          calendarId: cal.calendarId,
          timeMin,
          singleEvents: true,
          orderBy: 'startTime',
          maxResults: 250
        });
        items = respuesta.data?.items || [];
      } else {
        items = await consultarCalendarConFetch(cal.calendarId, timeMin);
      }

      // Filtrar eventos válidos (no cancelados y con título)
      const eventosValidos = items.filter(
        (ev) => ev.status !== 'cancelled' && (ev.summary || '').trim() !== ''
      );

      // Localizar la cabaña real en la base de datos PRIORIZANDO nombre exacto y alias
      let cabanaDb = null;
      const busquedas = cal.aliases || [cal.cabanaNombre];
      for (const nom of busquedas) {
        cabanaDb = await db('cabanas').whereILike('nombre', nom).first();
        if (cabanaDb) break;
      }
      if (!cabanaDb) {
        cabanaDb = await db('cabanas').where({ id: cal.cabanaId }).first();
      }
      if (!cabanaDb) {
        cabanaDb = await db('cabanas')
          .whereILike('nombre', `%${cal.cabanaNombre}%`)
          .first();
      }

      if (!cabanaDb) {
        console.warn(`[Google Calendar] No se encontró cabaña en DB para "${cal.cabanaNombre}"`);
        return {
          cal,
          exito: false,
          error: `No existe la cabaña "${cal.cabanaNombre}" en el catálogo de base de datos`,
          creadas: 0,
          actualizadas: 0,
          omitidas: eventosValidos.length,
          total: eventosValidos.length,
          creadasList: [],
          actualizadasList: []
        };
      }

      let creadasEnEsteCal = 0;
      let actualizadasEnEsteCal = 0;
      let omitidasEnEsteCal = 0;
      const creadasList = [];
      const actualizadasList = [];

      for (const ev of eventosValidos) {
        const { fechaInicio, fechaFin, noches } = calcularDetallesEstancia(ev.start, ev.end);
        const nombreHuesped = (ev.summary || 'Reservación Google Calendar').trim();

        // 1. Verificación de existencia previa (por ID de Google Calendar o por cabaña/fecha/nombre)
        const yaExiste = await db('ventas_cabanas')
          .where(function () {
            this.where('notas', 'like', `%[GCAL_EVENT_ID:${ev.id}]%`).orWhere(function () {
              this.where({ cabana_id: cabanaDb.id })
                .andWhere(function () {
                  this.where('fecha_checkin', fechaInicio).orWhere('fecha', fechaInicio);
                })
                .andWhere('nombre_reservacion', nombreHuesped);
            });
          })
          .first();

        if (yaExiste) {
          // Detectar si cambió de cabaña, fechas o nombre normalizando fechas a formato YYYY-MM-DD
          const fechaInDb = yaExiste.fecha_checkin instanceof Date
            ? yaExiste.fecha_checkin.toISOString().split('T')[0]
            : String(yaExiste.fecha_checkin || '').split('T')[0];
          const fechaOutDb = yaExiste.fecha_checkout instanceof Date
            ? yaExiste.fecha_checkout.toISOString().split('T')[0]
            : String(yaExiste.fecha_checkout || '').split('T')[0];

          const cambioCabana = Number(yaExiste.cabana_id) !== Number(cabanaDb.id);
          const cambioFechas =
            fechaInDb !== fechaInicio ||
            fechaOutDb !== fechaFin ||
            Number(yaExiste.noches) !== Number(noches);
          const cambioNombre = yaExiste.nombre_reservacion !== nombreHuesped;

          if (cambioCabana || cambioFechas || cambioNombre) {
            // Recalcular tarifas según la nueva cabaña y fechas, preservando pagos ya realizados
            const temporadaSugerida = determinarTemporadaFecha(fechaInicio);
            const precioNoche =
              temporadaSugerida === 'fin_semana'
                ? Number(cabanaDb.precio_fin_semana)
                : Number(cabanaDb.precio_entre_semana);
            const costoCabana = precioNoche * noches;
            const depositoGarantia = Number(cabanaDb.deposito) || 250.0;

            const anticipoActual = Number(yaExiste.anticipo) || 0;
            const liquidadoActual = Number(yaExiste.monto_liquidado) || 0;
            const horasExtraCosto = Number(yaExiste.costo_horas_extra) || 0;
            const personasExtraCosto = Number(yaExiste.costo_personas_extra) || 0;
            const descuento = Number(yaExiste.descuento_especial) || 0;

            const nuevoSubtotal = costoCabana + personasExtraCosto;
            const nuevoTotal = Math.max(0, nuevoSubtotal + horasExtraCosto - descuento);
            const totalPagado = anticipoActual + liquidadoActual;
            const nuevoSaldoPendiente = Math.max(0, nuevoTotal - totalPagado);

            let nuevoEstadoPago = yaExiste.estado_pago;
            if (nuevoSaldoPendiente <= 0 && totalPagado > 0) {
              nuevoEstadoPago = 'liquidado';
            } else if (anticipoActual > 0) {
              nuevoEstadoPago = 'anticipo_pagado';
            } else {
              nuevoEstadoPago = 'pendiente_liquidacion';
            }

            let notasActualizadas = yaExiste.notas || '';
            if (!notasActualizadas.includes(`[GCAL_EVENT_ID:${ev.id}]`)) {
              notasActualizadas = `[GCAL_EVENT_ID:${ev.id}] ${notasActualizadas}`.trim();
            }

            const detalleCambio = [];
            if (cambioCabana) detalleCambio.push(`Cabaña: ${yaExiste.cabana_nombre} ➜ ${cabanaDb.nombre}`);
            if (cambioFechas) detalleCambio.push(`Fechas: ${fechaInicio} al ${fechaFin} (${noches}n)`);
            if (cambioNombre) detalleCambio.push(`Huésped: ${nombreHuesped}`);

            await db('ventas_cabanas')
              .where({ id: yaExiste.id })
              .update({
                cabana_id: cabanaDb.id,
                cabana_nombre: cabanaDb.nombre,
                fecha: fechaInicio,
                fecha_checkin: fechaInicio,
                fecha_checkout: fechaFin,
                noches,
                precio_noche: precioNoche,
                costo_cabana: costoCabana,
                deposito_requerido: depositoGarantia,
                subtotal: nuevoSubtotal,
                total: nuevoTotal,
                saldo_pendiente: nuevoSaldoPendiente,
                estado_pago: nuevoEstadoPago,
                nombre_reservacion: nombreHuesped,
                temporada: temporadaSugerida,
                concepto: `Reserva Google Calendar: ${cabanaDb.nombre} (${noches}n)`,
                notas: notasActualizadas
              });

            actualizadasEnEsteCal++;
            actualizadasList.push({
              id: yaExiste.id,
              nombre_reservacion: nombreHuesped,
              cabana_anterior: yaExiste.cabana_nombre,
              cabana_nueva: cabanaDb.nombre,
              fecha_checkin: fechaInicio,
              fecha_checkout: fechaFin,
              saldo_pendiente: nuevoSaldoPendiente,
              cambio: detalleCambio.join(' | ')
            });
            continue;
          }

          omitidasEnEsteCal++;
          continue;
        }

        // 2. Calcular costos y tarifas
        const temporadaSugerida = determinarTemporadaFecha(fechaInicio);
        const precioNoche =
          temporadaSugerida === 'fin_semana'
            ? Number(cabanaDb.precio_fin_semana)
            : Number(cabanaDb.precio_entre_semana);
        const costoCabana = precioNoche * noches;
        const depositoGarantia = Number(cabanaDb.deposito) || 250.0;

        // 3. Crear reservación en ventas_cabanas con pagos pendientes
        const nuevaReservacion = {
          fecha: fechaInicio,
          hora: '15:00',
          temporada: temporadaSugerida,
          nombre_reservacion: nombreHuesped,
          cabana_id: cabanaDb.id,
          cabana_nombre: cabanaDb.nombre,
          noches,
          precio_noche: precioNoche,
          huespedes_totales: Number(cabanaDb.capacidad) || 2,
          personas_extra: 0,
          costo_personas_extra: 0.0,
          costo_cabana: costoCabana,
          deposito_requerido: depositoGarantia,
          horas_extra: 0,
          costo_horas_extra: 0.0,
          fecha_checkin: fechaInicio,
          hora_checkin: '15:00',
          fecha_checkout: fechaFin,
          hora_checkout: '12:00',
          // Regla estricta: pagos en 0.00 / Pendiente
          anticipo: 0.0,
          metodo_pago_anticipo: null,
          comprobante_anticipo: null,
          estado_pago: 'pendiente_liquidacion',
          saldo_pendiente: costoCabana,
          monto_liquidado: 0.0,
          metodo_pago_liquidacion: null,
          tipo_descuento: 'monto',
          valor_descuento: 0.0,
          descuento_especial: 0.0,
          subtotal: costoCabana,
          total: costoCabana,
          metodo_pago: 'Pendiente',
          concepto: `Reserva Google Calendar: ${cabanaDb.nombre} (${noches}n)`,
          notas: `[GCAL_EVENT_ID:${ev.id}] Sincronizado automáticamente desde Google Calendar`
        };

        const [idGen] = await db('ventas_cabanas').insert(nuevaReservacion).returning('id');
        const idInsertado = typeof idGen === 'object' && idGen !== null ? idGen.id : idGen;

        creadasEnEsteCal++;
        creadasList.push({
          id: idInsertado,
          nombre_reservacion: nombreHuesped,
          cabana_nombre: cabanaDb.nombre,
          fecha_checkin: fechaInicio,
          fecha_checkout: fechaFin,
          noches,
          saldo_pendiente: costoCabana
        });
      }

      return {
        cal,
        cabana: cabanaDb.nombre,
        exito: true,
        creadas: creadasEnEsteCal,
        actualizadas: actualizadasEnEsteCal,
        omitidas: omitidasEnEsteCal,
        total: eventosValidos.length,
        creadasList,
        actualizadasList
      };
    } catch (errCal) {
      console.error(
        `[Google Calendar] Error al sincronizar "${cal.cabanaNombre}" (${cal.calendarId}):`,
        errCal.message
      );
      return {
        cal,
        cabana: cal.cabanaNombre,
        exito: false,
        error: errCal.message,
        creadas: 0,
        actualizadas: 0,
        omitidas: 0,
        total: 0,
        creadasList: [],
        actualizadasList: []
      };
    }
  });

  const resultados = await Promise.allSettled(promesas);

  for (const r of resultados) {
    if (r.status === 'fulfilled') {
      const d = r.value;
      totalCreadas += d.creadas;
      totalActualizadas += d.actualizadas || 0;
      totalOmitidas += d.omitidas;
      totalEventosEncontrados += d.total;
      reservacionesCreadas.push(...(d.creadasList || []));
      reservacionesActualizadas.push(...(d.actualizadasList || []));
      detalleCalendarios.push({
        cabana: d.cabana || d.cal.cabanaNombre,
        calendarId: d.cal.calendarId,
        exito: d.exito,
        creadas: d.creadas,
        actualizadas: d.actualizadas || 0,
        omitidas: d.omitidas,
        totalEventos: d.total,
        error: d.error || null
      });
    }
  }

  const cabanaTexto =
    calendarios.length === 1 ? `de ${calendarios[0].cabanaNombre}` : 'de todas las cabañas';

  const partes = [`${totalCreadas} nueva(s) reservación(es)`];
  if (totalActualizadas > 0) {
    partes.push(`${totalActualizadas} actualizada(s) por cambio de cabaña/fechas`);
  }
  partes.push(`${totalOmitidas} sin cambios`);

  return {
    exito: true,
    mensaje: `Sincronización ${cabanaTexto}: ${partes.join(', ')}.`,
    creadas: totalCreadas,
    actualizadas: totalActualizadas,
    omitidas: totalOmitidas,
    totalEventos: totalEventosEncontrados,
    reservacionesCreadas,
    reservacionesActualizadas,
    calendarios: detalleCalendarios
  };
}

/**
 * Consulta de solo lectura de eventos en Google Calendar (para visualización/diagnóstico)
 */
export async function consultarEventosGoogleCalendar(filtroCabanaId = null) {
  const timeMin = calcularInicioSemana40();
  const calendarios = obtenerCalendariosConfigurados(filtroCabanaId);

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;
  const credencialesPresentes = Boolean(clientId && clientSecret && refreshToken);

  if (!credencialesPresentes || calendarios.length === 0) {
    return {
      exito: true,
      timeMin,
      total: 0,
      datos: [],
      aviso: !credencialesPresentes
        ? 'Faltan credenciales de Google OAuth 2.0 en backend/.env.'
        : 'No se encontraron IDs de calendario para la cabaña seleccionada.'
    };
  }

  const { cliente: calendarClient, tipo } = await obtenerClienteGoogleApi();

  const promesas = calendarios.map(async (cal) => {
    try {
      let items = [];
      if (calendarClient && tipo === 'googleapis') {
        const respuesta = await calendarClient.events.list({
          calendarId: cal.calendarId,
          timeMin,
          singleEvents: true,
          orderBy: 'startTime',
          maxResults: 250
        });
        items = respuesta.data?.items || [];
      } else {
        items = await consultarCalendarConFetch(cal.calendarId, timeMin);
      }

      return items
        .filter((ev) => ev.status !== 'cancelled' && (ev.summary || '').trim() !== '')
        .map((ev) => {
          const { fechaInicio, fechaFin, noches } = calcularDetallesEstancia(ev.start, ev.end);
          return {
            id: ev.id,
            nombre_reservacion: (ev.summary || 'Sin Nombre').trim(),
            cabana_id: cal.cabanaId,
            cabana_nombre: cal.cabanaNombre,
            calendario_id: cal.calendarId,
            fecha_inicio: fechaInicio,
            fecha_fin: fechaFin,
            noches
          };
        });
    } catch (err) {
      console.warn(`[Google Calendar] Error en ${cal.cabanaNombre}:`, err.message);
      return [];
    }
  });

  const arrays = await Promise.all(promesas);
  const todos = arrays.flat();
  todos.sort((a, b) => (a.fecha_inicio || '').localeCompare(b.fecha_inicio || ''));

  return {
    exito: true,
    timeMin,
    total: todos.length,
    datos: todos
  };
}
