class AppError extends Error {
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
        this.status = `${statusCode}`.startsWith("4") ? "fail" : "error";
        this.isOperational = true;
        Error.captureStackTrace(this, this.constructor);
    }
}

const handleCastErrorDB = (err) => {
    const message = `Invalid ID: ${err.value}. Please provide a valid ObjectId.`;
    return new AppError(message, 400);
};

const handleDuplicateKey = (err) => {
    const field = Object.keys(err.keyValue)[0];
    const value = err.keyValue[field];
    const message = `Duplicate field value: ${field} = '${value}' already exists in the database.`;
    return new AppError(message, 400);
};

const handleJWTError = () => new AppError("Invalid Token. Please log in again.", 401);

const handleTokenExpiredError = () => new AppError("Token has expired. Please log in again.", 401);

const handleValidationError = (err) => {
    const errors = Object.values(err.errors).map(el => el.message).join(", ");
    const message = `Validation Error: ${errors}`;
    return new AppError(message, 400);
};

const errorHandler = (err, req, res, next) => {
    console.error(err);
    let error = { ...err, message: err.message };

    if (err.name === "CastError") error = handleCastErrorDB(err);
    if (err.code === 11000) error = handleDuplicateKey(err);
    if (err.name === "JsonWebTokenError") error = handleJWTError();
    if (err.name === "TokenExpiredError") error = handleTokenExpiredError();
    if (err.name === "ValidationError") error = handleValidationError(err);

    res.status(error.statusCode || 500).json({
        status: error.status || "error",
        message: error.message || "Internal Server Error"
    });
};

const catchAsync = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};

export { AppError, errorHandler, catchAsync };