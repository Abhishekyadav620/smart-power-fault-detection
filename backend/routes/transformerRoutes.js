const express = require("express");

const router = express.Router();

const {
  getAllTransformers,
  getTransformerById,
} = require("../controllers/transformerController");

router.get("/", getAllTransformers);

router.get("/:id", getTransformerById);

module.exports = router;