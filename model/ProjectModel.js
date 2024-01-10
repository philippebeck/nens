"use strict";

const { Sequelize, DataTypes } = require("sequelize");

/**
 * ? PROJECT MODEL
 * * Define the Project Model
 *
 * @param {Sequelize} Sequelize - the Sequelize instance
 * @param {DataTypes} DataTypes - the DataTypes instance
 * @return {ProjectModel} the Project Model
 */
module.exports = (Sequelize, DataTypes) => {
  const ProjectModel = Sequelize.define("Projects", {
    id: {
      type: DataTypes.SMALLINT.UNSIGNED,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING(250),
      allowNull: false,
      unique: true
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
      unique: true
    },
    image: {
      type: DataTypes.STRING(250),
      allowNull: false,
      unique: true
    },
    alt: {
      type: DataTypes.STRING(250),
      allowNull: false
    },
    url: {
      type: DataTypes.STRING(250)
    },
    cat: {
      type: DataTypes.STRING(25),
      allowNull: false
    },
  }, {
    tableName: "Projects"
  });

  return ProjectModel;
}
