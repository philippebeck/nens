"use strict";

const express   = require("express");
const cors      = require("cors");
const helmet    = require("helmet");
const Sequelize = require('sequelize');

const articleRoute  = require("./route/ArticleRoute");
const authRoute     = require("./route/AuthRoute");
const galleryRoute  = require("./route/GalleryRoute");
const imageRoute    = require("./route/ImageRoute");
const linkRoute     = require("./route/LinkRoute");
const orderRoute    = require("./route/OrderRoute");
const productRoute  = require("./route/ProductRoute");
const userRoute     = require("./route/UserRoute");

require("dotenv").config();

/**
 * SEQUELIZE
 */
const sequelize = new Sequelize(process.env.DB);
sequelize
  .authenticate()
  .then(() => { console.log(process.env.SQL_OK) })
  .catch(err => { console.error(process.env.SQL_KO, err) });

/**
 * EXPRESS
 */
const app = express();
app
  .use(express.json())
  .use(cors())
  .use(helmet());

/**
 * ROUTES
 */
app
  .use(process.env.ROUTE_ARTICLE, articleRoute)
  .use(process.env.ROUTE_AUTH, authRoute)
  .use(process.env.ROUTE_GALLERY, galleryRoute)
  .use(process.env.ROUTE_IMAGE, imageRoute)
  .use(process.env.ROUTE_LINK, linkRoute)
  .use(process.env.ROUTE_ORDER, orderRoute)
  .use(process.env.ROUTE_PRODUCT, productRoute)
  .use(process.env.ROUTE_USER, userRoute);

module.exports = app;
