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
      type: DataTypes.JSON,
      allowNull: false
    },
    total: {
      type: DataTypes.DECIMAL,
      allowNull: false
    },
    payment_id: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true
    },
    status: {
      type: DataTypes.STRING(10),
      allowNull: false
    },
    user_id: {
      type: DataTypes.SMALLINT.UNSIGNED,
      allowNull: false,
      references: {
        model: "User",
        key: "id",
      },
    },

    created: {
      type: DataTypes.DATE,
      allowNull: false
    },

    updated: {
      type: DataTypes.DATE,
      allowNull: false
    }
  }, {
    tableName: "Orders",
    timestamps: false,
    underscored: true
  });

  return OrderModel;
}
