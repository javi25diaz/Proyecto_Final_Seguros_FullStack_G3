const { Router } = require('express');
const paymentController = require('../controllers/payment.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const requireRole = require('../middlewares/role.middleware');
const validate = require('../middlewares/validate.middleware');
const { createPaymentValidator, updatePaymentValidator, idParamValidator } = require('../validators/payment.validator');

const router = Router();

router.use(authMiddleware, requireRole('user', 'admin'));

router.get('/', paymentController.list);
router.post('/', createPaymentValidator, validate, paymentController.create);
router.get('/:id', idParamValidator, validate, paymentController.getById);
router.put('/:id', updatePaymentValidator, validate, paymentController.update);
router.delete('/:id', idParamValidator, validate, paymentController.remove);

module.exports = router;
