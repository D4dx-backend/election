// utils/errorHandler.js
// If you have a separate, dedicated error logging function (e.g., to write to a file/db),
// you would require it here from its own file.
// For example: const { logErrorToFile } = require('./logger'); 

const handleError = (err, req, res, next) => {
  console.error("Global Error Handler:", err.name, "-", err.message);
  // console.error("Stack:", err.stack); // You can uncomment this for more detail during development

  // Example of calling a dedicated logging function if you had one:
  // if (typeof logErrorToFile === "function") {
  //   logErrorToFile(req, err); 
  // }

  const statusCode = err.statusCode || 500;
  const isProduction = process.env.NODE_ENV === 'production';
  const responseError = {
    success: false,
    error: isProduction && statusCode === 500 ? "Internal Server Error" : err.message || "Something went wrong",
  };

  if (!isProduction) {
    responseError.stack = err.stack; // Optionally send stack in development
  }

  res.status(statusCode).json(responseError);
};

module.exports = { handleError };
