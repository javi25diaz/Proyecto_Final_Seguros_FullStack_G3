const { body, param } = require('express-validator');
const { passwordRules } = require('./auth.validator');

const createUserValidator = [
  body('name').trim().isLength({ min: 2, max: 100 }).withMessage('El nombre debe tener entre 2 y 100 caracteres'),
  body('email').trim().isEmail().withMessage('Debe proporcionar un email válido').normalizeEmail(),
  passwordRules,
  body('role').optional().isIn(['guest', 'user', 'admin']).withMessage('Rol inválido'),
  body('status').optional().isIn(['active', 'inactive']).withMessage('Estado inválido')
];

const updateUserValidator = [
  param('id').isMongoId().withMessage('Identificador inválido'),
  body('name').optional().trim().isLength({ min: 2, max: 100 }).withMessage('El nombre debe tener entre 2 y 100 caracteres'),
  body('email').optional().trim().isEmail().withMessage('Debe proporcionar un email válido').normalizeEmail(),
  body('password').optional().isLength({ min: 8 }).withMessage('La contraseña debe tener al menos 8 caracteres')
    .if(body('password').notEmpty())
    .matches(/[A-Z]/).withMessage('La contraseña debe contener al menos una mayúscula')
    .matches(/[a-z]/).withMessage('La contraseña debe contener al menos una minúscula')
    .matches(/[0-9]/).withMessage('La contraseña debe contener al menos un número')
    .matches(/[^A-Za-z0-9]/).withMessage('La contraseña debe contener al menos un carácter especial'),
  body('role').optional().isIn(['guest', 'user', 'admin']).withMessage('Rol inválido'),
  body('status').optional().isIn(['active', 'inactive']).withMessage('Estado inválido')
];

const idParamValidator = [param('id').isMongoId().withMessage('Identificador inválido')];

const reassignUserValidator = [
  body('replacementUserId').isMongoId().withMessage('Identificador inválido')
];

module.exports = { createUserValidator, updateUserValidator, idParamValidator, reassignUserValidator };
