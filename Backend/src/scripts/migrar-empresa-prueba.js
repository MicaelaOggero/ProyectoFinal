// Diagnóstico por defecto. La migración se ejecuta únicamente con --apply.
import 'dotenv/config';
import mongoose from 'mongoose';
import User from '../modules/users/user.model.js';
import Project from '../modules/projects/project.model.js';
import Company from '../modules/companies/company.model.js';

const nombre = 'Empresa Prueba';
const emailSuperadmin = 'proyectof2026@gmail.com';
const emailCarlos = 'carlos.admin@example.com';
const apply = process.argv.includes('--apply');
const sinEmpresa = { empresa: null };

try {
  if (!process.env.MONGO) throw new Error('Falta configurar MONGO.');
  await mongoose.connect(process.env.MONGO, { serverSelectionTimeoutMS: 10000 });

  const inspect = async (session = null) => {
    const options = session ? { session } : {};
    // Las operaciones dentro de una transacción deben ejecutarse en serie.
    const superadmin = await User.findOne({ email: emailSuperadmin, rol: 'superadmin', empresa: null }, null, options).lean();
    const companies = await Company.find({ nombre }, null, options).lean();
    const users = await User.find({ ...sinEmpresa, rol: { $ne: 'superadmin' } }, '_id rol', options).lean();
    const projects = await Project.find(sinEmpresa, '_id administrador', options).lean();
    const carlos = await User.findOne({ email: emailCarlos, rol: 'admin', ...sinEmpresa }, '_id nombre email', options).lean();
    const owners = await User.find({ _id: { $in: projects.map(p => p.administrador).filter(Boolean) } }, '_id', options).lean();
    const ownerIds = new Set(owners.map(owner => String(owner._id)));
    const orphans = projects.filter(project => !ownerIds.has(String(project.administrador)));
    return { superadmin, companies, users, projects, orphans, carlos };
  };

  const report = state => {
    console.log(`Empresa: ${nombre}`);
    console.log(`Cuentas sin empresa: ${state.users.length}; proyectos sin empresa: ${state.projects.length}.`);
    console.log(`Proyectos con administrador inexistente: ${state.orphans.length}; se asignarán a ${emailCarlos}.`);
    console.log(`Cuenta administradora de Carlos disponible: ${state.carlos ? 'sí' : 'no'}.`);
    console.log(`Administrador general existente: ${state.superadmin ? 'sí' : 'no'}. Empresas con el mismo nombre: ${state.companies.length}.`);
  };

  if (!apply) {
    report(await inspect());
    console.log('Solo diagnóstico: no se modificaron datos.');
  } else {
    const session = await mongoose.startSession();
    try {
      await session.withTransaction(async () => {
        const state = await inspect(session);
        report(state);
        if (!state.superadmin) throw new Error('Primero debe existir la cuenta de administrador general indicada.');
        if (!state.carlos && state.orphans.length) throw new Error('No se encontró la cuenta administradora de Carlos sin empresa.');
        if (state.companies.length) throw new Error('Ya existe una empresa con ese nombre; revisar antes de continuar.');
        if (!state.users.length && !state.projects.length) throw new Error('No hay datos sin empresa para migrar.');
        const [company] = await Company.create([{ nombre, creadaPor: state.superadmin._id }], { session });
        // Conservar las referencias originales para poder revisar las reasignaciones.
        await mongoose.connection.collection('migraciones_empresa').insertOne({
          empresa: company._id,
          fecha: new Date(),
          usuarios: state.users.map(user => user._id),
          proyectos: state.projects.map(project => project._id),
          administradoresAnteriores: state.orphans.map(project => ({ proyecto: project._id, administrador: project.administrador ?? null })),
        }, { session });
        const userResult = await User.updateMany({ _id: { $in: state.users.map(u => u._id) }, ...sinEmpresa }, { $set: { empresa: company._id } }, { session });
        const projectResult = await Project.updateMany({ _id: { $in: state.projects.map(p => p._id) }, ...sinEmpresa }, { $set: { empresa: company._id } }, { session });
        if (userResult.modifiedCount !== state.users.length || projectResult.modifiedCount !== state.projects.length) {
          throw new Error('Los datos cambiaron durante la migración; se cancela la transacción.');
        }
        if (state.orphans.length) {
          const result = await Project.updateMany({ _id: { $in: state.orphans.map(p => p._id) }, empresa: company._id }, { $set: { administrador: state.carlos._id } }, { session });
          if (result.modifiedCount !== state.orphans.length) throw new Error('No se pudieron reasignar todos los proyectos; se cancela la transacción.');
        }
      });
      console.log('Migración completada. Los proyectos con administrador inexistente fueron asignados a Carlos.');
    } finally {
      await session.endSession();
    }
  }
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
