/**
 * Servicio de Asignación Automática
 * Replica la lógica del backend filtroDisponibilidad.js
 */

class AssignmentService {
  /**
   * Genera un rango de fechas de inicio a fin (solo días hábiles)
   * @param {Date} fechaInicio - Fecha de inicio
   * @param {Date} fechaFin - Fecha de fin
   * @returns {Date[]} Array de fechas (solo días hábiles)
   */
  generarRangoDias(fechaInicio, fechaFin) {
    const dias = [];
    let fecha = new Date(fechaInicio);
    
    while (fecha <= fechaFin) {
      const diaSemana = fecha.getDay();
      // Solo días hábiles (lunes a viernes)
      if (diaSemana >= 1 && diaSemana <= 5) {
        dias.push(new Date(fecha));
      }
      fecha.setDate(fecha.getDate() + 1);
    }
    
    return dias;
  }

  /**
   * Verifica si un desarrollador cumple con un porcentaje mínimo de habilidades requeridas
   * @param {Object} dev - Usuario desarrollador
   * @param {Array} habilidadesRequeridas - Array de nombres de habilidades de la tarea
   * @param {Number} porcentajeMinimo - Ej: 0.7 = 70%
   * @returns {Boolean}
   */
  tieneHabilidadesSuficientes(dev, habilidadesRequeridas, porcentajeMinimo = 1) {
    if (!habilidadesRequeridas || habilidadesRequeridas.length === 0) return true;

    // Normalizar nombres: todo a minúsculas y quitar espacios iniciales/finales
    const habDev = dev.habilidades.map(h => h.nombre.trim().toLowerCase());
    const habReq = habilidadesRequeridas.map(h => h.trim().toLowerCase());

    // Contar cuántas habilidades requeridas tiene el dev
    const cantidadCumplida = habReq.filter(h => habDev.includes(h)).length;

    // Verificar porcentaje mínimo
    return cantidadCumplida / habReq.length >= porcentajeMinimo;
  }

  /**
   * Ordena tareas por prioridades y dificultades
   * @param {Array} tareas - Array de tareas
   * @returns {Array} Tareas ordenadas
   */
  ordenarTareas(tareas) {
    const prioridadMap = { alta: 3, media: 2, baja: 1 };
    
    return tareas.sort((a, b) => {
      const prioridadA = prioridadMap[a.prioridad] || 0;
      const prioridadB = prioridadMap[b.prioridad] || 0;

      // Primero por prioridad (de mayor a menor), luego por dificultad (de mayor a menor)
      if (prioridadB !== prioridadA) return prioridadB - prioridadA;
      return (b.nivelDificultad || 0) - (a.nivelDificultad || 0);
    });
  }

  /**
   * Calcula las horas disponibles totales de un desarrollador en un rango de fechas
   * @param {Object} dev - Desarrollador
   * @param {Array} diasDisponibles - Array de fechas
   * @returns {Number} Horas disponibles totales
   */
  calcularHorasDisponiblesTotales(dev, diasDisponibles) {
    let horasDisponiblesTotales = 0;
    
    for (const dia of diasDisponibles) {
      const diaISO = dia.toISOString().split("T")[0];
      let registroDia = dev.calendario?.find(d => 
        d.fecha.toISOString().split("T")[0] === diaISO
      );

      if (!registroDia) {
        // Si no existe registro para este día, asumir 8 horas disponibles
        horasDisponiblesTotales += 8;
      } else {
        horasDisponiblesTotales += registroDia.horasDisponibles;
      }
    }

    return horasDisponiblesTotales;
  }

  /**
   * Encuentra los candidatos que cumplen habilidades y tienen disponibilidad
   * @param {Array} desarrolladores - Array de desarrolladores
   * @param {Object} tarea - Tarea a asignar
   * @param {Array} diasDisponibles - Días disponibles para la tarea
   * @returns {Array} Array de candidatos válidos
   */
  encontrarCandidatos(desarrolladores, tarea, diasDisponibles) {
    return desarrolladores.filter(dev => {
      // Verificar que no sea admin
      if (dev.rol === 'admin') return false;

      // Verificar habilidades suficientes (70% mínimo)
      if (!this.tieneHabilidadesSuficientes(dev, tarea.habilidadesRequeridas, 0.7)) {
        return false;
      }

      // Verificar disponibilidad de horas
      const horasDisponiblesTotales = this.calcularHorasDisponiblesTotales(dev, diasDisponibles);
      return horasDisponiblesTotales >= tarea.tiempoEstimadoHoras;
    });
  }

