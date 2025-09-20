// 👉 genera rango de días hábiles (lunes a viernes)
export function obtenerDiasDisponibles(fechaInicio, fechaFin) {
  const dias = [];
  let fecha = new Date(fechaInicio);
  while (fecha <= fechaFin) {
    const diaSemana = fecha.getDay();
    if (diaSemana >= 1 && diaSemana <= 5) {
      dias.push(new Date(fecha));
    }
    fecha.setDate(fecha.getDate() + 1);
  }
  return dias;
}
