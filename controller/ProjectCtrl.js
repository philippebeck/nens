"use strict";

const formidable  = require("formidable");
const fs          = require("fs");

const { getName } = require("../middleware/getters");
const db          = require("../model");

require("dotenv").config();

const { PROJECT_NOT_FOUND, PROJECTS_NOT_FOUND, IMG_EXT, IMG_URL, THUMB_URL } = process.env;

const PROJECTS_IMG    = `${IMG_URL}projects/`;
const PROJECTS_THUMB  = `${THUMB_URL}projects/`;

const form = formidable({ uploadDir: PROJECTS_IMG, keepExtensions: true });

const Project = db.project;

//! ******************** UTILS ********************

/**
 * ? CHECK PROJECT DATA
 * * Checks the validity of project data.
 * 
 * @param {string} name - The name of the project.
 * @param {string} description - The description of the project.
 * @param {string} alt - The alternative description for the project.
 * @param {string} url - The url of the project.
 * @param {string} cat - The category of the project.
 * @param {Object} res - The response object.
 * @return {object} The response object with an error message if the project is not correct.
 */
exports.checkProjectData = (name, description, alt, url, cat, res) => {
  const { checkRange, checkUrl } = require("../middleware/checkers");

  const { CHECK_CAT, CHECK_NAME, CHECK_TEXT, CHECK_URL, STRING_MAX, STRING_MIN, TEXT_MAX, TEXT_MIN } = process.env;

  const IS_NAME_CHECKED = checkRange(name, STRING_MIN, STRING_MAX);
  const IS_TEXT_CHECKED = checkRange(description, TEXT_MIN, TEXT_MAX);
  const IS_ALT_CHECKED  = checkRange(alt, STRING_MIN, STRING_MAX);

  const IS_URL_CHECKED  = url ? checkUrl("https://" + url) : true;
  const IS_CAT_CHECKED  = checkRange(cat, STRING_MIN, STRING_MAX);

  if (!IS_NAME_CHECKED || !IS_TEXT_CHECKED || !IS_ALT_CHECKED || !IS_URL_CHECKED || !IS_CAT_CHECKED) {
    return res.status(403).json({ 
      message: CHECK_NAME || CHECK_TEXT || CHECK_NAME || CHECK_URL || CHECK_CAT
    });
  }
}

/**
 * ? CHECK PROJECT UNIQUE
 * * Checks if a project is unique based on its name & description.
 * 
 * @param {string} name - The name of the project.
 * @param {string} description - The description of the project.
 * @param {object} project - The existing project to compare with.
 * @param {object} res - The response object used to send the result.
 * @return {object} The response object with an error message if the project is not unique.
 */
exports.checkProjectUnique = (name, description, project, res) => {
  const { DISPO_NAME, DISPO_TEXT } = process.env;

  if (project.name === name || project.description === description) {
    return res.status(403).json({ message: DISPO_NAME || DISPO_TEXT })
  }
}

/**
 * ? SET IMAGE
 * * Sets the image for a project.
 * 
 * @param {string} input - The name of the input image.
 * @param {string} output - The name of the output image.
 */
exports.setImages = async (input, output) => {
  const { setImage, setThumbnail } = require("../middleware/setters");

  const INPUT   = `projects/${input}`;
  const OUTPUT  = `projects/${output}`;

  await setImage(INPUT, OUTPUT);
  await setThumbnail(INPUT, OUTPUT);
}

//! ******************** PUBLIC ********************

/**
 * ? LIST PROJECTS
 * * Retrieves a list of projects.
 *
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @return {Object} The JSON response containing the list of projects.
 * @throws {Error} If the projects are not found in the database.
 */
exports.listProjects = async (req, res) => {
  try {
    const projects = await Project.findAll();
    res.status(200).json(projects);

  } catch (error) {
    res.status(404).json({ message: PROJECTS_NOT_FOUND });
  }
}

//! ******************** PRIVATE ********************

