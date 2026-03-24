import FinalProjectReport from "./report.model.js";
import SimulacionAsignacion from "../simulationAssignment/simulationAssignment.model.js";

export const createFinalProjectReport = (data) => FinalProjectReport.create(data);

export const findFinalReportByProject = (projectId) =>
  FinalProjectReport.findOne({ proyecto: projectId }).sort({ creadoEn: -1 });

export const findLatestSimulationByProject = (projectId) =>
  SimulacionAsignacion.findOne({ proyecto: projectId })
    .sort({ creadoEn: -1 })
    .populate({
      path: "asignaciones",
      populate: { path: "tarea" },
    });
