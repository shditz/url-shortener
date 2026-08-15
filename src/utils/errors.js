export class AppError extends Error {
  /**
   * @param {string} code 
   * @param {string} message 
   * @param {number} statusCode 
   */
  constructor(code, message, statusCode = 400) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.statusCode = statusCode;
  }
}

export class ValidationError extends AppError {
  constructor(message, code = 'VALIDATION_ERROR') {
    super(code, message, 400);
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Short URL not found', code = 'URL_NOT_FOUND') {
    super(code, message, 404);
    this.name = 'NotFoundError';
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Custom alias is already in use', code = 'ALIAS_ALREADY_EXISTS') {
    super(code, message, 409);
    this.name = 'ConflictError';
  }
}

export class ExpiredError extends AppError {
  constructor(message = 'This short URL has expired', code = 'URL_EXPIRED') {
    super(code, message, 410);
    this.name = 'ExpiredError';
  }
}
