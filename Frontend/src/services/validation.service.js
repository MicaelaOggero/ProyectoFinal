const API_URL = process.env.VUE_APP_API_URL || 'http://localhost:8080/api';

import axios from 'axios';

// Configurar axios para enviar cookies
axios.defaults.withCredentials = true;

class ValidationService {
  /**
   * Valida que una tarea no supere las 8 horas si empieza y termina el mismo día
   * @param {Object} taskData - Datos de la tarea
   * @returns {Object} - { isValid: boolean, message: string }
   */
  validateSameDayHours(taskData) {
    const { fechaEstimadaInicio, fechaEstimadaFin, tiempoEstimadoHoras } = taskData;
    
    if (!fechaEstimadaInicio || !fechaEstimadaFin || !tiempoEstimadoHoras) {
      return { isValid: false, message: 'Faltan datos requeridos para la validación' };
    }

    const startDate = new Date(fechaEstimadaInicio);
    const endDate = new Date(fechaEstimadaFin);
    
    // Verificar si empieza y termina el mismo día
    const isSameDay = startDate.toDateString() === endDate.toDateString();
    
    if (isSameDay && tiempoEstimadoHoras > 8) {
      return {
        isValid: false,
        message: `Una tarea que empieza y termina el mismo día no puede superar las 8 horas. Tiempo estimado: ${tiempoEstimadoHoras}h`
      };
    }

    return { isValid: true, message: 'Validación de horas exitosa' };
  }

