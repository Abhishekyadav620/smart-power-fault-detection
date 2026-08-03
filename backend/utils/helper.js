const isNonEmptyString = (value) => {
  return typeof value === "string" && value.trim().length > 0;
};

const normalizeOptionalString = (value) => {
  if (!isNonEmptyString(value)) {
    return null;
  }

  return value.trim();
};

module.exports = {
  isNonEmptyString,
  normalizeOptionalString,
};