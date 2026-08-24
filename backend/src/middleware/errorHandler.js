// Алдааны төрлүүд
export class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

// Алдаа боловсруулах middleware
export const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log хийх
  console.error('Error:', err);

  // PostgreSQL алдаанууд
  if (err.code === '23505') {
    // Unique constraint violation
    error = new AppError('Энэ утга аль хэдийн бүртгэлтэй байна', 400);
  }

  if (err.code === '23503') {
    // Foreign key violation
    error = new AppError('Холбоотой өгөгдөл олдсонгүй', 404);
  }

  if (err.code === '22P02') {
    // Invalid input syntax
    error = new AppError('Буруу өгөгдлийн формат', 400);
  }

  // Validation алдаанууд
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(e => e.message).join(', ');
    error = new AppError(message, 400);
  }

  // JWT алдаанууд
  if (err.name === 'JsonWebTokenError') {
    error = new AppError('Буруу token', 401);
  }

  if (err.name === 'TokenExpiredError') {
    error = new AppError('Token-ий хугацаа дууссан', 401);
  }

  res.status(error.statusCode || 500).json({
    success: false,
    message: error.message || 'Серверийн алдаа',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

// 404 алдаа
export const notFound = (req, res, next) => {
  const error = new AppError(`Олдсонгүй - ${req.originalUrl}`, 404);
  next(error);
};
