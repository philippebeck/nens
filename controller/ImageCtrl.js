"use strict";

const db          = require("../model");
const formidable  = require("formidable");
const fs          = require("fs");
const nem         = require("nemjs");

require("dotenv").config();

const { IMAGES_NOT_FOUND, IMG_URL, THUMB_URL } = process.env;

const GALLERIES_IMG   = IMG_URL + "galleries/";
const GALLERIES_THUMB = THUMB_URL + "galleries/";

const form    = formidable({ uploadDir: GALLERIES_IMG, keepExtensions: true });
const Gallery = db.gallery;
const Image   = db.image;

//! ******************** UTILS ********************

/**
 * ? CHECK IMAGE DATA
 * * Checks the image data.
 * @param {string} description - The description of the image data.
 * @param {object} res - The response object.
 * @return {object} The JSON response.
 */
exports.checkImageData = (description, res) => {
  const { CHECK_NAME, STRING_MIN, TEXT_MAX } = process.env;

  if (!nem.checkRange(description, STRING_MIN, TEXT_MAX)) {
    return res.status(403).json({ message: CHECK_NAME })
  }
}

/**
 * ? SET IMAGE
 * * Sets the image & thumbnail for a gallery.
 * @param {string} image - The filename of the image to set.
 * @param {string} newFilename - The new filename to use for the image.
 */
exports.setImage = (image, newFilename) => {
  const INPUT   = "galleries/" + newFilename;
  const OUTPUT  = "galleries/" + image;

  nem.setImage(INPUT, IMG_URL + OUTPUT);
  nem.setThumbnail(INPUT, THUMB_URL + OUTPUT);
}

//! ******************** PUBLIC ********************

/**
 * ? LIST IMAGES
 * * Retrieves a list of gallery images based on the provided gallery ID.
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @return {Promise} A promise that resolves to a response containing the list of gallery images.
 * @throws {Error} If the images are not found in the database.
 */
exports.listImages = (req, res) => {
  Image.belongsTo(Gallery, { foreignKey: "galleryId" });

  Image.findAll({
      where: { galleryId: req.params.id },
      attributes: ["id", "name", "description", "galleryId"],
      include: { model: Gallery, attributes: ["name"] }
    })
    .then((images) => { res.status(200).json(images) })
    .catch(() => res.status(404).json({ message: IMAGES_NOT_FOUND }));
};

//! ******************** PRIVATE ********************

/**
 * ? CREATE IMAGE
 * * Creates an image based on the request data.
 * @param {Object} req - the request object
 * @param {Object} res - the response object
 * @param {Function} next - the next middleware function
 * @return {Object} A message indicating that the image was created.
 * @throws {Error} If the image is not created in the database.
 */
exports.createImage = (req, res, next) => {
  const { GALLERY_NOT_FOUND, IMAGE_CREATED, IMAGE_NOT_CREATED, IMAGES_NOT_FOUND, IMG_EXT } = process.env;

  form.parse(req, (err, fields, files) => {
    if (err) { next(err); return }

    const { description, galleryId } = fields;
    const { image } = files;

    this.checkImageData(description, res);

    Gallery.findOne({ where: { id: galleryId }})
      .then((gallery) => {

        Image.findAll({ where: { galleryId: galleryId }})
        .then((images) => { 
          let index = images.length + 1;
          if (index < 10) index = "0" + index;

          const name  = nem.getName(gallery.name) + "-" + index + "." + IMG_EXT;
          const img   = { ...fields, name: name };

          if (image && image.newFilename) this.setImage(name, image.newFilename);

          Image.create(img)
            .then(() => {
              if (image && image.newFilename) {
                fs.unlink(GALLERIES_IMG + image.newFilename, () => { 
                  res.status(201).json({ message: IMAGE_CREATED })
                })
              }
            })
            .catch(() => res.status(400).json({ message: IMAGE_NOT_CREATED }));
        })
        .catch(() => res.status(404).json({ message: IMAGES_NOT_FOUND }));
      })
      .catch(() => res.status(404).json({ message: GALLERY_NOT_FOUND }));
  })
};

/**
 * ? UPDATE IMAGE
 * * Updates an image.
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @param {Function} next - The next middleware function.
 * @return {Object} A message indicating that the image was updated.
 * @throws {Error} If the image is not updated in the database.
 */
exports.updateImage = (req, res, next) => {
  const { IMAGE_NOT_UPDATED, IMAGE_UPDATED } = process.env;
  const ID = parseInt(req.params.id, 10);

  form.parse(req, (err, fields, files) => {
    if (err) { next(err); return }

    const { name, description } = fields;
    const { image } = files;
    const img = { ...fields };

    this.checkImageData(description, res);
    if (image && image.newFilename) this.setImage(name, image.newFilename);

    Image.update(img, { where: { id: ID }})
      .then(() => {
        if (image && image.newFilename) {
          fs.unlink(GALLERIES_IMG + image.newFilename, () => {})
        }
        res.status(200).json({ message: IMAGE_UPDATED });
      })
      .catch(() => res.status(400).json({ message: IMAGE_NOT_UPDATED }));
  })
};

/**
 * ? DELETE IMAGE
 * * Deletes an image from the server and database.
 * @param {Object} req - The HTTP request object.
 * @param {Object} res - The HTTP response object.
 * @return {Object} A message indicating that the image was deleted.
 * @throws {Error} If the image is not deleted in the database.
 */
exports.deleteImage = (req, res) => {
  const { IMAGE_DELETED, IMAGE_NOT_DELETED, IMAGE_NOT_FOUND } = process.env;
  const ID = parseInt(req.params.id, 10);

  Image.findByPk(ID)
    .then((image) => {
      fs.unlink(GALLERIES_THUMB + image.name, () => {
        fs.unlink(GALLERIES_IMG + image.name, () => {

          Image.destroy({ where: { id: ID }})
            .then(() => res.status(204).json({ message: IMAGE_DELETED }))
            .catch(() => res.status(400).json({ message: IMAGE_NOT_DELETED }));
        })
      })
    })
    .catch(() => res.status(400).json({ message: IMAGE_NOT_FOUND }));
};
