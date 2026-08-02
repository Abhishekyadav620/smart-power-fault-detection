const {simulatePowerFault,restoreNetwork,} = require("../services/simulatorService");
const simulateFault = async (req, res) => {
  try {
    const result = await simulatePowerFault(req.body);

    res.status(200).json({
      success: true,
      data: result,
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const restorePower = async (req, res) => {
  try {

    const result = await restoreNetwork();

    res.status(200).json({
      success: true,
      data: result,
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  simulateFault,
  restorePower,
};