// models/Meal.js
import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';
import User from './User.js';
import Food from './Food.js';

const Meal = sequelize.define('Meal', {
  meal_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: User,
      key: 'id'
    }
  },
  name: {
    type: DataTypes.STRING,
    allowNull: true
  },
  meal_type: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  meal_date: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  meal_time: {
    type: DataTypes.TIME,
    allowNull: true
  },
  total_calories: {
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
  underscored: true, // Use snake_case for timestamps
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      fields: ['user_id', 'meal_date']
    }
  ]
});

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
      key: 'id'
    }
  },
  serving_qty: {
    type: DataTypes.FLOAT,
    allowNull: false,
    defaultValue: 1
  },
  serving_size: {
    type: DataTypes.FLOAT,
    allowNull: true
  },
  serving_unit: {
    type: DataTypes.STRING,
    allowNull: true
  },
  calories: {
    type: DataTypes.FLOAT,
    allowNull: true
  }
}, {
  tableName: 'meal_foods',
  timestamps: true,
  underscored: true, // Use snake_case for timestamps
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      fields: ['meal_id', 'food_id']
    }
  ]
});

Meal.belongsTo(User, { foreignKey: 'user_id' });
User.hasMany(Meal, { foreignKey: 'user_id' });

Meal.belongsToMany(Food, { 
  through: MealFood,
  foreignKey: 'meal_id',
  otherKey: 'food_id',
  as: 'foods'  // This alias must match what you use in your queries
});

Food.belongsToMany(Meal, { 
  through: MealFood,
  foreignKey: 'food_id',
  otherKey: 'meal_id'
  // You can add an alias here as well if needed
});

export { Meal, MealFood };