export const NOMBRES_DIAS = [
  'Domingo',
  'Lunes',
  'Martes',
  'Miércoles',
  'Jueves',
  'Viernes',
  'Sábado'
];

export const NOMBRES_MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

export const DIAS_TEMPORADA_ALTA_DEFAULT = [
  '2026-01-01',
  '2026-02-02',
  '2026-03-16',
  '2026-03-29', '2026-03-30', '2026-03-31',
  '2026-04-01', '2026-04-02', '2026-04-03', '2026-04-04', '2026-04-05',
  '2026-05-01',
  '2026-09-16',
  '2026-10-31', '2026-11-01', '2026-11-02',
  '2026-11-16',
  '2026-12-23', '2026-12-24', '2026-12-25', '2026-12-26', '2026-12-27',
  '2026-12-28', '2026-12-29', '2026-12-30', '2026-12-31',
  '2027-01-01'
];

const CLAVE_STORAGE = 'karinga_dias_temporada_alta';

export function obtenerDiasTemporadaAltaGuardados() {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const raw = localStorage.getItem(CLAVE_STORAGE);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.sort();
        }
      }
    }
  } catch (e) {
    console.warn('No se pudo leer dias de temporada alta:', e);
  }
  return [...DIAS_TEMPORADA_ALTA_DEFAULT].sort();
}

export function guardarDiasTemporadaAltaEnStorage(lista) {
  try {
    const listaOrdenada = Array.from(new Set(lista)).sort();
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem(CLAVE_STORAGE, JSON.stringify(listaOrdenada));
    }
    return listaOrdenada;
  } catch (e) {
    console.error('Error al guardar dias de temporada alta:', e);
    return lista;
  }
}

export function determinarInfoFecha(fechaStr, listaTemporadaAlta = []) {
  if (!fechaStr || typeof fechaStr !== 'string') {
    return {
      fecha: '',
      diaNombre: '',
      diaSemanaIndex: -1,
      esFinSemana: false,
      esTemporadaAlta: false,
      temporadaSugerida: 'entre_semana',
      motivo: 'Fecha no especificada'
    };
  }

  const partes = fechaStr.split('-').map(Number);
  if (partes.length < 3 || isNaN(partes[0]) || isNaN(partes[1]) || isNaN(partes[2])) {
    return {
      fecha: fechaStr,
      diaNombre: '',
      diaSemanaIndex: -1,
      esFinSemana: false,
      esTemporadaAlta: false,
      temporadaSugerida: 'entre_semana',
      motivo: 'Formato inválido'
    };
  }

  const [anio, mes, dia] = partes;
  const fechaObj = new Date(anio, mes - 1, dia);
  const diaSemanaIndex = fechaObj.getDay();
  const diaNombre = NOMBRES_DIAS[diaSemanaIndex] || '';

  const esTemporadaAlta = Array.isArray(listaTemporadaAlta) && listaTemporadaAlta.includes(fechaStr);
  if (esTemporadaAlta) {
    return {
      fecha: fechaStr,
      diaNombre,
      diaSemanaIndex,
      esFinSemana: diaSemanaIndex === 0 || diaSemanaIndex === 6,
      esTemporadaAlta: true,
      temporadaSugerida: 'temporada_alta',
      motivo: 'Temporada Alta (Vacaciones / Festivo)'
    };
  }

  // Sábado (6) y Domingo (0) son Fin de semana
  if (diaSemanaIndex === 0 || diaSemanaIndex === 6) {
    return {
      fecha: fechaStr,
      diaNombre,
      diaSemanaIndex,
      esFinSemana: true,
      esTemporadaAlta: false,
      temporadaSugerida: 'fin_semana',
      motivo: 'Fin de semana (Sábado y Domingo)'
    };
  }

  // Lunes a Viernes (1 a 5) son Entre semana
  return {
    fecha: fechaStr,
    diaNombre,
    diaSemanaIndex,
    esFinSemana: false,
    esTemporadaAlta: false,
    temporadaSugerida: 'entre_semana',
    motivo: 'Entre semana (Lunes a Viernes)'
  };
}

/**
 * Calcula el desglose detallado de cada noche para estancias de 1 o más noches.
 * Cada noche i corresponde a fechaInicio + i días.
 * Asigna automáticamente la tarifa según el calendario:
 *   - Lunes a Viernes: Entre semana
 *   - Sábado y Domingo: Fin de semana
 *   - Días festivos/marcados: Temporada alta
 * Y permite aplicar ajustes manuales por noche desde el menú interactivo.
 */
