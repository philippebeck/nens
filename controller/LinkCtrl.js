"use strict";

const db          = require("../model");
const formidable  = require("formidable");
const nem         = require("nemjs");

require("dotenv").config();

const form = formidable();
const Link = db.link;

//! ******************** CHECKERS ********************

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
  const MAX = process.env.STRING_MAX;
  const MIN = process.env.STRING_MIN;

  let alert = "";

  if (!nem.checkRange(cat, MIN, MAX)) alert = process.env.CHECK_CAT;
  if (!nem.checkUrl("https://" + url)) alert = process.env.CHECK_URL;
  if (!nem.checkRange(name, MIN, MAX)) alert = process.env.CHECK_NAME;

  if (alert !== "") return res.status(403).json({ message: alert });
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
  if (link.name === name) {
    return res.status(403).json({ message: process.env.DISPO_NAME });
  }

  if (link.url === url) {
    return res.status(403).json({ message: process.env.DISPO_URL });
  }
}

/**
 * ? CHECK LINKS FOR UNIQUE
 * * Checks the links for uniqueness based on the given ID.
 *
 * @param {string} id - The ID to compare against the links.
 * @param {Array} links - An array of links to check.
 * @param {Object} fields - An object containing the fields to check against the links.
 * @param {Object} res - The response object to handle the result.
 */
exports.checkLinksForUnique = (id, links, fields, res) => {
  for (let link of links) {
    if (!link.id.equals(id)) {
      this.checkLinkUnique(fields.name, fields.url, link, res);
    }
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
exports.listLinks = (req, res) => {
  Link
    .findAll()
    .then((links) => res.status(200).json(links))
    .catch(() => res.status(404).json({ message: process.env.LINKS_NOT_FOUND }));
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
exports.createLink = (req, res, next) => {
  form.parse(req, (err, fields) => {
    if (err) { next(err); return }

    this.checkLinkData(fields.name, fields.url, fields.cat, res);

    Link
      .findAll()
      .then((links) => {
        for (let link of links) {
          this.checkLinkUnique(fields.name, fields.url, link, res);
        }
        Link
          .create(fields)
          .then(() => res.status(201).json({ message: process.env.LINK_CREATED }))
          .catch(() => res.status(400).json({ message: process.env.LINK_NOT_CREATED }));
      })
      .catch(() => res.status(404).json({ message: process.env.LINKS_NOT_FOUND }));
  })
};

/**
 * ? UPDATE LINK
 * * Updates a link in the database.
 *
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @param {Function} next - The next middleware function.
 * @return {Object} A message indicating that the link was updated.
 * @throws {Error} If the link is not updated.
 */
exports.updateLink = (req, res, next) => {
  form.parse(req, (err, fields) => {
    if (err) { next(err); return }

    this.checkLinkData(fields.name, fields.url, fields.cat, res);

    Link
      .findAll()
      .then((links) => {
        this.checkLinksForUnique(req.params.id, links, fields, res);

        Link
          .update(fields, { where: { id: req.params.id }})
          .then(() => res.status(200).json({ message: process.env.LINK_UPDATED }))
          .catch(() => res.status(400).json({ message: process.env.LINK_NOT_UPDATED }));
      })
      .catch(() => res.status(404).json({ message: process.env.LINKS_NOT_FOUND }));
  })
};

/**
 * ? DELETE LINK
 * * Deletes a link.
 *
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @return {Object} - A message indicating that the link was deleted.
 * @throws {Error} If the link is not deleted.
 */
exports.deleteLink = (req, res) => {
  Link
    .destroy({ where: { id: req.params.id }})
    .then(() => res.status(204).json({ message: process.env.LINK_DELETED }))
    .catch(() => res.status(400).json({ message: process.env.LINK_NOT_DELETED }))
};
