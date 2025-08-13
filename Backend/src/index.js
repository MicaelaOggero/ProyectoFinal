import express from 'express'
import mongoose from 'mongoose'
import dotenv from 'dotenv'
import session from 'express-session'
import MongoStore from 'connect-mongo'
import sessionRouter from '../src/modules/session/session.routes.js'
import projectRouter from '../src/modules/projects/project.routes.js'
import userRouter from '../src/modules/users/user.routes.js'
import skillRouter from '../src/modules/skills/skills.routes.js'
import passport from 'passport'

dotenv.config()
const app=express()

// Configuración CORS
app.use((req, res, next) => {
  const allowedOrigins = ['http://localhost:8081', 'http://localhost:8082']; // Puertos del frontend Vue
  const origin = req.headers.origin;
  
  if (allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
  }
  
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

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

app.use(session({
  secret: 'tu-secreto',
  resave: false,
  saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());


app.use('/api/session', sessionRouter)
app.use('/api/project', projectRouter)
app.use('/api/user', userRouter)
app.use('/api/skill', skillRouter)


mongoose.connect('mongodb+srv://micaoggero17:lScrBJKESna5DDYv@cluster0.qy9szah.mongodb.net/ProyectoFinal?retryWrites=true&w=majority&appName=Cluster0')

app.listen(process.env.PORT, () => console.log("servidor escuchando en el puerto " + process.env.PORT))

// password: lScrBJKESna5DDYv 