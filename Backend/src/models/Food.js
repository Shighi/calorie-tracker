import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';
import Locale from './Locale.js';
import Nutrient from './Nutrient.js';

const Food = sequelize.define('Food', {
  food_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
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
  }
}, {
  tableName: 'foods',
  timestamps: true
});

// Associations
Food.belongsTo(Locale, {
  foreignKey: 'location_id',
  as: 'locale'
});

Food.hasMany(Nutrient, {
  foreignKey: 'food_id',
  as: 'nutrients'
});

export default Food;