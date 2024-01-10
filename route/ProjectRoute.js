"use strict";

const express     = require("express");
const router      = express.Router();
const nem         = require("nemjs");
const ProjectCtrl = require("../controller/ProjectCtrl");

/* Public */
router.get("/", ProjectCtrl.listProjects);

/* Private */
router.post("/", nem.checkAuth, ProjectCtrl.createProject);
router.put("/:id", nem.checkAuth, ProjectCtrl.updateProject);
router.delete("/:id", nem.checkAuth, ProjectCtrl.deleteProject);

module.exports = router;
