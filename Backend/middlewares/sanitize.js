import sanitize from 'mongo-sanitize';

export const sanitizeRequest = (req, res, next) => {
  // Sanitize req.body
  if (req.body && typeof req.body === 'object') {
    for (const key in req.body) {
      req.body[key] = sanitize(req.body[key]);
    }
  }

  // Sanitize req.query
  if (req.query && typeof req.query === 'object') {
    for (const key in req.query) {
      req.query[key] = sanitize(req.query[key]);
    }
  }

  // Sanitize req.params
  if (req.params && typeof req.params === 'object') {
    for (const key in req.params) {
      req.params[key] = sanitize(req.params[key]);
    }
  }

  next();
};
