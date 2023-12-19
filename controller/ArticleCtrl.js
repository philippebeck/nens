"use strict";

const db          = require("../model");
const formidable  = require("formidable");
const fs          = require("fs");
const nem         = require("nemjs");

require("dotenv").config();

const { ARTICLE_NOT_FOUND, ARTICLES_NOT_FOUND, IMG_EXT, IMG_URL, THUMB_URL } = process.env;

const ARTICLES_IMG    = IMG_URL + "articles/";
const ARTICLES_THUMB  = THUMB_URL + "articles/";

const Article = db.article;
const form    = formidable({ uploadDir: ARTICLES_IMG, keepExtensions: true });

//! ******************** UTILS ********************

/**
 * ? CHECK ARTICLE DATA
 * * Checks the validity of article data.
 * @param {string} name - The name of the article.
 * @param {string} text - The text of the article.
 * @param {string} alt - The alternative text for the article.
 * @param {string} cat - The category of the article.
 * @param {Object} res - The response object.
 * @return {object} The response object with an error message if the article is not correct.
 */
exports.checkArticleData = (name, text, alt, cat, res) => {
  const { CHECK_CAT, CHECK_NAME, CHECK_TEXT, STRING_MAX, STRING_MIN, TEXT_MAX, TEXT_MIN } = process.env;

  if (
    !nem.checkRange(cat, STRING_MIN, STRING_MAX) ||
    !nem.checkRange(alt, STRING_MIN, STRING_MAX) ||
    !nem.checkRange(text, TEXT_MIN, TEXT_MAX) ||
    !nem.checkRange(name, STRING_MIN, STRING_MAX)
  ) {
    return res.status(403).json({ 
      message: CHECK_CAT || CHECK_NAME || CHECK_TEXT || CHECK_NAME
    });
  }
}

/**
 * ? CHECK ARTICLE UNIQUE
 * * Checks if an article is unique based on its name & text.
 * @param {string} name - The name of the article.
 * @param {string} text - The text of the article.
 * @param {object} article - The existing article to compare with.
 * @param {object} res - The response object used to send the result.
 * @return {object} The response object with an error message if the article is not unique.
 */
exports.checkArticleUnique = (name, text, article, res) => {
  const { DISPO_NAME, DISPO_TEXT } = process.env;

  if (article.name === name || article.text === text) {
    return res.status(403).json({ message: DISPO_NAME || DISPO_TEXT })
  }
}

/**
 * ? SET IMAGE
 * * Sets the image for an article.
 * @param {string} input - The name of the input image.
 * @param {string} output - The name of the output image.
 */
exports.setImage = (input, output) => {
  const INPUT   = `articles/${input}`;
  const OUTPUT  = `articles/${output}`;

  nem.setImage(INPUT, OUTPUT);
  nem.setThumbnail(INPUT, OUTPUT);
}

//! ******************** PUBLIC ********************

/**
 * ? LIST ARTICLES
 * * Retrieves a list of articles.
 *
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @return {Object} The JSON response containing the list of articles.
 * @throws {Error} If the articles are not found in the database.
 */
exports.listArticles = (req, res) => {
  Article.findAll()
    .then((articles) => { res.status(200).json(articles) })
    .catch(() => res.status(404).json({ message: ARTICLES_NOT_FOUND }));
}

/**
 * ? READ ARTICLE
 * * Retrieves an article by its ID & sends it as a JSON response.
 *
 * @param {Object} req - The HTTP request object.
 * @param {Object} res - The HTTP response object.
 * @return {Object} The retrieved article as a JSON response.
 * @throws {Error} If the article is not found in the database.
 */
exports.readArticle = (req, res) => {
  const ID = parseInt(req.params.id, 10);

  Article.findByPk(ID)
    .then((article) => { res.status(200).json(article) })
    .catch(() => res.status(404).json({ message: ARTICLE_NOT_FOUND }));
}

//! ******************** PRIVATE ********************

