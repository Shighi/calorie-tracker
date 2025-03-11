import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Nutrient = sequelize.define('Nutrient', {
  nutrient_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  food_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  nutrient_name: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  amount: {
    type: DataTypes.FLOAT,
    allowNull: false
  },
  unit: {
    type: DataTypes.STRING(20),
    allowNull: false
  }
}, {
  tableName: 'nutrients',
  timestamps: true,
  indexes: [
    {
      fields: ['food_id', 'nutrient_name']
    }
  ]
});

// Note: We'll set up the belongsTo association after importing Food to avoid circular dependencies
// This will be done in the index.js file

export default Nutrient;