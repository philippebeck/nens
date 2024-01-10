"use strict";

const express = require("express");
const cors    = require("cors");
const helmet  = require("helmet");

require("dotenv").config();

const app = express();
app.use(express.json()).use(cors()).use(helmet());

app
  .use(process.env.ROUTE_ARTICLE, require("./route/ArticleRoute"))
  .use(process.env.ROUTE_AUTH, require("./route/AuthRoute"))
  .use(process.env.ROUTE_GALLERY, require("./route/GalleryRoute"))
  .use(process.env.ROUTE_IMAGE, require("./route/ImageRoute"))
  .use(process.env.ROUTE_LINK, require("./route/LinkRoute"))
  .use(process.env.ROUTE_ORDER, require("./route/OrderRoute"))
  .use(process.env.ROUTE_PRODUCT, require("./route/ProductRoute"))
  .use(process.env.ROUTE_PROJECT, require("./route/ProjectRoute"))
  .use(process.env.ROUTE_USER, require("./route/UserRoute"));

module.exports = app;
