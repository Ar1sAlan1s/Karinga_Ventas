/**
 * Migración: Creación de la tabla de ventas y reservas
 * @param {import('knex').Knex} knex
 */
export async function up(knex) {
  return knex.schema.createTable('ventas', (table) => {
    table.increments('id').primary();
    table.date('fecha').notNullable();
    table.string('hora', 20).notNullable();
    table.string('temporada', 50).notNullable();
    table.string('nombre_reservacion', 255).nullable();
    
    // Cabaña y Hospedaje
    table.integer('cabana_id').unsigned().references('id').inTable('cabanas').onDelete('SET NULL').nullable();
    table.string('cabana_nombre', 150).nullable();
    table.integer('noches').notNullable().defaultTo(0);
    table.decimal('precio_noche', 10, 2).notNullable().defaultTo(0.00);
    table.integer('huespedes_totales').notNullable().defaultTo(0);
    table.integer('personas_extra').notNullable().defaultTo(0);
    table.decimal('costo_personas_extra', 10, 2).notNullable().defaultTo(0.00);
    table.decimal('costo_cabana', 10, 2).notNullable().defaultTo(0.00);
    table.decimal('deposito_requerido', 10, 2).notNullable().defaultTo(0.00);
    
    // Descuentos y Anticipos
    table.decimal('anticipo', 10, 2).notNullable().defaultTo(0.00);
    table.decimal('descuento_especial', 10, 2).notNullable().defaultTo(0.00);
    
    // Actividades Ecoturísticas
    table.integer('fresa_kilos').notNullable().defaultTo(0);
    table.integer('fresa_medios').notNullable().defaultTo(0);
    table.integer('tirolesa_boletos').notNullable().defaultTo(0);
    table.integer('cabalgata_30min').notNullable().defaultTo(0);
    table.integer('cabalgata_1hora').notNullable().defaultTo(0);
    table.decimal('costo_actividades', 10, 2).notNullable().defaultTo(0.00);
    
    // Totales y Pago
    table.decimal('subtotal', 10, 2).notNullable().defaultTo(0.00);
    table.decimal('total', 10, 2).notNullable().defaultTo(0.00);
    table.string('metodo_pago', 100).notNullable();
    
    // Metadatos y detalles para reportes
    table.string('concepto', 255).nullable();
    table.text('detalles_actividades').nullable();
    table.text('notas').nullable();

    table.timestamps(true, true);
  });
}

/**
 * @param {import('knex').Knex} knex
 */
export async function down(knex) {
  return knex.schema.dropTableIfExists('ventas');
}
