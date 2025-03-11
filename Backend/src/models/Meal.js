import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';
import { User } from './User.js';
import Food from './Food.js';

const Meal = sequelize.define('Meal', {
  meal_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  user_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: User,
      key: 'id'
    }
  },
  meal_type: {
    type: DataTypes.ENUM('breakfast', 'lunch', 'dinner', 'snack'),
    allowNull: false
  },
  meal_date: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  calories: {
    type: DataTypes.FLOAT,
    allowNull: true
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'meals',
  timestamps: true,
  indexes: [
    {
      fields: ['user_id', 'meal_date']
    }
  ]
});

// MealFood junction table
const MealFood = sequelize.define('MealFood', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  meal_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Meal,
      key: 'meal_id'
    }
  },
  food_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Food,
      key: 'food_id'
    }
  },
  serving_qty: {
    type: DataTypes.FLOAT,
    allowNull: false,
    defaultValue: 1
  }
}, {
  tableName: 'meal_foods',
  timestamps: true,
  indexes: [
    {
      fields: ['meal_id', 'food_id']
    }
  ]
});

// Define associations
Meal.belongsTo(User, { foreignKey: 'user_id' });
User.hasMany(Meal, { foreignKey: 'user_id' });

Meal.belongsToMany(Food, { 
  through: MealFood,
  foreignKey: 'meal_id',
  otherKey: 'food_id'
});

Food.belongsToMany(Meal, { 
  through: MealFood,
  foreignKey: 'food_id',
  otherKey: 'meal_id'
});

export default Meal;
export { MealFood };