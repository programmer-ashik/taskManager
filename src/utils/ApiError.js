class ApiError extends Error {
  constructor(
    statusCode,
    message = "Somthing went Wrong",
    errors = [],
    statck = ""
  ) {
    super(message);
    this.statusCode = statusCode;
    this.errors = this.errors;
    this.data = null;
    this.success = false;
    this.message = message;
    if (statck) {
      this.statck = statck;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}
export { ApiError };
