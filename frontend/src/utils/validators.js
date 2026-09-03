/**
 * Simple email validation regex helper
 */
export function isValidEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(String(email).toLowerCase());
}

/**
 * Validate password requirements (minimum 6 characters)
 */
export function isValidPassword(password) {
  return typeof password === 'string' && password.length >= 6;
}

