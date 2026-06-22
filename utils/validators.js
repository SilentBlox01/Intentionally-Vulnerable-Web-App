/**
 * Input validation utilities.
 * Returns an object with { valid: boolean, errors: string[] }.
 */

const config = require('../config');

function validateRequired(fields, body) {
  const errors = [];
  for (const field of fields) {
    if (!body[field] || (typeof body[field] === 'string' && body[field].trim() === '')) {
      errors.push(`${field} is required`);
    }
  }
  return errors;
}

function validateEmail(email) {
  if (!email) return [];
  const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!pattern.test(email)) {
    return ['Invalid email format'];
  }
  return [];
}

function validateUsername(username) {
  if (!username) return [];
  const errors = [];
  if (username.length < config.MIN_USERNAME_LENGTH) {
    errors.push(`Username must be at least ${config.MIN_USERNAME_LENGTH} characters`);
  }
  if (username.length > config.MAX_USERNAME_LENGTH) {
    errors.push(`Username must be at most ${config.MAX_USERNAME_LENGTH} characters`);
  }
  if (config.USERNAME_PATTERN && !config.USERNAME_PATTERN.test(username)) {
    errors.push('Username can only contain letters, numbers, and underscores');
  }
  return errors;
}

function validatePassword(password) {
  if (!password) return [];
  const errors = [];
  if (password.length < config.MIN_PASSWORD_LENGTH) {
    errors.push(`Password must be at least ${config.MIN_PASSWORD_LENGTH} characters`);
  }
  if (password.length > config.MAX_PASSWORD_LENGTH) {
    errors.push(`Password must be at most ${config.MAX_PASSWORD_LENGTH} characters`);
  }
  return errors;
}

function validateAmount(amount, opts) {
  if (amount === undefined || amount === null || amount === '') return [];
  const errors = [];
  const num = parseFloat(amount);
  if (isNaN(num)) {
    errors.push('Amount must be a valid number');
  } else {
    if (num < (opts && opts.min !== undefined ? opts.min : config.MIN_TRANSFER_AMOUNT)) {
      errors.push(`Amount must be at least $${(opts && opts.min !== undefined ? opts.min : config.MIN_TRANSFER_AMOUNT).toFixed(2)}`);
    }
    if (num > (opts && opts.max !== undefined ? opts.max : config.MAX_TRANSFER_AMOUNT)) {
      errors.push(`Amount must be at most $${(opts && opts.max !== undefined ? opts.max : config.MAX_TRANSFER_AMOUNT).toFixed(2)}`);
    }
  }
  return errors;
}

function validateRegistration(body) {
  let errors = [];
  errors = errors.concat(validateRequired(['username', 'password', 'email', 'full_name'], body));
  errors = errors.concat(validateUsername(body.username));
  errors = errors.concat(validatePassword(body.password));
  errors = errors.concat(validateEmail(body.email));
  return { valid: errors.length === 0, errors };
}

function validateTransfer(body) {
  let errors = [];
  errors = errors.concat(validateRequired(['recipient_account', 'amount'], body));
  errors = errors.concat(validateAmount(body.amount));
  return { valid: errors.length === 0, errors };
}

function validateDocument(body) {
  let errors = [];
  errors = errors.concat(validateRequired(['title', 'content'], body));
  return { valid: errors.length === 0, errors };
}

function validateProfileUpdate(body) {
  let errors = [];
  errors = errors.concat(validateRequired(['full_name', 'email'], body));
  errors = errors.concat(validateEmail(body.email));
  return { valid: errors.length === 0, errors };
}

function validateTicket(body) {
  let errors = [];
  errors = errors.concat(validateRequired(['subject', 'message'], body));
  return { valid: errors.length === 0, errors };
}

module.exports = {
  validateRequired,
  validateEmail,
  validateUsername,
  validatePassword,
  validateAmount,
  validateRegistration,
  validateTransfer,
  validateDocument,
  validateProfileUpdate,
  validateTicket
};
