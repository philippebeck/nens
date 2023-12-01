"use strict";

const { Sequelize, DataTypes } = require('sequelize');

/**
 * Define the Order Model
 *
 * @param {Sequelize} Sequelize - the Sequelize instance
 * @param {DataTypes} DataTypes - the DataTypes instance
 * @return {OrderModel} the Order Model
 */
module.exports = (Sequelize, DataTypes) => {
  const OrderModel = Sequelize.define('Orders', {

    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },

    products: {
      type: DataTypes.JSON,
      allowNull: false
    },

    total: {
      type: DataTypes.DECIMAL,
      allowNull: false
    },

    payment_id: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },

    status: {
      type: DataTypes.STRING,
      allowNull: false
    },

    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },

    created: {
      type: DataTypes.DATE,
      allowNull: false
    },

    updated: {
      type: DataTypes.DATE,
      allowNull: false
    }
  });

  return OrderModel;
}
