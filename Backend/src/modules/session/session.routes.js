import { Router } from "express"
import User from "../users/user.model.js"
import {auth} from "../auth/auth.routes.js"

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
      disponibilidadSemanal,
      preferencias,
      historialDesempeño: [],
      costoPorHora,
      email,
      password
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
    const user = await User.findOne({ email, password })
    if (!user) {
      return res.status(409).json({ error: 'El usuario no existe o la contraseña es incorrecta' })
    }

    req.session.nombre = user.nombre
    req.session.apellido = user.apellido
    req.session.rol = user.rol

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

router.get('/profile', auth, (req, res) =>{
  const nombre = req.session.nombre 
  const apellido = req.session.apellido 
  const rol = req.session.rol 

  res.status(200).send({status: 'ok', payload: {nombre, apellido, rol}})
})

export default router
