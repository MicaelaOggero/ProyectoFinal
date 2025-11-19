import mongoose from "mongoose";
import TaskLog from "../modules/task/taskLog.model.js"; // ajustá la ruta a tu modelo
import { conectarDB, desconectarDB } from '../config/db.js'
/**
 * Actualiza los TaskLog existentes para agregar o asignar el campo 'puntuacionCalidad'.
 * Si no existe, se agrega; si existe, se deja igual.
 * También puede asignar un valor automático según el estado de la tarea.
 */
/* export async function actualizarPuntuacionCalidad() {
  try {
    // 🔹 Conectarse a la base (usando tu configuración)
    await conectarDB();
    console.log("📡 Conectado a la base de datos");

    // 🔹 Obtener todos los registros
    const taskLogs = await TaskLog.find();
    console.log(`🔍 Registros encontrados: ${taskLogs.length}`);

    let actualizados = 0;

    // 🔹 ID de proyecto genérico temporal (podés reemplazarlo luego por uno real)
    const proyectoFakeId = new mongoose.Types.ObjectId("674acb2c1234567890abcdef");

    for (const log of taskLogs) {
      let modificado = false;

      // 1️⃣ Si ya tiene puntuación, no la cambiamos
      if (log.puntuacionCalidad === undefined || log.puntuacionCalidad === null) {
        let puntaje = 3; // valor por defecto
        switch (log.estado) {
          case "adelantada":
            puntaje = 5;
            break;
          case "completada":
            puntaje = 4;
            break;
          case "retrasada":
            puntaje = 2;
            break;
          case "cancelada":
            puntaje = 1;
            break;
        }

        log.puntuacionCalidad = puntaje;
        modificado = true;
      }

      // 2️⃣ Si no tiene proyecto asociado, agregamos uno temporal
      if (!log.proyecto) {
        log.proyecto = proyectoFakeId;
        modificado = true;
      }

      // 3️⃣ Guardar solo si hubo cambios
      if (modificado) {
        await log.save();
        actualizados++;
      }
    }

    console.log(`✅ TaskLogs actualizados: ${actualizados}`);
  } catch (error) {
    console.error("❌ Error al actualizar los TaskLogs:", error);
  } finally {
    await desconectarDB();
    console.log("🔌 Desconectado de la base de datos");
  }
}

actualizarPuntuacionCalidad() */

// actualizarCategorias.js

import Task from "../modules/task/task.model.js";  // ajustá la ruta según tu proyecto

// 🔹 Conexión a tu base de datos
const MONGODB_URI = "mongodb://localhost:27017/tu_base"; // <-- cambialo por tu DB

async function agregarCategoriaATareas() {
  try {
    await conectarDB()

    // 🔹 Actualizar todas las tareas que no tengan categoría
    const resultado = await Task.updateMany(
      { categoria: { $exists: false } },
      { $set: { categoria: "general" } } // <-- valor por defecto
    );

    console.log(`✅ Tareas actualizadas: ${resultado.modifiedCount}`);
    await desconectarDB()
  } catch (error) {
    console.error("❌ Error actualizando tareas:", error);
    await desconectarDB()
  }
}

agregarCategoriaATareas();
