/**
 * Semilla canónica de cabañas en Karinga Resort Ecoturístico
 *
 * Mapeo exacto de IDs canónicos:
 * 1: Glamping Irekani
 * 2: Glamping Jaracuaro
 * 3: Tecuenita
 * 4: Buena Vista
 * 5: Tecuen
 * 6: Pacanda
 * 7: Yunuen
 * 8: Santa Fe
 * 9: Janitzio
 * 10: Chupicuaro
 * 11: Hostal Uranden
 * 12: HH Santa Clara
 * 13: Glamping Erandini
 */
export async function seed(knex) {
  const cabanas = [
    {
      id: 1,
      nombre: 'Glamping Irekani',
      capacidad: 2,
      precio_entre_semana: 760.00,
      precio_fin_semana: 850.00,
      precio_temporada_alta: 999.00,
      deposito: 250.00,
      activo: true
    },
    {
      id: 2,
      nombre: 'Glamping Jaracuaro',
      capacidad: 2,
      precio_entre_semana: 960.00,
      precio_fin_semana: 1060.00,
      precio_temporada_alta: 1250.00,
      deposito: 250.00,
      activo: true
    },
    {
      id: 3,
      nombre: 'Tecuenita',
      capacidad: 2,
      precio_entre_semana: 1400.00,
      precio_fin_semana: 1560.00,
      precio_temporada_alta: 1840.00,
      deposito: 500.00,
      activo: true
    },
    {
      id: 4,
      nombre: 'Buena Vista',
      capacidad: 2,
      precio_entre_semana: 1770.00,
      precio_fin_semana: 1970.00,
      precio_temporada_alta: 2320.00,
      deposito: 500.00,
      activo: true
    },
    {
      id: 5,
      nombre: 'Tecuen',
      capacidad: 3,
      precio_entre_semana: 2340.00,
      precio_fin_semana: 2600.00,
      precio_temporada_alta: 3070.00,
      deposito: 500.00,
      activo: true
    },
    {
      id: 6,
      nombre: 'Pacanda',
      capacidad: 4,
      precio_entre_semana: 3660.00,
      precio_fin_semana: 4070.00,
      precio_temporada_alta: 4800.00,
      deposito: 600.00,
      activo: true
    },
    {
      id: 7,
      nombre: 'Yunuen',
      capacidad: 7,
      precio_entre_semana: 4410.00,
      precio_fin_semana: 4900.00,
      precio_temporada_alta: 5780.00,
      deposito: 600.00,
      activo: true
    },
    {
      id: 8,
      nombre: 'Santa Fe',
      capacidad: 6,
      precio_entre_semana: 4650.00,
      precio_fin_semana: 5160.00,
      precio_temporada_alta: 6093.00,
      deposito: 600.00,
      activo: true
    },
    {
      id: 9,
      nombre: 'Janitzio',
      capacidad: 10,
      precio_entre_semana: 6224.00,
      precio_fin_semana: 6915.00,
      precio_temporada_alta: 8160.00,
      deposito: 800.00,
      activo: true
    },
    {
      id: 10,
      nombre: 'Chupicuaro',
      capacidad: 22,
      precio_entre_semana: 9720.00,
      precio_fin_semana: 10800.00,
      precio_temporada_alta: 12750.00,
      deposito: 1000.00,
      activo: true
    },
    {
      id: 11,
      nombre: 'Hostal Uranden',
      capacidad: 16,
      precio_entre_semana: 6020.00,
      precio_fin_semana: 5920.00,
      precio_temporada_alta: 6990.00,
      deposito: 1500.00,
      activo: true
    },
    {
      id: 12,
      nombre: 'HH Santa Clara',
      capacidad: 8,
      precio_entre_semana: 3960.00,
      precio_fin_semana: 4400.00,
      precio_temporada_alta: 5190.00,
      deposito: 600.00,
      activo: true
    },
    {
      id: 13,
      nombre: 'Glamping Erandini',
      capacidad: 2,
      precio_entre_semana: 760.00,
      precio_fin_semana: 850.00,
      precio_temporada_alta: 999.00,
      deposito: 250.00,
      activo: true
    }
  ];

  for (const c of cabanas) {
    const existe = await knex('cabanas').where({ id: c.id }).first();
    if (existe) {
      await knex('cabanas').where({ id: c.id }).update({
        nombre: c.nombre,
        capacidad: c.capacidad,
        precio_entre_semana: c.precio_entre_semana,
        precio_fin_semana: c.precio_fin_semana,
        precio_temporada_alta: c.precio_temporada_alta,
        deposito: c.deposito,
        activo: c.activo
      });
    } else {
      await knex('cabanas').insert(c);
    }
  }

  // Ajustar la secuencia de Postgres al ID máximo
  try {
    await knex.raw("SELECT setval(pg_get_serial_sequence('cabanas', 'id'), coalesce(max(id), 13)) FROM cabanas;");
  } catch (errSeq) {
    // Si no es secuencia serial simple, ignorar
  }
}
