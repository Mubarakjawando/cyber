const { getRecentFailures } = require('../db/logModel');
const config = require('../config/env');

/**
 * Evaluates risk based on rolling-window failed login count,
 * per Chapter 3.5: successive failures increase risk; crossing
 * LOW_RISK_THRESHOLD triggers detention, HIGH_RISK_THRESHOLD triggers prevention.
 */
function evaluateRisk({ ipAddress, username }) {
  const failCount = getRecentFailures({
    ipAddress,
    username,
    windowMinutes: config.riskWindowMinutes
  });

  let decision = 'allow';
  if (failCount >= config.highRiskThreshold) {
    decision = 'prevent';
  } else if (failCount >= config.lowRiskThreshold) {
    decision = 'detain';
  }

  return {
    failCount,
    decision,
    riskScore: failCount // simple 1:1 mapping for now; can be weighted later
  };
}

module.exports = { evaluateRisk };
