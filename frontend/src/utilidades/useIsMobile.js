import { useState, useEffect } from 'react';

/**
 * Hook para detectar si el dispositivo se encuentra en pantalla móvil (por defecto <= 768px).
 * Se actualiza reactivamente al rotar la pantalla o cambiar el tamaño de la ventana.
 */
export function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth <= breakpoint;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia(`(max-width: ${breakpoint}px)`);
    const actualizar = (e) => setIsMobile(e.matches);

    setIsMobile(mediaQuery.matches);

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', actualizar);
      return () => mediaQuery.removeEventListener('change', actualizar);
    } else {
      mediaQuery.addListener(actualizar);
      return () => mediaQuery.removeListener(actualizar);
    }
  }, [breakpoint]);

  return isMobile;
}

