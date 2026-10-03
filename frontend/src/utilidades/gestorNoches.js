/**
 * Utilidades para cálculo de noches y fechas de estancia
 */

export function calcularNoches(fechaCheckin, fechaCheckout) {
  if (!fechaCheckin || !fechaCheckout) return 1;
  try {
    const d1 = new Date(fechaCheckin.split('T')[0]);
    const d2 = new Date(fechaCheckout.split('T')[0]);
    const diffTime = d2.getTime() - d1.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 1;
  } catch {
    return 1;
  }
}

export function calcularFechaCheckout(fechaInicio, numNoches = 1) {
  if (!fechaInicio) return '';
  try {
    const partes = fechaInicio.split('T')[0].split('-').map(Number);
    const dt = new Date(partes[0], partes[1] - 1, partes[2]);
    dt.setDate(dt.getDate() + Number(numNoches || 1));
    const y = dt.getFullYear();
    const m = String(dt.getMonth() + 1).padStart(2, '0');
    const d = String(dt.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  } catch {
    return '';
  }
}

