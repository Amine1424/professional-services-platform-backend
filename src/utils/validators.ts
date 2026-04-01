import { Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';

// Validation Rules
export const validateRegister = () => [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must contain uppercase, lowercase, number and special character'),
  body('confirmPassword')
    .custom((value, { req }) => value === req.body.password)
    .withMessage('Passwords do not match'),
  body('firstName')
    .trim()
    .notEmpty()
    .withMessage('First name is required')
    .isLength({ min: 2, max: 50 })
    .withMessage('First name must be between 2 and 50 characters'),
  body('lastName')
    .trim()
    .notEmpty()
    .withMessage('Last name is required')
    .isLength({ min: 2, max: 50 })
    .withMessage('Last name must be between 2 and 50 characters'),
  body('role')
    .isIn(['customer', 'service_provider'])
    .withMessage('Invalid role'),
  body('acceptTerms')
    .equals('true')
    .withMessage('You must accept the terms and conditions'),
];

export const validateLogin = () => [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
];

export const validateEmail = () => [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
];

export const validatePasswordReset = () => [
  body('newPassword')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long'),
  body('confirmPassword')
    .custom((value, { req }) => value === req.body.newPassword)
    .withMessage('Passwords do not match'),
];

// Validation Middleware
export const handleValidationErrors = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      status: 'error',
      message: 'Validation failed',
      errors: errors.array(),
    });
  }
  next();
};