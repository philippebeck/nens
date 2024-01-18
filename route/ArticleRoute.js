"use strict";

const express = require("express");
const router  = express.Router();

const ArticleCtrl   = require("../controller/ArticleCtrl");
const { checkAuth } = require("../middleware/checkers");

/* Public */
router.get("/", ArticleCtrl.listArticles);
router.get("/:id", ArticleCtrl.readArticle);

/* Private */
router.post("/", checkAuth, ArticleCtrl.createArticle);
router.put("/:id", checkAuth, ArticleCtrl.updateArticle);
router.delete("/:id", checkAuth, ArticleCtrl.deleteArticle);

module.exports = router;
