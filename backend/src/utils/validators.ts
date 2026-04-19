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
    .withMessage(
      'Password must contain uppercase, lowercase, number and special character'
    ),

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

  body('phone')
    .optional({ values: 'falsy' })
    .trim()
    .isLength({ min: 8, max: 30 })
    .withMessage('Phone number must be between 8 and 30 characters'),

  body('companyName')
    .optional({ values: 'falsy' })
    .trim()
    .isLength({ min: 2, max: 180 })
    .withMessage('Company name must be between 2 and 180 characters'),

  body('primaryCategoryId')
    .optional({ values: 'falsy' })
    .isUUID()
    .withMessage('Primary category must be a valid id'),

  body('region')
    .optional({ values: 'falsy' })
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Region must be between 2 and 100 characters'),

  body('wilaya')
    .optional({ values: 'falsy' })
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Wilaya must be between 2 and 100 characters'),

  body('city')
    .optional({ values: 'falsy' })
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('City must be between 2 and 100 characters'),

  body('yearsOfExperience')
    .optional({ values: 'falsy' })
    .isInt({ min: 0, max: 80 })
    .withMessage('Years of experience must be between 0 and 80'),

  body('description')
    .optional({ values: 'falsy' })
    .trim()
    .isLength({ max: 2500 })
    .withMessage('Description must be 2500 characters or less'),

  body('serviceCoverageMode')
    .optional({ values: 'falsy' })
    .isIn(['wilaya_only', 'regional', 'nationwide'])
    .withMessage('Service coverage mode is invalid'),

  body('serviceCoverageRegions')
    .optional()
    .isArray()
    .withMessage('Service coverage regions must be an array'),

  body('acceptTerms')
    .custom((value) => value === true || value === 'true')
    .withMessage('You must accept the terms and conditions'),
];

export const validateLogin = () => [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),

  body('password').notEmpty().withMessage('Password is required'),
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
    res.status(400).json({
      status: 'error',
      message: 'Validation failed',
      errors: errors.array(),
    });
    return;
  }

  next();
};
