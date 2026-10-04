import PaginaExportacion from './components/PaginaExportacion';
import Icono from './components/Icono';
import { useState, useEffect, useMemo } from 'react';
import Encabezado from './components/Encabezado';
import NavegacionPaginas from './components/NavegacionPaginas';
import PaginaCabanas from './components/PaginaCabanas';
import PaginaInteracciones from './components/PaginaInteracciones';
import PaginaCalendario from './components/PaginaCalendario';
import PaginaReportes from './components/PaginaReportes';
import ModalSincronizarCalendario from './components/ModalSincronizarCalendario';

// Componentes y Navegación Exclusivos para Celulares
import MobileTopBar from './components/mobile/MobileTopBar';
import MobileBottomNav from './components/mobile/MobileBottomNav';
import PaginaCabanasMobile from './components/mobile/PaginaCabanasMobile';
import PaginaInteraccionesMobile from './components/mobile/PaginaInteraccionesMobile';
import PaginaCalendarioMobile from './components/mobile/PaginaCalendarioMobile';
import { useIsMobile } from './utilidades/useIsMobile';

import {
  obtenerCabanasApi,
  registrarVentaApi,
  obtenerVentasApi,
  asignarHorasExtraApi,
  liquidarSaldoApi,
  registrarDanoDepositoApi,
  descargarExcelBackendApi
} from './servicios/api';
import { exportarExcelCliente } from './servicios/exportarExcel';
import { CABANAS_INICIALES } from './constantes/datosIniciales';
import {
  obtenerDiasTemporadaAltaGuardados,
  guardarDiasTemporadaAltaEnStorage,
  determinarInfoFecha
} from './utilidades/gestorTemporadas';

import './estilos/karinga-theme.css';

function obtenerFechaYHoraActual() {
  const ahora = new Date();
  const anio = ahora.getFullYear();
  const mes = String(ahora.getMonth() + 1).padStart(2, '0');
  const dia = String(ahora.getDate()).padStart(2, '0');
  const horas = String(ahora.getHours()).padStart(2, '0');
  const minutos = String(ahora.getMinutes()).padStart(2, '0');

  return {
    fecha: `${anio}-${mes}-${dia}`,
    hora: `${horas}:${minutos}`
  };
}

