const jwt = require('jsonwebtoken');
const { AppError, forbidden } = require('../lib/errors');
function authenticate(config) { return (req, res, next) => { const value = req.headers.authorization; if (!value?.startsWith('Bearer ')) return next(new AppError(401, 'Authentication token is required.', 'UNAUTHORIZED')); try { req.user = jwt.verify(value.slice(7), config.jwtSecret, { algorithms: ['HS256'] }); next(); } catch { next(new AppError(401, 'Invalid or expired authentication token.', 'UNAUTHORIZED')); } }; }
function requireRole(...roles) { return (req, res, next) => roles.includes(req.user.role) ? next() : next(forbidden()); }
module.exports = { authenticate, requireRole };
