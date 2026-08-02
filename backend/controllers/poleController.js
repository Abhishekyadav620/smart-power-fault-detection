const Pole = require("../models/Pole");
const getAllPoles = async (req, res) => {
  try {
    const poles = await Pole.find();

    res.status(200).json({
      success: true,
      count: poles.length,
      data: poles,
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
const getPoleById = async (req, res) => {
  try {

    const pole = await Pole.findOne({
      poleId: req.params.id,//The route contains a dynamic parameter (:id). Express stores its value in req.params.id, which we use to query the database.
    });

    if (!pole) {
      return res.status(404).json({
        success: false,
        message: "Pole not found",
      });
    }

    res.status(200).json({
      success: true,
      data: pole,
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  getAllPoles,
  getPoleById,
};