import bcrypt from 'bcryptjs';
import db from '../config/db.js';

const ROLES_VALIDOS = ['ADMIN', 'RECEPCION', 'OPERADOR'];

/**
 * Crear un nuevo usuario - EXCLUSIVO PARA ADMINISTRADORES AUTENTICADOS
 * Protege contra creación no autorizada desde Postman o clientes externos
 */
export async function crearUsuario(req, res) {
  try {
    const { nombre, email, password, rol } = req.body;

    if (!nombre || !email || !password) {
      return res.status(400).json({
        exito: false,
        mensaje: 'Nombre, correo electrónico y contraseña son campos obligatorios.'
      });
    }

    const emailNormalizado = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailNormalizado)) {
      return res.status(400).json({
        exito: false,
        mensaje: 'El formato del correo electrónico no es válido.'
      });
    }

    if (typeof password !== 'string' || password.length < 8) {
      return res.status(400).json({
        exito: false,
        mensaje: 'La contraseña debe tener al menos 8 caracteres.'
      });
    }

    const rolAsignado = rol && ROLES_VALIDOS.includes(rol.toUpperCase())
      ? rol.toUpperCase()
      : 'OPERADOR';

    // Comprobar si el correo ya existe
    const existente = await db('usuarios').where({ email: emailNormalizado }).first();
    if (existente) {
      return res.status(409).json({
        exito: false,
        mensaje: 'Ya existe una cuenta registrada con este correo electrónico.'
      });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const [nuevoId] = await db('usuarios').insert({
      nombre: nombre.trim(),
      email: emailNormalizado,
      password_hash: passwordHash,
      rol: rolAsignado,
      activo: true,
      created_at: new Date(),
      updated_at: new Date()
    }).returning('id');

    const idCreado = typeof nuevoId === 'object' ? nuevoId.id : nuevoId;

    return res.status(201).json({
      exito: true,
      mensaje: 'Usuario creado exitosamente.',
      usuario: {
        id: idCreado,
        nombre: nombre.trim(),
        email: emailNormalizado,
        rol: rolAsignado,
        activo: true
      }
    });
  } catch (error) {
    console.error('[CREAR USUARIO ERROR]', error);
    return res.status(500).json({
      exito: false,
      mensaje: 'Error interno al registrar el usuario.'
    });
  }
}

/**
 * Listar todos los usuarios del sistema (Sólo administradores)
 */
export async function listarUsuarios(req, res) {
  try {
    const usuarios = await db('usuarios')
      .select('id', 'nombre', 'email', 'rol', 'activo', 'ultimo_acceso', 'created_at')
      .orderBy('id', 'asc');

    return res.json({
      exito: true,
      usuarios
    });
  } catch (error) {
    console.error('[LISTAR USUARIOS ERROR]', error);
    return res.status(500).json({
      exito: false,
      mensaje: 'Error al obtener la lista de usuarios.'
    });
  }
}

/**
 * Activar o desactivar cuenta de usuario (Sólo administradores)
 */
export async function cambiarEstadoUsuario(req, res) {
  try {
    const { id } = req.params;
    const { activo } = req.body;

    if (typeof activo !== 'boolean') {
      return res.status(400).json({
        exito: false,
        mensaje: 'Debe especificar el estado booleano (activo: true|false).'
      });
    }

    if (parseInt(id, 10) === req.usuario.id && !activo) {
      return res.status(400).json({
        exito: false,
        mensaje: 'No puedes desactivar tu propia cuenta administradora.'
      });
    }

    const modificado = await db('usuarios').where({ id }).update({
      activo,
      updated_at: new Date()
    });

    if (!modificado) {
      return res.status(404).json({
        exito: false,
        mensaje: 'Usuario no encontrado.'
      });
    }

    // Si se desactiva, invalidar todas sus sesiones activas inmediatamente
    if (!activo) {
      await db('sesiones_tokens').where({ usuario_id: id }).update({ revocado: true });
    }

    return res.json({
      exito: true,
      mensaje: `Usuario ${activo ? 'activado' : 'desactivado'} correctamente.`
    });
  } catch (error) {
    console.error('[CAMBIAR ESTADO USUARIO ERROR]', error);
    return res.status(500).json({
      exito: false,
      mensaje: 'Error al modificar el estado del usuario.'
    });
  }
}
