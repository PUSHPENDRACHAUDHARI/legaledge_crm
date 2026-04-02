export const REQUIRED_ERROR = 'This field is required';
export const PHONE_ERROR = 'Enter valid 10 digit number';

export const sanitizePhone = (value = '') => {
  const digits = value.replace(/\D/g, '');
  return digits.length > 10 ? digits.slice(-10) : digits;
};

export const sanitizeDigits = (value = '') => value.replace(/\D/g, '');

export const sanitizePercentage = (value = '') => {
  const digits = sanitizeDigits(value);
  if (!digits) return '';
  return String(Math.min(100, parseInt(digits, 10)));
};

export const isValidPhone = (value = '') => /^\d{10}$/.test(value);

export const isValidEmail = (value = '') => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());

export const required = (value) => String(value ?? '').trim().length > 0;
