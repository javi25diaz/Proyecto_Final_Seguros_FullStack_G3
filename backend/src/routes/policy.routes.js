const { Router } = require('express');
const policyController = require('../controllers/policy.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const requireRole = require('../middlewares/role.middleware');
const validate = require('../middlewares/validate.middleware');
const { createPolicyValidator, updatePolicyValidator, idParamValidator } = require('../validators/policy.validator');

const router = Router();

router.use(authMiddleware, requireRole('user', 'admin'));

router.get('/', policyController.list);
router.post('/', createPolicyValidator, validate, policyController.create);
router.get('/:id', idParamValidator, validate, policyController.getById);
router.put('/:id', updatePolicyValidator, validate, policyController.update);
router.delete('/:id', idParamValidator, validate, policyController.remove);

module.exports = router;
