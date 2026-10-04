/**
 * Migración: Dividir ventas en ventas_cabanas y ventas_actividades
 * con relación opcional entre ambas (reserva_cabana_id).
 * Migra automáticamente los datos existentes.
 * @param {import('knex').Knex} knex
 */
export async function up(knex) {
  // 1. Crear tabla ventas_cabanas
  const tieneVentasCabanas = await knex.schema.hasTable('ventas_cabanas');
  if (!tieneVentasCabanas) {
    await knex.schema.createTable('ventas_cabanas', (table) => {
      table.increments('id').primary();
      table.date('fecha').notNullable();
      table.string('hora', 20).notNullable();
      table.string('temporada', 50).notNullable().defaultTo('entre_semana');
      table.string('nombre_reservacion', 255).notNullable();
      table.integer('cabana_id').unsigned().references('id').inTable('cabanas').onDelete('SET NULL').nullable();
      table.string('cabana_nombre', 150).nullable();
      table.integer('noches').notNullable().defaultTo(1);
      table.decimal('precio_noche', 10, 2).notNullable().defaultTo(0.00);
      table.integer('huespedes_totales').notNullable().defaultTo(0);
      table.integer('personas_extra').notNullable().defaultTo(0);
      table.decimal('costo_personas_extra', 10, 2).notNullable().defaultTo(0.00);
      table.decimal('costo_cabana', 10, 2).notNullable().defaultTo(0.00);
      table.decimal('deposito_requerido', 10, 2).notNullable().defaultTo(0.00);
      table.integer('horas_extra').notNullable().defaultTo(0);
      table.decimal('costo_horas_extra', 10, 2).notNullable().defaultTo(0.00);
      table.date('fecha_checkin').nullable();
      table.string('hora_checkin', 20).defaultTo('15:00');
      table.date('fecha_checkout').nullable();
      table.string('hora_checkout', 20).defaultTo('12:00');
      table.decimal('anticipo', 10, 2).notNullable().defaultTo(0.00);
      table.string('metodo_pago_anticipo', 100).nullable();
      table.string('comprobante_anticipo', 255).nullable();
      table.string('estado_pago', 50).notNullable().defaultTo('liquidado');
      table.decimal('saldo_pendiente', 10, 2).notNullable().defaultTo(0.00);
      table.decimal('monto_liquidado', 10, 2).notNullable().defaultTo(0.00);
      table.string('metodo_pago_liquidacion', 100).nullable();
      table.string('tipo_descuento', 20).notNullable().defaultTo('monto');
      table.decimal('valor_descuento', 10, 2).notNullable().defaultTo(0.00);
      table.decimal('descuento_especial', 10, 2).notNullable().defaultTo(0.00);
      table.decimal('subtotal', 10, 2).notNullable().defaultTo(0.00);
      table.decimal('total', 10, 2).notNullable().defaultTo(0.00);
      table.string('metodo_pago', 100).notNullable().defaultTo('Efectivo');
      table.string('concepto', 255).nullable();
      table.text('notas').nullable();
      table.timestamps(true, true);
    });
  }

  // 2. Crear tabla ventas_actividades
  const tieneVentasActividades = await knex.schema.hasTable('ventas_actividades');
  if (!tieneVentasActividades) {
    await knex.schema.createTable('ventas_actividades', (table) => {
      table.increments('id').primary();
      table.date('fecha').notNullable();
      table.string('hora', 20).notNullable();
      table.string('temporada', 50).defaultTo('N/A');
      table.string('cliente_nombre', 255).notNullable().defaultTo('Público General');
      // Relación opcional con cabaña y reservación de hospedaje
      table.integer('reserva_cabana_id').unsigned().references('id').inTable('ventas_cabanas').onDelete('SET NULL').nullable();
      table.integer('cabana_id').unsigned().references('id').inTable('cabanas').onDelete('SET NULL').nullable();
      table.string('cabana_nombre', 150).nullable();
      table.integer('visitas_personas').defaultTo(0);
      table.decimal('costo_visitas', 10, 2).defaultTo(0.00);
      table.integer('camping_personas').defaultTo(0);
      table.decimal('camping_precio_unitario', 10, 2).defaultTo(140.00);
      table.decimal('costo_camping', 10, 2).defaultTo(0.00);
      table.integer('fresa_kilos').defaultTo(0);
      table.integer('fresa_medios').defaultTo(0);
      table.integer('tirolesa_boletos').defaultTo(0);
      table.integer('cabalgata_30min').defaultTo(0);
      table.integer('cabalgata_1hora').defaultTo(0);
      table.decimal('costo_actividades', 10, 2).defaultTo(0.00);
      table.string('tipo_descuento', 20).defaultTo('monto');
      table.decimal('valor_descuento', 10, 2).defaultTo(0.00);
      table.decimal('descuento_especial', 10, 2).defaultTo(0.00);
      table.decimal('subtotal', 10, 2).defaultTo(0.00);
      table.decimal('total', 10, 2).notNullable().defaultTo(0.00);
      table.string('metodo_pago', 100).notNullable().defaultTo('Efectivo');
      table.string('concepto', 255).nullable();
      table.text('detalles_actividades').nullable();
      table.text('notas').nullable();
      table.timestamps(true, true);
    });
  }

  // 3. Migrar datos existentes desde la tabla 'ventas' si existe
  const tieneVentas = await knex.schema.hasTable('ventas');
  if (tieneVentas) {
    const filasVentas = await knex('ventas').select('*');

    for (const v of filasVentas) {
      if (v.cabana_id) {
        // Cabaña
        const yaExiste = await knex('ventas_cabanas').where({ id: v.id }).first();
        if (!yaExiste) {
          await knex('ventas_cabanas').insert({
            id: v.id,
            fecha: v.fecha,
            hora: v.hora,
            temporada: v.temporada || 'entre_semana',
            nombre_reservacion: v.nombre_reservacion || 'Sin Nombre',
            cabana_id: v.cabana_id,
            cabana_nombre: v.cabana_nombre,
            noches: v.noches || 1,
            precio_noche: v.precio_noche || 0.00,
            huespedes_totales: v.huespedes_totales || 0,
            personas_extra: v.personas_extra || 0,
            costo_personas_extra: v.costo_personas_extra || 0.00,
            costo_cabana: v.costo_cabana || 0.00,
            deposito_requerido: v.deposito_requerido || 0.00,
            horas_extra: v.horas_extra || 0,
            costo_horas_extra: v.costo_horas_extra || 0.00,
            fecha_checkin: v.fecha_checkin,
            hora_checkin: v.hora_checkin || '15:00',
            fecha_checkout: v.fecha_checkout,
            hora_checkout: v.hora_checkout || '12:00',
            anticipo: v.anticipo || 0.00,
            metodo_pago_anticipo: v.metodo_pago_anticipo,
            comprobante_anticipo: v.comprobante_anticipo,
            estado_pago: v.estado_pago || 'liquidado',
            saldo_pendiente: v.saldo_pendiente || 0.00,
            monto_liquidado: v.monto_liquidado || 0.00,
            metodo_pago_liquidacion: v.metodo_pago_liquidacion,
            tipo_descuento: v.tipo_descuento || 'monto',
            valor_descuento: v.valor_descuento || 0.00,
            descuento_especial: v.descuento_especial || 0.00,
            subtotal: v.subtotal || 0.00,
            total: v.total || 0.00,
            metodo_pago: v.metodo_pago || 'Efectivo',
            concepto: v.concepto,
            notas: v.notas,
            created_at: v.created_at || new Date(),
            updated_at: v.updated_at || new Date()
          });
        }
      } else {
        // Actividad
        const yaExiste = await knex('ventas_actividades').where({ id: v.id }).first();
        if (!yaExiste) {
          await knex('ventas_actividades').insert({
            id: v.id,
            fecha: v.fecha,
            hora: v.hora,
            temporada: v.temporada || 'N/A',
            cliente_nombre: v.nombre_reservacion || 'Público General',
            reserva_cabana_id: null,
            cabana_id: null,
            cabana_nombre: null,
            visitas_personas: v.visitas_personas || 0,
            costo_visitas: Number(v.visitas_personas || 0) * 95.0,
            camping_personas: v.camping_personas || 0,
            camping_precio_unitario: v.camping_precio_unitario || 140.0,
            costo_camping: Number(v.camping_personas || 0) * Number(v.camping_precio_unitario || 140.0),
            fresa_kilos: v.fresa_kilos || 0,
            fresa_medios: v.fresa_medios || 0,
            tirolesa_boletos: v.tirolesa_boletos || 0,
            cabalgata_30min: v.cabalgata_30min || 0,
            cabalgata_1hora: v.cabalgata_1hora || 0,
            costo_actividades: v.costo_actividades || 0.00,
            tipo_descuento: v.tipo_descuento || 'monto',
            valor_descuento: v.valor_descuento || 0.00,
            descuento_especial: v.descuento_especial || 0.00,
            subtotal: v.subtotal || 0.00,
            total: v.total || 0.00,
            metodo_pago: v.metodo_pago || 'Efectivo',
            concepto: v.concepto,
            detalles_actividades: v.detalles_actividades,
            notas: v.notas,
            created_at: v.created_at || new Date(),
            updated_at: v.updated_at || new Date()
          });
        }
      }
    }

    // Actualizar secuencias en PostgreSQL
    try {
      await knex.raw(`SELECT setval(pg_get_serial_sequence('ventas_cabanas', 'id'), COALESCE((SELECT MAX(id) FROM ventas_cabanas), 1));`);
      await knex.raw(`SELECT setval(pg_get_serial_sequence('ventas_actividades', 'id'), COALESCE((SELECT MAX(id) FROM ventas_actividades), 1));`);
    } catch {
      // Ignorar si el cliente no es Postgres
    }
  }
}

/**
 * @param {import('knex').Knex} knex
 */
export async function down(knex) {
  await knex.schema.dropTableIfExists('ventas_actividades');
  await knex.schema.dropTableIfExists('ventas_cabanas');
}
