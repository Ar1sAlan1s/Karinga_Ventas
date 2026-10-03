import { CABANAS_INICIALES } from '../constantes/datosIniciales';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

export async function obtenerCabanasApi() {
  try {
    const respuesta = await fetch(`${API_BASE}/cabanas`);
    if (!respuesta.ok) throw new Error(`HTTP ${respuesta.status}`);
    const json = await respuesta.json();
    if (json.exito && Array.isArray(json.datos) && json.datos.length > 0) {
      return json.datos;
    }
    return CABANAS_INICIALES;
  } catch (error) {
    console.warn('Usando catálogo local de cabañas:', error.message);
    return CABANAS_INICIALES;
  }
}

export async function registrarVentaApi(datosVenta) {
  const respuesta = await fetch(`${API_BASE}/ventas`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(datosVenta)
  });

  const json = await respuesta.json();
  if (!respuesta.ok) {
    throw new Error(json.mensaje || 'Error al registrar el movimiento');
  }
  return json;
}

export async function asignarHorasExtraApi(id, payload) {
  const respuesta = await fetch(`${API_BASE}/ventas/${id}/horas-extra`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  const json = await respuesta.json();
  if (!respuesta.ok) {
    throw new Error(json.mensaje || 'Error al asignar horas extra');
  }
  return json;
}

export async function liquidarSaldoApi(id, payload) {
  const respuesta = await fetch(`${API_BASE}/ventas/${id}/liquidar`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  const json = await respuesta.json();
  if (!respuesta.ok) {
    throw new Error(json.mensaje || 'Error al liquidar la reservación');
  }
  return json;
}

export async function obtenerVentasApi(tipo = 'todos') {
  try {
    const url = tipo && tipo !== 'todos' 
      ? `${API_BASE}/ventas?tipo=${tipo}&limite=300` 
      : `${API_BASE}/ventas?limite=300`;
    const respuesta = await fetch(url);
    if (!respuesta.ok) throw new Error(`HTTP ${respuesta.status}`);
    const json = await respuesta.json();
    return json.datos || [];
  } catch (error) {
    console.error('Error al obtener ventas:', error.message);
    return [];
  }
}

export async function descargarExcelBackendApi(tipo = 'todos') {
  const url = tipo && tipo !== 'todos' 
    ? `${API_BASE}/ventas/excel?tipo=${tipo}` 
    : `${API_BASE}/ventas/excel`;
  const respuesta = await fetch(url);
  if (!respuesta.ok) {
    throw new Error('Error al descargar el archivo Excel desde el servidor.');
  }

  const blob = await respuesta.blob();
  const blobUrl = window.URL.createObjectURL(blob);
  const enlace = document.createElement('a');
  enlace.href = blobUrl;
  const hoy = new Date().toISOString().split('T')[0];
  const sufijo = tipo === 'todos' ? 'Completo' : (tipo === 'cabanas' ? 'Cabanas' : 'Solo_Actividades');
  enlace.download = `Reporte_Ventas_Karinga_${sufijo}_${hoy}.xlsx`;
  document.body.appendChild(enlace);
  enlace.click();
  document.body.removeChild(enlace);
  window.URL.revokeObjectURL(blobUrl);
}

export async function registrarDanoDepositoApi(id, payload) {
  const respuesta = await fetch(`${API_BASE}/ventas/${id}/dano-deposito`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  const json = await respuesta.json();
  if (!respuesta.ok) {
    throw new Error(json.mensaje || 'Error al registrar la deducción de depósito');
  }
  return json;
}

export async function obtenerReservacionesGoogleApi(demo = false) {
  const url = demo ? `${API_BASE}/reservaciones?demo=true` : `${API_BASE}/reservaciones`;
  const respuesta = await fetch(url);
  const json = await respuesta.json().catch(() => ({}));
  if (!respuesta.ok) {
    throw new Error(json.mensaje || `Error HTTP ${respuesta.status} al consultar Google Calendar`);
  }
  return json;
}

export async function sincronizarCalendariosApi(cabanaId = null) {
  const url = cabanaId
    ? `${API_BASE}/reservaciones/sincronizar/${encodeURIComponent(cabanaId)}`
    : `${API_BASE}/reservaciones/sincronizar`;

  const respuesta = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  });

  const json = await respuesta.json().catch(() => ({}));
  if (!respuesta.ok) {
    throw new Error(json.mensaje || `Error al sincronizar con Google Calendar (HTTP ${respuesta.status})`);
  }
  return json;
}