/**
 * ? CREATE PROJECT
 * * Creates an project based on the request data.
 *
 * @param {Object} req - the request object
 * @param {Object} res - the response object
 * @param {Function} next - the next function in the middleware chain
 * @return {Object} A message indicating that the project was created.
 * @throws {Error} If the project is not created in the database.
 */
exports.createProject = async (req, res, next) => {
  const { PROJECT_CREATED, PROJECT_NOT_CREATED } = process.env;

  form.parse(req, async (err, fields, files) => {
    if (err) { next(err); return }

    const { name, description, alt, url, cat } = fields;
    const { image } = files;

    try {
      this.checkProjectData(name, description, alt, url, cat, res);

      const projects = await Project.findAll();
      if (!projects) return res.status(404).json({ message: PROJECTS_NOT_FOUND });

      for (const project of projects) {
        this.checkProjectUnique(name, description, project, res);
      }

      const IMG = `${getName(name)}-${Date.now()}.${IMG_EXT}`;

      if (image && image.newFilename) {
        await this.setImages(image.newFilename, IMG);
        await fs.promises.unlink(PROJECTS_IMG + image.newFilename);
      }

      await Project.create({ ...fields, image: IMG });
      res.status(201).json({ message: PROJECT_CREATED });

    } catch (error) {
      res.status(400).json({ message: PROJECT_NOT_CREATED });
    }
  })
}

/**
 * ? UPDATE PROJECT
 * * Updates an project by its ID & based on the request data.
 *
 * @param {Object} req - the request object
 * @param {Object} res - the response object
 * @param {Function} next - the next middleware function
 * @return {Object} A message indicating that the project was updated.
 * @throws {Error} If the project is not updated in the database.
 */
exports.updateProject = async (req, res, next) => {
  const { PROJECT_NOT_UPDATED , PROJECT_UPDATED} = process.env;
  const ID = parseInt(req.params.id, 10);

  form.parse(req, async (err, fields, files) => {
    if (err) { next(err); return }

    const { name, description, alt, url, cat } = fields;
    const { image } = files;

    try {
      this.checkProjectData(name, description, alt, url, cat, res);

      const projects = await Project.findAll();

      if (!projects || projects.length === 0) {
        return res.status(404).json({ message: PROJECTS_NOT_FOUND });
      }

      projects
        .filter(project => project.id !== ID)
        .forEach(project => this.checkProjectUnique(name, description, project, res));

      let img = projects.find(project => project.id === ID)?.image;

      if (image && image.newFilename) {
        await fs.promises.unlink(PROJECTS_IMG + img);
        await fs.promises.unlink(PROJECTS_THUMB + img);

        img = `${getName(name)}-${Date.now()}.${IMG_EXT}`;

        await this.setImages(image.newFilename, img);
        await fs.promises.unlink(PROJECTS_IMG + image.newFilename);
      }

      await Project.update({ ...fields, image: img }, { where: { id: ID }});
      res.status(200).json({ message: PROJECT_UPDATED });

    } catch (error) {
      res.status(400).json({ message: PROJECT_NOT_UPDATED });
    }
  })
}

/**
 * ? DELETE PROJECT
 * * Deletes an project by its ID.
 * 
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @return {Object} A message indicating that the project was deleted.
 * @throws {Error} If the project is not deleted in the database.
 */
exports.deleteProject = async (req, res) => {
  const { PROJECT_DELETED, PROJECT_NOT_DELETED } = process.env;
  const ID = parseInt(req.params.id, 10);

  try {
    const project = await Project.findByPk(ID);

    if (!project) {
      return res.status(404).json({ message: PROJECT_NOT_FOUND });
    }

    await fs.promises.unlink(PROJECTS_IMG + project.image);
    await fs.promises.unlink(PROJECTS_THUMB + project.image);

    await Project.destroy({ where: { id: ID } });
    res.status(204).json({ message: PROJECT_DELETED });

  } catch (error) {
    res.status(400).json({ message: PROJECT_NOT_DELETED });
  }
};
