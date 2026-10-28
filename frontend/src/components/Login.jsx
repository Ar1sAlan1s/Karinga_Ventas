import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import Icono from './Icono';

export default function Login() {
  const { iniciarSesion } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [errorLocal, setErrorLocal] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorLocal(null);

    if (!email.trim() || !password) {
      setErrorLocal('Por favor ingrese su correo y contraseña.');
      return;
    }

    setCargando(true);
    try {
      const res = await iniciarSesion(email.trim(), password);
      if (!res.exito) {
        setErrorLocal(res.mensaje || 'Error al iniciar sesión.');
      }
    } catch (err) {
      setErrorLocal(err.message || 'Error de conexión con el servidor.');
    } finally {
      setCargando(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1.5rem',
      background: 'linear-gradient(135deg, #143D2B 0%, #1F5F3E 45%, #0F2E20 100%)'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '430px',
        backgroundColor: '#FFFFFF',
        borderRadius: '16px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
        padding: '2.5rem 2rem',
        boxSizing: 'border-box'
      }}>
        {/* Encabezado e Ícono */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            width: '64px',
            height: '64px',
            backgroundColor: '#143D2B',
            borderRadius: '16px',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 8px 16px rgba(20, 61, 43, 0.25)',
            marginBottom: '1rem'
          }}>
            <Icono nombre="nature" tamano={34} color="#FFFFFF" />
          </div>
          <h1 style={{
            fontSize: '1.45rem',
            fontWeight: 700,
            color: '#143D2B',
            margin: '0 0 0.35rem 0'
          }}>
            Karinga Resort
          </h1>
          <p style={{
            fontSize: '0.875rem',
            color: '#6B7280',
            margin: 0
          }}>
            Sistema de Ventas y Reservaciones
          </p>
        </div>

        {/* Alerta de error */}
        {errorLocal && (
          <div style={{
            backgroundColor: '#FEF2F2',
            border: '1px solid #FCA5A5',
            color: '#B91C1C',
            padding: '0.85rem 1rem',
            borderRadius: '10px',
            fontSize: '0.875rem',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            lineHeight: 1.4
          }}>
            <Icono nombre="alert" tamano={18} color="#B91C1C" />
            <span>{errorLocal}</span>
          </div>
        )}

        {/* Formulario */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <label style={{
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: 600,
              color: '#374151',
              marginBottom: '0.4rem'
            }}>
              Correo Electrónico
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ejemplo@karinga.com"
                required
                disabled={cargando}
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  fontSize: '0.95rem',
                  border: '1.5px solid #E5E7EB',
                  borderRadius: '10px',
                  outline: 'none',
                  boxSizing: 'border-box',
                  transition: 'border-color 0.2s, box-shadow 0.2s'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#2E7D32';
                  e.target.style.boxShadow = '0 0 0 3px rgba(46, 125, 50, 0.15)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#E5E7EB';
                  e.target.style.boxShadow = 'none';
                }}
              />
            </div>
          </div>

          <div>
            <label style={{
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: 600,
              color: '#374151',
              marginBottom: '0.4rem'
            }}>
              Contraseña
            </label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <input
                type={mostrarPassword ? 'text' : 'password'}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                disabled={cargando}
                style={{
                  width: '100%',
                  padding: '0.75rem 2.8rem 0.75rem 1rem',
                  fontSize: '0.95rem',
                  border: '1.5px solid #E5E7EB',
                  borderRadius: '10px',
                  outline: 'none',
                  boxSizing: 'border-box',
                  transition: 'border-color 0.2s, box-shadow 0.2s'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#2E7D32';
                  e.target.style.boxShadow = '0 0 0 3px rgba(46, 125, 50, 0.15)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#E5E7EB';
                  e.target.style.boxShadow = 'none';
                }}
              />
              <button
                type="button"
                onClick={() => setMostrarPassword(!mostrarPassword)}
                tabIndex={-1}
                aria-label={mostrarPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                style={{
                  position: 'absolute',
                  right: '0.75rem',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '4px',
                  color: '#6B7280',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                <Icono nombre={mostrarPassword ? 'view_agenda' : 'visibility'} tamano={20} color="#6B7280" />
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={cargando}
            style={{
              marginTop: '0.5rem',
              backgroundColor: cargando ? '#6B7280' : '#143D2B',
              color: '#FFFFFF',
              fontWeight: 600,
              fontSize: '1rem',
              padding: '0.85rem 1.25rem',
              borderRadius: '10px',
              border: 'none',
              cursor: cargando ? 'not-allowed' : 'pointer',
              boxShadow: '0 4px 6px -1px rgba(20, 61, 43, 0.3)',
              transition: 'background-color 0.2s, transform 0.1s',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem'
            }}
          >
            {cargando ? (
              <span>Iniciando sesión...</span>
            ) : (
              <>
                <span>Ingresar al Sistema</span>
                <Icono nombre="check_circle" tamano={18} color="#FFFFFF" />
              </>
            )}
          </button>
        </form>

        {/* Pie de seguridad */}
        <div style={{
          marginTop: '2rem',
          paddingTop: '1.25rem',
          borderTop: '1px solid #F3F4F6',
          textAlign: 'center',
          fontSize: '0.75rem',
          color: '#9CA3AF',
          lineHeight: 1.5
        }}>
          Acceso protegido con JWT y sesiones encriptadas.<br />
          Para crear o restablecer usuarios, contacte al Administrador.
        </div>
      </div>
    </div>
  );
}

