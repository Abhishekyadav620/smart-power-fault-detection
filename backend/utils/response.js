const sendSuccess = (res, statusCode, data, meta = {}) => {
  return res.status(statusCode).json({
    success: true,
    ...meta,
    data,
  });
};

const sendError = (res, statusCode, message, extra = {}) => {
  return res.status(statusCode).json({
    success: false,
    message,
    ...extra,
  });
};

module.exports = {
  sendSuccess,
  sendError,
};