"use strict";

const express     = require("express");
const router      = express.Router();

const ProductCtrl   = require("../controller/ProductCtrl");
const { checkAuth } = require("../middleware/checkers");

/* Public */
router.get("/", ProductCtrl.listProducts);
router.get("/:id", ProductCtrl.readProduct);

/* Private */
router.post("/", checkAuth, ProductCtrl.createProduct);
router.put("/:id", checkAuth, ProductCtrl.updateProduct);
router.delete("/:id", checkAuth, ProductCtrl.deleteProduct);

module.exports = router;
