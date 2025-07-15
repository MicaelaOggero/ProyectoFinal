import { Router } from "express"
import User from "../users/user.model.js"

const router = Router()

router.post('/register', async (req, res) => {
  try {
    const {
      dni,
      nombre,
      apellido,
      rol,
      habilidades,
      disponibilidadSemanal,
      preferencias,
      costoPorHora
    } = req.body

    // Validación básica
    if (!dni || !rol) {
      return res.status(400).json({ error: 'Faltan datos obligatorios (dni o rol)' })
    }

    // Verificar duplicado
    const yaExiste = await User.findOne({ dni })
    if (yaExiste) {
      return res.status(409).json({ error: 'Ya existe un usuario con ese DNI' })
    }

    // Crear el nuevo usuario
    const nuevoUsuario = await User.create({
      dni,
      nombre,
      apellido,
      rol, // debe ser 'admin' o 'desarrollador'
      habilidades,
      disponibilidadSemanal,
      preferencias,
      historialDesempeño: [],
      costoPorHora
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


router.post('/login', (req, res) => {
  const { email, password } = req.body
  if (email !== 'xasd_rosand@hotmail.com' || password !== 'aA123456') {
    return res.send('login failed')
  }

  req.session.email = email
  req.session.role = 'admin'
  res.status(200).send({ status: 'login success' })
})

router.delete('/logout', (req, res) => {
  req.session.destroy(err => {
    if (!err) res.send({ status: 'logout ok' })
    else res.send({ status: 'Logout ERROR', body: err })
  })
})

export default router
