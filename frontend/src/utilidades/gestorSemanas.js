/**
 * Utilidades para cálculo y gestión de semanas en Karinga Ventas
 * Estándar de la empresa:
 * - Semanas de Lunes a Domingo
 * - Número de semana del año (1 - 53)
 * - Fechas legibles de inicio y término
 */

const NOMBRES_MESES_CORTOS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
const NOMBRES_MESES_LARGOS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

/**
 * Obtiene la información detallada de la semana para una fecha dada
 * @param {string|Date} fechaInput
 * @returns {object|null}
 */
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

  // Lunes como inicio de semana (0=Dom, 1=Lun, ..., 6=Sab)
  const diaSemana = d.getDay();
  const diffLunes = diaSemana === 0 ? -6 : 1 - diaSemana;

  const lunes = new Date(d);
  lunes.setDate(d.getDate() + diffLunes);
  lunes.setHours(0, 0, 0, 0);

  const domingo = new Date(lunes);
  domingo.setDate(lunes.getDate() + 6);
  domingo.setHours(23, 59, 59, 999);

  // Cálculo de número de semana ISO-8601
  const jueves = new Date(lunes);
  jueves.setDate(lunes.getDate() + 3);
  jueves.setHours(0, 0, 0, 0);
  const anoSemana = jueves.getFullYear();

  const primerJueves = new Date(anoSemana, 0, 4);
  primerJueves.setHours(0, 0, 0, 0);
  const diaPrimerJueves = primerJueves.getDay();
  const primerLunesDelAno = new Date(primerJueves);
  primerLunesDelAno.setDate(primerJueves.getDate() - (diaPrimerJueves === 0 ? 6 : diaPrimerJueves - 1));
  primerLunesDelAno.setHours(0, 0, 0, 0);

  const diffMs = lunes.getTime() - primerLunesDelAno.getTime();
  const numeroSemana = 1 + Math.round(diffMs / (7 * 86400000));

  const formatearISO = (dt) => {
    const y = dt.getFullYear();
    const m = String(dt.getMonth() + 1).padStart(2, '0');
    const day = String(dt.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const formatearMX = (dt) => {
    const day = String(dt.getDate()).padStart(2, '0');
    const m = String(dt.getMonth() + 1).padStart(2, '0');
    const y = dt.getFullYear();
    return `${day}/${m}/${y}`;
  };

  const formatearLegible = (dt) => {
    const day = dt.getDate();
    const mes = NOMBRES_MESES_CORTOS[dt.getMonth()];
    return `${day} ${mes}`;
  };

  const inicioISO = formatearISO(lunes);
  const finISO = formatearISO(domingo);
  const inicioMX = formatearMX(lunes);
  const finMX = formatearMX(domingo);
  const claveSemana = `${anoSemana}-W${String(numeroSemana).padStart(2, '0')}`;

  return {
    numeroSemana,
    anoSemana,
    claveSemana,
    inicioISO,
    finISO,
    inicioMX,
    finMX,
    lunesFecha: lunes,
    domingoFecha: domingo,
    etiquetaCorta: `Semana ${numeroSemana}`,
    etiquetaSemana: `Semana ${numeroSemana}`,
    etiquetaRango: `${formatearLegible(lunes)} - ${formatearLegible(domingo)} ${domingo.getFullYear()}`,
    etiquetaCompleta: `Semana ${numeroSemana} (${inicioMX} - ${finMX})`,
    etiquetaDetallada: `Semana ${numeroSemana}: Lunes ${inicioMX} al Domingo ${finMX}`,
    inicioTexto: `Lunes ${lunes.getDate()} de ${NOMBRES_MESES_LARGOS[lunes.getMonth()]} ${lunes.getFullYear()}`,
    finTexto: `Domingo ${domingo.getDate()} de ${NOMBRES_MESES_LARGOS[domingo.getMonth()]} ${domingo.getFullYear()}`
  };
}

/**
 * Obtiene todas las semanas presentes en el arreglo de ventas, ordenadas de más reciente a más antigua
 * @param {Array} ventas
 * @returns {Array}
 */
export function obtenerSemanasDeVentas(ventas = []) {
  const mapaSemanas = {};

  ventas.forEach((v) => {
    const fechaRef = v.fecha_checkin || v.fecha || v.fecha_inicio;
    if (!fechaRef) return;
    const info = obtenerInfoSemana(fechaRef);
    if (!info) return;

    if (!mapaSemanas[info.claveSemana]) {
      mapaSemanas[info.claveSemana] = {
        ...info,
        totalVentas: 0,
        totalMonto: 0,
        totalAnticipos: 0,
        totalCabanas: 0,
        totalActividades: 0
      };
    }

    const item = mapaSemanas[info.claveSemana];
    item.totalVentas += 1;
    item.totalMonto += Number(v.total) || 0;
    item.totalAnticipos += Number(v.anticipo) || 0;
    if (v.cabana_id) item.totalCabanas += 1;
    else item.totalActividades += 1;
  });

  // Si no hay ventas, agregar al menos la semana actual
  if (Object.keys(mapaSemanas).length === 0) {
    const actual = obtenerInfoSemana(new Date());
    if (actual) {
      mapaSemanas[actual.claveSemana] = {
        ...actual,
        totalVentas: 0,
        totalMonto: 0,
        totalAnticipos: 0,
        totalCabanas: 0,
        totalActividades: 0
      };
    }
  }

  // Ordenar descendente por claveSemana
  return Object.values(mapaSemanas).sort((a, b) => b.claveSemana.localeCompare(a.claveSemana));
}

/**
 * Filtra un conjunto de ventas por clave de semana
 * @param {Array} ventas
 * @param {string} claveSemana 'todas' o 'YYYY-Wnn'
 * @returns {Array}
 */
export function filtrarVentasPorSemana(ventas = [], claveSemana = 'todas') {
  if (!claveSemana || claveSemana === 'todas') return ventas;
  return ventas.filter((v) => {
    const info = obtenerInfoSemana(v.fecha_checkin || v.fecha || v.fecha_inicio);
    return info && info.claveSemana === claveSemana;
  });
}

/**
 * Obtiene la semana actual respecto a hoy o a una fecha base dada
 * @param {string|Date} fechaBase
 * @returns {object}
 */
export function obtenerSemanaActual(fechaBase = null) {
  return obtenerInfoSemana(fechaBase || new Date());
}

/**
 * Obtiene la información de la semana siguiente a la semana dada
 * @param {string|Date} fechaBase
 * @returns {object}
 */
export function obtenerProximaSemana(fechaBase = null) {
  const actual = obtenerInfoSemana(fechaBase || new Date());
  if (!actual) return null;
  const d = new Date(actual.lunesFecha);
  d.setDate(d.getDate() + 7);
  return obtenerInfoSemana(d);
}

/**
 * Verifica si una reservación pertenece a una semana específica por su fecha de check-in o de estancia
 * @param {object} reserva
 * @param {object|string} semana O bien el objeto devuelto por obtenerInfoSemana o la clave 'YYYY-Wnn'
 * @returns {boolean}
 */
export function estaReservaEnSemana(reserva, semana) {
  if (!reserva || !semana) return false;
  const claveDeseada = typeof semana === 'string' ? semana : semana.claveSemana;
  const fechaIn = (reserva.fecha_checkin || reserva.fecha || reserva.fecha_inicio || '').split('T')[0];
  if (!fechaIn) return false;
  const info = obtenerInfoSemana(fechaIn);
  return info && info.claveSemana === claveDeseada;
}

