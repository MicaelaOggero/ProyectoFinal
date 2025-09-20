import Task from "../task/task.model.js";
import User from "../users/user.model.js";
import { ordenarTareas } from "../../utils/ordenarTareas.js";
import { tieneHabilidadesSuficientes } from "../../utils/filtroHabilidades.js";
import { tieneDisponibilidad } from "../../utils/filtroDisponibilidad.js";
import { seleccionarMejorDev } from "../../utils/filtroMejorDev.js";
import Asignacion from "../assignment/assignment.model.js";
import { obtenerDiasDisponibles } from "../../utils/diasDisponible.js";

export async function asignarTareasConCalendario(projectId) {
    // 🔹 obtener todas las tareas pendientes
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

        // 1️⃣ filtrar candidatos
        const candidatos = desarrolladores.filter(dev =>
            tieneHabilidadesSuficientes(dev, tarea.habilidadesRequeridas, 0.7) &&
            tieneDisponibilidad(dev, fechaInicio, fechaFin, tarea.tiempoEstimadoHoras)
        );

        if (!candidatos.length) {
            resumen.push({
                tarea: tarea.descripcion,
                asignado: null,
                motivo: "No hay dev con disponibilidad suficiente o habilidades requeridas"
            });
            continue;
        }

        // 2️⃣ elegir el mejor dev
        const mejorDev = seleccionarMejorDev(candidatos, fechaInicio, fechaFin);

        // 3️⃣ asignar la tarea al dev
        tarea.desarrolladorAsignado = mejorDev._id;
        await tarea.save();

        let horasRestantes = tarea.tiempoEstimadoHoras;
        const diasAsignados = [];

        for (const dia of obtenerDiasDisponibles(fechaInicio, fechaFin)) {
            if (horasRestantes <= 0) break;

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

        // 📌 guardar registro de asignación
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
