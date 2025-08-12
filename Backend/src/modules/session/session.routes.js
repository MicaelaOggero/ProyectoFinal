import { Router } from "express"
import User from "../users/user.model.js"
import { auth } from "../auth/auth.routes.js"
import { createHash, isValidPassword } from "../../utils/utils.js"

const router = Router()

router.post('/register', async (req, res) => {
  try {
    const {
      dni,
      nombre,
      apellido,
      rol,
      habilidades,
      aniosExperiencia,
      disponibilidadSemanal,
      preferencias,
      costoPorHora,
      email,
      password
    } = req.body

    // Verificar duplicado
    const user = await User.findOne({ dni })
    if (user) {
      return res.status(409).json({ error: 'Ya existe un usuario con ese DNI' })
    }

    // Crear el nuevo usuario
    const nuevoUsuario = await User.create({
      dni,
      nombre,
      apellido,
      rol, // debe ser 'admin' o 'desarrollador'
      habilidades, //debe ser un array
      aniosExperiencia,
      disponibilidadSemanal,
      preferencias,
      historialDesempeño: [],
      costoPorHora,
      email,
      password: createHash(password)
    })

    res.status(201).json({
      mensaje: '✅ Usuario registrado correctamente',
      usuario: nuevoUsuario
    })

  } catch (error) {
    console.error('❌ Error al registrar usuario:', error)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
})


router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body
    const user = await User.findOne({ email })
    if (!user) {
      return res.status(409).json({ error: 'El usuario no existe' })
    }
    if (!isValidPassword(user, password)) {
      return res.status(403).send({ status: 'error', error: 'Contraseña incorrecta' })
    }

    req.session.userId = user._id
    req.session.email = user.email
    req.session.nombre = user.nombre;
    req.session.apellido = user.apellido
    req.session.rol = user.rol;

    res.status(200).send({ status: 'login success' })
  } catch (error) {
    console.error('❌ Error al iniciar sesión:', error)
    res.status(500).json({ error: 'Error interno del servidor' })
  }

})

router.delete('/logout', (req, res) => {
  req.session.destroy(err => {
    if (!err) res.send({ status: 'logout ok' })
    else res.send({ status: 'Logout ERROR', body: err })
  })
})

//Reestablecer contraseña
router.patch("/reset-password", async (req, res) => {
  const { email, password } = req.body;

  if (!email) {
    return res.status(400).send({ status: 'error', message: 'No se encontro el usuario' });
  }

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(401).send('Usuario no encontrado');

    await User.updateOne({ _id: user._id }, { $set: { password: createHash(password) } });

    req.session.nombre = user.nombre;
    req.session.apellido = user.apellido
    req.session.rol = user.rol;

    res.send('Reseteo de contraseña exitoso');
  } catch (error) {
    res.status(500).send('Error al resetear contraseña');
  }
});


router.get('/profile', auth, async (req, res) => {
  try {

    const userId = req.session.userId; 

    if (!userId) {
      return res.status(401).json({ error: 'No autorizado' });
    }

    // Buscar el usuario en la base de datos, excluyendo password y fechaCreacion
    const user = await User.findOne({ userId }).select('-password -fechaCreacion').lean();

    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    res.status(200).json({ status: 'ok', payload: user });

  } catch (error) {
    console.error('Error en /profile:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Actualizar datos del usuario logueado (no admin, solo su propio perfil)
router.put('/me', auth, async (req, res) => {
  try {
    const userId = req.session.userId 
    if (!userId) return res.status(401).json({ error: 'No autorizado' })

    // Campos que permitís actualizar (podés ajustar)
    const { nombre, apellido, habilidades, disponibilidadSemanal, preferencias, aniosExperiencia } = req.body

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { nombre, apellido, habilidades, disponibilidadSemanal, preferencias, aniosExperiencia },
      { new: true, runValidators: true }
    ).select('-password')

    if (!updatedUser) {
      return res.status(404).json({ error: 'Usuario no encontrado' })
    }

    res.json({ message: 'Perfil actualizado', usuario: updatedUser })
  } catch (error) {
    console.error('Error al actualizar perfil:', error)
    res.status(500).json({ error: 'Error interno' })
  }
})


export default router
