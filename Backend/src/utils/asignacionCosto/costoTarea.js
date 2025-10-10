/**
 * Calcula el costo total para una tarea según las horas y el costo por hora del dev
 */
export function calcularCostoDev(dev, horasTarea) {
  return dev.costoPorHora * horasTarea;
}
