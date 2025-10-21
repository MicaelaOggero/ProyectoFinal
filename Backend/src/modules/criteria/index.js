import Task from "../task/task.model.js";
import User from "../users/user.model.js";
import Project from "../projects/project.model.js";
import { ordenarTareas } from "../../utils/asignacionBasica/ordenarTareas.js";
import { tieneHabilidadesSuficientes } from "../../utils/asignacionBasica/filtroHabilidades.js";
import { tieneDisponibilidad } from "../../utils/asignacionBasica/filtroDisponibilidad.js";
import { seleccionarMejorDev } from "../../utils/asignacionBasica/filtroMejorDev.js";
import Asignacion from "../assignment/assignment.model.js";
import { obtenerDiasDisponibles } from "../../utils/asignacionBasica/diasDisponible.js";
import { calcularCostoDev } from "../../utils/asignacionCosto/costoTarea.js";

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
    let costoTotalProyecto = 0;
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
        const costoTarea = calcularCostoDev(mejorDev, tarea.tiempoEstimadoHoras);
        costoTotalProyecto += costoTarea;

        // 3️⃣ asignar la tarea al dev
        tarea.desarrolladorAsignado = mejorDev._id;
        await tarea.save();

        // 4️⃣ descontar horas en el calendario del dev 
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

        // Actualizar costo total del proyecto en la base de datos
        const proyecto = tarea.proyecto;
        proyecto.costoTotal = costoTotalProyecto;
        await proyecto.save();

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

/**
 * Previsualiza la asignación básica (sin guardar en BD)
 */
export async function previsualizarAsignacionBasica(projectId) {
    const tareasPendientes = await Task.find({
        proyecto: projectId,
        desarrolladorAsignado: null,
        estado: "pendiente",
    }).populate("proyecto");

    if (!tareasPendientes.length) {
        return { message: "No hay tareas pendientes en este proyecto", asignaciones: [] };
    }
    // 🔹 Obtener IDs de tareas que ya están asignadas en la colección Asignacion
    const tareasAsignadas = await Asignacion.find(
        { proyecto: projectId },
        { tarea: 1, _id: 0 }
    ).lean();

    const idsTareasAsignadas = tareasAsignadas.map(a => a.tarea.toString());

    // 🔹 Filtrar tareas que aún NO estén asignadas
    const tareas = tareasPendientes.filter(
        t => !idsTareasAsignadas.includes(t._id.toString())
    );

    if (!tareas.length)
        throw new Error("Todas las tareas del proyecto ya están asignadas");


    const desarrolladores = await User.find({ rol: "user" });
    const tareasOrdenadas = ordenarTareas(tareas);

    const asignaciones = [];
    let costoTotalProyecto = 0;

    for (const tarea of tareasOrdenadas) {
        const fechaInicio = new Date(tarea.fechaEstimadaInicio);
        const fechaFin = new Date(tarea.fechaEstimadaFin);



        const candidatos = desarrolladores.filter(
            (dev) =>
                tieneHabilidadesSuficientes(dev, tarea.habilidadesRequeridas, 0.7) &&
                tieneDisponibilidad(dev, fechaInicio, fechaFin, tarea.tiempoEstimadoHoras)

        );

        if (!candidatos.length) {
            asignaciones.push({
                tarea: { id: tarea._id, descripcion: tarea.descripcion },
                desarrollador: null,
                motivo: "Sin desarrolladores con disponibilidad o habilidades suficientes",
            });
            continue;
        }

        const mejorDev = seleccionarMejorDev(candidatos, fechaInicio, fechaFin);
        const costoTarea = calcularCostoDev(mejorDev, tarea.tiempoEstimadoHoras);
        costoTotalProyecto += costoTarea;

        const diasAsignacion = [];
        let horasRestantes = tarea.tiempoEstimadoHoras;
        const diasDisponibles = obtenerDiasDisponibles(fechaInicio, fechaFin, mejorDev);

        for (const dia of diasDisponibles) {
            if (horasRestantes <= 0) break;

            const registroDia = mejorDev.calendario.find(
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
            tarea: { id: tarea._id, descripcion: tarea.descripcion },
            desarrollador: {
                id: mejorDev._id,
                nombre: mejorDev.nombre,
                apellido: mejorDev.apellido,
            },
            dias: diasAsignacion,
            horasTotales: tarea.tiempoEstimadoHoras,
            tipoAsignacion: "basica",
        });
    }

    return {
        message: "Previsualización de asignación básica completada",
        asignaciones,
        costoTotalProyecto
    };
}

/**
 * Confirma y guarda la asignación básica en BD
 */
export async function confirmarAsignacionBasica(projectId, asignacionesPrevias, costoTotalProyecto) {
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

        // 🔹 VALIDACIÓN: evitar duplicar asignaciones de la misma tarea
        const existeAsignacion = await Asignacion.findOne({ tarea: tareaId });
        if (existeAsignacion) {
            resultados.push({
                tarea: tareaDB.descripcion,
                estado: "omitida",
                mensaje: `La tarea "${tareaDB.descripcion}" ya está asignada y no puede reasignarse.`,
            });
            continue;
        }

        // 🔹 Crear registro de asignación
        await Asignacion.create({
            tarea: tareaDB._id,
            desarrollador: dev._id,
            dias: asignacion.dias,
            horasTotales: asignacion.horasTotales,
            proyecto: proyecto._id,
            tipoAsignacion: "basica",
        });

        // 🔹 Actualizar tarea
        tareaDB.desarrolladorAsignado = dev._id;
        tareaDB.estado = "en curso";
        await tareaDB.save();

        resultados.push({
            tarea: tareaDB.descripcion,
            desarrollador: `${dev.nombre} ${dev.apellido}`,
            estado: "ok",
        });
    }

    // 🔹 Actualizar costo total del proyecto
    await Project.findByIdAndUpdate(projectId, { costoTotal: costoTotalProyecto });

    return {
        message: "Asignaciones básicas confirmadas y guardadas en la base de datos",
        resultados,
        costoTotalProyecto
    };
}