export default function App() {
  const actual = obtenerFechaYHoraActual();

  const esMovil = useIsMobile(768);
  const [modoEscritorioForzado, setModoEscritorioForzado] = useState(false);
  const [modalSincronizarGlobal, setModalSincronizarGlobal] = useState(false);

  const [paginaActiva, setPaginaActiva] = useState('cabanas');

  const [fecha, setFecha] = useState(actual.fecha);
  const [hora, setHora] = useState(actual.hora);

  // Días de Temporada Alta configurados (guardados en LocalStorage)
  const [diasTemporadaAlta, setDiasTemporadaAlta] = useState(() => obtenerDiasTemporadaAltaGuardados());

  // Tarifa activa calculada inteligentemente según la fecha inicial (L-V: entre semana, S-D: fin de semana, o festivo)
  const [temporada, setTemporada] = useState(() => {
    const info = determinarInfoFecha(actual.fecha, obtenerDiasTemporadaAltaGuardados());
    return info.temporadaSugerida;
  });

  const [catalogoCabanas, setCatalogoCabanas] = useState(CABANAS_INICIALES);
  const [ventas, setVentas] = useState([]);

  const [registrando, setRegistrando] = useState(false);
  const [cargandoExcel, setCargandoExcel] = useState(false);
  const [mensajeToast, setMensajeToast] = useState(null);
  // Temporizador automático de 4.5 segundos para cerrar notificaciones
  useEffect(() => {
    if (!mensajeToast) return;
    const timer = setTimeout(() => {
      setMensajeToast(null);
    }, 4500);
    return () => clearTimeout(timer);
  }, [mensajeToast]);


  useEffect(() => {
    async function cargarDatos() {
      try {
        const [cabanasData, ventasData] = await Promise.all([
          obtenerCabanasApi(),
          obtenerVentasApi()
        ]);
        if (cabanasData && cabanasData.length > 0) setCatalogoCabanas(cabanasData);
        setVentas(ventasData || []);
      } catch (err) {
        console.error('Error al inicializar datos:', err);
      }
    }
    cargarDatos();
  }, []);

  const recargarVentas = async () => {
    try {
      const lista = await obtenerVentasApi();
      setVentas(lista);
    } catch (err) {
      console.error('Error al recargar:', err);
    }
  };

  // Cambio de fecha: actualiza la fecha y asigna automáticamente la tarifa sugerida
  const manejarCambioFecha = (nuevaFecha) => {
    setFecha(nuevaFecha);
    const info = determinarInfoFecha(nuevaFecha, diasTemporadaAlta);
    setTemporada(info.temporadaSugerida);
  };

  // Actualización del calendario de temporada alta
  const manejarGuardarDiasTemporadaAlta = (nuevaLista) => {
    const listaGuardada = guardarDiasTemporadaAltaEnStorage(nuevaLista);
    setDiasTemporadaAlta(listaGuardada);
    const info = determinarInfoFecha(fecha, listaGuardada);
    setTemporada(info.temporadaSugerida);
  };

  const manejarRegistroVenta = async (payload, alCompletar) => {
    setRegistrando(true);
    try {
      const res = await registrarVentaApi(payload);
      setMensajeToast({ tipo: 'exito', texto: res.mensaje || '¡Movimiento registrado con éxito!' });
      await recargarVentas();
      if (alCompletar) alCompletar();
    } catch (err) {
      console.error('Error al registrar venta:', err);
      setMensajeToast({ tipo: 'error', texto: `No se guardó en la base de datos: ${err.message}` });
    } finally {
      setRegistrando(false);
    }
  };

  const manejarAsignarHorasExtra = async (ventaId, horasOPayload, metodoPago, alCompletar) => {
    let numHoras;
    let metodo;
    let callback = alCompletar;

    if (typeof horasOPayload === 'object' && horasOPayload !== null) {
      numHoras = Number(horasOPayload.horas_extra) || 1;
      metodo = horasOPayload.metodo_pago || 'Efectivo';
      if (typeof metodoPago === 'function') callback = metodoPago;
    } else {
      numHoras = Number(horasOPayload) || 1;
      metodo = metodoPago || 'Efectivo';
    }

    setRegistrando(true);
    try {
      const res = await asignarHorasExtraApi(ventaId, { horas_extra: numHoras, metodo_pago: metodo });
      setMensajeToast({ tipo: 'exito', texto: res.mensaje || 'Horas extra asignadas con éxito' });
      await recargarVentas();
      if (callback) callback();
    } catch (err) {
      setMensajeToast({ tipo: 'error', texto: err.message });
    } finally {
      setRegistrando(false);
    }
  };

  const manejarRegistrarDanoDeposito = async (ventaId, payload, alCompletar) => {
    setRegistrando(true);
    try {
      const res = await registrarDanoDepositoApi(ventaId, payload);
      setMensajeToast({ tipo: 'exito', texto: res.mensaje || 'Deducción de depósito registrada con éxito' });
      await recargarVentas();
      if (alCompletar) alCompletar();
    } catch (err) {
      setMensajeToast({ tipo: 'error', texto: err.message });
    } finally {
      setRegistrando(false);
    }
  };

  const manejarLiquidarSaldo = async (ventaId, payloadOmetodo, montoOcallback, alCompletar) => {
    let payload = {};
    let callback = alCompletar;

    if (typeof payloadOmetodo === 'object' && payloadOmetodo !== null) {
      payload = payloadOmetodo;
      callback = typeof montoOcallback === 'function' ? montoOcallback : alCompletar;
    } else {
      payload = {
        metodo_pago: payloadOmetodo,
        metodo_pago_liquidacion: payloadOmetodo,
        monto_liquidado: montoOcallback
      };
    }

    setRegistrando(true);
    try {
      const res = await liquidarSaldoApi(ventaId, payload);
      setMensajeToast({ tipo: 'exito', texto: res.mensaje || '¡Saldo liquidado con éxito!' });
      await recargarVentas();
      if (callback) callback();
    } catch (err) {
      setMensajeToast({ tipo: 'error', texto: err.message });
    } finally {
      setRegistrando(false);
    }
  };

  const manejarExportarExcel = async (tipo = 'todos') => {
    setCargandoExcel(true);
    try {
      await descargarExcelBackendApi(tipo);
    } catch (errBackend) {
      console.warn('Descargando Excel cliente:', errBackend.message);
      try {
        exportarExcelCliente(ventas, tipo);
      } catch (errCliente) {
        setMensajeToast({ tipo: 'error', texto: errCliente.message });
      }
    } finally {
      setCargandoExcel(false);
    }
  };

  const conteoPendientes = useMemo(() => {
    return ventas.filter((v) => {
      if (!v.cabana_id) return false;
      const estado = String(v.estado_pago || '').toLowerCase();
      const saldo = Number(v.saldo_pendiente);
      const total = Number(v.total) || 0;
      const anticipo = Number(v.anticipo) || 0;
      return (
        estado === 'pendiente' ||
        estado === 'no pagado' ||
        estado === 'anticipo_pagado' ||
        estado === 'apartado' ||
        saldo > 0 ||
        (anticipo < total && estado !== 'liquidado')
      );
    }).length;
  }, [ventas]);

  const esVistaMovilActiva = esMovil && !modoEscritorioForzado;

  return (
    <div className={`karinga-contenedor ${esVistaMovilActiva ? 'karinga-contenedor-movil' : ''}`}>
      {/* MODO MÓVIL: TopBar Compacto */}
      {esVistaMovilActiva ? (
        <MobileTopBar
          fecha={fecha}
          paginaActiva={paginaActiva}
          onAbrirSincronizacion={
            (paginaActiva === 'cabanas' || paginaActiva === 'calendario')
              ? () => setModalSincronizarGlobal(true)
              : null
          }
          modoEscritorioForzado={modoEscritorioForzado}
          setModoEscritorioForzado={setModoEscritorioForzado}
        />
      ) : (
        /* MODO ESCRITORIO: Encabezado Completo y Navegación de 5 Tarjetas */
        <>
          {esMovil && modoEscritorioForzado && (
            <aside aria-label="Aviso de versión de escritorio" className="karinga-banner-modo-pc">
              <div className="karinga-banner-modo-pc-contenido">
                <span className="karinga-banner-modo-pc-texto">
                  <Icono nombre="settings" tamano={15} color="#92400E" />
                  <span>Modo Computadora activo en celular</span>
                </span>
                <button
                  type="button"
                  className="karinga-btn-volver-movil"
                  onClick={() => setModoEscritorioForzado(false)}
                >
                  <Icono nombre="nature" tamano={14} color="#FFFFFF" />
                  <span>Volver a vista celular</span>
                </button>
              </div>
            </aside>
          )}

          <Encabezado
            alExportarExcel={() => manejarExportarExcel('todos')}
            cargandoExcel={cargandoExcel}
          />
          <NavegacionPaginas
            paginaActiva={paginaActiva}
            alCambiarPagina={setPaginaActiva}
            conteoVentas={ventas.length}
          />
        </>
      )}

      {mensajeToast && (
        <div className={`karinga-alerta-toast ${mensajeToast.tipo}`}>
          <div className="karinga-toast-icono">
            <Icono nombre={mensajeToast.tipo === 'exito' ? 'check' : 'alert'} tamano={18} color="currentColor" />
          </div>
          <div className="karinga-toast-texto">
            <span>{mensajeToast.texto}</span>
          </div>
          <button
            type="button"
            className="karinga-toast-cerrar"
            onClick={() => setMensajeToast(null)}
            title="Cerrar notificación"
          >
            <Icono nombre="close" tamano={14} color="currentColor" />
          </button>
          <div className="karinga-toast-barra-tiempo" />
        </div>
      )}

      {/* RENDERIZADO DE PÁGINAS: MÓVIL DEDICADO vs ESCRITORIO */}
      {paginaActiva === 'cabanas' && (
        esVistaMovilActiva ? (
          <PaginaCabanasMobile
            cabanas={catalogoCabanas}
            ventas={ventas}
            alRegistrar={manejarRegistroVenta}
            alAsignarHorasExtra={manejarAsignarHorasExtra}
            alRegistrarDanoDeposito={manejarRegistrarDanoDeposito}
            alLiquidarSaldo={manejarLiquidarSaldo}
            registrando={registrando}
            fecha={fecha}
            alCambiarFecha={manejarCambioFecha}
            hora={hora}
            alCambiarHora={setHora}
            temporada={temporada}
            alCambiarTemporada={setTemporada}
            diasTemporadaAlta={diasTemporadaAlta}
            alGuardarDiasTemporadaAlta={manejarGuardarDiasTemporadaAlta}
            alRecargarVentas={recargarVentas}
          />
        ) : (
          <PaginaCabanas
            cabanas={catalogoCabanas}
            ventas={ventas}
            alRegistrar={manejarRegistroVenta}
            alAsignarHorasExtra={manejarAsignarHorasExtra}
            alRegistrarDanoDeposito={manejarRegistrarDanoDeposito}
            alLiquidarSaldo={manejarLiquidarSaldo}
            registrando={registrando}
            fecha={fecha}
            alCambiarFecha={manejarCambioFecha}
            hora={hora}
            alCambiarHora={setHora}
            temporada={temporada}
            alCambiarTemporada={setTemporada}
            diasTemporadaAlta={diasTemporadaAlta}
            alGuardarDiasTemporadaAlta={manejarGuardarDiasTemporadaAlta}
            alRecargarVentas={recargarVentas}
          />
        )
      )}

      {paginaActiva === 'interacciones' && (
        esVistaMovilActiva ? (
          <PaginaInteraccionesMobile
            alRegistrar={manejarRegistroVenta}
            registrando={registrando}
            fecha={fecha}
            alCambiarFecha={manejarCambioFecha}
            hora={hora}
            alCambiarHora={setHora}
            diasTemporadaAlta={diasTemporadaAlta}
          />
        ) : (
          <PaginaInteracciones
            alRegistrar={manejarRegistroVenta}
            registrando={registrando}
            fecha={fecha}
            alCambiarFecha={manejarCambioFecha}
            hora={hora}
            alCambiarHora={setHora}
            diasTemporadaAlta={diasTemporadaAlta}
          />
        )
      )}

      {paginaActiva === 'calendario' && (
        esVistaMovilActiva ? (
          <PaginaCalendarioMobile
            ventas={ventas}
            cabanas={catalogoCabanas}
          />
        ) : (
          <PaginaCalendario
            ventas={ventas}
            cabanas={catalogoCabanas}
          />
        )
      )}

      {paginaActiva === 'exportacion' && (
        <PaginaExportacion
          ventas={ventas}
          alExportarExcel={manejarExportarExcel}
          cargandoExcel={cargandoExcel}
          alCambiarPagina={setPaginaActiva}
        />
      )}

      {paginaActiva === 'reportes' && (
        <PaginaReportes
          ventas={ventas}
          alExportarExcel={manejarExportarExcel}
          cargandoExcel={cargandoExcel}
          alRecargar={recargarVentas}
          alCambiarPagina={setPaginaActiva}
        />
      )}

      {/* BARRA DE NAVEGACIÓN INFERIOR MÓVIL (BOTTOM NAV) */}
      {esVistaMovilActiva && (
        <MobileBottomNav
          paginaActiva={paginaActiva}
          alCambiarPagina={setPaginaActiva}
          conteoPendientes={conteoPendientes}
        />
      )}


      {/* MODAL GLOBAL DE GOOGLE CALENDAR */}
      {modalSincronizarGlobal && (
        <ModalSincronizarCalendario
          abierto={modalSincronizarGlobal}
          alCerrar={() => setModalSincronizarGlobal(false)}
          alSeleccionarReservacion={() => {
            setModalSincronizarGlobal(false);
            setPaginaActiva('cabanas');
          }}
          cabanas={catalogoCabanas}
        />
      )}
    </div>
  );
}
