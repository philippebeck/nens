"use strict";

const db          = require("../model");
const formidable  = require("formidable");
const fs          = require("fs");
const nem         = require("nemjs");

require("dotenv").config();

const PRODUCTS_IMG    = process.env.IMG_URL + "products/";
const PRODUCTS_THUMB  = process.env.THUMB_URL + "products/";

const form    = formidable({ uploadDir: PRODUCTS_IMG, keepExtensions: true });
const Product = db.product;

//! ******************** CHECKERS ********************

/**
 * ? CHECK PRODUCT DATA
 * * Validates and checks the product data before processing it.
 *
 * @param {string} name - The name of the product.
 * @param {string} description - The description of the product.
 * @param {string} alt - The alternative name of the product.
 * @param {number} price - The price of the product.
 * @param {string} cat - The category of the product.
 * @param {object} res - The response object.
 * @return {object} The response object with a JSON message if there are any validation errors.
 */
exports.checkProductData = (name, description, alt, price, cat, res) => {
  const PRICE_MAX = process.env.PRICE_MAX;
  const PRICE_MIN = process.env.PRICE_MIN;
  const STR_MAX   = process.env.STRING_MAX;
  const STR_MIN   = process.env.STRING_MIN;
  const TXT_MAX   = process.env.TEXT_MAX;
  const TXT_MIN   = process.env.TEXT_MIN;

  let alert = "";

  if (!nem.checkRange(cat, STR_MIN, STR_MAX)) alert = process.env.CHECK_CAT;
  if (!nem.checkRange(price, PRICE_MIN, PRICE_MAX)) alert = process.env.CHECK_PRICE;
  if (!nem.checkRange(alt, STR_MIN, STR_MAX)) alert = process.env.CHECK_NAME;
  if (!nem.checkRange(description, TXT_MIN, TXT_MAX)) alert = process.env.CHECK_TEXT;
  if (!nem.checkRange(name, STR_MIN, STR_MAX)) alert = process.env.CHECK_NAME;

  if (alert !== "") return res.status(403).json({ message: alert });
}

/**
 * ? CHECK PRODUCT UNIQUE
 * * Checks if the given product name and description are unique.
 *
 * @param {string} name - The name of the product.
 * @param {string} description - The description of the product.
 * @param {object} product - The product object to compare with.
 * @param {object} res - The response object.
 * @return {object} The JSON response object with the appropriate message and status code.
 */
exports.checkProductUnique = (name, description, product, res) => {
  if (product.name === name) {
    return res.status(403).json({ message: process.env.DISPO_NAME });
  }

  if (product.description === description) {
    return res.status(403).json({ message: process.env.DISPO_DESCRIPTION });
  }
}

/**
 * ? CHECK PRODUCTS FOR UNIQUE
 * * Checks if a product is unique based on its ID & fields.
 *
 * @param {string} id - The ID of the product to check uniqueness against.
 * @param {Array} products - An array of products to check for uniqueness.
 * @param {Object} fields - An object containing the fields to check for uniqueness.
 * @param {Object} res - The response object to send the result to.
 */
exports.checkProductsForUnique = (id, products, fields, res) => {
  for (let product of products) {
    if (product.id !== id) {
      this.checkProductUnique(fields.name, fields.description, product, res)
    }
  }
}

//! ******************** GETTERS ********************

/**
 * ? GET PRODUCT
 * * Returns a product object with the given properties.
 *
 * @param {string} name - The name of the product.
 * @param {string} description - The description of the product.
 * @param {string} image - The image URL of the product.
 * @param {string} alt - The alternative text for the product image.
 * @param {number} price - The price of the product.
 * @param {object} options - The options for the product.
 * @param {string} cat - The category of the product.
 * @return {object} The product object with the given properties.
 */
exports.getProduct = (name, description, image, alt, price, options, cat) => {

  return {
    name: name,
    description: description,
    image: image,
    alt: alt,
    price: price,
    options: options,
    cat: cat
  }
}

//! ******************** SETTER ********************

/**
 * ? SET IMAGE
 * * Sets the image for a product.
 *
 * @param {string} name - The name of the product.
 * @param {string} newFilename - The new filename of the image.
 */
exports.setImage = (name, newFilename) => {
  let input   = "products/" + newFilename;
  let output  = "products/" + name;

  nem.setThumbnail(input, process.env.THUMB_URL + output);
  nem.setThumbnail(
    input,
    process.env.IMG_URL + output,
    process.env.IMG_WIDTH,
    process.env.IMG_HEIGHT
  );
}

//! ******************** PUBLIC ********************

/**
 * ? LIST PRODUCTS
 * * Retrieves a list of all products.
 *
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @return {Object} The list of products in JSON format.
 * @throws {Error} If the products are not found in the database.
 */