  /**
   * Valida la disponibilidad de un desarrollador para un rango de fechas
   * @param {string} developerId - ID del desarrollador
   * @param {string} startDate - Fecha de inicio (YYYY-MM-DD)
   * @param {string} endDate - Fecha de fin (YYYY-MM-DD)
   * @param {number} requiredHours - Horas requeridas
   * @returns {Promise<Object>} - { isValid: boolean, message: string, availableHours: number }
   */
  async validateDeveloperAvailability(developerId, startDate, endDate, requiredHours) {
    try {
      // Obtener el calendario del desarrollador para el rango de fechas
      const start = new Date(startDate);
      const end = new Date(endDate);
      const availableHours = {};

      // Iterar por cada mes en el rango
      let currentMonth = new Date(start.getFullYear(), start.getMonth(), 1);
      const endMonth = new Date(end.getFullYear(), end.getMonth(), 1);

      while (currentMonth <= endMonth) {
        const monthStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}`;
        
        try {
          const response = await axios.get(`${API_URL}/user/${developerId}/calendario?month=${monthStr}`);
          
          if (response.data && response.data.calendario) {
            response.data.calendario.forEach(entry => {
              const entryDate = new Date(entry.fecha).toISOString().split('T')[0];
              const entryStart = new Date(startDate).toISOString().split('T')[0];
              const entryEnd = new Date(endDate).toISOString().split('T')[0];
              
              // Solo considerar fechas dentro del rango de la tarea
              if (entryDate >= entryStart && entryDate <= entryEnd) {
                availableHours[entryDate] = entry.horasDisponibles || 8;
              }
            });
          }
        } catch (error) {
          console.warn(`Error obteniendo calendario para ${monthStr}:`, error);
          // Asumir 8 horas por día laboral si no se puede obtener el calendario
          const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
          for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
            const dateStr = date.toISOString().split('T')[0];
            const entryStart = new Date(startDate).toISOString().split('T')[0];
            const entryEnd = new Date(endDate).toISOString().split('T')[0];
            
            if (dateStr >= entryStart && dateStr <= entryEnd && date.getDay() >= 1 && date.getDay() <= 5) {
              availableHours[dateStr] = 8;
            }
          }
        }

        currentMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1);
      }

      // Calcular horas disponibles totales
      const totalAvailableHours = Object.values(availableHours).reduce((sum, hours) => sum + hours, 0);

      if (totalAvailableHours < requiredHours) {
        return {
          isValid: false,
          message: `El desarrollador no tiene disponibilidad suficiente. Disponible: ${totalAvailableHours}h, Requerido: ${requiredHours}h`,
          availableHours: totalAvailableHours
        };
      }

      return {
        isValid: true,
        message: `Disponibilidad verificada. Disponible: ${totalAvailableHours}h, Requerido: ${requiredHours}h`,
        availableHours: totalAvailableHours
      };

    } catch (error) {
      console.error('Error validando disponibilidad del desarrollador:', error);
      return {
        isValid: false,
        message: 'Error al verificar la disponibilidad del desarrollador'
      };
    }
  }

  /**
   * Valida las habilidades del desarrollador vs las requeridas por la tarea
   * @param {Array} developerSkills - Habilidades del desarrollador
   * @param {Array} requiredSkills - Habilidades requeridas por la tarea
   * @returns {Object} - { isValid: boolean, message: string, matchPercentage: number }
   */
  validateSkillsMatch(developerSkills, requiredSkills) {
    if (!requiredSkills || requiredSkills.length === 0) {
      return { isValid: true, message: 'No se requieren habilidades específicas', matchPercentage: 100 };
    }

    if (!developerSkills || developerSkills.length === 0) {
      return { isValid: false, message: 'El desarrollador no tiene habilidades registradas', matchPercentage: 0 };
    }

    // Normalizar habilidades (convertir a strings para comparación)
    const devSkills = developerSkills.map(skill => 
      typeof skill === 'string' ? skill.toLowerCase() : skill.nombre?.toLowerCase() || ''
    ).filter(skill => skill);

    const reqSkills = requiredSkills.map(skill => 
      typeof skill === 'string' ? skill.toLowerCase() : skill.nombre?.toLowerCase() || ''
    ).filter(skill => skill);

    // Calcular coincidencias
    const matches = reqSkills.filter(reqSkill => 
      devSkills.some(devSkill => devSkill.includes(reqSkill) || reqSkill.includes(devSkill))
    );

    const matchPercentage = (matches.length / reqSkills.length) * 100;

    if (matchPercentage < 70) {
      return {
        isValid: false,
        message: `Las habilidades del desarrollador no cumplen con los requisitos. Coincidencia: ${matchPercentage.toFixed(1)}% (mínimo 70%)`,
        matchPercentage
      };
    }

    return {
      isValid: true,
      message: `Habilidades verificadas. Coincidencia: ${matchPercentage.toFixed(1)}%`,
      matchPercentage
    };
  }

  /**
   * Valida completamente una asignación de tarea
   * @param {Object} assignmentData - Datos de la asignación
   * @returns {Promise<Object>} - { isValid: boolean, message: string, details: Object }
   */
  async validateTaskAssignment(assignmentData) {
    const { task, developer } = assignmentData;
    const results = {
      sameDayHours: null,
      availability: null,
      skills: null
    };

    // 1. Validar horas del mismo día
    results.sameDayHours = this.validateSameDayHours(task);
    if (!results.sameDayHours.isValid) {
      return {
        isValid: false,
        message: results.sameDayHours.message,
        details: results
      };
    }

    // 2. Validar disponibilidad del desarrollador
    results.availability = await this.validateDeveloperAvailability(
      developer.id || developer._id,
      task.fechaEstimadaInicio,
      task.fechaEstimadaFin,
      task.tiempoEstimadoHoras
    );

    // 3. Validar habilidades
    results.skills = this.validateSkillsMatch(developer.habilidades, task.habilidadesRequeridas);

    const allValid = results.availability.isValid && results.skills.isValid;

    return {
      isValid: allValid,
      message: allValid 
        ? 'Asignación validada exitosamente' 
        : 'La asignación no cumple con todos los requisitos',
      details: results
    };
  }

  /**
   * Ordena tareas por prioridad y dificultad
   * @param {Array} tasks - Array de tareas
   * @returns {Array} - Tareas ordenadas
   */
  sortTasksByPriority(tasks) {
    const priorityOrder = { 'alta': 3, 'media': 2, 'baja': 1 };
    const difficultyOrder = { 'alta': 3, 'media': 2, 'baja': 1 };

    return tasks.sort((a, b) => {
      // Primero por prioridad (alta > media > baja)
      const priorityA = priorityOrder[a.prioridad?.toLowerCase()] || 0;
      const priorityB = priorityOrder[b.prioridad?.toLowerCase()] || 0;
      
      if (priorityA !== priorityB) {
        return priorityB - priorityA; // Descendente
      }

      // Luego por dificultad (alta > media > baja)
      const difficultyA = difficultyOrder[a.nivelDificultad?.toString()?.toLowerCase()] || 
                         difficultyOrder[a.nivelDificultad] || 0;
      const difficultyB = difficultyOrder[b.nivelDificultad?.toString()?.toLowerCase()] || 
                         difficultyOrder[b.nivelDificultad] || 0;

      if (difficultyA !== difficultyB) {
        return difficultyB - difficultyA; // Descendente
      }

      // Finalmente por fecha de creación (más recientes primero)
      return new Date(b.createdAt || b.fechaCreacion || 0) - new Date(a.createdAt || a.fechaCreacion || 0);
    });
  }
}

export default new ValidationService();
