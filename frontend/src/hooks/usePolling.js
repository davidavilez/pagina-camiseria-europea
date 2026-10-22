import { useCallback, useEffect, useRef, useState } from 'react';
import { mensajeDeError } from '../api/client';

export const INTERVALO_TIEMPO_REAL = 5000;

/**
 * Consulta `cargarDatos` al montar y cada `intervalo` ms (actualización en
 * "tiempo real" por polling). Se pausa mientras la pestaña está oculta.
 */
export default function usePolling(cargarDatos, intervalo = INTERVALO_TIEMPO_REAL) {
  const [datos, setDatos] = useState(null);
  const [error, setError] = useState('');
  const [ultimaActualizacion, setUltimaActualizacion] = useState(null);
  const [version, setVersion] = useState(0);
  const cargarRef = useRef(cargarDatos);

  useEffect(() => {
    cargarRef.current = cargarDatos;
  });

  useEffect(() => {
    let activo = true;

    const consultar = async () => {
      if (document.hidden) return;
      try {
        const resultado = await cargarRef.current();
        if (!activo) return;
        setDatos(resultado);
        setError('');
        setUltimaActualizacion(new Date());
      } catch (err) {
        if (activo) setError(mensajeDeError(err));
      }
    };

    consultar();
    const temporizador = setInterval(consultar, intervalo);
    document.addEventListener('visibilitychange', consultar);

    return () => {
      activo = false;
      clearInterval(temporizador);
      document.removeEventListener('visibilitychange', consultar);
    };
  }, [intervalo, version]);

  const recargar = useCallback(() => setVersion((v) => v + 1), []);

  return { datos, error, cargando: datos === null && !error, ultimaActualizacion, recargar };
}
