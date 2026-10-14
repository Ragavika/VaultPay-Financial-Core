class AppError extends Error { constructor(status, message, code = 'ERROR') { super(message); this.status = status; this.code = code; } }
const forbidden = (message = 'You do not have permission to access this resource.') => new AppError(403, message, 'FORBIDDEN');
module.exports = { AppError, forbidden };
