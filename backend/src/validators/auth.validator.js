const { body } = require('express-validator');

const passwordRules = body('password')
  .isLength({ min: 8 })
  .withMessage('La contraseña debe tener al menos 8 caracteres')
  .matches(/[A-Z]/)
  .withMessage('La contraseña debe contener al menos una mayúscula')
  .matches(/[a-z]/)
  .withMessage('La contraseña debe contener al menos una minúscula')
  .matches(/[0-9]/)
  .withMessage('La contraseña debe contener al menos un número')
  .matches(/[^A-Za-z0-9]/)
  .withMessage('La contraseña debe contener al menos un carácter especial');

const registerValidator = [
  body('name').trim().isLength({ min: 2, max: 100 }).withMessage('El nombre debe tener entre 2 y 100 caracteres'),
  body('email').trim().isEmail().withMessage('Debe proporcionar un email válido').normalizeEmail(),
  passwordRules
];

const loginValidator = [
  body('email').trim().isEmail().withMessage('Debe proporcionar un email válido').normalizeEmail(),
  body('password').notEmpty().withMessage('La contraseña es obligatoria')
];

module.exports = { registerValidator, loginValidator, passwordRules };
