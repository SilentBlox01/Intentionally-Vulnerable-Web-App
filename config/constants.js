/**
 * Application constants and default values.
 * These are non-secret configuration values used throughout the app.
 */

module.exports = {
  // Pagination / list limits
  MAX_TRANSACTIONS_LIST: 50,
  MAX_AUDIT_LOG: 100,
  MAX_API_RESULTS: 200,
  MAX_DOCUMENTS_LIST: 50,
  MAX_UPLOADS_LIST: 50,
  MAX_SEARCH_RESULTS: 50,

  // Backup
  BACKUP_INTERVAL_MS: 60000,
  BACKUP_INITIAL_DELAY_MS: 2000,

  // Session
  SESSION_MAX_AGE_MS: 86400000 * 7,

  // Account
  DEFAULT_BALANCE: 1000.00,

  // Transaction limits
  MIN_TRANSFER_AMOUNT: 0.01,
  MAX_TRANSFER_AMOUNT: 1000000.00,

  // Password rules
  MIN_PASSWORD_LENGTH: 6,
  MAX_PASSWORD_LENGTH: 128,

  // Username rules
  MIN_USERNAME_LENGTH: 3,
  MAX_USERNAME_LENGTH: 30,
  USERNAME_PATTERN: /^[a-zA-Z0-9_]+$/,

  // Upload limits
  MAX_FILE_SIZE_BYTES: 10 * 1024 * 1024,
  ALLOWED_UPLOAD_TYPES: [
    'image/jpeg', 'image/png', 'image/gif', 'image/webp',
    'application/pdf',
    'text/plain', 'text/csv',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]
};
