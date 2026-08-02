const express = require("express");

const router = express.Router();

const {
  simulateFault,
  restorePower,
} = require("../controllers/simulatorController");

router.post("/fault", simulateFault);

router.post("/restore", restorePower);

module.exports = router;