import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';
import Locale from './Locale.js';
import Nutrient from './Nutrient.js';

const Food = sequelize.define('Food', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  calories: {
    type: DataTypes.FLOAT,
    allowNull: false
  },
  proteins: {
    type: DataTypes.FLOAT,
    allowNull: false
  },
  carbs: {
    type: DataTypes.FLOAT,
    allowNull: false
  },
  fats: {
    type: DataTypes.FLOAT,
    allowNull: false
  },
  category: {
    type: DataTypes.STRING,
    allowNull: true
  },
  serving_size: {
    type: DataTypes.FLOAT,
    allowNull: true
  },
  serving_unit: {
    type: DataTypes.STRING,
    allowNull: true
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  is_public: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  locale_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'locales',
      key: 'id'
    }
  },
  external_id: {
    type: DataTypes.STRING,
    allowNull: true
  }
}, {
  tableName: 'foods',
  timestamps: true,
  underscored: true, // Use snake_case for timestamps
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

// Associations
Food.belongsTo(Locale, {
  foreignKey: 'locale_id',
  as: 'locale'
});

Food.hasMany(Nutrient, {
  foreignKey: 'food_id',
  as: 'nutrients'
});

export default Food;