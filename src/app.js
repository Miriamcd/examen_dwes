



require('dotenv').config()

const path = require('path')
const jwt = require('jsonwebtoken')

const mysql = require('mysql2/promise')

const express = require('express')
const ejs = require('ejs')
const cookie = require('cookie-parser')
const { log } = require('console')

const conexion =  mysql.createPool({
database: process.env.DATABASE,
user: process.env.USER,
password: process.env.PASSWORD,
host: process.env.HOST
})

const app = express()

app.set('view engine','ejs')
app.set('views', path.join(__dirname,'views'))

app.use(express.json())
app.use(express.urlencoded({extended: false})) 
app.use(cookie())
app.use((req,res,next)=>{    
    if (req.cookies.usuario){
        const token = req.cookies.usuario
        const payload = jwt.verify(token,process.env.SECRETKEY)
        req.usuario = payload        
    }

    next()
})

app.get('/',(req,res)=>{
    res.render('bienvenida')
})



app.get('/registro',(req,res)=>{
    res.render('registro')

})

app.post('/registro',async(req,res)=>{
    const bd = require('./bd')
    const encriptar = require('./encriptar')
    const {nombre,email,pass} = req.body
    const usuario_email = await bd.obtener_usuario_email(email)

    if (!usuario_email) {

        // const usuario_creado = await bd.crear_usuario({nombre,email,pass})
        const contrasena_encriptada = await encriptar.encriptar_contrasenya(pass)
        const usuario_creado = await bd.crear_usuario({nombre,email,pass:contrasena_encriptada})
        const usuario_id = await bd.obtener_usuario_id(usuario_creado.insertId)     

        const token = jwt.sign({user_id: usuario_creado.insertId, nombre: usuario_id.nombre,email:usuario_id.email},process.env.SECRETKEY,{expiresIn: "1h"})
        res.cookie('usuario',token)
        console.log('usuario creado', usuario_creado);
        console.log('usuario id', usuario_id);
        res.redirect('bienvenida_usuario')
        
    } 
    else{
        res.redirect('login')
    }
})

app.get('/bienvenida_usuario',(req,res)=>{
    // const usuario = req.cookies.usuario
    const usuario = req.usuario
    res.render('bienvenida_usuario',{usuario:usuario.nombre})

})

app.get('/perfil',async (req,res)=>{
    const db = require('./bd')
    // const usuario = req.cookies.usuario
    const usuario = req.usuario
    console.log('usuario token',usuario);
    let usuario_email = await db.obtener_usuario_email(usuario.email)
    console.log('usuario_email',usuario_email);
    const libros = await db.obtener_libros_usuario({usuario:usuario_email.id})
    console.log('libros',libros);
    let libros_bd= await db.obtener_libros()


    res.render('perfil',{libros:libros_bd})

})

app.get('/login',(req,res)=>{
    res.render('login',{mensaje:""})

})

app.post('/login',async(req,res)=>{
    const bd = require('./bd')
    const encriptar = require('./encriptar')
    const {user_email,user_pass}= req.body
    const contrasena_encriptada = await encriptar.encriptar_contrasenya(user_pass)
    // const existe_uusario = await bd.validar_usuario(user_email,contrasena_encriptada)
    const usuario_email = await bd.obtener_usuario_email(user_email)
    console.log('usuario email',usuario_email);
    const contrasenas_iguales = await encriptar.comparar_contrasenya(user_pass,usuario_email.pass)
    
    if (contrasenas_iguales) {
        console.log(contrasenas_iguales);
        const token = jwt.sign({user_id: usuario_email.id, nombre: usuario_email.nombre,email:usuario_email.email},process.env.SECRETKEY,{expiresIn: "1h"})
        res.cookie('usuario',token)
        if (usuario_email.email == 'admin@admin.com' ) {
            
            res.redirect('panel_admin')
        }
        else{
            res.redirect('bienvenida_usuario')
        }        
    }

    // res.render('login',{mensaje:'usuario y contraseña invalidos'})
})

app.get('/panel_admin',(req,res)=>{
    res.render('panel_admin')

})

app.get('/usuarios_admin',async(req,res)=>{
    const bd = require('./bd')
    const usuarios = await bd.obtener_usuarios()

    res.render('usuarios_admin',{usuarios})
})

app.get('/objetos_admin',async(req,res)=>{
    const bd = require('./bd')
    const libros = await bd.obtener_libros()
    

    res.render('objetos_admin',{libros:libros})
})

app.get('/registro_libros',(req,res)=>{
    res.render('registro_libros')
})




app.post('/registro_libros',async(req,res)=>{
    const bd = require('./bd')
    const {titulo,autor,descripcion} = req.body
    // const usuario = req.cookies.usuario
    const usuario = req.usuario
    
    const libro_creado = await bd.crear_libro({titulo,autor,descripcion},{usuario:usuario.user_id})
    console.log('libro creado',libro_creado);
    res.redirect('perfil',{libros:libro_creado})
})


app.use((req,res,next)=>{
    
    res.status(404).send('<h1>Página no encontrada</h1>')
    next()
})

app.use('/public',express.static(path.join(__dirname, '/public')))
console.log(path.join(__dirname, 'public'))
const PORT = process.env.PORT || 5000

app.listen(PORT)

console.log('Escuchando en el puerto',PORT)
