import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Import models using dynamic import - fixed for Windows paths in ESM
const getModels = async () => {
  try {
    // Convert the path to a proper file URL
    const modelsPath = path.join(__dirname, '../src/models/index.js');
    const modelsUrl = new URL(`file://${modelsPath.replace(/\\/g, '/')}`);
    const models = await import(modelsUrl);
    return models;
  } catch (error) {
    console.error('Error importing models:', error);
    throw error;
  }
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function seed(knex) {
  try {
    // First, clean up existing entries
    await knex('locales').del();

    const locales = [
      { id: 1, name: 'United States', code: 'us', created_at: knex.fn.now(), updated_at: knex.fn.now() },
      { id: 2, name: 'United Kingdom', code: 'uk', created_at: knex.fn.now(), updated_at: knex.fn.now() },
      { id: 3, name: 'Canada', code: 'ca', created_at: knex.fn.now(), updated_at: knex.fn.now() },
      { id: 4, name: 'Australia', code: 'au', created_at: knex.fn.now(), updated_at: knex.fn.now() },
      { id: 5, name: 'European Union', code: 'eu', created_at: knex.fn.now(), updated_at: knex.fn.now() },
      { id: 6, name: 'Japan', code: 'jp', created_at: knex.fn.now(), updated_at: knex.fn.now() },
      { id: 7, name: 'China', code: 'cn', created_at: knex.fn.now(), updated_at: knex.fn.now() },
      { id: 8, name: 'India', code: 'in', created_at: knex.fn.now(), updated_at: knex.fn.now() },
      { id: 9, name: 'Brazil', code: 'br', created_at: knex.fn.now(), updated_at: knex.fn.now() },
      { id: 10, name: 'Mexico', code: 'mx', created_at: knex.fn.now(), updated_at: knex.fn.now() }
    ];

    // Using Knex insert method
    await knex('locales').insert(locales);

    console.log('Locales seed data inserted successfully');
  } catch (error) {
    console.error('Error in localeSeed:', error);
    throw error;
  }
}