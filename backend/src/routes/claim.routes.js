const { Router } = require('express');
const claimController = require('../controllers/claim.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const requireRole = require('../middlewares/role.middleware');
const validate = require('../middlewares/validate.middleware');
const { createClaimValidator, updateClaimValidator, statusValidator, idParamValidator } = require('../validators/claim.validator');

const router = Router();

router.use(authMiddleware, requireRole('user', 'admin'));

router.get('/', claimController.list);
router.post('/', createClaimValidator, validate, claimController.create);
router.get('/:id', idParamValidator, validate, claimController.getById);
router.put('/:id', updateClaimValidator, validate, claimController.update);
router.patch('/:id/status', statusValidator, validate, claimController.changeStatus);
router.delete('/:id', idParamValidator, validate, claimController.remove);

module.exports = router;
