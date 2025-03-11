// In src/models/index.js
import Food from './Food.js';
import Nutrient from './Nutrient.js';
import Locale from './Locale.js';
import { User, UserProfile } from './User.js';
import Meal, { MealFood } from './Meal.js';

// Set up associations that couldn't be defined in the models
// to avoid circular dependencies
Nutrient.belongsTo(Food, { 
  foreignKey: 'food_id',
  as: 'food'
});

export {
  Food,
  Nutrient,
  Locale,
  Meal,
  MealFood,
  User,
  UserProfile
};