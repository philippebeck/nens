"use strict";

const formidable  = require("formidable");
const nem         = require("nemjs");
const db          = require("../model");

require("dotenv").config();

const form = formidable();
const Link = db.link;

//! ****************************** CHECKERS ******************************

/**
 * CHECK LINK DATA
 * @param {string} name 
 * @param {string} url 
 * @param {string} cat 
 * @param {object} res 
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
 * CHECK LINK UNIQUE
 * @param {string} name 
 * @param {string} url 
 * @param {object} link 
 * @param {object} res 
 * @returns
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
 * CHECK LINKS FOR UNIQUE
 * @param {string} id 
 * @param {array} links 
 * @param {object} fields 
 * @param {object} res 
 */
exports.checkLinksForUnique = (id, links, fields, res) => {
  for (let link of links) {
    if (!link.id.equals(id)) {
      this.checkLinkUnique(fields.name, fields.url, link, res);
    }
  }
}

//! ****************************** PUBLIC ******************************

/**
 * LIST LINK
 * @param {object} req 
 * @param {object} res 
 */
exports.listLinks = (req, res) => {
  Link
    .findAll()
    .then((links) => res.status(200).json(links))
    .catch(() => res.status(404).json({ message: process.env.LINKS_NOT_FOUND }));
};

//! ****************************** PRIVATE ******************************

/**
 * CREATE LINK
 * @param {object} req 
 * @param {object} res 
 * @param {function} next 
 * @returns
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
 * UPDATE LINK
 * @param {object} req 
 * @param {object} res 
 * @param {function} next 
 * @returns
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
 * DELETE LINK
 * @param {object} req 
 * @param {object} res 
 */
exports.deleteLink = (req, res) => {
  Link
    .destroy({ where: { id: req.params.id }})
    .then(() => res.status(204).json({ message: process.env.LINK_DELETED }))
    .catch(() => res.status(400).json({ message: process.env.LINK_NOT_DELETED }))
};
