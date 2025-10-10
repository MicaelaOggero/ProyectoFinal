/**
 * Devuelve el desarrollador con menor costo por hora.
 */
export function seleccionarDevMasBarato(candidatos) {
  return candidatos.reduce((a, b) =>
    a.costoPorHora < b.costoPorHora ? a : b
  );
}