export function calcularDesgloseNoches(
  fechaInicio,
  numNoches = 1,
  listaTemporadaAlta = [],
  cabana = null,
  ajustesManuales = {}
) {
  const desglose = [];
  if (!fechaInicio) return desglose;

  const partes = String(fechaInicio).split('-').map(Number);
  if (partes.length < 3 || isNaN(partes[0]) || isNaN(partes[1]) || isNaN(partes[2])) {
    return desglose;
  }

  const [anio, mes, dia] = partes;
  const fechaBase = new Date(anio, mes - 1, dia);
  const cantNoches = Math.max(1, Number(numNoches) || 1);

  for (let i = 0; i < cantNoches; i++) {
    const fechaNocheObj = new Date(fechaBase);
    fechaNocheObj.setDate(fechaBase.getDate() + i);

    const y = fechaNocheObj.getFullYear();
    const m = String(fechaNocheObj.getMonth() + 1).padStart(2, '0');
    const d = String(fechaNocheObj.getDate()).padStart(2, '0');
    const fechaStr = `${y}-${m}-${d}`;

    const diaSemanaIndex = fechaNocheObj.getDay();
    const diaNombre = NOMBRES_DIAS[diaSemanaIndex] || '';

    // Determinamos sugerencia automática según fecha y calendario de temporada alta
    const infoFecha = determinarInfoFecha(fechaStr, listaTemporadaAlta);
    const tarifaSugerida = infoFecha.temporadaSugerida || 'entre_semana';

    // Verificamos si hay ajuste manual para esta noche específica
    const esAjusteManual = Boolean(ajustesManuales && ajustesManuales[i]);
    const tarifaAplicada = esAjusteManual ? ajustesManuales[i] : tarifaSugerida;

    // Calculamos precio según la tarifa aplicada y la cabaña
    let precio = 0;
    if (cabana) {
      if (tarifaAplicada === 'temporada_alta') {
        precio = Number(cabana.precio_temporada_alta) || 0;
      } else if (tarifaAplicada === 'fin_semana') {
        precio = Number(cabana.precio_fin_semana) || 0;
      } else {
        precio = Number(cabana.precio_entre_semana) || 0;
      }
    }

    desglose.push({
      indice: i,
      numeroNoche: i + 1,
      fecha: fechaStr,
      fechaAmigable: `${diaNombre} ${d}/${m}`,
      diaNombre: diaNombre,
      diaSemanaIndex: diaSemanaIndex,
      tarifaSugerida: tarifaSugerida,
      tarifaAplicada: tarifaAplicada,
      esAjusteManual: esAjusteManual,
      motivo: esAjusteManual ? 'Ajustado manualmente' : infoFecha.motivo,
      precio: precio
    });
  }

  return desglose;
}

export function generarRangoFechas(fechaInicio, fechaFin) {
  if (!fechaInicio || !fechaFin) return [];
  const [a1, m1, d1] = fechaInicio.split('-').map(Number);
  const [a2, m2, d2] = fechaFin.split('-').map(Number);

  const inicio = new Date(a1, m1 - 1, d1);
  const fin = new Date(a2, m2 - 1, d2);

  if (inicio > fin) return [];

  const fechas = [];
  const actual = new Date(inicio);

  while (actual <= fin) {
    const y = actual.getFullYear();
    const m = String(actual.getMonth() + 1).padStart(2, '0');
    const d = String(actual.getDate()).padStart(2, '0');
    fechas.push(`${y}-${m}-${d}`);
    actual.setDate(actual.getDate() + 1);
  }

  return fechas;
}

export function formatearFechaAmigable(fechaStr) {
  if (!fechaStr) return '';
  const partes = String(fechaStr).split('T')[0].split('-').map(Number);
  if (partes.length < 3) return fechaStr;
  const [anio, mes, dia] = partes;
  const fechaObj = new Date(anio, mes - 1, dia);
  const diaNombre = NOMBRES_DIAS[fechaObj.getDay()] || '';
  const mesNombre = NOMBRES_MESES[mes - 1] || '';
  return `${diaNombre} ${dia} de ${mesNombre} (${anio})`;
}

export function formatearFechaConDia(fechaStr, formato = 'completo') {
  if (!fechaStr) return '';
  const str = String(fechaStr).split('T')[0];
  const partes = str.split('-').map(Number);
  if (partes.length < 3) return str;
  const [anio, mes, dia] = partes;
  const fechaObj = new Date(anio, mes - 1, dia);
  const diaNombre = NOMBRES_DIAS[fechaObj.getDay()] || '';
  const mesNombre = NOMBRES_MESES[mes - 1] || '';
  const diaCorto = diaNombre.slice(0, 3);
  const mesCorto = mesNombre.slice(0, 3);

  if (formato === 'corta') {
    return `${diaCorto} ${dia} ${mesCorto}`;
  }
  if (formato === 'dia') {
    return diaNombre;
  }
  if (formato === 'media') {
    return `${diaNombre}, ${dia} de ${mesCorto}`;
  }
  return `${diaNombre}, ${dia} de ${mesNombre} de ${anio}`;
}

export function formatearHora12(horaStr) {
  if (!horaStr) return '';
  const [h, m] = horaStr.split(':').map(Number);
  if (isNaN(h) || isNaN(m)) return horaStr;
  const periodo = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  const mm = String(m).padStart(2, '0');
  const hh = String(h12).padStart(2, '0');
  return `${hh}:${mm} ${periodo}`;
}