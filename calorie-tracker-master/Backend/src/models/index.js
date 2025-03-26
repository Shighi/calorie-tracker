import Food from './Food.js';
import Nutrient from './Nutrient.js';
import Locale from './Locale.js';
import User from './User.js';
import UserProfile from './UserProfile.js';
import { Meal, MealFood } from './Meal.js';
import { MealTemplate, TemplateFood } from '../models/MealTemplate.js';

// Food and Nutrient associations
Food.hasMany(Nutrient, {
  foreignKey: 'food_id',
  as: 'foodNutrients',
  onDelete: 'CASCADE'
});

Nutrient.belongsTo(Food, { 
  foreignKey: 'food_id',
  as: 'foodItem'
});

// User and UserProfile associations
User.hasOne(UserProfile, {
  foreignKey: 'user_id',
  as: 'profile',
  onDelete: 'CASCADE'
});

UserProfile.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'user'
});

// Meal and Food associations
Meal.belongsToMany(Food, {
  through: MealFood,
  foreignKey: 'meal_id',
  otherKey: 'food_id',
  as: 'mealFoods' // Changed from 'foods'
});

Food.belongsToMany(Meal, {
  through: MealFood,
  foreignKey: 'food_id',
  otherKey: 'meal_id',
  as: 'mealsIncluded' // Added a unique alias
});

// User and Meal associations
User.hasMany(Meal, {
  foreignKey: 'user_id',
  as: 'meals',
  onDelete: 'CASCADE'
});

Meal.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'user'
});

// User and MealTemplate associations
User.hasMany(MealTemplate, {
  foreignKey: 'user_id',
  as: 'mealTemplates',
  onDelete: 'CASCADE'
});

MealTemplate.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'user'
});

export {
  Food,
  Nutrient,
  Locale,
  Meal,
  MealFood,
  MealTemplate,
  TemplateFood,
  User,
  UserProfile
};