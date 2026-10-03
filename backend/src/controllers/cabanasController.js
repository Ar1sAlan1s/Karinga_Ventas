import db from '../config/db.js';

export async function obtenerCabanas(req, res) {
  try {
    const cabanas = await db('cabanas')
      .where({ activo: true })
      .orderBy('id', 'asc');

    return res.status(200).json({
      exito: true,
      datos: cabanas
    });
  } catch (error) {
    console.error('Error al obtener cabañas:', error);
    return res.status(500).json({
      exito: false,
      mensaje: 'Error interno al consultar el catálogo de cabañas',
      error: error.message
    });
  }
}

export async function obtenerCabanaPorId(req, res) {
  try {
    const { id } = req.params;
    const cabana = await db('cabanas').where({ id }).first();

    if (!cabana) {
      return res.status(404).json({
        exito: false,
        mensaje: 'Cabaña no encontrada'
      });
    }

    return res.status(200).json({
      exito: true,
      datos: cabana
    });
  } catch (error) {
    console.error('Error al obtener cabaña:', error);
    return res.status(500).json({
      exito: false,
      mensaje: 'Error interno al consultar la cabaña',
      error: error.message
    });
  }
}
