const { body, param } = require('express-validator');

const STATUSES = ['reported', 'under_review', 'closed'];

const createIncidentValidator = [
  body('policy').isMongoId().withMessage('Debe indicar una póliza válida'),
  body('description').trim().notEmpty().withMessage('La descripción es obligatoria'),
  body('eventDate').isISO8601().withMessage('Fecha del evento inválida').toDate(),
  body('evidenceUrl').optional({ checkFalsy: true }).isURL().withMessage('La URL de evidencia no es válida'),
  body('status').optional().isIn(STATUSES).withMessage('Estado inválido')
];

const updateIncidentValidator = [
  param('id').isMongoId().withMessage('Identificador inválido'),
  body('description').optional().trim().notEmpty().withMessage('La descripción es obligatoria'),
  body('eventDate').optional().isISO8601().withMessage('Fecha del evento inválida').toDate(),
  body('evidenceUrl').optional({ checkFalsy: true }).isURL().withMessage('La URL de evidencia no es válida'),
  body('status').optional().isIn(STATUSES).withMessage('Estado inválido')
];

const statusValidator = [
  param('id').isMongoId().withMessage('Identificador inválido'),
  body('status').isIn(STATUSES).withMessage('Estado inválido')
];

const idParamValidator = [param('id').isMongoId().withMessage('Identificador inválido')];

module.exports = { createIncidentValidator, updateIncidentValidator, statusValidator, idParamValidator };
