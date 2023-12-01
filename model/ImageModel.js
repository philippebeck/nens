"use strict";

const { Sequelize, DataTypes } = require('sequelize');

/**
 * Define the Image Model
 *
 * @param {Sequelize} Sequelize - the Sequelize instance
 * @param {DataTypes} DataTypes - the DataTypes instance
 * @return {ImageModel} the Image Model
 */
module.exports = (Sequelize, DataTypes) => {
  const ImageModel = Sequelize.define('Images', {

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
      allowNull: false
    },

    gallery_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    }
  });

  return ImageModel;
}
