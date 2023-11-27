"use strict";

const express = require("express");
const helmet  = require("helmet");
const cors    = require("cors");

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
 * EXPRESS
 */
const app = express();
app.use(express.json());
app.use(cors());
app.use(helmet());

/**
 * ROUTES
 */
app.use(process.env.ROUTE_ARTICLE, articleRoute);
app.use(process.env.ROUTE_AUTH, authRoute);
app.use(process.env.ROUTE_GALLERY, galleryRoute);
app.use(process.env.ROUTE_IMAGE, imageRoute);
app.use(process.env.ROUTE_LINK, linkRoute);
app.use(process.env.ROUTE_ORDER, orderRoute);
app.use(process.env.ROUTE_PRODUCT, productRoute);
app.use(process.env.ROUTE_USER, userRoute);

module.exports = app;
