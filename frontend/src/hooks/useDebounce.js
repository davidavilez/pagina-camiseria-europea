import { useEffect, useState } from 'react';

/** Devuelve `valor` solo cuando deja de cambiar durante `espera` ms. */
export default function useDebounce(valor, espera = 400) {
  const [retrasado, setRetrasado] = useState(valor);

  useEffect(() => {
    const temporizador = setTimeout(() => setRetrasado(valor), espera);
    return () => clearTimeout(temporizador);
  }, [valor, espera]);

  return retrasado;
}
