"use strict";

const db          = require("../model");
const formidable  = require("formidable");
const fs          = require("fs");
const nem         = require("nemjs");

require("dotenv").config();

const GALLERIES_IMG   = process.env.IMG_URL + "galleries/";
const GALLERIES_THUMB = process.env.THUMB_URL + "galleries/";

const form    = formidable();
const Gallery = db.gallery;
const Image   = db.image;

//! ******************** CHECKERS ********************

/**
 * ? CHECK GALLERY DATA
 * * Checks the gallery data for valid name and author.
 *
 * @param {string} name - The name of the gallery.
 * @param {string} author - The author of the gallery.
 * @param {object} res - The response object.
 * @return {object} A message indicating that the gallery data is invalid.
 */
exports.checkGalleryData = (name, author, res) => {
  const MAX = process.env.STRING_MAX;
  const MIN = process.env.STRING_MIN;

  if (!nem.checkRange(author, MIN, MAX)) {
    return res.status(403).json({ message: process.env.CHECK_NAME });
  }

  if (!nem.checkRange(name, MIN, MAX)) { 
    return res.status(403).json({ message: process.env.CHECK_NAME });
  }
}

/**
 * ? CHECK GALLERY UNIQUE
 * * Checks if the given name is unique in the gallery.
 *
 * @param {string} name - The name to be checked.
 * @param {object} gallery - The gallery object.
 * @param {object} res - The response object.
 * @return {object} A message indicating that the name is not unique.
 * @throws {Error} If the name is not unique.
 */
exports.checkGalleryUnique = (name, gallery, res) => {
  if (gallery.name === name) {
    return res.status(403).json({ message: process.env.DISPO_NAME });
  }
}

/**
 * ? CHECK GALLERIES FOR UNIQUE
 * * Checks if the given name is unique in the array of galleries.
 * 
 * @param {type} id - The ID to compare with the galleries' IDs.
 * @param {type} galleries - The array of galleries to check.
 * @param {type} name - The name parameter to pass to the "checkGalleryUnique" function.
 * @param {type} res - The res parameter to pass to the "checkGalleryUnique" function.
 */
exports.checkGalleriesForUnique = (id, galleries, name, res) => {
  for (let gallery of galleries) {
    if (gallery.id !== id) { 
      this.checkGalleryUnique(name, gallery, res) 
    }
  }
}

//! ******************** PUBLIC ********************

/**
 * ? LIST GALLERIES
 * * Retrieves a list of all galleries.
 *
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @return {Object} The list of galleries in JSON format.
 * @throws {Error} If the galleries are not found in the database.
 */
exports.listGalleries = (req, res) => {
  Gallery
    .findAll()
    .then((galleries) => { res.status(200).json(galleries) })
    .catch(() => res.status(404).json({ message: process.env.GALLERIES_NOT_FOUND }));
}

/**
 * ? READ GALLERY
 * * Retrieves a gallery by its ID and sends it as a JSON response.
 *
 * @param {object} req - The request object.
 * @param {object} res - The response object.
 * @return {object} The retrieved gallery as a JSON response.
 * @throws {Error} If the gallery is not found in the database.
 */
exports.readGallery = (req, res) => {
  Gallery
  .findByPk(parseInt(req.params.id))
  .then((gallery) => { res.status(200).json(gallery) })
  .catch(() => res.status(404).json({ message: process.env.GALLERY_NOT_FOUND }));
}

//! ******************** PRIVATE ********************

/**
 * ? CREATE GALLERY
 * * Creates a new gallery.
 *
 * @param {Object} req - the request object
 * @param {Object} res - the response object
 * @param {Function} next - the next middleware function
 * @return {Object} A message indicating that the gallery was created.
 * @throws {Error} If the gallery was not created.
 */
exports.createGallery = (req, res, next) => {
  form.parse(req, (err, fields) => {
    if (err) { next(err); return }

    this.checkGalleryData(fields.name, fields.author, res);

    Gallery
      .findAll()
      .then((galleries) => {
        for (let gallery of galleries) { 
          this.checkGalleryUnique(fields.name, gallery, res) 
        }

        let cover   = nem.getPosterName(fields.name);
        let gallery = {
          name: fields.name,
          author: fields.author,
          cover: cover
        };

        Gallery
          .create(gallery)
          .then(() => res.status(201).json({ message: process.env.GALLERY_CREATED }))
          .catch(() => res.status(400).json({ message: process.env.GALLERY_NOT_CREATED }));
      })
      .catch(() => res.status(404).json({ message: process.env.GALLERIES_NOT_FOUND }));
  })
}

/**
 * ? UPDATE GALLERY
 * * Update the gallery with the given request data.
 *
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @param {Function} next - The next middleware function.
 * @return {Object} A message indicating that the gallery was updated.
 * @throws {Error} If the gallery is not updated.
 */
exports.updateGallery = (req, res, next) => {
  const id = parseInt(req.params.id);

  form.parse(req, (err, fields) => {
    if (err) { next(err); return }

    this.checkGalleryData(fields.name, fields.author, res);

    Gallery
      .findAll()
      .then((galleries) => {
        this.checkGalleriesForUnique(id, galleries, fields.name, res);

        let gallery = {
          name: fields.name,
          author: fields.author
        };

        Gallery
          .update(gallery, { where: { id: id }})
          .then(() => res.status(200).json({ message: process.env.GALLERY_UPDATED }))
          .catch(() => res.status(400).json({ message: process.env.GALLERY_NOT_UPDATED }));
      })
      .catch(() => res.status(404).json({ message: process.env.GALLERIES_NOT_FOUND }));
  })
}

/**
 * ? DELETE GALLERY
 * * Deletes a gallery and its associated images.
 *
 * @param {Object} req - the request object
 * @param {Object} res - the response object
 * @return {Object} A message indicating that the gallery was deleted.
 * @throws {Error} If the gallery is not deleted.
 */
exports.deleteGallery = (req, res) => {
  const id = parseInt(req.params.id);

  Image
    .findAll({ where: { gallery_id: id }})
    .then(images => {
      for (let image of images) {
        fs.unlink(GALLERIES_THUMB + image.name, () => {
          fs.unlink(GALLERIES_IMG + image.name, () => {});
        });
      }
      Image
        .destroy({ where: { gallery_id: id }})
        .then(() =>

          Gallery
            .destroy({ where: { id: id }})
            .then(() => res.status(204).json({ message: process.env.GALLERY_DELETED }))
            .catch(() => res.status(400).json({ message: process.env.GALLERY_NOT_DELETED }))
        )
        .catch(() => res.status(400).json({ message: process.env.IMAGE_DELETE_MANY }));
    })
    .catch(() => res.status(404).json({ message: process.env.IMAGES_NOT_FOUND }));
}
