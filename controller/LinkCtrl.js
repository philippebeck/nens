"use strict";

const formidable  = require("formidable");
const db          = require("../model");

require("dotenv").config();

const { checkRange, checkUrl } = require("../app/middlewares");
const { LINKS_NOT_FOUND } = process.env;

const form = formidable();
const Link = db.link;

//! ******************** UTILS ********************

/**
 * ? CHECK LINK DATA
 * * Validates the link data provided and returns an error message if any validation fails.
 *
 * @param {string} name - The name of the link.
 * @param {string} url - The URL of the link.
 * @param {string} cat - The category of the link.
 * @param {object} res - The response object.
 * @return {object} The error message if any validation fails.
 */
exports.checkLinkData = (name, url, cat, res) => {
  const { CHECK_CAT, CHECK_NAME, CHECK_URL, STRING_MAX, STRING_MIN } = process.env;

  const IS_NAME_CHECKED = checkRange(name, STRING_MIN, STRING_MAX);
  const IS_URL_CHECKED  = checkUrl("https://" + url);
  const IS_CAT_CHECKED  = checkRange(cat, STRING_MIN, STRING_MAX);

  if (!IS_NAME_CHECKED || !IS_URL_CHECKED || !IS_CAT_CHECKED) {
    return res.status(403).json({ message: CHECK_NAME || CHECK_URL || CHECK_CAT });
  }
}

/**
 * ? CHECK LINK UNIQUE
 * * Checks if the given link name & URL are unique.
 *
 * @param {string} name - The name of the link to check uniqueness for.
 * @param {string} url - The URL of the link to check uniqueness for.
 * @param {object} link - The link object to compare against.
 * @param {object} res - The response object to send the result to.
 * @return {object} - The response object with the appropriate status & message.
 */
exports.checkLinkUnique = (name, url, link, res) => {
  const { DISPO_NAME, DISPO_URL } = process.env;

  if (link.name === name || link.url === url) {
    return res.status(403).json({ message: DISPO_NAME || DISPO_URL });
  }
}

//! ******************** PUBLIC ********************

/**
 * ? LIST LINKS
 * * Retrieves a list of links.
 *
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @return {Object} A JSON object containing the list of links.
 * @throws {Error} If the links are not found in the database.
 */
exports.listLinks = async (req, res) => {
  try {
    const links = await Link.findAll();
    res.status(200).json(links);

  } catch (error) {
    res.status(404).json({ message: LINKS_NOT_FOUND });
  }
};

//! ******************** PRIVATE ********************

/**
 * ? CREATE LINK
 * * Creates a link based on the request data.
 *
 * @param {Object} req - the request object
 * @param {Object} res - the response object
 * @param {Function} next - the next middleware function
 * @return {Object} A message indicating that the link was created.
 * @throws {Error} If the link is not created.
 */
exports.createLink = async (req, res, next) => {
  const { LINK_CREATED, LINK_NOT_CREATED } = process.env;

  form.parse(req, async (err, fields) => {
    if (err) { next(err); return }

    const { name, url, cat } = fields;

    try {
      this.checkLinkData(name, url, cat, res);

      const links = await Link.findAll();

      if (!links) return res.status(404).json({ message: LINKS_NOT_FOUND });
      for (const link of links) this.checkLinkUnique(name, url, link, res);

      await Link.create(fields);
      res.status(201).json({ message: LINK_CREATED });

    } catch (error) {
      res.status(400).json({ message: LINK_NOT_CREATED });
    }
  })
};

/**
 * ? UPDATE LINK
 * * Updates a link by its Id & based on the request data.
 *
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @param {Function} next - The next middleware function.
 * @return {Object} A message indicating that the link was updated.
 * @throws {Error} If the link is not updated.
 */
exports.updateLink = async (req, res, next) => {
  const { LINK_NOT_UPDATED, LINK_UPDATED } = process.env;
  const ID = parseInt(req.params.id, 10);

  form.parse(req, async (err, fields) => {
    if (err) { next(err); return }

    const { name, url, cat } = fields;

    try {
      this.checkLinkData(name, url, cat, res);

      const links = await Link.findAll();

      if (!links || links.length === 0) {
        return res.status(404).json({ message: LINKS_NOT_FOUND });
      }

      links
        .filter((link) => link.id !== ID)
        .forEach((link) => this.checkLinkUnique(name, url, link, res));

      await Link.update(fields, { where: { id: ID } });
      res.status(200).json({ message: LINK_UPDATED });

    } catch (error) {
      res.status(400).json({ message: LINK_NOT_UPDATED });
    }
  })
};

/**
 * ? DELETE LINK
 * * Deletes a link by its ID.
 *
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @return {Object} - A message indicating that the link was deleted.
 * @throws {Error} If the link is not deleted.
 */
exports.deleteLink = async (req, res) => {
  const { LINK_DELETED, LINK_NOT_DELETED } = process.env;
  const ID = parseInt(req.params.id, 10);

  try {
    await Link.destroy({ where: { id: ID }});
    res.status(204).json({ message: LINK_DELETED });

  } catch (error) {
    res.status(400).json({ message: LINK_NOT_DELETED });
  }
};
