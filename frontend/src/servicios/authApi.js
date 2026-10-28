const normalizarApiUrl = () => {
  let url = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';
  url = url.trim().replace(/\/+$/, '');
  return url.endsWith('/api') ? url : `${url}/api`;
};

export const API_BASE = normalizarApiUrl();

// Almacenamiento seguro en memoria del Access Token de corta duración
let accessTokenMemoria = null;
let callbackSesionExpirada = null;
let promesaRefreshEnCurso = null;

export function setAccessToken(token) {
  accessTokenMemoria = token;
}

export function getAccessToken() {
  return accessTokenMemoria;
}

export function registrarCallbackSesionExpirada(cb) {
  callbackSesionExpirada = cb;
}

/**
 * Petición de login
 */
export async function loginApi(email, password) {
  const respuesta = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include', // Para recibir la cookie httpOnly con el refresh token
    body: JSON.stringify({ email, password })
  });

  const datos = await respuesta.json().catch(() => ({}));

  if (!respuesta.ok) {
    throw new Error(datos.mensaje || 'Error al iniciar sesión');
  }

  setAccessToken(datos.token);
  return datos;
}

/**
 * Renovación silenciosa de sesión mediante Refresh Token (Cookie httpOnly)
 */
export async function refreshApi() {
  // Evitar múltiples llamadas concurrentes de refresh
  if (promesaRefreshEnCurso) {
    return promesaRefreshEnCurso;
  }

  promesaRefreshEnCurso = (async () => {
    try {
      const respuesta = await fetch(`${API_BASE}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include' // Envía la cookie karinga_refresh_token
      });

      if (!respuesta.ok) {
        setAccessToken(null);
        return null;
      }

      const datos = await respuesta.json();
      if (datos.exito && datos.token) {
        setAccessToken(datos.token);
        return datos;
      }

      setAccessToken(null);
      return null;
    } catch (err) {
      console.warn('[AUTH] No fue posible renovar la sesión silenciosa:', err.message);
      setAccessToken(null);
      return null;
    } finally {
      promesaRefreshEnCurso = null;
    }
  })();

  return promesaRefreshEnCurso;
}

/**
 * Cierre de sesión y revocación de Refresh Token en backend
 */
export async function logoutApi() {
  try {
    await fetch(`${API_BASE}/auth/logout`, {
      method: 'POST',
      credentials: 'include'
    });
  } catch (err) {
    console.error('Error al notificar logout al backend:', err);
  } finally {
    setAccessToken(null);
  }
}

/**
 * Obtener perfil del usuario autenticado
 */
export async function obtenerPerfilApi() {
  const token = getAccessToken();
  if (!token) return null;

  const respuesta = await fetch(`${API_BASE}/auth/perfil`, {
    headers: {
      Authorization: `Bearer ${token}`
    },
    credentials: 'include'
  });

  if (!respuesta.ok) return null;
  const json = await respuesta.json();
  return json.usuario;
}

/**
 * Wrapper de Fetch con inyección automática de Bearer Token y reintento inteligente
 */
export async function fetchAutenticado(url, opciones = {}) {
  const headers = { ...(opciones.headers || {}) };
  
  if (accessTokenMemoria) {
    headers['Authorization'] = `Bearer ${accessTokenMemoria}`;
  }

  const opcionesCompletas = {
    ...opciones,
    headers,
    credentials: 'include'
  };

  let respuesta = await fetch(url, opcionesCompletas);

  // Si recibimos 401 por token expirado, intentamos refresh una vez
  if (respuesta.status === 401) {
    const jsonError = await respuesta.clone().json().catch(() => null);

    if (jsonError?.codigo === 'TOKEN_EXPIRADO' || !accessTokenMemoria) {
      const refreshResultado = await refreshApi();
      if (refreshResultado?.token) {
        // Reintentamos la petición con el nuevo Access Token
        opcionesCompletas.headers['Authorization'] = `Bearer ${refreshResultado.token}`;
        respuesta = await fetch(url, opcionesCompletas);
      } else {
        // Sesión definitivamente expirada
        if (typeof callbackSesionExpirada === 'function') {
          callbackSesionExpirada();
        }
      }
    }
  }

  return respuesta;
}

