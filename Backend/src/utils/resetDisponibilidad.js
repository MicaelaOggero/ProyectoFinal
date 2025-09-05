import cron from 'node-cron';
import User from '../models/User.js';

cron.schedule('0 0 * * 1', async () => {
  const usuarios = await User.find({});
  for (const u of usuarios) {
    u.disponibilidadSemanal = u.horasSemanalMax;
    await u.save();
  }
  console.log("Disponibilidad semanal reiniciada para todos los usuarios.");
});
