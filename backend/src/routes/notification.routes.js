const { Router } = require('express');
const notificationController = require('../controllers/notification.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const requireRole = require('../middlewares/role.middleware');
const validate = require('../middlewares/validate.middleware');
const { createNotificationValidator, updateNotificationValidator, idParamValidator } = require('../validators/notification.validator');

const router = Router();

router.use(authMiddleware, requireRole('user', 'admin'));

router.get('/', notificationController.list);
router.post('/', requireRole('admin'), createNotificationValidator, validate, notificationController.create);
router.get('/:id', idParamValidator, validate, notificationController.getById);
router.put('/:id', requireRole('admin'), updateNotificationValidator, validate, notificationController.update);
router.patch('/:id/read', idParamValidator, validate, notificationController.markAsRead);
router.delete('/:id', idParamValidator, validate, notificationController.remove);

module.exports = router;
