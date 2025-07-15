import express from 'express'
import mongoose from 'mongoose'
import dotenv from 'dotenv'
import authRouter from '../src/modules/auth/auth.routes.js'
import session from 'express-session'
import MongoStore from 'connect-mongo'

dotenv.config()
const app=express()
app.use(express.json())
app.use('/static', express.static('public'))
app.use(session({
  store: MongoStore.create({
    mongoUrl: process.env.MONGO,
    ttl: 60 * 60
  }),
  secret: process.env.SECRET_SESSION,
  resave: true,
  saveUninitialized: true,
  cookie: {
    httpOnly: true,
    secure: false
  }
}))

app.use('/api/session', authRouter)

mongoose.connect('mongodb+srv://micaoggero17:lScrBJKESna5DDYv@cluster0.qy9szah.mongodb.net/ProyectoFinal?retryWrites=true&w=majority&appName=Cluster0')

app.listen(process.env.PORT, () => console.log("servidor escuchando en el puerto " + process.env.PORT))

// password: lScrBJKESna5DDYv 