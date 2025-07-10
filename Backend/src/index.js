import express from 'express'
import mongoose from 'mongoose'
import dotenv from 'dotenv'
import cookieParser from 'cookie-parser'

dotenv.config()
const app=express()
app.use(express.json())
app.use(cookieParser())
app.use('/static', express.static('public'))

app.post('e/cooki', (req, res)=>{
    const {name, modo} = req.body
    res.cookie('cookie', JSON.stringify({name, modo}), {maxAge:1000}).send('cookie')
})

app.get('/cookie', (req, res)=>{
    
})

app.delete('/cookie', (req, res)=>{
    
})

mongoose.connect('mongodb+srv://micaoggero17:lScrBJKESna5DDYv@cluster0.qy9szah.mongodb.net/ProyectoFinal?retryWrites=true&w=majority&appName=Cluster0')

app.listen(process.env.PORT, () => console.log("servidor escuchando en el puerto " + process.env.PORT))

// password: lScrBJKESna5DDYv 