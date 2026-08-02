const express = require("express");

const router = express.Router();

const {
  getAllPoles,
  getPoleById,
} = require("../controllers/poleController");

router.get("/", getAllPoles);

router.get("/:id", getPoleById);

module.exports = router;