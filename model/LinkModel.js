"use strict";

const { Sequelize, DataTypes } = require('sequelize');

/**
 * Define the Link Model
 *
 * @param {Sequelize} Sequelize - the Sequelize instance
 * @param {DataTypes} DataTypes - the DataTypes instance
 * @return {LinkModel} the Link Model
 */
module.exports = (Sequelize, DataTypes) => {
  const LinkModel = Sequelize.define('Links', {

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

    url: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },

    cat: {
      type: DataTypes.STRING,
      allowNull: false
    }
  });

  return LinkModel;
}
