// backend/app/utils/validationHelpers.js

/**
 * Validates if a string is a valid UUID v4
 * @param {string} uuid - The UUID to validate
 * @returns {boolean} - True if valid UUID
 */
export const isValidUUID = (uuid) => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
};

/**
 * Validates if a date string is valid
 * @param {string} dateStr - Date string to validate
 * @returns {boolean} - True if valid date
 */
export const isValidDate = (dateStr) => {
  const date = new Date(dateStr);
  return date instanceof Date && !isNaN(date);
};

/**
 * Sanitizes and validates period label
 * @param {string} label - Period label to sanitize
 * @returns {string} - Sanitized label
 */
export const sanitizePeriodLabel = (label) => {
  if (!label) return '';
  return label.trim().replace(/[^\w\-\s]/g, '');
};

/**
 * Checks if a period is overdue based on expected date
 * @param {string} expectedAt - Expected date (YYYY-MM-DD)
 * @returns {boolean} - True if overdue
 */
export const isPeriodOverdue = (expectedAt) => {
  if (!expectedAt) return false;
  const today = new Date().toISOString().split('T')[0];
  return expectedAt < today;
};

/**
 * Formats a date to YYYY-MM-DD
 * @param {Date|string} date - Date to format
 * @returns {string} - Formatted date
 */
export const formatDate = (date) => {
  const d = new Date(date);
  return d.toISOString().split('T')[0];
};

/**
 * Calculates the number of days between two dates
 * @param {string} startDate - Start date (YYYY-MM-DD)
 * @param {string} endDate - End date (YYYY-MM-DD)
 * @returns {number} - Number of days
 */
export const daysBetween = (startDate, endDate) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.abs(end - start);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

/**
 * Validates if a string is a valid email
 * @param {string} email - Email to validate
 * @returns {boolean} - True if valid email
 */
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validates if a value is a positive integer
 * @param {any} value - Value to validate
 * @returns {boolean} - True if positive integer
 */
export const isPositiveInteger = (value) => {
  const num = Number(value);
  return Number.isInteger(num) && num > 0;
};

/**
 * Truncates a string to maximum length
 * @param {string} str - String to truncate
 * @param {number} maxLength - Maximum length
 * @returns {string} - Truncated string
 */
export const truncateString = (str, maxLength) => {
  if (!str || str.length <= maxLength) return str;
  return str.substring(0, maxLength - 3) + '...';
};

/**
 * Parses pagination parameters from query
 * @param {Object} query - Request query object
 * @returns {Object} - Pagination parameters
 */
export const parsePagination = (query) => {
  const page = Math.max(1, parseInt(query.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit) || 10));
  const offset = (page - 1) * limit;
  
  return { page, limit, offset };
};

/**
 * Parses sorting parameters from query
 * @param {Object} query - Request query object
 * @param {Array} allowedFields - Allowed sort fields
 * @param {string} defaultField - Default sort field
 * @returns {Object} - Sorting parameters
 */
export const parseSorting = (query, allowedFields, defaultField = 'created_at') => {
  const sort = allowedFields.includes(query.sort) ? query.sort : defaultField;
  const order = query.order?.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
  
  return { sort, order };
};

/**
 * Generates a random string
 * @param {number} length - Length of string
 * @returns {string} - Random string
 */
export const generateRandomString = (length = 10) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

export default {
  isValidUUID,
  isValidDate,
  sanitizePeriodLabel,
  isPeriodOverdue,
  formatDate,
  daysBetween,
  isValidEmail,
  isPositiveInteger,
  truncateString,
  parsePagination,
  parseSorting,
  generateRandomString
};