import express from 'express'
import dotenv from 'dotenv'
import session from 'express-session'
import MongoStore from 'connect-mongo'
import sessionRouter from '../src/modules/session/session.routes.js'
import projectRouter from '../src/modules/projects/project.routes.js'
import userRouter from '../src/modules/users/user.routes.js'
import skillRouter from '../src/modules/skills/skills.routes.js'
import taskRouter from '../src/modules/task/task.routes.js'
import assignmentRouter from '../src/modules/assignment/assignment.routes.js'
import simulationAssignmentRouter from '../src/modules/simulationAssignment/simulationAssignment.routes.js'
import notificationRouter from '../src/modules/notifications/notification.routes.js'
import passport from 'passport'
import cookieParser from 'cookie-parser'
import cors from 'cors'
import '../src/config/passport.config.js' 
import '../src/utils/resetDisponibilidad.js'
import { conectarDB } from "./config/db.js"
import feedbackRouter from '../src/modules/performanceFeedback/performanceFeedback.routes.js'
import reportRouter from '../src/modules/reports/report.routes.js'

dotenv.config()
const app=express()

// Configuración CORS
app.use((req, res, next) => {
  const allowedOrigins = ['http://localhost:8081', 'http://localhost:8082', "https://smartassistant.com.ar"]; // Puertos del frontend Vue
  const origin = req.headers.origin;
  
  if (allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
  }
  
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

app.use(express.json())
app.use(cookieParser())
app.use('/static', express.static('public'))

app.set("trust proxy", 1);

const isProd = process.env.NODE_ENV === "production";

app.use(session({
  store: MongoStore.create({
    mongoUrl: process.env.MONGO,
    ttl: 60 * 60
  }),
  secret: process.env.SECRET_SESSION,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: isProd,                 // ✅ true en prod (HTTPS)
    sameSite: isProd ? "none" : "lax", // ✅ cross-site necesita "none"
    maxAge: 60 * 60 * 1000
  }
}));

app.use(passport.initialize());
app.use(passport.session());


app.use('/api/session', sessionRouter)
app.use('/api/project', projectRouter)
app.use('/api/user', userRouter)
app.use('/api/skill', skillRouter)
app.use('/api/task', taskRouter)
app.use('/api/assignment', assignmentRouter)
app.use('/api/feedback', feedbackRouter)
app.use('/api/simulation-assignment', simulationAssignmentRouter)
app.use('/api/notification', notificationRouter)
app.use('/api/report', reportRouter)

// Conectar a la base de datos
conectarDB()

app.listen(process.env.PORT, () => console.log("servidor escuchando en el puerto " + process.env.PORT))

// password: lScrBJKESna5DDYv 