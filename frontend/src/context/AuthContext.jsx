import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  loginApi,
  refreshApi,
  logoutApi,
  registrarCallbackSesionExpirada
} from '../servicios/authApi';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [errorAuth, setErrorAuth] = useState(null);

  // Manejador centralizado de cierre de sesión
  const cerrarSesion = useCallback(async () => {
    try {
      await logoutApi();
    } finally {
      setUsuario(null);
      setErrorAuth(null);
    }
  }, []);

  // Comprobación de sesión inicial persistente (Silent Refresh con Cookie httpOnly)
  useEffect(() => {
    let cancelado = false;

    async function verificarSesionInicial() {
      try {
        const resultado = await refreshApi();
        if (!cancelado && resultado?.usuario) {
          setUsuario(resultado.usuario);
        }
      } catch (err) {
        console.info('[AUTH] No hay sesión persistente activa');
      } finally {
        if (!cancelado) {
          setCargando(false);
        }
      }
    }

    // Registrar callback por si el token expira y no puede renovarse
    registrarCallbackSesionExpirada(() => {
      setUsuario(null);
    });

    verificarSesionInicial();

    return () => {
      cancelado = true;
    };
  }, []);

  // Función de inicio de sesión
  const iniciarSesion = async (email, password) => {
    setErrorAuth(null);
    try {
      const respuesta = await loginApi(email, password);
      if (respuesta.usuario) {
        setUsuario(respuesta.usuario);
        return { exito: true };
      }
      return { exito: false, mensaje: 'Respuesta inválida del servidor' };
    } catch (err) {
      setErrorAuth(err.message);
      return { exito: false, mensaje: err.message };
    }
  };

  const valor = {
    usuario,
    estaAutenticado: Boolean(usuario),
    cargando,
    errorAuth,
    iniciarSesion,
    cerrarSesion
  };

  return (
    <AuthContext.Provider value={valor}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const contexto = useContext(AuthContext);
  if (!contexto) {
    throw new Error('useAuth debe ser utilizado dentro de un AuthProvider');
  }
  return contexto;
}

