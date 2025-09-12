// 📌 asignarConCalendario.js
import Task from "../task/task.model.js";
import User from "../users/user.model.js";
import { ordenarTareas } from "../assignments/prioridadDificultadTareas.js";
import { tieneHabilidadesSuficientes } from "../../utils/filtros.js";

// 👉 generar rango de fechas de inicio a fin (solo días hábiles)
function generarRangoDias(fechaInicio, fechaFin) {
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

export async function asignarTareasConCalendario(projectId) {
  // 🔹 obtener todas las tareas del proyecto
  let tareas = await Task.find({ 
    proyecto: projectId, 
    desarrolladorAsignado: null, 
    estado: "pendiente" 
  }).populate("proyecto");

  if (!tareas.length) {
    return { message: "No hay tareas pendientes en este proyecto", resumen: [] };
  }

  // 🔹 ordenar tareas (prioridad/dificultad)
  tareas = ordenarTareas(tareas);

  // 🔹 obtener desarrolladores
  const desarrolladores = await User.find({ rol: "user" });

  const resumen = [];

  for (const tarea of tareas) {
    const fechaInicio = new Date(tarea.fechaEstimadaInicio);
    const fechaFin = new Date(tarea.fechaEstimadaFin);
    const diasDisponibles = generarRangoDias(fechaInicio, fechaFin);

    // 🔎 candidatos que cumplen habilidades y tienen disponibilidad
    const candidatos = desarrolladores.filter(dev => {
      if (!tieneHabilidadesSuficientes(dev, tarea.habilidadesRequeridas, 0.7)) {
        return false;
      }

      let horasDisponiblesTotales = 0;
      for (const dia of diasDisponibles) {
        const diaISO = dia.toISOString().split("T")[0];
        let registroDia = dev.calendario.find(d => 
          d.fecha.toISOString().split("T")[0] === diaISO
        );

        if (!registroDia) {
          // inicializar si no existe
          registroDia = { fecha: new Date(dia), horasDisponibles: 8 };
          dev.calendario.push(registroDia);
        }

        horasDisponiblesTotales += registroDia.horasDisponibles;
      }

      return horasDisponiblesTotales >= tarea.tiempoEstimadoHoras;
    });

    if (candidatos.length === 0) {
      resumen.push({
        tarea: tarea.descripcion,
        asignado: null,
        motivo: "No hay dev con disponibilidad suficiente en el rango de fechas"
      });
      continue;
    }

    // 📌 elegir al dev con mayor disponibilidad total en el rango
    const mejorDev = candidatos.reduce((a, b) => {
      const horasA = diasDisponibles.reduce((acc, dia) => {
        const registro = a.calendario.find(d => 
          d.fecha.toISOString().split("T")[0] === dia.toISOString().split("T")[0]
        );
        return acc + (registro ? registro.horasDisponibles : 8);
      }, 0);

      const horasB = diasDisponibles.reduce((acc, dia) => {
        const registro = b.calendario.find(d => 
          d.fecha.toISOString().split("T")[0] === dia.toISOString().split("T")[0]
        );
        return acc + (registro ? registro.horasDisponibles : 8);
      }, 0);

      return horasA > horasB ? a : b;
    });

    // 🔹 asignar la tarea al dev
    tarea.desarrolladorAsignado = mejorDev._id;
    await tarea.save();

    let horasRestantes = tarea.tiempoEstimadoHoras;
    const diasAsignados = [];

    for (const dia of diasDisponibles) {
      if (horasRestantes <= 0) break;

      // buscar o inicializar el día en el calendario del dev
      const diaISO = dia.toISOString().split("T")[0];
      let registroDia = mejorDev.calendario.find(d => 
        d.fecha.toISOString().split("T")[0] === diaISO
      );

      if (!registroDia) {
        registroDia = { fecha: new Date(dia), horasDisponibles: 8 };
        mejorDev.calendario.push(registroDia);
      }

      const horasAsignadas = Math.min(registroDia.horasDisponibles, horasRestantes);

      if (horasAsignadas > 0) {
        registroDia.horasDisponibles -= horasAsignadas;
        horasRestantes -= horasAsignadas;

        diasAsignados.push({
          inicio: new Date(dia),
          horasAsignadas
        });
      }
    }

    await mejorDev.save();

    resumen.push({
      tarea: tarea.descripcion,
      asignado: `${mejorDev.nombre} ${mejorDev.apellido}`,
      dias: diasAsignados,
      horasAsignadasTotales: tarea.tiempoEstimadoHoras - horasRestantes
    });
  }

  return {
    message: "Asignación automática con calendario diario completada",
    resumen
  };
}
