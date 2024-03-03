"use strict";

const express   = require("express");
const router    = express.Router();

const LinkCtrl      = require("../controller/LinkCtrl");
const { checkAuth } = require("../app/middlewares");

/* Public */
router.get("/", LinkCtrl.listLinks);

/* Private */
router.post("/", checkAuth, LinkCtrl.createLink);
router.put("/:id", checkAuth, LinkCtrl.updateLink);
router.delete("/:id", checkAuth, LinkCtrl.deleteLink);

module.exports = router;