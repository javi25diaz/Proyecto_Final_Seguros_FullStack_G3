const { body, param } = require('express-validator');

const TYPES = ['policy', 'payment', 'incident', 'claim', 'system'];

const createNotificationValidator = [
  body('message').trim().notEmpty().withMessage('El mensaje es obligatorio'),
  body('type').isIn(TYPES).withMessage('Tipo de notificación inválido'),
  body('recipientUser').optional().isMongoId().withMessage('Usuario destinatario inválido'),
  body('client').optional().isMongoId().withMessage('Cliente destinatario inválido'),
  body('relatedEntityType').optional().isIn(['Policy', 'Payment', 'Incident', 'Claim', 'User']).withMessage('Tipo de entidad relacionada inválido'),
  body('relatedEntityId').optional().isMongoId().withMessage('Identificador de entidad relacionada inválido'),
  body().custom((value) => {
    if (!value.recipientUser && !value.client) {
      throw new Error('Debe indicar al menos un destinatario (usuario o cliente)');
    }
    return true;
  })
];

const updateNotificationValidator = [
  param('id').isMongoId().withMessage('Identificador inválido'),
  body('message').optional().trim().notEmpty().withMessage('El mensaje es obligatorio'),
  body('isRead').optional().isBoolean().withMessage('isRead debe ser booleano')
];

const idParamValidator = [param('id').isMongoId().withMessage('Identificador inválido')];

module.exports = { createNotificationValidator, updateNotificationValidator, idParamValidator };
