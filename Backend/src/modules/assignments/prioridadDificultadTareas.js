// Módulo para asignar prioridades y dificultades a las tareas
const prioridadMap = { alta: 3, media: 2, baja: 1 };

export const ordenarTareas = (tareas) => {
  return tareas.sort((a, b) => {
    const prioridadA = prioridadMap[a.prioridad] || 0; 
    const prioridadB = prioridadMap[b.prioridad] || 0;

    // Primero por prioridad (de mayor a menor), luego por dificultad (de mayor a menor)
    if (prioridadB !== prioridadA) return prioridadB - prioridadA;
    return (b.nivelDificultad || 0) - (a.nivelDificultad || 0);
  });
};