  /**
   * Selecciona el mejor desarrollador basado en mayor disponibilidad
   * @param {Array} candidatos - Array de candidatos válidos
   * @param {Array} diasDisponibles - Días disponibles para la tarea
   * @returns {Object|null} Mejor desarrollador o null si no hay candidatos
   */
  seleccionarMejorDesarrollador(candidatos, diasDisponibles) {
    if (candidatos.length === 0) return null;

    return candidatos.reduce((mejor, actual) => {
      const horasMejor = this.calcularHorasDisponiblesTotales(mejor, diasDisponibles);
      const horasActual = this.calcularHorasDisponiblesTotales(actual, diasDisponibles);
      
      return horasActual > horasMejor ? actual : mejor;
    });
  }

  /**
   * Simula la asignación de horas en el calendario del desarrollador
   * @param {Object} dev - Desarrollador
   * @param {Object} tarea - Tarea
   * @param {Array} diasDisponibles - Días disponibles
   * @returns {Object} Información de la asignación
   */
  simularAsignacionCalendario(dev, tarea, diasDisponibles) {
    let horasRestantes = tarea.tiempoEstimadoHoras;
    const diasAsignados = [];

    for (const dia of diasDisponibles) {
      if (horasRestantes <= 0) break;

      const diaISO = dia.toISOString().split("T")[0];
      let registroDia = dev.calendario?.find(d => 
        d.fecha.toISOString().split("T")[0] === diaISO
      );

      if (!registroDia) {
        registroDia = { fecha: new Date(dia), horasDisponibles: 8 };
        // En el frontend, no podemos modificar directamente el calendario del backend
        // Solo simulamos para mostrar el resultado
      }

      const horasAsignadas = Math.min(registroDia.horasDisponibles, horasRestantes);

      if (horasAsignadas > 0) {
        horasRestantes -= horasAsignadas;
        diasAsignados.push({
          inicio: new Date(dia),
          horasAsignadas
        });
      }
    }

    return {
      diasAsignados,
      horasAsignadasTotales: tarea.tiempoEstimadoHoras - horasRestantes,
      horasRestantes
    };
  }

  /**
   * Ejecuta la asignación automática con calendario
   * @param {String} projectId - ID del proyecto
   * @param {Array} tareas - Array de tareas del proyecto
   * @param {Array} desarrolladores - Array de desarrolladores
   * @returns {Object} Resultado de la asignación
   */
  async asignarTareasConCalendario(projectId, tareas, desarrolladores) {
    // Filtrar tareas pendientes sin asignar
    const tareasPendientes = tareas.filter(tarea => 
      !tarea.desarrolladorAsignado && tarea.estado === "pendiente"
    );

    if (tareasPendientes.length === 0) {
      return { 
        message: "No hay tareas pendientes en este proyecto", 
        resumen: [] 
      };
    }

    // Ordenar tareas por prioridad y dificultad
    const tareasOrdenadas = this.ordenarTareas(tareasPendientes);
    const resumen = [];

    for (const tarea of tareasOrdenadas) {
      const fechaInicio = new Date(tarea.fechaEstimadaInicio);
      const fechaFin = new Date(tarea.fechaEstimadaFin);
      const diasDisponibles = this.generarRangoDias(fechaInicio, fechaFin);

      // Encontrar candidatos
      const candidatos = this.encontrarCandidatos(desarrolladores, tarea, diasDisponibles);

      if (candidatos.length === 0) {
        resumen.push({
          tarea: tarea.descripcion,
          asignado: null,
          motivo: "No hay dev con disponibilidad suficiente en el rango de fechas",
          diasAsignados: [],
          horasAsignadasTotales: 0
        });
        continue;
      }

      // Seleccionar mejor desarrollador
      const mejorDev = this.seleccionarMejorDesarrollador(candidatos, diasDisponibles);

      if (mejorDev) {
        // Simular asignación en calendario
        const asignacionInfo = this.simularAsignacionCalendario(mejorDev, tarea, diasDisponibles);

        resumen.push({
          tarea: tarea.descripcion,
          asignado: `${mejorDev.nombre} ${mejorDev.apellido}`,
          desarrolladorId: mejorDev._id,
          dias: asignacionInfo.diasAsignados,
          horasAsignadasTotales: asignacionInfo.horasAsignadasTotales,
          tareaId: tarea._id
        });
      }
    }

    return {
      message: "Asignación automática con calendario diario completada",
      resumen
    };
  }
}

export default new AssignmentService();
