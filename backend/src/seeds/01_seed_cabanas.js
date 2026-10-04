/**
 * Seed inicial del catálogo de cabañas para Karinga Ecoturismo
 * @param {import('knex').Knex} knex
 */
export async function seed(knex) {
  const cabanasData = [
    {
      nombre: 'Glamping Irekani & Erandini',
      capacidad: 2,
      precio_entre_semana: 760.00,
      precio_fin_semana: 850.00,
      precio_temporada_alta: 999.00,
      deposito: 250.00,
      activo: true
    },
    {
      nombre: 'Glamping Jaracuaro',
      capacidad: 2,
      precio_entre_semana: 960.00,
      precio_fin_semana: 1060.00,
      precio_temporada_alta: 1250.00,
      deposito: 250.00,
      activo: true
    },
    {
      nombre: 'Tecuenita',
      capacidad: 2,
      precio_entre_semana: 1400.00,
      precio_fin_semana: 1560.00,
      precio_temporada_alta: 1840.00,
      deposito: 500.00,
      activo: true
    },
    {
      nombre: 'Buena Vista',
      capacidad: 2,
      precio_entre_semana: 1770.00,
      precio_fin_semana: 1970.00,
      precio_temporada_alta: 2320.00,
      deposito: 500.00,
      activo: true
    },
    {
      nombre: 'Tecuen',
      capacidad: 3,
      precio_entre_semana: 2340.00,
      precio_fin_semana: 2600.00,
      precio_temporada_alta: 3070.00,
      deposito: 500.00,
      activo: true
    },
    {
      nombre: 'Pacanda',
      capacidad: 4,
      precio_entre_semana: 3660.00,
      precio_fin_semana: 4070.00,
      precio_temporada_alta: 4800.00,
      deposito: 600.00,
      activo: true
    },
    {
      nombre: 'Yunuen',
      capacidad: 7,
      precio_entre_semana: 4410.00,
      precio_fin_semana: 4900.00,
      precio_temporada_alta: 5780.00,
      deposito: 600.00,
      activo: true
    },
    {
      nombre: 'Santa Fe',
      capacidad: 6,
      precio_entre_semana: 4650.00,
      precio_fin_semana: 5160.00,
      precio_temporada_alta: 6093.00,
      deposito: 600.00,
      activo: true
    },
    {
      nombre: 'Janitzio',
      capacidad: 10,
      precio_entre_semana: 6224.00,
      precio_fin_semana: 6915.00,
      precio_temporada_alta: 8160.00,
      deposito: 800.00,
      activo: true
    },
    {
      nombre: 'Chupicuaro',
      capacidad: 22,
      precio_entre_semana: 9720.00,
      precio_fin_semana: 10800.00,
      precio_temporada_alta: 12750.00,
      deposito: 1000.00,
      activo: true
    },
    {
      nombre: 'Hostal Uranden',
      capacidad: 16,
      precio_entre_semana: 6020.00,
      precio_fin_semana: 5920.00,
      precio_temporada_alta: 6990.00,
      deposito: 1500.00,
      activo: true
    },
    {
      nombre: 'HH Santa Clara',
      capacidad: 8,
      precio_entre_semana: 3960.00,
      precio_fin_semana: 4400.00,
      precio_temporada_alta: 5190.00,
      deposito: 600.00,
      activo: true
    }
  ];

  for (const cabana of cabanasData) {
    const existe = await knex('cabanas').where({ nombre: cabana.nombre }).first();
    if (!existe) {
      await knex('cabanas').insert(cabana);
    } else {
      await knex('cabanas').where({ id: existe.id }).update({
        capacidad: cabana.capacidad,
        precio_entre_semana: cabana.precio_entre_semana,
        precio_fin_semana: cabana.precio_fin_semana,
        precio_temporada_alta: cabana.precio_temporada_alta,
        deposito: cabana.deposito,
        activo: cabana.activo
      });
    }
  }
}
