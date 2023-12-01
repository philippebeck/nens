"use strict";

const { Sequelize, DataTypes } = require('sequelize');

/**
 * ? GALLERY MODEL
 * * Define the Gallery Model
 *
 * @param {Sequelize} Sequelize - the Sequelize instance
 * @param {DataTypes} DataTypes - the DataTypes instance
 * @return {GalleryModel} the Gallery Model
 */
module.exports = (Sequelize, DataTypes) => {
  const GalleryModel = Sequelize.define('Galleries', {

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

    author: {
      type: DataTypes.STRING,
      allowNull: false
    },

    cover: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    }
  }, {
    timestamps: false
  });

  return GalleryModel;
}
