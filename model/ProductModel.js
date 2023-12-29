"use strict";

const { Sequelize, DataTypes } = require("sequelize");

/**
 * ? PRODUCT MODEL
 * * Define the Product Model
 *
 * @param {Sequelize} Sequelize - the Sequelize instance
 * @param {DataTypes} DataTypes - the DataTypes instance
 * @return {ProductModel} the Product Model
 */
module.exports = (Sequelize, DataTypes) => {
  const ProductModel = Sequelize.define("Products", {
    id: {
      type: DataTypes.SMALLINT.UNSIGNED,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING(200),
      allowNull: false,
      unique: true
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
      unique: true
    },
    image: {
      type: DataTypes.STRING(200),
      allowNull: false,
      unique: true
    },
    alt: {
      type: DataTypes.STRING(200),
      allowNull: false
    },
    price: {
      type: DataTypes.DECIMAL,
      allowNull: false
    },
    options: {
      type: DataTypes.TEXT,
      defaultValue: ""
    },
    cat: {
      type: DataTypes.STRING(20),
      allowNull: false
    }
  }, {
    tableName: "Products",
    timestamps: false
  });

  return ProductModel;
}
