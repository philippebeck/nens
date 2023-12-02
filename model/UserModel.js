"use strict";

const { Sequelize, DataTypes } = require('sequelize');

/**
 * ? USER MODEL
 * * Define the User Model
 *
 * @param {Sequelize} Sequelize - the Sequelize instance
 * @param {DataTypes} DataTypes - the DataTypes instance
 * @return {UserModel} the User Model
 */
module.exports = (Sequelize, DataTypes) => {
  const UserModel = Sequelize.define('Users', {

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

    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },

    image: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },

    pass: {
      type: DataTypes.STRING,
      allowNull: false
    },

    role: {
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
  }, {
    timestamps: false
  });

  return UserModel;
}
