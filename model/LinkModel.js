"use strict";

const { Sequelize, DataTypes } = require("sequelize");

/**
 * ? LINK MODEL
 * * Define the Link Model
 *
 * @param {Sequelize} Sequelize - the Sequelize instance
 * @param {DataTypes} DataTypes - the DataTypes instance
 * @return {LinkModel} the Link Model
 */
module.exports = (Sequelize, DataTypes) => {
  const LinkModel = Sequelize.define("Links", {
    id: {
      type: DataTypes.SMALLINT.UNSIGNED,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true
    },
    url: {
      type: DataTypes.STRING(200),
      allowNull: false,
      unique: true
    },
    cat: {
      type: DataTypes.STRING(20),
      allowNull: false
    }
  }, {
    tableName: "Links",
    timestamps: false
  });

  return LinkModel;
}
