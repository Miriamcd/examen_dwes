
    
const mysql =  require('mysql2/promise')
const encriptar = require('./encriptar')

const conexion =  mysql.createPool({
    database: process.env.DATABASE,
    user: process.env.USER,
    password: process.env.PASSWORD,
    host: process.env.HOST
    })


    async function crear_libro(libro,usuario){

        const [rows] = await conexion.execute('insert into libros(nombre,autor,descripcion,usuario_id) values (?,?,?,?)',[libro.titulo,libro.autor,libro.descripcion,usuario.user_id])
        return rows
      
      }


async function crear_usuario(usuario){
    await conexion.execute('insert into usuarios (nombre,email,pass) values (?,?,?)',[usuario.nombre,usuario.email,usuario.pass])
}


async  function obtener_libros(){
    const [rows] = await conexion.execute('select * from libros')
    return rows
}
async  function obtener_usuarios(){
    const [rows] = await conexion.execute('select * from usuarios')
    return rows
}

async  function obtener_libro(id){
    const [rows] = await conexion.execute('select * from libros where id =?', [id])
    return rows[0]
}
async function obtener_usuario_email(email){
    const [rows] = await conexion.execute('select * from usuarios where email=?',[email])
    return rows[0]

}
async function obtener_libros_usuario(usuario){
    const [rows] = await conexion.execute('select * from libros where usuario_id=?',[usuario])
    return rows[0]

}

async function validar_login(usuario){//parametros que me llegan del login


    const [rows] = await conexion.execute('select * from usuarios where user=?',[usuario.user_name])
    if (rows.length>0) {
        const usuario_bd = rows[0]
        const contrasenya_correcta = await encriptar.comparar_contrasenya(usuario.user_pass,usuario_bd.password)
        
        return contrasenya_correcta
        
    } else {
        return false
        
    }
}
async function obtener_usuario_id(id){
    const [rows] = await conexion.execute('select * from usuarios where id=?',[id])
    return rows[0]
}

module.exports ={
    crear_libro,
    crear_usuario,
    obtener_libros,
    obtener_libro,
    // validar_login,
    
    obtener_usuario_email,
    obtener_libros_usuario,
    obtener_usuario_id,
    obtener_usuarios
}