exports.listProducts = (req, res) => {
  Product
    .findAll()
    .then((products) => {
      for (const product of products) {
        product.options = JSON.parse(product.options).join(",");
      }
      res.status(200).json(products);
    })
    .catch(() => res.status(404).json({ message: process.env.PRODUCTS_NOT_FOUND }));
};

/**
 * ? READ PRODUCT
 * * Reads a product by its ID.
 *
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @return {Object} The product in JSON format.
 * @throws {Error} If the product is not found in the database.
 */
exports.readProduct = (req, res) => {
  Product
    .findByPk(parseInt(req.params.id))
    .then((product) => { 
      product.options = JSON.parse(product.options).join(",");
      res.status(200).json(product);
    })
    .catch(() => res.status(404).json({ message: process.env.PRODUCT_NOT_FOUND }));
}

//! ******************** PRIVATE ********************

/**
 * ? CREATE PRODUCT
 * * Creates a new product.
 *
 * @param {Object} req - the request object
 * @param {Object} res - the response object
 * @param {Function} next - the next middleware function
 * @return {Object} A message indicating that the product was created.
 * @throws {Error} If the product is not created.
 */
exports.createProduct = (req, res, next) => {
  form.parse(req, (err, fields, files) => {
    if (err) { next(err); return }

    this.checkProductData(fields.name, fields.description, fields.alt, fields.price, fields.cat, res);

    Product
      .findAll()
      .then((products) => {
        for (let product of products) { this.checkProductUnique(fields.name, fields.description, product, res) }

        let options = nem.getArrayFromString(fields.options);
        let image   = nem.getName(fields.name) + "." + process.env.IMG_EXT;
        this.setImage(image, files.image.newFilename);

        let product = this.getProduct(
          fields.name, fields.description, image, fields.alt, fields.price, options, fields.cat
        );

        Product
          .create(product)
          .then(() => {
            fs.unlink(PRODUCTS_IMG + files.image.newFilename, () => {
              res.status(201).json({ message: process.env.PRODUCT_CREATED })
            })
          })
          .catch(() => res.status(400).json({ message: process.env.PRODUCT_NOT_CREATED }));
      })
      .catch(() => res.status(404).json({ message: process.env.PRODUCTS_NOT_FOUND }));
  })
};

/**
 * ? UPDATE PRODUCT
 * * Updates a product.
 *
 * @param {Object} req - the request object
 * @param {Object} res - the response object
 * @param {Function} next - the next middleware function
 * @return {Object} A message indicating that the product was updated.
 * @throws {Error} If the product is not updated.
 */
exports.updateProduct = (req, res, next) => {
  const id = parseInt(req.params.id);

  form.parse(req, (err, fields, files) => {
    if (err) { next(err); return }

    this.checkProductData(fields.name, fields.description, fields.alt, fields.price, fields.cat, res);

    Product
      .findAll()
      .then((products) => {
        this.checkProductsForUnique(id, products, fields, res);

        let image = nem.getName(fields.name) + "." + process.env.IMG_EXT;
        if (files.image) this.setImage(image, files.image.newFilename);

        let options = nem.getArrayFromString(fields.options);
        let product = this.getProduct(fields.name, fields.description, image, fields.alt, fields.price, options, fields.cat);

        Product
          .update(product, { where: { id: id }})
          .then(() => {
            if (files.image) fs.unlink(PRODUCTS_IMG + files.image.newFilename, () => { });
            res.status(200).json({ message: process.env.PRODUCT_UPDATED });
          })
          .catch(() => res.status(400).json({ message: process.env.PRODUCT_NOT_UPDATED }));
      })
      .catch(() => res.status(404).json({ message: process.env.PRODUCTS_NOT_FOUND }));
  })
};

/**
 * ? DELETE PRODUCT
 * * Deletes a product from the database.
 *
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @return {Object} A message indicating that the product was deleted.
 * @throws {Error} If the product is not found in the database.
 */
exports.deleteProduct = (req, res) => {
  const id = parseInt(req.params.id);

  Product
    .findByPk(id)
    .then(product => {
      fs.unlink(PRODUCTS_THUMB + product.image, () => {
        fs.unlink(PRODUCTS_IMG + product.image, () => {

          Product
            .destroy({ where: { id: id }})
            .then(() => res.status(204).json({ message: process.env.PRODUCT_DELETED }))
            .catch(() => res.status(400).json({ message: process.env.PRODUCT_NOT_DELETED }))
        })
      })
    })
    .catch(() => res.status(404).json({ message: process.env.PRODUCT_NOT_FOUND }));
}
