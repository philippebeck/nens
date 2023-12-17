"use strict";

const db          = require("../model");
const formidable  = require("formidable");
const nem         = require("nemjs");

require("dotenv").config();

const { LINKS_NOT_FOUND } = process.env;

const form = formidable();
const Link = db.link;

//! ******************** UTILS ********************

/**
 * ? CHECK LINK DATA
 * * Validates the link data provided and returns an error message if any validation fails.
 * @param {string} name - The name of the link.
 * @param {string} url - The URL of the link.
 * @param {string} cat - The category of the link.
 * @param {object} res - The response object.
 * @return {object} The error message if any validation fails.
 */
exports.checkLinkData = (name, url, cat, res) => {
  const { CHECK_CAT, CHECK_NAME, CHECK_URL, STRING_MAX, STRING_MIN } = process.env;

  if (
    !nem.checkRange(cat, STRING_MIN, STRING_MAX) ||
    !nem.checkUrl("https://" + url) ||
    !nem.checkRange(name, STRING_MIN, STRING_MAX)
  ) {
    return res.status(403).json({ message: CHECK_CAT || CHECK_URL || CHECK_NAME });
  }
}

/**
 * ? CHECK LINK UNIQUE
 * * Checks if the given link name & URL are unique.
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
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @return {Object} A JSON object containing the list of links.
 * @throws {Error} If the links are not found in the database.
 */
exports.listLinks = (req, res) => {
  Link.findAll()
    .then((links) => res.status(200).json(links))
    .catch(() => res.status(404).json({ message: LINKS_NOT_FOUND }));
};

//! ******************** PRIVATE ********************

/**
 * ? CREATE LINK
 * * Creates a link based on the request data.
 * @param {Object} req - the request object
 * @param {Object} res - the response object
 * @param {Function} next - the next middleware function
 * @return {Object} A message indicating that the link was created.
 * @throws {Error} If the link is not created.
 */
exports.createLink = (req, res, next) => {
  const { LINK_CREATED, LINK_NOT_CREATED } = process.env;

  form.parse(req, (err, fields) => {
    if (err) { next(err); return }

    const { name, url, cat } = fields;
    this.checkLinkData(name, url, cat, res);

    Link.findAll()
      .then((links) => {
        for (let link of links) this.checkLinkUnique(name, url, link, res);

        Link.create(fields)
          .then(() => res.status(201).json({ message: LINK_CREATED }))
          .catch(() => res.status(400).json({ message: LINK_NOT_CREATED }));
      })
      .catch(() => res.status(404).json({ message: LINKS_NOT_FOUND }));
  })
};

/**
 * ? UPDATE LINK
 * * Updates a link in the database.
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @param {Function} next - The next middleware function.
 * @return {Object} A message indicating that the link was updated.
 * @throws {Error} If the link is not updated.
 */
exports.updateLink = (req, res, next) => {
  const { LINK_NOT_UPDATED, LINK_UPDATED } = process.env;
  const ID = parseInt(req.params.id, 10);

  form.parse(req, (err, fields) => {
    if (err) { next(err); return }

    const { name, url, cat } = fields;
    this.checkLinkData(name, url, cat, res);

    Link.findAll()
      .then((links) => {
        links.filter(link => link.id !== ID).forEach(link => 
          this.checkLinkUnique(name, url, link, res));

        Link.update(fields, { where: { id: ID }})
          .then(() => res.status(200).json({ message: LINK_UPDATED }))
          .catch(() => res.status(400).json({ message: LINK_NOT_UPDATED }));
      })
      .catch(() => res.status(404).json({ message: LINKS_NOT_FOUND }));
  })
};

/**
 * ? DELETE LINK
 * * Deletes a link.
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @return {Object} - A message indicating that the link was deleted.
 * @throws {Error} If the link is not deleted.
 */
exports.deleteLink = (req, res) => {
  const { LINK_DELETED, LINK_NOT_DELETED } = process.env;
  const ID = parseInt(req.params.id, 10);

  Link.destroy({ where: { id: ID }})
    .then(() => res.status(204).json({ message: LINK_DELETED }))
    .catch(() => res.status(400).json({ message: LINK_NOT_DELETED }))
};
