"use strict";

const db          = require("../model");
const formidable  = require("formidable");
const fs          = require("fs");
const nem         = require("nemjs");

require("dotenv").config();

const {IMG_EXT, IMG_URL, PRODUCT_NOT_FOUND, PRODUCTS_NOT_FOUND, THUMB_URL } = process.env;

const PRODUCTS_IMG    = `${IMG_URL}products/`;
const PRODUCTS_THUMB  = `${THUMB_URL}products/`;

const form = formidable({ uploadDir: PRODUCTS_IMG, keepExtensions: true });

const Product = db.product;

//! ******************** UTILS ********************

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
 * @return {object} The response object with a JSON message if there are errors.
 */
exports.checkProductData = (name, description, alt, price, cat, res) => {
  const { CHECK_CAT, CHECK_NAME, CHECK_PRICE, CHECK_TEXT, PRICE_MAX, PRICE_MIN, STRING_MAX, STRING_MIN, TEXT_MAX, TEXT_MIN } = process.env;

  const IS_NAME_CHECKED   = nem.checkRange(name, STRING_MIN, STRING_MAX);
  const IS_DESC_CHECKED   = nem.checkRange(description, TEXT_MIN, TEXT_MAX);
  const IS_ALT_CHECKED    = nem.checkRange(alt, STRING_MIN, STRING_MAX);
  const IS_PRICE_CHECKED  = nem.checkRange(price, PRICE_MIN, PRICE_MAX);
  const ID_CAT_CHECKED    = nem.checkRange(cat, STRING_MIN, STRING_MAX);

  if (!IS_NAME_CHECKED || !IS_DESC_CHECKED || !IS_ALT_CHECKED || !IS_PRICE_CHECKED || !ID_CAT_CHECKED) {
    return res.status(403).json({ 
      message: CHECK_NAME || CHECK_TEXT || CHECK_NAME || CHECK_PRICE || CHECK_CAT
    });
  }
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
  const { DISPO_DESCRIPTION, DISPO_NAME } = process.env;

  if (product.name === name || product.description === description) {
    return res.status(403).json({ message: DISPO_NAME || DISPO_DESCRIPTION });
  }
}

/**
 * ? SET IMAGE
 * * Sets the image for a product.
 *
 * @param {string} input - The name of the input image.
 * @param {string} output - The name of the output image.
 */
exports.setImage = async (input, output) => {
  const INPUT   = `products/${input}`;
  const OUTPUT  = `products/${output}`;

  await nem.setImage(INPUT, OUTPUT);
  await nem.setThumbnail(INPUT, OUTPUT);
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
exports.listProducts = async (req, res) => {
  try {
    const products = await Product.findAll();
    res.status(200).json(products);

  } catch (error) {
    console.error(error);
    res.status(404).json({ message: PRODUCTS_NOT_FOUND });
  }
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
exports.readProduct = async (req, res) => {
  const ID = parseInt(req.params.id, 10);

  try {
    const product = await Product.findByPk(ID);
    res.status(200).json(product);

  } catch (error) {
    console.error(error);
    res.status(404).json({ message: PRODUCT_NOT_FOUND });
  }
}

//! ******************** PRIVATE ********************

/**
 * ? CREATE PRODUCT
 * * Creates a new product based on the request data.
 *
 * @param {Object} req - the request object
 * @param {Object} res - the response object
 * @param {Function} next - the next middleware function
 * @return {Object} A message indicating that the product was created.
 * @throws {Error} If the product is not created.
 */
exports.createProduct = async (req, res, next) => {
  const { PRODUCT_CREATED, PRODUCT_NOT_CREATED } = process.env;

  form.parse(req, async (err, fields, files) => {
    if (err) { next(err); return }

    const { name, description, alt, price, cat } = fields;
    const { image } = files;

    try {
      this.checkProductData(name, description, alt, price, cat, res);

      const products = await Product.findAll();

      if (!products || products.length === 0) {
        return res.status(404).json({ message: PRODUCTS_NOT_FOUND });
      }

      for (const product of products) {
        this.checkProductUnique(name, description, product, res);
      }

      const IMG = `${nem.getName(name)}-${Date.now()}.${IMG_EXT}`;

      if (image && image.newFilename) {
        await this.setImage(image.newFilename, IMG);
        await fs.promises.unlink(PRODUCTS_IMG + image.newFilename);
      } 

      await Product.create({ ...fields, image: IMG });
      res.status(201).json({ message: PRODUCT_CREATED });

    } catch (error) {
      console.error(error);
      res.status(400).json({ message: PRODUCT_NOT_CREATED });
    }
  })
};

/**
 * ? UPDATE PRODUCT
 * * Updates a product by its ID & based on the request data.
 *
 * @param {Object} req - the request object
 * @param {Object} res - the response object
 * @param {Function} next - the next middleware function
 * @return {Object} A message indicating that the product was updated.
 * @throws {Error} If the product is not updated.
 */
exports.updateProduct = async (req, res, next) => {
  const { PRODUCT_NOT_UPDATED, PRODUCT_UPDATED } = process.env;
  const ID = parseInt(req.params.id, 10);

  form.parse(req, async (err, fields, files) => {
    if (err) { next(err); return }

    const { name, description, alt, price, cat } = fields;
    const { image } = files;

    try {
      this.checkProductData(name, description, alt, price, cat, res);

      const products = await Product.findAll();

      if (!products || products.length === 0) {
        return res.status(404).json({ message: PRODUCTS_NOT_FOUND });
      }

      products
        .filter(product => product.id !== ID)
        .forEach(product => this.checkProductUnique(name, description, product, res));

      let img = products.find(product => product.id === ID)?.image;

      if (image && image.newFilename) {
        await fs.promises.unlink(PRODUCTS_IMG + img);
        await fs.promises.unlink(PRODUCTS_THUMB + img);

        img = `${nem.getName(name)}-${Date.now()}.${IMG_EXT}`;

        await this.setImage(image.newFilename, img);
        await fs.promises.unlink(PRODUCTS_IMG + image.newFilename);
      }

      await Product.update({ ...fields, image: img }, { where: { id: ID }});
      res.status(200).json({ message: PRODUCT_UPDATED });

    } catch (error) {
      console.error(error);
      res.status(400).json({ message: PRODUCT_NOT_UPDATED });
    }
  })
};

/**
 * ? DELETE PRODUCT
 * * Deletes a product by its ID.
 *
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @return {Object} A message indicating that the product was deleted.
 * @throws {Error} If the product is not found in the database.
 */
exports.deleteProduct = async (req, res) => {
  const { PRODUCT_DELETED, PRODUCT_NOT_DELETED } = process.env;
  const ID = parseInt(req.params.id, 10);

  try {
    const product = await Product.findByPk(ID);

    if (!product) {
      return res.status(404).json({ message: PRODUCT_NOT_FOUND });
    }

    await fs.promises.unlink(PRODUCTS_IMG + product.image);
    await fs.promises.unlink(PRODUCTS_THUMB + product.image);

    await Product.destroy({ where: { id: ID } });
    res.status(204).json({ message: PRODUCT_DELETED });

  } catch (error) {
    console.error(error);
    res.status(400).json({ message: PRODUCT_NOT_DELETED });
  }
};
