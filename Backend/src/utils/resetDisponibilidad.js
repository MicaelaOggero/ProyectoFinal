import cron from 'node-cron';
import User from '../modules/users/user.model.js';

// Programar tarea para que se ejecute cada lunes a la medianoche (cuando comienza la semana)
cron.schedule('0 0 * * 1', async () => {
  console.log("Se ejecutó el cron!");
  const usuarios = await User.find({});
  for (const u of usuarios) {
    u.disponibilidadSemanal = u.horasSemanalMax;
    await u.save();
  }
  console.log("Disponibilidad semanal reiniciada para todos los usuarios.");
});