/**
 * ? CREATE ARTICLE
 * * Creates an article based on the request data.
 *
 * @param {Object} req - the request object
 * @param {Object} res - the response object
 * @param {Function} next - the next function in the middleware chain
 * @return {Object} A message indicating that the article was created.
 * @throws {Error} If the article is not created in the database.
 */
exports.createArticle = (req, res, next) => {
  const { ARTICLE_CREATED, ARTICLE_NOT_CREATED } = process.env;

  form.parse(req, (err, fields, files) => {
    if (err) { next(err); return }

    const { name, text, alt, cat } = fields;
    const { image } = files;

    const IMG = nem.getName(name) + "." + IMG_EXT;
    if (image && image.newFilename) this.setImage(image.newFilename, IMG);

    this.checkArticleData(name, text, alt, cat, res);

    Article.findAll()
      .then((articles) => {
        for (const article of articles) {
          this.checkArticleUnique(name, text, article, res);
        }

        const article = { ...fields, image: IMG };

        Article.create(article)
          .then(() => {
            if (image && image.newFilename) {
              fs.unlink(ARTICLES_IMG + image.newFilename, () => {
                res.status(201).json({ message: ARTICLE_CREATED })
              })
            }
          })
          .catch(() => res.status(400).json({ message: ARTICLE_NOT_CREATED }));
      })
      .catch(() => res.status(404).json({ message: ARTICLES_NOT_FOUND }));
  })
}

/**
 * ? UPDATE ARTICLE
 * * Updates an article based on the request.
 *
 * @param {Object} req - the request object
 * @param {Object} res - the response object
 * @param {Function} next - the next middleware function
 * @return {Object} A message indicating that the article was updated.
 * @throws {Error} If the article is not updated in the database.
 */
exports.updateArticle = (req, res, next) => {
  const { ARTICLE_UPDATED, ARTICLE_NOT_UPDATED } = process.env;
  const ID = parseInt(req.params.id, 10);

  form.parse(req, (err, fields, files) => {
    if (err) { next(err); return }

    const { name, text, alt, cat } = fields;
    const { image } = files;

    this.checkArticleData(name, text, alt, cat, res);

    Article.findAll()
      .then((articles) => {
        let img;

        if (image && image.newFilename) {
          img = nem.getName(name) + "." + IMG_EXT;
          this.setImage(image.newFilename, img);

        } else {
          img = articles.find(article => article.id === ID)?.image;
        }

        articles.filter(article => article.id !== ID).forEach(article => 
          this.checkArticleUnique(name, text, article, res));

        const article = { ...fields, image: img };

        Article.update(article, { where: { id: ID }})
          .then(() => {
            if (image && image.newFilename) {
              fs.unlink(ARTICLES_IMG + image.newFilename, () => {})
            }
            res.status(200).json({ message: ARTICLE_UPDATED });
          })
          .catch(() => res.status(400).json({ message: ARTICLE_NOT_UPDATED }));
      })
      .catch(() => res.status(404).json({ message: ARTICLES_NOT_FOUND }));
  })
}

/**
 * ? DELETE ARTICLE
 * * Deletes an article from the database.
 *
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @return {Object} A message indicating that the article was deleted.
 * @throws {Error} If the article is not deleted in the database.
 */
exports.deleteArticle = (req, res) => {
  const { ARTICLE_DELETED, ARTICLE_NOT_DELETED } = process.env;
  const ID = parseInt(req.params.id, 10);

  Article.findByPk(ID)
    .then(article => {
      fs.unlink(ARTICLES_THUMB + article.image, () => {
        fs.unlink(ARTICLES_IMG + article.image, () => {

          Article.destroy({ where: { id: ID }})
            .then(() => res.status(204).json({ message: ARTICLE_DELETED }))
            .catch(() => res.status(400).json({ message: ARTICLE_NOT_DELETED }));
        })
      })
    })
    .catch(() => res.status(404).json({ message: ARTICLE_NOT_FOUND }));
}
