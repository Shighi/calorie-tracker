/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema
    // Create meal_logs table
    .createTable('meal_logs', table => {
      table.increments('id').primary();
      table.integer('user_id').references('id').inTable('users')
        .onUpdate('CASCADE').onDelete('CASCADE')
        .notNullable();
      table.string('name').notNullable();
      table.date('meal_date').notNullable();
      table.time('meal_time');
      table.enum('meal_type', ['breakfast', 'lunch', 'dinner', 'snack']).notNullable();
      table.text('notes');
      table.float('total_calories');
      table.timestamp('created_at').defaultTo(knex.fn.now()).notNullable();
      table.timestamp('updated_at').defaultTo(knex.fn.now()).notNullable();
    })
    // Create meal_foods table
    .then(() => {
      return knex.schema.createTable('meal_foods', table => {
        table.increments('id').primary();
        table.integer('meal_id').references('id').inTable('meal_logs')
          .onUpdate('CASCADE').onDelete('CASCADE')
          .notNullable();
        table.integer('food_id').references('id').inTable('foods')
          .onUpdate('CASCADE').onDelete('CASCADE')
          .notNullable();
        table.float('quantity').notNullable().defaultTo(1);
        table.float('serving_size').notNullable();
        table.string('serving_unit', 10).notNullable().defaultTo('g');
        table.float('calories');
        table.timestamp('created_at').defaultTo(knex.fn.now()).notNullable();
        table.timestamp('updated_at').defaultTo(knex.fn.now()).notNullable();
      });
    })
    // Create saved_meals table
    .then(() => {
      return knex.schema.createTable('saved_meals', table => {
        table.increments('id').primary();
        table.integer('user_id').references('id').inTable('users')
          .onUpdate('CASCADE').onDelete('CASCADE')
          .notNullable();
        table.string('name').notNullable();
        table.text('description');
        table.enum('meal_type', ['breakfast', 'lunch', 'dinner', 'snack', 'any'])
          .notNullable().defaultTo('any');
        table.float('total_calories');
        table.timestamp('created_at').defaultTo(knex.fn.now()).notNullable();
        table.timestamp('updated_at').defaultTo(knex.fn.now()).notNullable();
      });
    })
    // Create saved_meal_foods table
    .then(() => {
      return knex.schema.createTable('saved_meal_foods', table => {
        table.increments('id').primary();
        table.integer('saved_meal_id').references('id').inTable('saved_meals')
          .onUpdate('CASCADE').onDelete('CASCADE')
          .notNullable();
        table.integer('food_id').references('id').inTable('foods')
          .onUpdate('CASCADE').onDelete('CASCADE')
          .notNullable();
        table.float('quantity').notNullable().defaultTo(1);
        table.float('serving_size').notNullable();
        table.string('serving_unit', 10).notNullable().defaultTo('g');
        table.timestamp('created_at').defaultTo(knex.fn.now()).notNullable();
        table.timestamp('updated_at').defaultTo(knex.fn.now()).notNullable();
      });
    })
    // Create indexes
    .then(() => {
      return knex.schema.table('meal_logs', table => {
        table.index('user_id');
        table.index('meal_date');
        table.index('meal_type');
      });
    })
    .then(() => {
      return knex.schema.table('meal_foods', table => {
        table.index('meal_id');
        table.index('food_id');
      });
    })
    .then(() => {
      return knex.schema.table('saved_meals', table => {
        table.index('user_id');
      });
    })
    .then(() => {
      return knex.schema.table('saved_meal_foods', table => {
        table.index('saved_meal_id');
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
    .dropTableIfExists('saved_meal_foods')
    .then(() => knex.schema.dropTableIfExists('saved_meals'))
    .then(() => knex.schema.dropTableIfExists('meal_foods'))
    .then(() => knex.schema.dropTableIfExists('meal_logs'));
};