import {
  createTask,
  saveTask,
  getTaskByIdDAO,
  deleteTask,
  findTasksByProject,
  findTasksByDeveloper,
  findTasksByProjectAndDeveloper,
  getTareasSinAsignar,
  obtenerTodasTareasDAO
} from "./task.dao.js";
import { ordenarTareas } from '../../utils/asignacionBasica/ordenarTareas.js';
import Project from "../projects/project.model.js";
import User from "../users/user.model.js";
import TaskLog from "../task/taskLog.model.js"; // 👈 importar el modelo


export async function addTask(taskData) {
  // 1️⃣ Verificar que el proyecto exista
  const proyectoExistente = await Project.findById(taskData.proyecto);
  if (!proyectoExistente) {
    throw new Error("El proyecto indicado no existe");
  }

  // 2️⃣ Validar que las fechas de la tarea estén dentro del rango del proyecto
  const fechaInicioTarea = new Date(taskData.fechaEstimadaInicio);
  const fechaFinTarea = new Date(taskData.fechaEstimadaFin);

  if (fechaInicioTarea < proyectoExistente.fechaInicioEstimada) {
    throw new Error(
      `La fecha de inicio de la tarea (${fechaInicioTarea.toDateString()}) no puede ser anterior al inicio estimado del proyecto (${proyectoExistente.fechaInicioEstimada.toDateString()}).`
    );
  }

  if (fechaFinTarea > proyectoExistente.fechaFinEstimada) {
    throw new Error(
      `La fecha de fin de la tarea (${fechaFinTarea.toDateString()}) no puede ser posterior a la fecha de fin estimada del proyecto (${proyectoExistente.fechaFinEstimada.toDateString()}).`
    );
  }

  // 3️⃣ Verificar que el desarrollador exista (si fue asignado)
  if (taskData.desarrolladorAsignado) {
    const devExistente = await User.findById(taskData.desarrolladorAsignado);
    if (!devExistente) {
      throw new Error("El desarrollador asignado no existe");
    }
  }

  // 4️⃣ Crear la tarea
  return await createTask(taskData);
}


export async function editTask(taskId, taskData, usuarioId) {
  // 1. Buscar la tarea
  const tarea = await getTaskByIdDAO(taskId);
  if (!tarea) throw new Error("Tarea no encontrada");

  // 2. Si se cambia desarrollador, validar que exista
  if (taskData.desarrolladorAsignado !== undefined && taskData.desarrolladorAsignado !== null) {
    const devExistente = await User.findById(taskData.desarrolladorAsignado);
    if (!devExistente) throw new Error("El desarrollador asignado no existe");
  }

  // 3. Recorrer campos enviados y registrar historial
  for (const key of Object.keys(taskData)) {
    const valorAnterior = tarea[key];
    const valorNuevo = taskData[key];

    // Guardar solo si cambió
    if (valorNuevo !== undefined && valorNuevo !== valorAnterior) {
      tarea.historial.push({
        campo: key,
        valorAnterior,
        valorNuevo,
        cambiadoPor: usuarioId,
        fechaCambio: new Date()
      });

      tarea[key] = valorNuevo;
    }
  }

  // 4. Guardar tarea
  await saveTask(tarea);
  return tarea;
}

export async function obtenerTodasTareasService() {
  const tareas = await obtenerTodasTareasDAO();
  // Podés agregar lógica extra si querés
  return tareas;
}

export async function getTaskById(taskId) {
  const tarea = await getTaskByIdDAO(taskId);

  if (!tarea) {
    throw new Error("Tarea no encontrada");
  }

  return tarea;
}

export async function removeTask(taskId) {
  return await deleteTask(taskId);
}

export async function getTasksByProject(projectId) {
  return await findTasksByProject(projectId);
}

export async function getTasksByDeveloper(userId) {
  return await findTasksByDeveloper(userId);
}


export async function getTasksByProjectAndDeveloper(projectId, developerId) {
  return await findTasksByProjectAndDeveloper(projectId, developerId);
}

export const obtenerTareasOrdenadasPorProyecto = async (projectId) => {
  const tareas = await getTareasSinAsignar(projectId, { estado: 'pendiente' });
  const tareasOrdenadas = ordenarTareas(tareas);
  console.log("Tareas ordenadas:", tareasOrdenadas);
  return tareasOrdenadas;
};

export async function iniciarTareaService(taskId, userId) {
  //Buscar la tarea
  const tarea = await getTaskByIdDAO(taskId);
  if (!tarea) {
    throw new Error("Tarea no encontrada");
  }

  //Buscar el desarrollador
  const desarrollador = await User.findById(userId);
  if (!desarrollador) {
    throw new Error("Desarrollador no encontrado");
  }

  //Validar estado actual
  if (tarea.estado !== "pendiente") {
    throw new Error("Solo se pueden iniciar tareas en estado 'pendiente'");
  }

  tarea.estado = "en curso";

  //Actualizar fecha de inicio real
  tarea.fechaRealInicio = new Date();

  //Registrar tiempo de inicio
  tarea.enTrabajoDesde = new Date();

  //Actualizar historial
  tarea.historial.push({
    campo: "estado",
    valorAnterior: "pendiente",
    valorNuevo: "en curso",
    cambiadoPor: desarrollador._id,
    fechaCambio: new Date()
  });

  await saveTask(tarea);
  return tarea;
}



export async function pausarOCompletarTarea(taskId, userId, accion = "pausar") {
  const tarea = await getTaskByIdDAO(taskId);
  if (!tarea) throw new Error("Tarea no encontrada");

  const desarrollador = await User.findById(userId);
  if (!desarrollador) throw new Error("Desarrollador no encontrado");

  if (tarea.estado !== "en curso") {
    throw new Error("Solo se pueden pausar o completar tareas en curso");
  }

  // 🔹 Calcular tiempo transcurrido desde que empezó
  if (tarea.enTrabajoDesde) {
    const ahora = new Date();
    const diffMs = ahora - tarea.enTrabajoDesde;
    const horasTrabajadas = diffMs / (1000 * 60 * 60);
    tarea.tiempoInvertidoHoras += horasTrabajadas;
    tarea.enTrabajoDesde = null; // ya no está trabajando
  }

  // 🔹 Si es completar
  if (accion === "completar") {
  tarea.estado = "completada";
  tarea.fechaRealFin = new Date();

  // 🔹 Registrar el TaskLog
  const estadoFinal =
    tarea.tiempoInvertidoHoras > tarea.tiempoEstimadoHoras
      ? "retrasada"
      : tarea.tiempoInvertidoHoras < tarea.tiempoEstimadoHoras
      ? "adelantada"
      : "completada";

  await TaskLog.create({
    tarea: tarea._id,
    desarrollador: desarrollador._id,
    duracionEstimadaHoras: tarea.tiempoEstimadoHoras,
    tiempoInvertidoHoras: tarea.tiempoInvertidoHoras,
    estado: estadoFinal,
  });

  // 🔹 Actualizar el rendimiento histórico del dev usando todos sus logs
  const nuevoPromedio = await actualizarRendimientoDesarrollador(userId);
}

  // 🔹 Registrar en historial de la tarea
  tarea.historial.push({
    campo: "estado",
    valorAnterior: "en curso",
    valorNuevo: tarea.estado,
    cambiadoPor: desarrollador._id,
    fechaCambio: new Date()
  });

  await saveTask(tarea);

  return {
    message: `Tarea ${accion === "completar" ? "completada" : "pausada"} correctamente`,
    horasTotales: tarea.tiempoInvertidoHoras.toFixed(2),
    rendimientoActualizado: nuevoPromedio.toFixed(2)
  };
}
