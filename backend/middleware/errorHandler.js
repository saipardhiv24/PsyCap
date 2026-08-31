export function errorHandler(err, req, res, next) {
  console.error(err);
  const message = err.message || "Internal server error";
  const status = err.status || 500;
  res.status(status).json({ success: false, error: { message } });
}
