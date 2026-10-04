export default function Icono({ nombre, tamano = 18, color = 'currentColor', className = '', style = {} }) {
  const propsBase = {
    width: tamano,
    height: tamano,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: color,
    strokeWidth: 2,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    className: `karinga-svg-icon ${className}`,
    style: { display: 'inline-block', verticalAlign: 'middle', flexShrink: 0, ...style }
  };

  switch (nombre) {
    case 'calendar':
    case 'calendario':
      return (
        <svg {...propsBase}>
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
      );

    case 'calendar-check':
      return (
        <svg {...propsBase}>
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
          <polyline points="9 16 11 18 15 14" />
        </svg>
      );

    case 'calendar-days':
      return (
        <svg {...propsBase}>
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
          <path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01M16 18h.01" />
        </svg>
      );

    case 'filter':
    case 'filtro':
      return (
        <svg {...propsBase}>
          <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
        </svg>
      );

    case 'clock':
    case 'reloj':
      return (
        <svg {...propsBase}>
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
      );

    case 'stopwatch':
    case 'horas-extra':
      return (
        <svg {...propsBase}>
          <circle cx="12" cy="14" r="8" />
          <line x1="12" y1="10" x2="12" y2="14" />
          <line x1="12" y1="2" x2="12" y2="4" />
          <line x1="10" y1="2" x2="14" y2="2" />
        </svg>
      );

    case 'bed':
    case 'cabana':
    case 'hotel':
      return (
        <svg {...propsBase}>
          <path d="M2 4v16M2 8h18a2 2 0 0 1 2 2v10M2 17h20M6 8v9" />
          <circle cx="7" cy="12" r="1.5" fill="currentColor" />
        </svg>
      );

    case 'ticket':
    case 'actividades':
      return (
        <svg {...propsBase}>
          <path d="M2 9a3 3 0 0 1 0 6v3a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-3a3 3 0 0 1 0-6V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2z" />
          <line x1="13" y1="5" x2="13" y2="19" strokeDasharray="2 2" />
        </svg>
      );

    case 'tent':
    case 'camping':
      return (
        <svg {...propsBase}>
          <path d="M19 20L10 4 1 20h18z" />
          <path d="M10 4l9 16" />
          <path d="M14 20l-4-7-4 7" />
        </svg>
      );

    case 'chart':
    case 'chart-bar':
    case 'metricas':
    case 'reportes':
      return (
        <svg {...propsBase}>
          <line x1="18" y1="20" x2="18" y2="10" />
          <line x1="12" y1="20" x2="12" y2="4" />
          <line x1="6" y1="20" x2="6" y2="14" />
          <line x1="2" y1="20" x2="22" y2="20" />
        </svg>
      );

    case 'excel':
    case 'file-excel':
      return (
        <svg {...propsBase}>
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <path d="M8 13l3 4m0-4l-3 4" />
          <line x1="14" y1="13" x2="16" y2="13" />
          <line x1="14" y1="17" x2="16" y2="17" />
        </svg>
      );

    case 'credit-card':
    case 'tarjeta':
      return (
        <svg {...propsBase}>
          <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
          <line x1="1" y1="10" x2="23" y2="10" />
        </svg>
      );

    case 'cash':
    case 'efectivo':
    case 'money-bill':
      return (
        <svg {...propsBase}>
          <rect x="2" y="6" width="20" height="12" rx="2" />
          <circle cx="12" cy="12" r="2.5" />
          <path d="M6 12h.01M18 12h.01" />
        </svg>
      );

    case 'globe':
    case 'web':
      return (
        <svg {...propsBase}>
          <circle cx="12" cy="12" r="10" />
          <line x1="2" y1="12" x2="22" y2="12" />
          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
        </svg>
      );

    case 'bank':
    case 'banco':
    case 'transferencia':
      return (
        <svg {...propsBase}>
          <line x1="2" y1="21" x2="22" y2="21" />
          <line x1="4" y1="10" x2="4" y2="18" />
          <line x1="9" y1="10" x2="9" y2="18" />
          <line x1="15" y1="10" x2="15" y2="18" />
          <line x1="20" y1="10" x2="20" y2="18" />
          <polygon points="12 2 2 7 22 7" />
          <line x1="2" y1="18" x2="22" y2="18" />
        </svg>
      );

    case 'user':
    case 'huesped':
      return (
        <svg {...propsBase}>
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      );

    case 'users':
    case 'personas':
      return (
        <svg {...propsBase}>
          <path d="M17 21v-2a4 4 0 0 0-3-3.87M9 21v-2a4 4 0 0 1 3-3.87M9 21H3v-2a4 4 0 0 1 4-4h2M16 3.13a4 4 0 0 1 0 7.75M12 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0z" />
        </svg>
      );


    case 'alert':
    case 'alerta':
    case 'warning':
      return (
        <svg {...propsBase}>
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
          <line x1="12" y1="9" x2="12" y2="13" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
      );

    case 'info':
    case 'informacion':
      return (
        <svg {...propsBase}>
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="16" x2="12" y2="12" />
          <line x1="12" y1="8" x2="12.01" y2="8" />
        </svg>
      );

    case 'star':
    case 'estrella':
      return (
        <svg {...propsBase}>
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      );

    case 'tag':
    case 'etiqueta':
      return (
        <svg {...propsBase}>
          <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
          <line x1="7" y1="7" x2="7.01" y2="7" />
        </svg>
      );

    case 'gear':
    case 'ajustes':
      return (
        <svg {...propsBase}>
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
      );

    case 'receipt':
    case 'recibo':
      return (
        <svg {...propsBase}>
          <path d="M4 2v20l3-2 3 2 3-2 3 2 4-2V2l-4 2-3-2-3 2-3-2-3 2z" />
          <line x1="8" y1="7" x2="16" y2="7" />
          <line x1="8" y1="11" x2="16" y2="11" />
          <line x1="8" y1="15" x2="12" y2="15" />
        </svg>
      );

    case 'plus':
    case 'mas':
      return (
        <svg {...propsBase}>
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      );

    case 'trash':
    case 'eliminar':
      return (
        <svg {...propsBase}>
          <polyline points="3 6 5 6 21 6" />
          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
        </svg>
      );

    case 'search':
    case 'buscar':
      return (
        <svg {...propsBase}>
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
      );

    case 'eye':
    case 'ojo':
    case 'ver':
      return (
        <svg {...propsBase}>
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      );

    case 'door-open':
    case 'salida':
    case 'checkout':
      return (
        <svg {...propsBase}>
          <path d="M13 4h3a2 2 0 0 1 2 2v14" />
          <path d="M2 20h20" />
          <path d="M13 20V4a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v16" />
          <circle cx="9" cy="12" r="1" fill="currentColor" />
        </svg>
      );

    case 'door-closed':
    case 'entrada':
    case 'checkin':
      return (
        <svg {...propsBase}>
          <path d="M4 20h16M4 4h16v16H4V4z" />
          <circle cx="8" cy="12" r="1" fill="currentColor" />
        </svg>
      );

    case 'arrow-down':
    case 'descarga':
      return (
        <svg {...propsBase}>
          <line x1="12" y1="5" x2="12" y2="19" />
          <polyline points="19 12 12 19 5 12" />
        </svg>
      );

    case 'arrow-down-line':
    case 'anticipo':
      return (
        <svg {...propsBase}>
          <path d="M12 3v13M5 11l7 7 7-7M3 21h18" />
        </svg>
      );

    case 'hand-coins':
    case 'liquidacion':
    case 'cobro':
      return (
        <svg {...propsBase}>
          <path d="M11 15h2a2 2 0 1 0 0-4h-3c-.6 0-1.1.2-1.4.6L3 17" />
          <path d="M7 21h12a2 2 0 0 0 2-2v-2" />
          <circle cx="18" cy="6" r="3" />
        </svg>
      );

    case 'nature':
    case 'arbol':
      return (
        <svg {...propsBase}>
          <path d="M12 2L6 8h3l-4 6h4l-3 4h12l-3-4h4l-4-6h3L12 2z" />
          <line x1="12" y1="20" x2="12" y2="22" strokeWidth="3" />
        </svg>
      );

    case 'fresa':
    case 'planta':
      return (
        <svg {...propsBase}>
          <path d="M12 2a3 3 0 0 0-3 3c0 1 .5 2 1.5 2.5C7.5 9 5 12 5 15a7 7 0 0 0 14 0c0-3-2.5-6-5.5-7.5C14.5 7 15 6 15 5a3 3 0 0 0-3-3z" />
          <path d="M10 13h.01M14 13h.01M12 16h.01M10 18h.01M14 18h.01" />
        </svg>
      );

    case 'tirolesa':
    case 'aventura':
      return (
        <svg {...propsBase}>
          <path d="M4 4l16 16" />
          <circle cx="12" cy="10" r="2" />
          <path d="M10 12l2 4 4-2" />
          <path d="M12 8V6" />
        </svg>
      );

    case 'horse':
    case 'cabalgata':
      return (
        <svg {...propsBase}>
          <path d="M19 17l-3-4-2 2-3-4-4 2 2-7 6-2 5 4 1 5-2 4z" />
          <path d="M7 13l-3 5h3l2-3" />
          <path d="M13 15l2 6h3l-2-6" />
        </svg>
      );

    case 'hiking':
    case 'senderismo':
      return (
        <svg {...propsBase}>
          <path d="M13 4a2 2 0 1 0-4 0 2 2 0 0 0 4 0z" />
          <path d="M6 21l3-6 2 2v5" />
          <path d="M17 21l-2-7-3 1-1-4 4-2 3 5" />
          <path d="M19 12l2 9" />
          <path d="M4 17l4-2" />
        </svg>
      );

    case 'gotcha':
    case 'target':
      return (
        <svg {...propsBase}>
          <circle cx="12" cy="12" r="10" />
          <circle cx="12" cy="12" r="6" />
          <circle cx="12" cy="12" r="2" />
        </svg>
      );

    case 'paw':
    case 'animales':
    case 'interaccion':
      return (
        <svg {...propsBase}>
          <circle cx="12" cy="14" r="4" />
          <circle cx="6.5" cy="10.5" r="2" />
          <circle cx="10" cy="6.5" r="2" />
          <circle cx="14" cy="6.5" r="2" />
          <circle cx="17.5" cy="10.5" r="2" />
        </svg>
      );

    case 'honey':
    case 'miel':
      return (
        <svg {...propsBase}>
          <path d="M12 2v2M8 4h8a2 2 0 0 1 2 2v1H6V6a2 2 0 0 1 2-2z" />
          <path d="M5 9h14a2 2 0 0 1 2 2v7a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4v-7a2 2 0 0 1 2-2z" />
          <line x1="8" y1="14" x2="16" y2="14" />
        </svg>
      );

    case 'egg':
    case 'huevo':
      return (
        <svg {...propsBase}>
          <path d="M12 2C8 2 5 8 5 14a7 7 0 0 0 14 0c0-6-3-12-7-12z" />
        </svg>
      );

    case 'package':
    case 'paquete':
      return (
        <svg {...propsBase}>
          <line x1="16.5" y1="9.4" x2="7.5" y2="4.21" />
          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
          <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
          <line x1="12" y1="22.08" x2="12" y2="12" />
        </svg>
      );

    case 'close':
    case 'cerrar':
      return (
        <svg {...propsBase}>
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      );


    case 'refresh':
    case 'recargar':
    case 'actualizar':
      return (
        <svg {...propsBase}>
          <polyline points="23 4 23 10 17 10" />
          <polyline points="1 20 1 14 7 14" />
          <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
        </svg>
      );

    case 'clipboard':
    case 'portapapeles':
    case 'historial':
      return (
        <svg {...propsBase}>
          <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
          <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
        </svg>
      );

    case 'folder':
    case 'carpeta':
      return (
        <svg {...propsBase}>
          <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
        </svg>
      );

    case 'sparkles':
    case 'destello':
      return (
        <svg {...propsBase}>
          <path d="M12 3l1.912 5.885L20 10l-5.088 2.115L13 18l-1.912-5.885L6 10l5.088-1.115L12 3z" />
        </svg>
      );

    case 'shield':
    case 'seguridad':
    case 'deposito':
      return (
        <svg {...propsBase}>
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
      );

    case 'damage':
    case 'perdida':
    case 'dano':
      return (
        <svg {...propsBase}>
          <circle cx="12" cy="12" r="10" />
          <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
        </svg>
      );

    case 'home':
    case 'casa':
      return (
        <svg {...propsBase}>
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
      );

    case 'check':
    case 'exito':
      return (
        <svg {...propsBase}>
          <polyline points="20 6 9 17 4 12" />
        </svg>
      );
    default:
      return (
        <svg {...propsBase}>
          <circle cx="12" cy="12" r="3" fill="currentColor" />
        </svg>
      );
  }
}
