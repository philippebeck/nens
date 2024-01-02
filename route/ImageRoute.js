"use strict";

const express     = require("express");
const router      = express.Router();
const nem         = require("nemjs");
const ImageCtrl   = require("../controller/ImageCtrl");

/* Public */
router.get("/", ImageCtrl.listImages);
router.get("/:id", ImageCtrl.listGalleryImages);

/* Private */
router.post("/", nem.checkAuth, ImageCtrl.createImage);
router.put("/:id", nem.checkAuth, ImageCtrl.updateImage);
router.delete("/:id", nem.checkAuth, ImageCtrl.deleteImage);

module.exports = router;
