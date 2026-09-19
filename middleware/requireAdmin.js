function requireAdmin(req, res, next) {
  if (!req.session.userId) {
    return res.redirect('/login');
  }
  if (req.session.role !== 'admin') {
    return res.status(403).send('Access denied. Administrator privileges required.');
  }
  next();
}

module.exports = requireAdmin;
