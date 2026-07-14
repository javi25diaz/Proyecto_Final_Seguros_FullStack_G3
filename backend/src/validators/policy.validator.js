const { body, param } = require('express-validator');

const INSURANCE_TYPES = ['auto', 'home', 'life', 'health', 'travel', 'other'];
const STATUSES = ['draft', 'active', 'expired', 'cancelled'];

const createPolicyValidator = [
  body('client').isMongoId().withMessage('Debe indicar un cliente válido'),
  body('insuranceType').isIn(INSURANCE_TYPES).withMessage('Tipo de seguro inválido'),
  body('coverage').trim().notEmpty().withMessage('La cobertura es obligatoria'),
  body('premium').isFloat({ gt: 0 }).withMessage('La prima debe ser mayor que cero'),
  body('startDate').isISO8601().withMessage('Fecha de inicio inválida').toDate(),
  body('endDate').isISO8601().withMessage('Fecha final inválida').toDate(),
  body('status').optional().isIn(STATUSES).withMessage('Estado inválido'),
  body('assignedAgent').optional().isMongoId().withMessage('Agente responsable inválido'),
  body('notes').optional().trim()
];

const updatePolicyValidator = [
  param('id').isMongoId().withMessage('Identificador inválido'),
  body('insuranceType').optional().isIn(INSURANCE_TYPES).withMessage('Tipo de seguro inválido'),
  body('coverage').optional().trim().notEmpty().withMessage('La cobertura es obligatoria'),
  body('premium').optional().isFloat({ gt: 0 }).withMessage('La prima debe ser mayor que cero'),
  body('startDate').optional().isISO8601().withMessage('Fecha de inicio inválida').toDate(),
  body('endDate').optional().isISO8601().withMessage('Fecha final inválida').toDate(),
  body('status').optional().isIn(STATUSES).withMessage('Estado inválido'),
  body('assignedAgent').optional().isMongoId().withMessage('Agente responsable inválido'),
  body('notes').optional().trim()
];

const idParamValidator = [param('id').isMongoId().withMessage('Identificador inválido')];

module.exports = { createPolicyValidator, updatePolicyValidator, idParamValidator, INSURANCE_TYPES, STATUSES };
