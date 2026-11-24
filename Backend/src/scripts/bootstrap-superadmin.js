// Por defecto solo inspecciona. Para aplicar se requiere --apply explícitamente.
import 'dotenv/config';
import mongoose from 'mongoose';
import User from '../modules/users/user.model.js';
import { createHash } from '../utils/utils.js';

const emailArgument = process.argv.find(arg => arg.startsWith('--email='));
const email = emailArgument?.slice('--email='.length).trim().toLowerCase();
const apply = process.argv.includes('--apply');
const create = process.argv.includes('--create');

if (!email || !process.env.MONGO) {
  console.error('Uso: node scripts/bootstrap-superadmin.js --email=CORREO [--create] [--apply]');
  process.exitCode = 1;
} else {
  try {
    await mongoose.connect(process.env.MONGO, { serverSelectionTimeoutMS: 10000 });
    const user = await User.findOne({ email }).select('nombre email rol empresa');
    if (!user && !create) throw new Error('No se encontró la cuenta indicada. Usá --create para preparar una cuenta nueva.');
    if (!user && create) {
      if (await User.exists({ rol: 'superadmin' })) throw new Error('Ya existe un administrador general. La creación inicial está bloqueada.');
      if (apply) {
        const password = process.env.BOOTSTRAP_PASSWORD;
        if (!password || password.length < 8) throw new Error('Para crear la cuenta se requiere BOOTSTRAP_PASSWORD con al menos 8 caracteres.');
        await User.create({ nombre: 'Administrador general', email, rol: 'superadmin', empresa: null, password: createHash(password) });
        console.log(`Cuenta de administrador general creada: ${email}.`);
      } else {
        console.log(`La cuenta ${email} no existe; podría crearse como administrador general.`);
        console.log('Solo diagnóstico; no se modificaron datos.');
      }
    } else {
    if (user.empresa) throw new Error('La cuenta ya pertenece a una empresa; revisá el caso antes de continuar.');
    if (!['admin', 'superadmin'].includes(user.rol)) throw new Error('La cuenta debe ser administradora antes de habilitarla como administrador general.');
    console.log(`Cuenta encontrada: ${user.email}; rol actual: ${user.rol}.`);
    if (apply && user.rol !== 'superadmin') {
      user.rol = 'superadmin';
      await user.save();
      console.log('Cuenta habilitada como administrador general.');
    } else if (!apply) {
      console.log('Solo diagnóstico; no se modificaron datos. Agregá --apply para aplicar el cambio.');
    } else {
      console.log('La cuenta ya era administrador general.');
    }
    }
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}
