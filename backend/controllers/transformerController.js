const Transformer = require("../models/Transformer");

// GET /api/transformers
const getAllTransformers = async (req, res) => {
  try {

    const transformers = await Transformer.find();

    res.status(200).json({
      success: true,
      count: transformers.length,
      data: transformers,
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// GET /api/transformers/:id
const getTransformerById = async (req, res) => {
  try {

    const transformer = await Transformer.findOne({
      transformerId: req.params.id,
    });

    if (!transformer) {
      return res.status(404).json({
        success: false,
        message: "Transformer not found",
      });
    }

    res.status(200).json({
      success: true,
      data: transformer,
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  getAllTransformers,
  getTransformerById,
};