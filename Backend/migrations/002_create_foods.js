/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema
    // Create locales table
    .createTable('locales', table => {
      table.increments('id').primary();
      table.string('name').notNullable();
      table.string('code', 10).notNullable().unique();
      table.timestamp('created_at').defaultTo(knex.fn.now()).notNullable();
      table.timestamp('updated_at').defaultTo(knex.fn.now()).notNullable();
    })
    // Create foods table
    .then(() => {
      return knex.schema.createTable('foods', table => {
        table.increments('id').primary();
        table.string('name').notNullable();
        table.text('description');
        table.string('category');
        table.float('serving_size').notNullable().defaultTo(100);
        table.string('serving_unit', 10).notNullable().defaultTo('g');
        table.integer('locale_id').references('id').inTable('locales')
          .onUpdate('CASCADE').onDelete('SET NULL');
        table.string('external_id').unique();
        table.timestamp('created_at').defaultTo(knex.fn.now()).notNullable();
        table.timestamp('updated_at').defaultTo(knex.fn.now()).notNullable();
      });
    })
    // Create nutrients table
    .then(() => {
      return knex.schema.createTable('nutrients', table => {
        table.increments('id').primary();
        table.integer('food_id').references('id').inTable('foods')
          .onUpdate('CASCADE').onDelete('CASCADE')
          .notNullable();
        table.float('calories').notNullable().defaultTo(0);
        table.float('protein').notNullable().defaultTo(0);
        table.float('carbohydrates').notNullable().defaultTo(0);
        table.float('fat').notNullable().defaultTo(0);
        table.float('fiber').notNullable().defaultTo(0);
        table.float('sugar');
        table.float('sodium');
        table.timestamp('created_at').defaultTo(knex.fn.now()).notNullable();
        table.timestamp('updated_at').defaultTo(knex.fn.now()).notNullable();
      });
    })
    // Create indexes
    .then(() => {
      return knex.schema.table('foods', table => {
        table.index('name');
        table.index('category');
        table.index('locale_id');
        table.index('external_id');
      });
    })
    .then(() => {
      return knex.schema.table('nutrients', table => {
        table.index('food_id');
      });
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema
    .dropTableIfExists('nutrients')
    .then(() => knex.schema.dropTableIfExists('foods'))
    .then(() => knex.schema.dropTableIfExists('locales'));
};