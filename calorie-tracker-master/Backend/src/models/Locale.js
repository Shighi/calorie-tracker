import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Locale = sequelize.define('Locale', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  code: {
    type: DataTypes.STRING(10),
    allowNull: false
  },
  region: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  language_code: {
    type: DataTypes.STRING(10),
    allowNull: true
  },
  currency_code: {
    type: DataTypes.STRING(10),
    allowNull: true
  }
}, {
  tableName: 'locales',
  timestamps: true,
  underscored: true, // This tells Sequelize to use snake_case for timestamps
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      unique: true,
      fields: ['name', 'code']
    }
  ]
});

export default Locale;