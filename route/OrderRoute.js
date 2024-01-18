"use strict";

const express   = require("express");
const router    = express.Router();

const OrderCtrl     = require("../controller/OrderCtrl");
const { checkAuth } = require("../middleware/checkers");

/* Private */
router.get("/", checkAuth, OrderCtrl.listOrders);
router.get("/:id", checkAuth, OrderCtrl.listUserOrders);
router.post("/", checkAuth, OrderCtrl.createOrder);
router.put("/:id", checkAuth, OrderCtrl.updateOrder);
router.delete("/:id", checkAuth, OrderCtrl.deleteOrder);

module.exports = router;
