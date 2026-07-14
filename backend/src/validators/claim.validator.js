const { body, param } = require('express-validator');

const STATUSES = ['received', 'under_analysis', 'approved', 'rejected'];

const createClaimValidator = [
  body('incident').isMongoId().withMessage('Debe indicar un siniestro válido'),
  body('claimDate').optional().isISO8601().withMessage('Fecha de reclamación inválida').toDate(),
  body('amountRequested').isFloat({ gt: 0 }).withMessage('El monto solicitado debe ser mayor que cero'),
  body('description').trim().notEmpty().withMessage('La descripción es obligatoria'),
  body('documentUrls').optional().isArray().withMessage('documentUrls debe ser una lista de URLs'),
  body('documentUrls.*').optional().isURL().withMessage('Cada documento debe ser una URL válida'),
  body('status').optional().isIn(STATUSES).withMessage('Estado inválido')
];

const updateClaimValidator = [
  param('id').isMongoId().withMessage('Identificador inválido'),
  body('amountRequested').optional().isFloat({ gt: 0 }).withMessage('El monto solicitado debe ser mayor que cero'),
  body('amountApproved').optional().isFloat({ min: 0 }).withMessage('El monto aprobado debe ser mayor o igual a cero'),
  body('description').optional().trim().notEmpty().withMessage('La descripción es obligatoria'),
  body('documentUrls').optional().isArray().withMessage('documentUrls debe ser una lista de URLs'),
  body('documentUrls.*').optional().isURL().withMessage('Cada documento debe ser una URL válida'),
  body('resolutionNotes').optional().trim(),
  body('status').optional().isIn(STATUSES).withMessage('Estado inválido')
];

const statusValidator = [
  param('id').isMongoId().withMessage('Identificador inválido'),
  body('status').isIn(STATUSES).withMessage('Estado inválido'),
  body('amountApproved').optional().isFloat({ min: 0 }).withMessage('El monto aprobado debe ser mayor o igual a cero'),
  body('resolutionNotes').optional().trim()
];

const idParamValidator = [param('id').isMongoId().withMessage('Identificador inválido')];

module.exports = { createClaimValidator, updateClaimValidator, statusValidator, idParamValidator };
