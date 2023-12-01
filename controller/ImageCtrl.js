"use strict";

const db          = require("../model");
const formidable  = require("formidable");
const fs          = require("fs");
const nem         = require("nemjs");

require("dotenv").config();

const GALLERIES_IMG   = process.env.IMG_URL + "galleries/";
const GALLERIES_THUMB = process.env.THUMB_URL + "galleries/";

const form    = formidable({ uploadDir: GALLERIES_IMG, keepExtensions: true });
const Gallery = db.gallery;
const Image   = db.image;

//! ******************** CHECKER ********************

/**
 * ? CHECK IMAGE DATA
 * * Checks the image data.
 *
 * @param {string} description - The description of the image data.
 * @param {object} res - The response object.
 * @return {object} The JSON response.
 */
exports.checkImageData = (description, res) => {
  if (!nem.checkRange(description, process.env.STRING_MIN, process.env.TEXT_MAX)) {
    return res.status(403).json({ message: process.env.CHECK_NAME });
  }
}

//! ******************** SETTER ********************

/**
 * ? SET IMAGE
 * * Sets the image & thumbnail for a gallery.
 *
 * @param {string} image - The filename of the image to set.
 * @param {string} newFilename - The new filename to use for the image.
 */
exports.setImage = (image, newFilename) => {
  let input   = "galleries/" + newFilename;
  let output  = "galleries/" + image;

  nem.setImage(input, process.env.IMG_URL + output);
  nem.setThumbnail(input, process.env.THUMB_URL + output);
}

//! ******************** GETTER ********************

/**
 * ? GET IMAGE
 * * Retrieves an image with the given name, description & gallery ID.
 *
 * @param {string} name - The name of the image.
 * @param {string} description - The description of the image.
 * @param {number} gallery_id - The ID of the gallery the image belongs to.
 * @return {object} - An object containing the name, description & gallery ID of the image.
 */
exports.getImage = (name, description, gallery_id) => {

  return {
    name: name,
    description: description,
    gallery_id: gallery_id
  }
}

//! ******************** PUBLIC ********************

/**
 * ? LIST GALLERY IMAGES
 * * Retrieves a list of gallery images based on the provided gallery ID.
 *
 * @param {Object} req - The request object.
 * @param {Object} req.params - The parameters object containing the gallery ID.
 * @param {string} req.params.id - The ID of the gallery to retrieve images for.
 * @param {Object} res - The response object.
 * @return {Promise} A promise that resolves to a response containing the list of gallery images.
 * @throws {Error} If the images are not found in the database.
 */
exports.listGalleryImages = (req, res) => {
  Image
    .findAll({ where: { gallery_id: req.params.id }})
    .then((images) => { res.status(200).json(images) })
    .catch(() => res.status(404).json({ message: process.env.IMAGES_NOT_FOUND }));
};

//! ******************** PRIVATE ********************

/**
 * ? LIST IMAGES
 * * Retrieves a list of images & modifies the gallery ID of each image by appending the gallery name.
 *
 * @param {Object} req - The HTTP request object.
 * @param {Object} res - The HTTP response object.
 * @return {Promise} A promise that resolves to a response containing the list of images.
 * @throws {Error} If the images are not found in the database.
 */
exports.listImages = (req, res) => {
  Image
    .findAll()
    .then((images) => { 

      Gallery
        .findAll()
        .then((galleries) => {
          for (let image of images) {
            for (let gallery of galleries) {

              if (image.gallery_id === gallery.id.toNumber()) {
                image.gallery_id = image.gallery_id + "-" + gallery.name;
              }
            }
          }
          res.status(200).json(images);
        })
        .catch(() => res.status(404).json({ message: process.env.GALLERIES_NOT_FOUND }));
    })
    .catch(() => res.status(404).json({ message: process.env.IMAGES_NOT_FOUND }));
};

/**
 * ? CREATE IMAGE
 * * Creates an image based on the request data.
 *
 * @param {Object} req - the request object
 * @param {Object} res - the response object
 * @param {Function} next - the next middleware function
 * @return {Object} A message indicating that the image was created.
 * @throws {Error} If the image is not created in the database.
 */
exports.createImage = (req, res, next) => {
  form.parse(req, (err, fields, files) => {
    if (err) { next(err); return }

    this.checkImageData(fields.description, res);

    Gallery
      .findOne({ where: { id: fields.gallery_id }})
      .then((gallery) => {

        Image
        .findAll({ where: { gallery_id: fields.gallery_id }})
        .then((images) => { 
          let index = images.length + 1;
          if (index < 10) { index = "0" + index }

          let name = nem.getName(gallery.name) + "-" + index + "." + process.env.IMG_EXT;
          this.setImage(name, files.image.newFilename);
          let image = this.getImage(name, fields.description, fields.gallery_id);

          Image
            .create(image)
            .then(() => {
              fs.unlink(GALLERIES_IMG + files.image.newFilename, () => {
                res.status(201).json({ message: process.env.IMAGE_CREATED });
              })
            })
            .catch(() => res.status(400).json({ message: process.env.IMAGE_NOT_CREATED }));
        })
        .catch(() => res.status(404).json({ message: process.env.IMAGES_NOT_FOUND }));
      })
      .catch(() => res.status(404).json({ message: process.env.GALLERY_NOT_FOUND }));
  })
};

/**
 * ? UPDATE IMAGE
 * * Updates an image.
 *
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @param {Function} next - The next middleware function.
 * @return {Object} A message indicating that the image was updated.
 * @throws {Error} If the image is not updated in the database.
 */
exports.updateImage = (req, res, next) => {
  form.parse(req, (err, fields, files) => {
    if (err) { next(err); return }

    this.checkImageData(fields.description, res);
    let name = fields.name;

    if (files.image) this.setImage(name, files.image.newFilename);
    let image = this.getImage(name, fields.description, fields.gallery_id);

    Image
      .update(image, { where: { id: req.params.id }})
      .then(() => {
        if (files.image) fs.unlink(GALLERIES_IMG + files.image.newFilename, () => {});
        res.status(200).json({ message: process.env.IMAGE_UPDATED });
      })
      .catch(() => res.status(400).json({ message: process.env.IMAGE_NOT_UPDATED }));
  })
};

/**
 * ? DELETE IMAGE
 * * Deletes an image from the server and database.
 *
 * @param {Object} req - The HTTP request object.
 * @param {Object} res - The HTTP response object.
 * @return {Object} A message indicating that the image was deleted.
 * @throws {Error} If the image is not deleted in the database.
 */
exports.deleteImage = (req, res) => {
  Image
    .findByPk(req.params.id)
    .then((image) => {
      fs.unlink(GALLERIES_THUMB + image.name, () => {
        fs.unlink(GALLERIES_IMG + image.name, () => {

          Image
            .destroy({ where: { id: req.params.id }})
            .then(() => res.status(204).json({ message: process.env.IMAGE_DELETED }))
            .catch(() => res.status(400).json({ message: process.env.IMAGE_NOT_DELETED }));
        })
      })
    })
    .catch(() => res.status(400).json({ message: process.env.IMAGE_NOT_FOUND }));
};
