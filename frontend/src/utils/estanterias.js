export const estaLlena = (estanteria) => estanteria.disponibles <= 0;

/** Texto de la opción de un select, por ejemplo "A-01 (42/60)" o "A-01 (60/60) · Llena". */
export const etiquetaEstanteria = (estanteria) => {
  const ocupacion = `${estanteria.codigo} (${estanteria.ocupacion}/${estanteria.capacidad})`;
  return estaLlena(estanteria) ? `${ocupacion} · Llena` : ocupacion;
};
