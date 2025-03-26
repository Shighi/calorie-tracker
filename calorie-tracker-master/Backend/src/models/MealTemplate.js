import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';
import User from './User.js';
import Food from './Food.js';

const MealTemplate = sequelize.define('MealTemplate', {
  template_id: {
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
  tableName: 'meal_templates',
  timestamps: true,
  underscored: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      fields: ['user_id']
    }
  ]
});

const TemplateFood = sequelize.define('TemplateFood', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  template_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: MealTemplate,
      key: 'template_id'
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
  tableName: 'template_foods',
  timestamps: true,
  underscored: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      fields: ['template_id', 'food_id']
    }
  ]
});

MealTemplate.belongsTo(User, { foreignKey: 'user_id' });
User.hasMany(MealTemplate, { foreignKey: 'user_id' });

MealTemplate.belongsToMany(Food, { 
  through: TemplateFood,
  foreignKey: 'template_id',
  otherKey: 'food_id',
  as: 'foods'
});

Food.belongsToMany(MealTemplate, { 
  through: TemplateFood,
  foreignKey: 'food_id',
  otherKey: 'template_id'
});

export { MealTemplate, TemplateFood };