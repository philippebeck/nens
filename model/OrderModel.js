"use strict";

const { Sequelize, DataTypes } = require("sequelize");

/**
 * ? ORDER MODEL
 * * Define the Order Model
 *
 * @param {Sequelize} Sequelize - the Sequelize instance
 * @param {DataTypes} DataTypes - the DataTypes instance
 * @return {OrderModel} the Order Model
 */
module.exports = (Sequelize, DataTypes) => {
  const OrderModel = Sequelize.define("Orders", {
    id: {
      type: DataTypes.SMALLINT.UNSIGNED,
      primaryKey: true,
      autoIncrement: true
    },
    products: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    total: {
      type: DataTypes.DECIMAL,
      allowNull: false
    },
    paymentId: {
      type: DataTypes.STRING(200),
      allowNull: false,
      unique: true
    },
    status: {
      type: DataTypes.STRING(20),
      allowNull: false
    },
    userId: {
      type: DataTypes.SMALLINT.UNSIGNED,
      allowNull: false,
      references: {
        model: "User",
        key: "id",
      },
    },
  }, {
    tableName: "Orders",
    underscored: true
  });

  return OrderModel;
}
