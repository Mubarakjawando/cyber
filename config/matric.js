// Matric number validation for student registration.
// Placeholder format: YY/69/NNNN (matches the pattern on MAPOLY documents,
// where 69 appears to be a department code and NNNN a serial number).
// Update MATRIC_REGEX below once the exact Computer Science range is confirmed.

const MATRIC_REGEX = /^\d{2}\/69\/\d{4}$/;

function isValidMatric(matric) {
  if (!matric) return false;
  return MATRIC_REGEX.test(matric.trim());
}

module.exports = { isValidMatric };
