"use strict";

const { Sequelize, DataTypes } = require('sequelize');

/**
 * Define the Article Model
 *
 * @param {Sequelize} Sequelize - the Sequelize instance
 * @param {DataTypes} DataTypes - the DataTypes instance
 * @return {ArticleModel} the Article Model
 */
module.exports = (Sequelize, DataTypes) => {
  const ArticleModel = Sequelize.define('Articles', {

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

    text: {
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

    likes: {
      type: DataTypes.JSON,
      allowNull: false
    },

    cat: {
      type: DataTypes.STRING,
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

  return ArticleModel;
}
