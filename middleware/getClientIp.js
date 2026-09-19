function getClientIp(req) {
  // req.ip respects 'trust proxy' setting; falls back to socket address
  return req.ip || req.socket.remoteAddress || 'unknown';
}

module.exports = getClientIp;
