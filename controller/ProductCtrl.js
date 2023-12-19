"use strict";

const db          = require("../model");
const formidable  = require("formidable");
const fs          = require("fs");
const nem         = require("nemjs");

require("dotenv").config();

const {IMG_EXT, IMG_URL, PRODUCT_NOT_FOUND, PRODUCTS_NOT_FOUND, THUMB_URL } = process.env;

const PRODUCTS_IMG    = IMG_URL + "products/";
const PRODUCTS_THUMB  = THUMB_URL + "products/";

const form    = formidable({ uploadDir: PRODUCTS_IMG, keepExtensions: true });
const Product = db.product;

//! ******************** UTILS ********************

/**
 * ? CHECK PRODUCT DATA
 * * Validates and checks the product data before processing it.
 * @param {string} name - The name of the product.
 * @param {string} description - The description of the product.
 * @param {string} alt - The alternative name of the product.
 * @param {number} price - The price of the product.
 * @param {string} cat - The category of the product.
 * @param {object} res - The response object.
 * @return {object} The response object with a JSON message if there are errors.
 */
exports.checkProductData = (name, description, alt, price, cat, res) => {
  const { CHECK_CAT, CHECK_NAME, CHECK_PRICE, CHECK_TEXT, PRICE_MAX, PRICE_MIN, STRING_MAX, STRING_MIN, TEXT_MAX, TEXT_MIN } = process.env;

  if (
    !nem.checkRange(cat, STRING_MIN, STRING_MAX) ||
    !nem.checkRange(price, PRICE_MIN, PRICE_MAX) ||
    !nem.checkRange(alt, STRING_MIN, STRING_MAX) ||
    !nem.checkRange(description, TEXT_MIN, TEXT_MAX) ||
    !nem.checkRange(name, STRING_MIN, STRING_MAX)
  ) {
    return res.status(403).json({ 
      message: CHECK_CAT || CHECK_PRICE || CHECK_NAME || CHECK_TEXT || CHECK_NAME 
    });
  }
}

/**
 * ? CHECK PRODUCT UNIQUE
 * * Checks if the given product name and description are unique.
 * @param {string} name - The name of the product.
 * @param {string} description - The description of the product.
 * @param {object} product - The product object to compare with.
 * @param {object} res - The response object.
 * @return {object} The JSON response object with the appropriate message and status code.
 */
exports.checkProductUnique = (name, description, product, res) => {
  const { DISPO_DESCRIPTION, DISPO_NAME } = process.env;

  if (product.name === name || product.description === description) {
    return res.status(403).json({ message: DISPO_NAME || DISPO_DESCRIPTION });
  }
}

/**
 * ? SET IMAGE
 * * Sets the image for a product.
 * @param {string} input - The name of the input image.
 * @param {string} output - The name of the output image.
 */
exports.setImage = (input, output) => {
  const INPUT   = `products/${input}`;
  const OUTPUT  = `products/${output}`;

  nem.setImage(INPUT, OUTPUT);
  nem.setThumbnail(INPUT, OUTPUT);
}

//! ******************** PUBLIC ********************

/**
 * ? LIST PRODUCTS
 * * Retrieves a list of all products.
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @return {Object} The list of products in JSON format.
 * @throws {Error} If the products are not found in the database.
 */
exports.listProducts = (req, res) => {
  Product.findAll()
    .then((products) => { res.status(200).json(products) })
    .catch(() => res.status(404).json({ message: PRODUCTS_NOT_FOUND }));
};

/**
 * ? READ PRODUCT
 * * Reads a product by its ID.
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @return {Object} The product in JSON format.
 * @throws {Error} If the product is not found in the database.
 */
exports.readProduct = (req, res) => {
  const ID = parseInt(req.params.id, 10);

  Product.findByPk(ID)
    .then((product) => { res.status(200).json(product) })
    .catch(() => res.status(404).json({ message: PRODUCT_NOT_FOUND }));
}

