const { body, param } = require('express-validator');

const createClientValidator = [
  body('name').trim().isLength({ min: 2, max: 150 }).withMessage('El nombre debe tener entre 2 y 150 caracteres'),
  body('identification').trim().notEmpty().withMessage('La identificación es obligatoria'),
  body('phone').trim().notEmpty().withMessage('El teléfono es obligatorio'),
  body('email').trim().isEmail().withMessage('Debe proporcionar un email válido').normalizeEmail(),
  body('address').trim().notEmpty().withMessage('La dirección es obligatoria'),
  body('status').optional().isIn(['active', 'inactive']).withMessage('Estado inválido'),
  body('assignedAgent').optional().isMongoId().withMessage('Agente responsable inválido'),
  body('notes').optional().trim()
];

const updateClientValidator = [
  param('id').isMongoId().withMessage('Identificador inválido'),
  body('name').optional().trim().isLength({ min: 2, max: 150 }).withMessage('El nombre debe tener entre 2 y 150 caracteres'),
  body('identification').optional().trim().notEmpty().withMessage('La identificación es obligatoria'),
  body('phone').optional().trim().notEmpty().withMessage('El teléfono es obligatorio'),
  body('email').optional().trim().isEmail().withMessage('Debe proporcionar un email válido').normalizeEmail(),
  body('address').optional().trim().notEmpty().withMessage('La dirección es obligatoria'),
  body('status').optional().isIn(['active', 'inactive']).withMessage('Estado inválido'),
  body('assignedAgent').optional().isMongoId().withMessage('Agente responsable inválido'),
  body('notes').optional().trim()
];

const idParamValidator = [param('id').isMongoId().withMessage('Identificador inválido')];

module.exports = { createClientValidator, updateClientValidator, idParamValidator };
