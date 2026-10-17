export function notFound(req, res) {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });
}

export function errorHandler(error, req, res, next) {
  if (res.headersSent) return next(error);

  if (error?.name === 'ValidationError') {
    const details = Object.values(error.errors || {}).map((item) => item.message);
    return res.status(400).json({ message: 'Please check the submitted fields.', details });
  }

  if (error?.name === 'CastError') {
    return res.status(400).json({ message: 'Invalid record ID.' });
  }

  if (error?.code === 11000) {
    return res.status(409).json({ message: 'A record with this unique value already exists.' });
  }

  console.error(error);
  const status = Number.isInteger(error.status) ? error.status : 500;
  const message = status >= 500 && process.env.NODE_ENV === 'production'
    ? 'An unexpected server error occurred.'
    : (error.message || 'An unexpected server error occurred.');

  return res.status(status).json({ message });
}
