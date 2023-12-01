"use strict";

const { Sequelize, DataTypes } = require('sequelize');

/**
 * Define the Product Model
 *
 * @param {Sequelize} Sequelize - the Sequelize instance
 * @param {DataTypes} DataTypes - the DataTypes instance
 * @return {ProductModel} the Product Model
 */
module.exports = (Sequelize, DataTypes) => {
  const ProductModel = Sequelize.define('Products', {

    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },

    name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },

    description: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },

    image: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },

    alt: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },

    price: {
      type: DataTypes.DECIMAL,
      allowNull: false
    },

    options: {
      type: DataTypes.JSON,
      allowNull: false
    },

    cat: {
      type: DataTypes.STRING,
      allowNull: false
    }
  });

  return ProductModel;
}
