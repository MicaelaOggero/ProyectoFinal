import { seleccionarDevMasBarato } from "../../utils/asignacionCosto/filtroDevMasBarato.js";
import { calcularCostoDev } from "../../utils/asignacionCosto/costoTarea.js";
import { tieneDisponibilidad } from "../../utils/asignacionBasica/filtroDisponibilidad.js";
import { ordenarTareas } from "../../utils/asignacionBasica/ordenarTareas.js";
import { obtenerDiasDisponibles } from "../../utils/asignacionBasica/diasDisponible.js";
import { tieneHabilidadesSuficientes } from "../../utils/asignacionBasica/filtroHabilidades.js";
import Task from "../task/task.model.js";
import User from "../users/user.model.js";
import Project from "../projects/project.model.js";
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

        // Actualizar costo total del proyecto en la base de datos
        const proyecto = tarea.proyecto;
        proyecto.costoTotal = costoTotalProyecto;
        await proyecto.save();

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

/** Previsualizar las asignaciones sin guardar en BD **/
export async function previsualizarAsignacionPorCosto(projectId) {
    const tareas = await Task.find({
        proyecto: projectId,
        desarrolladorAsignado: null,
        estado: "pendiente",
    }).populate("proyecto");

    if (!tareas.length) {
        return { message: "No hay tareas pendientes en este proyecto", asignaciones: [] };
    }

    const desarrolladores = await User.find({ rol: "user" });
    const tareasOrdenadas = ordenarTareas(tareas);

    const asignaciones = [];
    let costoTotalProyecto = 0;

    for (const tarea of tareasOrdenadas) {
        const fechaInicio = new Date(tarea.fechaEstimadaInicio);
        const fechaFin = new Date(tarea.fechaEstimadaFin);

        // ✅ Filtrar desarrolladores disponibles y con habilidades
        const candidatos = desarrolladores.filter(
            (dev) =>
                tieneHabilidadesSuficientes(dev, tarea.habilidadesRequeridas, 0.7) &&
                tieneDisponibilidad(dev, fechaInicio, fechaFin, tarea.tiempoEstimadoHoras)
        );

        if (candidatos.length === 0) {
            asignaciones.push({
                tarea: { id: tarea._id, descripcion: tarea.descripcion },
                desarrollador: null,
                motivo: "Sin desarrolladores disponibles",
            });
            continue;
        }

        // 💰 Seleccionar desarrollador más económico
        const devSeleccionado = seleccionarDevMasBarato(candidatos);
        const costoTarea = calcularCostoDev(devSeleccionado, tarea.tiempoEstimadoHoras);
        costoTotalProyecto += costoTarea;

        // 📅 Simular asignación día por día (sin guardar)
        const diasAsignacion = [];
        const diasDisponibles = obtenerDiasDisponibles(fechaInicio, fechaFin, devSeleccionado);
        let horasRestantes = tarea.tiempoEstimadoHoras;

        for (const dia of diasDisponibles) {
            if (horasRestantes <= 0) break;
            const registroDia = devSeleccionado.calendario.find(
                (d) => d.fecha.toISOString().split("T")[0] === dia.toISOString().split("T")[0]
            );

            const horasAsignadas = Math.min(
                registroDia ? registroDia.horasDisponibles : 8,
                horasRestantes
            );

            //solo registrar si se asignan horas
            if (horasAsignadas > 0) {
                horasRestantes -= horasAsignadas;
                diasAsignacion.push({
                    fecha: new Date(dia),
                    horasAsignadas
                });
            }
        }

        asignaciones.push({
            tarea: {
                id: tarea._id,
                descripcion: tarea.descripcion,
            },
            desarrollador: {
                id: devSeleccionado._id,
                nombre: devSeleccionado.nombre,
                apellido: devSeleccionado.apellido,
                costoPorHora: devSeleccionado.costoPorHora,
            },
            dias: diasAsignacion,
            horasTotales: tarea.tiempoEstimadoHoras,
            costoTotal: costoTarea,
            tipoAsignacion: "costo",
        });
    }

    return {
        message: "Previsualización completada",
        costoTotalProyecto,
        asignaciones,
    };
}

/**
 * Guarda las asignaciones de la previsualización y actualiza todo en la BD
 */
export async function confirmarAsignacionPorCosto(projectId, asignacionesPrevias, costoTotalProyecto) {
    const resultados = [];

    for (const asignacion of asignacionesPrevias) {
        const tareaId = asignacion.tarea.id;
        const devId = asignacion.desarrollador.id;

        const tareaDB = await Task.findById(tareaId);
        const dev = await User.findById(devId);
        const proyecto = await Project.findById(projectId);

        if (!tareaDB || !dev || !proyecto) {
            resultados.push({
                tarea: tareaId,
                estado: "error",
                mensaje: "Tarea, desarrollador o proyecto no encontrado",
            });
            continue;
        }

        // 🔹 Actualizar calendario del desarrollador
        for (const dia of asignacion.dias) {
            const diaISO = new Date(dia.fecha).toISOString().split("T")[0];
            const registro = dev.calendario.find(
                (c) => c.fecha.toISOString().split("T")[0] === diaISO
            );
            if (registro) registro.horasDisponibles -= dia.horasAsignadas;
        }
        await dev.save();

        // 🔹 Crear registro de asignación
        await Asignacion.create({
            tarea: tareaDB._id,
            desarrollador: dev._id,
            dias: asignacion.dias,
            horasTotales: asignacion.horasTotales,
            proyecto: proyecto._id,
            costoPorHora: asignacion.desarrollador.costoPorHora,
            costoTotal: asignacion.costoTotal,
            tipoAsignacion: "costo",
        });

        // 🔹 Actualizar tarea
        tareaDB.desarrolladorAsignado = dev._id;
        await tareaDB.save();

        resultados.push({
            tarea: tareaDB.descripcion,
            desarrollador: `${dev.nombre} ${dev.apellido}`,
            costoTotal: asignacion.costoTotal,
            estado: "ok",
        });
    }

    // 🔹 Actualizar costo total del proyecto
    await Project.findByIdAndUpdate(projectId, { costoTotal: costoTotalProyecto });

    return {
        message: "Asignaciones confirmadas y guardadas en la base de datos",
        costoTotalProyecto,
        resultados,
    };
}
