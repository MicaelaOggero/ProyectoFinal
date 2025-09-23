// 📌 asignarConCalendario.js
import Task from "../modules/task/task.model.js";
import User from "../modules/users/user.model.js";
import { ordenarTareas } from "./ordenarTareas.js";
import { tieneHabilidadesSuficientes } from "./filtroHabilidades.js";
import Asignacion from "../modules/assignment/assignment.model.js";
import { obtenerDiasDisponibles } from "./diasDisponible.js";

// Función principal para asignar tareas usando el calendario diario
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
    const diasDisponibles = obtenerDiasDisponibles(fechaInicio, fechaFin);

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
          fecha: new Date(dia),
          horasAsignadas
        });
      }
    }

    await mejorDev.save();

    // después de asignar tarea a mejorDev
    await Asignacion.create({
      tarea: tarea._id,
      desarrollador: mejorDev._id,
      dias: diasAsignados,
      horasTotales: tarea.tiempoEstimadoHoras,
      proyecto: tarea.proyecto._id
    });


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
