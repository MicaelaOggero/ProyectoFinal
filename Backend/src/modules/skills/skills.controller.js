import Habilidad from './skills.model.js';

export async function obtenerHabilidades(req, res) {
  try {
    const habilidades = await Habilidad.find().sort({ nombre: 1 }); // orden alfabético
    res.json(habilidades);
  } catch (error) {
    console.error('Error al obtener habilidades:', error);
    res.status(500).json({ mensaje: 'Error al obtener habilidades' });
  }
}