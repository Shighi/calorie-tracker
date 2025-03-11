import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Import models using dynamic import - fixed for Windows paths in ESM
const getModels = async () => {
  // Convert the path to a proper file URL
  const modelsPath = path.join(__dirname, '../src/models/index.js');
  const modelsUrl = new URL(`file://${modelsPath.replace(/\\/g, '/')}`);
  const models = await import(modelsUrl);
  return models;
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function seed(knex) {
  try {
    // First, clean up existing entries
    await knex('nutrients').del();
    await knex('foods').del();

    // Check if locales exist
    const locales = await knex('locales').select('id');
    if (locales.length === 0) {
      console.log('Locales table is empty. Please run locale seeds first.');
      return;
    }

    // Basic food data for seeding (US locale is id: 1)
    const foods = [
      {
        name: 'Apple',
        description: 'Fresh medium-sized apple',
        category: 'fruits',
        serving_size: 100,
        serving_unit: 'g',
        locale_id: 1,
      },
      {
        name: 'Banana',
        description: 'Medium banana',
        category: 'fruits',
        serving_size: 100,
        serving_unit: 'g',
        locale_id: 1,
      },
      {
        name: 'Chicken Breast',
        description: 'Boneless, skinless chicken breast',
        category: 'meats',
        serving_size: 100,
        serving_unit: 'g',
        locale_id: 1,
      },
      {
        name: 'Brown Rice',
        description: 'Cooked brown rice',
        category: 'grains',
        serving_size: 100,
        serving_unit: 'g',
        locale_id: 1,
      },
      {
        name: 'Salmon',
        description: 'Atlantic salmon fillet',
        category: 'seafood',
        serving_size: 100,
        serving_unit: 'g',
        locale_id: 1,
      },
      {
        name: 'Broccoli',
        description: 'Fresh broccoli',
        category: 'vegetables',
        serving_size: 100,
        serving_unit: 'g',
        locale_id: 1,
      },
      {
        name: 'Greek Yogurt',
        description: 'Plain non-fat Greek yogurt',
        category: 'dairy',
        serving_size: 100,
        serving_unit: 'g',
        locale_id: 1,
      },
      {
        name: 'Almonds',
        description: 'Raw almonds',
        category: 'nuts',
        serving_size: 100,
        serving_unit: 'g',
        locale_id: 1,
      },
      {
        name: 'Olive Oil',
        description: 'Extra virgin olive oil',
        category: 'oils',
        serving_size: 100,
        serving_unit: 'g',
        locale_id: 1,
      },
      {
        name: 'Black Beans',
        description: 'Cooked black beans',
        category: 'legumes',
        serving_size: 100,
        serving_unit: 'g',
        locale_id: 1,
      }
    ];

    // Nutrient data for foods
    const nutrientData = [
      { calories: 52, protein: 0.3, carbohydrates: 13.8, fat: 0.2, fiber: 2.4, sugar: 10.4, sodium: 1 }, // Apple
      { calories: 89, protein: 1.1, carbohydrates: 22.8, fat: 0.3, fiber: 2.4, sugar: 12.2, sodium: 1 }, // Banana
      { calories: 165, protein: 31, carbohydrates: 0, fat: 3.6, fiber: 0, sugar: 0, sodium: 74 }, // Chicken Breast
      { calories: 112, protein: 2.6, carbohydrates: 23.5, fat: 0.9, fiber: 1.8, sugar: 0.4, sodium: 5 }, // Brown Rice
      { calories: 208, protein: 20.4, carbohydrates: 0, fat: 13.4, fiber: 0, sugar: 0, sodium: 59 }, // Salmon
      { calories: 34, protein: 2.8, carbohydrates: 6.6, fat: 0.4, fiber: 2.6, sugar: 1.7, sodium: 33 }, // Broccoli
      { calories: 59, protein: 10.2, carbohydrates: 3.6, fat: 0.4, fiber: 0, sugar: 3.6, sodium: 45 }, // Greek Yogurt
      { calories: 579, protein: 21.2, carbohydrates: 21.7, fat: 49.9, fiber: 12.5, sugar: 4.4, sodium: 1 }, // Almonds
      { calories: 884, protein: 0, carbohydrates: 0, fat: 100, fiber: 0, sugar: 0, sodium: 2 }, // Olive Oil
      { calories: 132, protein: 8.9, carbohydrates: 23.7, fat: 0.5, fiber: 8.7, sugar: 0.3, sodium: 1 } // Black Beans
    ];

    // Insert foods with their nutrients
    for (let i = 0; i < foods.length; i++) {
      const food = foods[i];
      const nutrients = nutrientData[i];

      // Insert food and get ID
      const [insertedFood] = await knex('foods').insert(food).returning('id');
      
      // Extract the actual ID value from the returned object
      const foodId = typeof insertedFood === 'object' ? insertedFood.id : insertedFood;

      // Insert main nutrients directly to nutrients table
      await knex('nutrients').insert({
        food_id: foodId,
        calories: nutrients.calories,
        protein: nutrients.protein,
        carbohydrates: nutrients.carbohydrates,
        fat: nutrients.fat,
        fiber: nutrients.fiber,
        sugar: nutrients.sugar,
        sodium: nutrients.sodium
      });
    }

    console.log('Food and nutrient seed data inserted successfully');
  } catch (error) {
    console.error('Error in foodSeed:', error);
    throw error;
  }
}