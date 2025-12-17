//ruta para calcular datos globales de simulacion
import calcularDatosGlobalesSimulacion from "../simulationAssignment/simulationAssignment.controller.js";

router.post("/calcular-datos-globales", authAdmin, calcularDatosGlobalesSimulacionController);