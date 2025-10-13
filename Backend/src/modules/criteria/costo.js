import { seleccionarDevMasBarato } from "../../utils/asignacionCosto/filtroDevMasBarato.js";
import { calcularCostoDev } from "../../utils/asignacionCosto/costoTarea.js";
import { tieneDisponibilidad } from "../../utils/asignacionBasica/filtroDisponibilidad.js";
import { ordenarTareas } from "../../utils/asignacionBasica/ordenarTareas.js";
import { obtenerDiasDisponibles } from "../../utils/asignacionBasica/diasDisponible.js";
import {tieneHabilidadesSuficientes} from "../../utils/asignacionBasica/filtroHabilidades.js";
import Task from "../task/task.model.js";
import User from "../users/user.model.js";
import Asignacion from "../assignment/assignment.model.js";

/**
 * Asigna tareas considerando disponibilidad y costo total del proyecto
 * @param {String} projectId - ID del proyecto
 */
export async function asignarTareasPorCosto(projectId) {
    // 🔹 obtener tareas pendientes
    let tareas = await Task.find({
        proyecto: projectId,
        desarrolladorAsignado: null,
        estado: "pendiente"
    }).populate("proyecto");

    if (!tareas.length) {
        return { message: "No hay tareas pendientes en este proyecto", resumen: [] };
    }

    tareas = ordenarTareas(tareas);
    const desarrolladores = await User.find({ rol: "user" });

    const resumen = [];
    let costoTotalProyecto = 0;

    for (const tarea of tareas) {
        const fechaInicio = new Date(tarea.fechaEstimadaInicio);
        const fechaFin = new Date(tarea.fechaEstimadaFin);
        // 🔍 candidatos con disponibilidad
        const candidatos = desarrolladores.filter(dev =>
            tieneHabilidadesSuficientes(dev, tarea.habilidadesRequeridas, 0.7) &&
            tieneDisponibilidad(dev, fechaInicio, fechaFin, tarea.tiempoEstimadoHoras)
        );

        if (candidatos.length === 0) {
            resumen.push({
                tarea: tarea.descripcion,
                asignado: null,
                motivo: "Sin desarrolladores con disponibilidad"
            });
            continue;
        }

        // 💰 seleccionar dev más barato
        const devSeleccionado = seleccionarDevMasBarato(candidatos);
        const costoTarea = calcularCostoDev(devSeleccionado, tarea.tiempoEstimadoHoras);
        costoTotalProyecto += costoTarea;

        // 📅 actualizar calendario día por día
        const diasAsignacion = [];
        const diasDisponibles = obtenerDiasDisponibles(
            tarea.fechaEstimadaInicio,
            tarea.fechaEstimadaFin,
            devSeleccionado
        );

        let horasRestantes = tarea.tiempoEstimadoHoras;

        for (const dia of diasDisponibles) {
            if (horasRestantes <= 0) break;

            const diaISO = dia.toISOString().split("T")[0];
            let registroDia = devSeleccionado.calendario.find(
                d => d.fecha.toISOString().split("T")[0] === diaISO
            );

            if (!registroDia) {
                registroDia = { fecha: new Date(dia), horasDisponibles: 8 };
                devSeleccionado.calendario.push(registroDia);
            }

            const horasAsignadas = Math.min(registroDia.horasDisponibles, horasRestantes);
            registroDia.horasDisponibles -= horasAsignadas;
            horasRestantes -= horasAsignadas;

            diasAsignacion.push({
                fecha: new Date(dia),
                horasAsignadas
            });
        }

        await devSeleccionado.save();

        // 🧾 registrar asignación
        await Asignacion.create({
            tarea: tarea._id,
            desarrollador: devSeleccionado._id,
            dias: diasAsignacion,
            horasTotales: tarea.tiempoEstimadoHoras,
            proyecto: tarea.proyecto._id,
            tipoAsignacion: "costo"
        });

        // 🔄 actualizar tarea
        tarea.desarrolladorAsignado = devSeleccionado._id;
        await tarea.save();

        resumen.push({
            tarea: tarea.descripcion,
            asignado: `${devSeleccionado.nombre} ${devSeleccionado.apellido}`,
            costoPorHora: devSeleccionado.costoPorHora,
            costoTotal: costoTarea,
            dias: diasAsignacion
        });
    }

    return {
        message: "Asignación automática por costo completada",
        costoTotalProyecto,
        resumen
    };
}
