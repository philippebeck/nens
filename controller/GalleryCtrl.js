"use strict";

const db          = require("../model");
const formidable  = require("formidable");
const fs          = require("fs");
const nem         = require("nemjs");

require("dotenv").config();

const { GALLERIES_NOT_FOUND } = process.env;

const GALLERIES_IMG   = process.env.IMG_URL + "galleries/";
const GALLERIES_THUMB = process.env.THUMB_URL + "galleries/";

const form    = formidable();
const Gallery = db.gallery;
const Image   = db.image;

//! ******************** UTILS ********************

/**
 * ? CHECK GALLERY DATA
 * * Checks the gallery data for valid name and author.
 * @param {string} name - The name of the gallery.
 * @param {string} author - The author of the gallery.
 * @param {object} res - The response object.
 * @return {object} A message indicating that the gallery data is invalid.
 */
exports.checkGalleryData = (name, author, res) => {
  const { CHECK_NAME, STRING_MAX, STRING_MIN } = process.env;

  if (
    !nem.checkRange(author, STRING_MIN, STRING_MAX) || 
    !nem.checkRange(name, STRING_MIN, STRING_MAX)
    ) {
    return res.status(403).json({ message: CHECK_NAME });
  }
}

/**
 * ? CHECK GALLERY UNIQUE
 * * Checks if the given name is unique in the gallery.
 * @param {string} name - The name to be checked.
 * @param {object} gallery - The gallery object.
 * @param {object} res - The response object.
 * @return {object} A message indicating that the name is not unique.
 * @throws {Error} If the name is not unique.
 */
exports.checkGalleryUnique = (name, gallery, res) => {
  const { DISPO_NAME } = process.env;

  if (gallery.name === name) return res.status(403).json({ message: DISPO_NAME });
}

//! ******************** PUBLIC ********************

/**
 * ? LIST GALLERIES
 * * Retrieves a list of all galleries.
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @return {Object} The list of galleries in JSON format.
 * @throws {Error} If the galleries are not found in the database.
 */
exports.listGalleries = (req, res) => {
  Gallery.findAll()
    .then((galleries) => { res.status(200).json(galleries) })
    .catch(() => res.status(404).json({ message: GALLERIES_NOT_FOUND }));
}

/**
 * ? READ GALLERY
 * * Retrieves a gallery by its ID and sends it as a JSON response.
 * @param {object} req - The request object.
 * @param {object} res - The response object.
 * @return {object} The retrieved gallery as a JSON response.
 * @throws {Error} If the gallery is not found in the database.
 */
exports.readGallery = (req, res) => {
  const { GALLERY_NOT_FOUND } = process.env;
  const ID = parseInt(req.params.id, 10);

  Gallery.findByPk(ID)
    .then((gallery) => { res.status(200).json(gallery) })
    .catch(() => res.status(404).json({ message: GALLERY_NOT_FOUND }));
}

//! ******************** PRIVATE ********************

/**
 * ? CREATE GALLERY
 * * Creates a new gallery.
 * @param {Object} req - the request object
 * @param {Object} res - the response object
 * @param {Function} next - the next middleware function
 * @return {Object} A message indicating that the gallery was created.
 * @throws {Error} If the gallery was not created.
 */
exports.createGallery = (req, res, next) => {
  const { GALLERY_CREATED, GALLERY_NOT_CREATED } = process.env;

  form.parse(req, (err, fields) => {
    if (err) { next(err); return }

    const { author, name } = fields;
    this.checkGalleryData(name, author, res);

    Gallery.findAll()
      .then((galleries) => {
        for (let gallery of galleries) this.checkGalleryUnique(name, gallery, res);

        const cover   = nem.getPosterName(name);
        const gallery = { ...fields, cover: cover };

        Gallery.create(gallery)
          .then(() => res.status(201).json({ message: GALLERY_CREATED }))
          .catch(() => res.status(400).json({ message: GALLERY_NOT_CREATED }));
      })
      .catch(() => res.status(404).json({ message: GALLERIES_NOT_FOUND }));
  })
}

/**
 * ? UPDATE GALLERY
 * * Update the gallery with the given request data.
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @param {Function} next - The next middleware function.
 * @return {Object} A message indicating that the gallery was updated.
 * @throws {Error} If the gallery is not updated.
 */
exports.updateGallery = (req, res, next) => {
  const { GALLERY_NOT_UPDATED, GALLERY_UPDATED } = process.env;
  const ID = parseInt(req.params.id, 10);

  form.parse(req, (err, fields) => {
    if (err) { next(err); return }

    const { author, name } = fields;
    this.checkGalleryData(name, author, res);

    Gallery.findAll()
      .then((galleries) => {
        galleries.filter(gallery => gallery.id !== ID).forEach(gallery => 
          this.checkGalleryUnique(name, gallery, res));

        const gallery = { ...fields };

        Gallery.update(gallery, { where: { id: ID }})
          .then(() => res.status(200).json({ message: GALLERY_UPDATED }))
          .catch(() => res.status(400).json({ message: GALLERY_NOT_UPDATED }));
      })
      .catch(() => res.status(404).json({ message: GALLERIES_NOT_FOUND }));
  })
}

/**
 * ? DELETE GALLERY
 * * Deletes a gallery and its associated images.
 * @param {Object} req - the request object
 * @param {Object} res - the response object
 * @return {Object} A message indicating that the gallery was deleted.
 * @throws {Error} If the gallery is not deleted.
 */
exports.deleteGallery = (req, res) => {
  const { GALLERY_DELETED, GALLERY_NOT_DELETED, IMAGE_DELETE_MANY, IMAGES_NOT_FOUND } = process.env;
  const ID = parseInt(req.params.id, 10);

  Image.findAll({ where: { galleryId: ID }})
    .then(images => {
      for (let image of images) {
        fs.unlink(GALLERIES_THUMB + image.name, () => { 
          fs.unlink(GALLERIES_IMG + image.name, () => {})
        });
      }
      Image.destroy({ where: { galleryId: ID }})
        .then(() =>
          Gallery.destroy({ where: { id: ID }})
            .then(() => res.status(204).json({ message: GALLERY_DELETED }))
            .catch(() => res.status(400).json({ message: GALLERY_NOT_DELETED }))
        )
        .catch(() => res.status(400).json({ message: IMAGE_DELETE_MANY }));
    })
    .catch(() => res.status(404).json({ message: IMAGES_NOT_FOUND }));
}
