const { body, param } = require('express-validator');

const STATUSES = ['pending', 'paid', 'reversed'];
const METHODS = ['cash', 'card', 'transfer', 'other'];

const createPaymentValidator = [
  body('policy').isMongoId().withMessage('Debe indicar una póliza válida'),
  body('amount').isFloat({ gt: 0 }).withMessage('El monto debe ser mayor que cero'),
  body('paymentDate').isISO8601().withMessage('Fecha de pago inválida').toDate(),
  body('method').isIn(METHODS).withMessage('Método de pago inválido'),
  body('status').optional().isIn(STATUSES).withMessage('Estado inválido'),
  body('reference').optional().trim(),
  body('notes').optional().trim()
];

const updatePaymentValidator = [
  param('id').isMongoId().withMessage('Identificador inválido'),
  body('amount').optional().isFloat({ gt: 0 }).withMessage('El monto debe ser mayor que cero'),
  body('paymentDate').optional().isISO8601().withMessage('Fecha de pago inválida').toDate(),
  body('method').optional().isIn(METHODS).withMessage('Método de pago inválido'),
  body('status').optional().isIn(STATUSES).withMessage('Estado inválido'),
  body('reference').optional().trim(),
  body('notes').optional().trim()
];

const idParamValidator = [param('id').isMongoId().withMessage('Identificador inválido')];

module.exports = { createPaymentValidator, updatePaymentValidator, idParamValidator };