//! ******************** PRIVATE ********************

/**
 * ? CREATE PRODUCT
 * * Creates a new product.
 * @param {Object} req - the request object
 * @param {Object} res - the response object
 * @param {Function} next - the next middleware function
 * @return {Object} A message indicating that the product was created.
 * @throws {Error} If the product is not created.
 */
exports.createProduct = (req, res, next) => {
  const { PRODUCT_CREATED, PRODUCT_NOT_CREATED } = process.env;

  form.parse(req, (err, fields, files) => {
    if (err) { next(err); return }

    const { alt, cat, description, name, price } = fields;
    const { image } = files;

    this.checkProductData(name, description, alt, price, cat, res);

    Product.findAll()
      .then((products) => {
        for (let product of products) {
          this.checkProductUnique(name, description, product, res)
        }

        const IMG     = nem.getName(fields.name) + "." + IMG_EXT;
        const product = { ...fields, image: IMG };

        if (image && image.newFilename) this.setImage(image.newFilename, IMG);

        Product.create(product)
          .then(() => {
            if (image && image.newFilename) {
              fs.unlink(PRODUCTS_IMG + image.newFilename, () => { 
                res.status(201).json({ message: PRODUCT_CREATED })
              })
            }
          })
          .catch(() => res.status(400).json({ message: PRODUCT_NOT_CREATED }));
      })
      .catch(() => res.status(404).json({ message: PRODUCTS_NOT_FOUND }));
  })
};

/**
 * ? UPDATE PRODUCT
 * * Updates a product.
 * @param {Object} req - the request object
 * @param {Object} res - the response object
 * @param {Function} next - the next middleware function
 * @return {Object} A message indicating that the product was updated.
 * @throws {Error} If the product is not updated.
 */
exports.updateProduct = (req, res, next) => {
  const { PRODUCT_NOT_UPDATED, PRODUCT_UPDATED } = process.env;
  const ID = parseInt(req.params.id, 10);

  form.parse(req, (err, fields, files) => {
    if (err) { next(err); return }

    const { name, description, alt, price, cat } = fields;
    const { image } = files;

    this.checkProductData(name, description, alt, price, cat, res);

    Product.findAll()
      .then((products) => {
        let img;

        products.filter(product => product.id !== ID).forEach(product => 
          this.checkProductUnique(name, description, product, res));

        if (image && image.newFilename) {
          img = nem.getName(name) + "." + IMG_EXT;
          this.setImage(image.newFilename, img);

        } else {
          img = products.find(product => product.id === ID)?.image;
        }

        const product = { ...fields, image: img };

        Product.update(product, { where: { id: ID }})
          .then(() => {
            if (image && image.newFilename) {
              fs.unlink(PRODUCTS_IMG + image.newFilename, () => {})
            }
            res.status(200).json({ message: PRODUCT_UPDATED });
          })
          .catch(() => res.status(400).json({ message: PRODUCT_NOT_UPDATED }));
      })
      .catch(() => res.status(404).json({ message: PRODUCTS_NOT_FOUND }));
  })
};

/**
 * ? DELETE PRODUCT
 * * Deletes a product from the database.
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @return {Object} A message indicating that the product was deleted.
 * @throws {Error} If the product is not found in the database.
 */
exports.deleteProduct = (req, res) => {
  const { PRODUCT_DELETED, PRODUCT_NOT_DELETED } = process.env;
  const ID = parseInt(req.params.id, 10);

  Product.findByPk(ID)
    .then(product => {
      fs.unlink(PRODUCTS_THUMB + product.image, () => {
        fs.unlink(PRODUCTS_IMG + product.image, () => {

          Product.destroy({ where: { id: ID }})
            .then(() => res.status(204).json({ message: PRODUCT_DELETED }))
            .catch(() => res.status(400).json({ message: PRODUCT_NOT_DELETED }))
        })
      })
    })
    .catch(() => res.status(404).json({ message: PRODUCT_NOT_FOUND }));
}
