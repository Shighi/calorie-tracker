/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema
    // Create nutrition_goals table
    .createTable('nutrition_goals', table => {
      table.increments('id').primary();
      table.integer('user_id').references('id').inTable('users')
        .onUpdate('CASCADE').onDelete('CASCADE')
        .notNullable();
      table.integer('calories');
      table.integer('protein');
      table.integer('carbohydrates');
      table.integer('fat');
      table.integer('fiber');
      table.integer('sugar');
      table.integer('sodium');
      table.timestamp('created_at').defaultTo(knex.fn.now()).notNullable();
      table.timestamp('updated_at').defaultTo(knex.fn.now()).notNullable();
    })
    // Create nutrition_logs table
    .then(() => {
      return knex.schema.createTable('nutrition_logs', table => {
        table.increments('id').primary();
        table.integer('user_id').references('id').inTable('users')
          .onUpdate('CASCADE').onDelete('CASCADE')
          .notNullable();
        table.date('log_date').notNullable();
        table.float('calories').notNullable().defaultTo(0);
        table.float('protein').notNullable().defaultTo(0);
        table.float('carbohydrates').notNullable().defaultTo(0);
        table.float('fat').notNullable().defaultTo(0);
        table.float('fiber').notNullable().defaultTo(0);
        table.float('sugar').notNullable().defaultTo(0);
        table.float('sodium').notNullable().defaultTo(0);
        table.timestamp('created_at').defaultTo(knex.fn.now()).notNullable();
        table.timestamp('updated_at').defaultTo(knex.fn.now()).notNullable();
      });
    })
    // Create indexes
    .then(() => {
      return knex.schema.table('nutrition_goals', table => {
        table.index('user_id');
      });
    })
    .then(() => {
      return knex.schema.table('nutrition_logs', table => {
        table.index('user_id');
        table.index('log_date');
        table.unique(['user_id', 'log_date']);
      });
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema
    .dropTableIfExists('nutrition_logs')
    .then(() => knex.schema.dropTableIfExists('nutrition_goals'));
};