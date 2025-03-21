// seeds/foodDataImport.js
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { parse } from 'csv-parse';
import sequelize from '../src/config/database.js';
import Food from '../src/models/Food.js';
import Locale from '../src/models/Locale.js';
import Nutrient from '../src/models/Nutrient.js';
import { QueryTypes } from 'sequelize';

// Fix for __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function importFoods() {
  console.log('Starting food data import...');
  
  try {
    // Make sure database connection is established
    await sequelize.authenticate();
    console.log('Database connection established successfully');
    
    // First, check if we need to fix the sequence
    const maxIdResult = await sequelize.query(
      'SELECT MAX(id) FROM locales',
      { type: QueryTypes.SELECT }
    );
    
    const maxId = maxIdResult[0].max || 0;
    console.log(`Maximum locale ID found: ${maxId}`);
    
    // Reset the sequence to be higher than the max ID
    if (maxId > 0) {
      await sequelize.query(
        `SELECT setval('locales_id_seq', ${maxId}, true)`,
        { type: QueryTypes.SELECT }
      );
      console.log(`Reset sequence to start after ${maxId}`);
    }
    
    // Define locales
    const locales = [
      { 
        name: 'East Africa', 
        code: 'EA', 
        region: 'Africa',
        language_code: 'en',
        currency_code: 'SH'
      },
      { 
        name: 'West Africa', 
        code: 'WA', 
        region: 'Africa',
        language_code: 'en',
        currency_code: 'NGN'
      }
    ];
    
    const localeMap = {};
    
    for (const locale of locales) {
      // First check if the locale already exists
      let localeRecord = await Locale.findOne({
        where: { name: locale.name, code: locale.code }
      });
      
      if (!localeRecord) {
        console.log(`Creating new locale for "${locale.name}"`);
        // Create without specifying ID
        localeRecord = await Locale.create(locale);
      } else {
        console.log(`Found existing locale "${locale.name}" (ID: ${localeRecord.id})`);
      }
      
      localeMap[locale.name] = localeRecord.id;
      console.log(`Locale "${locale.name}" (ID: ${localeRecord.id}) ready`);
    }
    
    // Read and parse the CSV file
    const filePath = path.resolve(__dirname, '..', 'data', 'foods.csv');
    console.log(`Looking for CSV file at: ${filePath}`);
    
    if (!fs.existsSync(filePath)) {
      console.error(`CSV file not found at ${filePath}`);
      process.exit(1);
    }
    
    const fileContent = fs.readFileSync(filePath, { encoding: 'utf-8' });
    
    // Parse CSV data
    parse(fileContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true
    }, async (err, records) => {
      if (err) {
        console.error('Error parsing CSV:', err);
        return;
      }
      
      console.log(`Found ${records.length} food records to import`);
      
      // Process each record
      for (const record of records) {
        try {
          // Map CSV fields to our model
          const foodData = {
            name: record.name,
            calories: parseFloat(record.calories) || 0,
            proteins: parseFloat(record.protein) || 0,
            fats: parseFloat(record.fat) || 0,
            carbs: parseFloat(record.carbs) || 0,
            category: record.categories || 'Uncategorized',
            is_public: true,
            locale_id: localeMap[record.locale] || null, // Changed from location_id to locale_id
            // Add any other required fields with defaults
            serving_size: 100,
            serving_unit: 'g'
          };
          
          // Check if food already exists
          let food;
          const existingFood = await Food.findOne({
            where: { name: foodData.name }
          });
          
          if (existingFood) {
            console.log(`Food "${foodData.name}" already exists, updating...`);
            await existingFood.update(foodData);
            food = existingFood;
          } else {
            food = await Food.create(foodData);
            console.log(`Added food: ${foodData.name}`);
          }
          
          // Now create or update nutrients
          const nutrientData = [
            {
              nutrient_name: 'calories',
              amount: parseFloat(record.calories) || 0,
              unit: 'kcal'
            },
            {
              nutrient_name: 'protein',
              amount: parseFloat(record.protein) || 0,
              unit: 'g'
            },
            {
              nutrient_name: 'carbohydrates',
              amount: parseFloat(record.carbs) || 0,
              unit: 'g'
            },
            {
              nutrient_name: 'fat',
              amount: parseFloat(record.fat) || 0,
              unit: 'g'
            }
          ];
          
          // Add other nutrients if available
          if (record.fiber) {
            nutrientData.push({
              nutrient_name: 'fiber',
              amount: parseFloat(record.fiber) || 0,
              unit: 'g'
            });
          }
          
          if (record.sodium) {
            nutrientData.push({
              nutrient_name: 'sodium',
              amount: parseFloat(record.sodium) || 0,
              unit: 'mg'
            });
          }
          
          // First, clean up existing nutrients for this food to avoid duplicates
          await Nutrient.destroy({
            where: { food_id: food.id }
          });
          
          // Then insert new nutrients
          for (const nutrient of nutrientData) {
            await Nutrient.create({
              food_id: food.id,
              ...nutrient
            });
          }
          
          console.log(`Added nutrients for: ${food.name}`);
          
        } catch (error) {
          console.error(`Error processing record: ${record.name}`, error);
          console.error(error.stack);
        }
      }
      
      console.log('Food import completed successfully');
      process.exit(0);
    });
    
  } catch (error) {
    console.error('Import failed:', error);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run the import function
importFoods();