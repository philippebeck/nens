"use strict";

const express     = require("express");
const router      = express.Router();

const ProjectCtrl   = require("../controller/ProjectCtrl");
const { checkAuth } = require("../app/middlewares");

/* Public */
router.get("/", ProjectCtrl.listProjects);

/* Private */
router.post("/", checkAuth, ProjectCtrl.createProject);
router.put("/:id", checkAuth, ProjectCtrl.updateProject);
router.delete("/:id", checkAuth, ProjectCtrl.deleteProject);

module.exports = router;
