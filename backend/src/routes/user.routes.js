const { Router } = require('express');
const userController = require('../controllers/user.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const requireRole = require('../middlewares/role.middleware');
const validate = require('../middlewares/validate.middleware');
const { createUserValidator, updateUserValidator, idParamValidator } = require('../validators/user.validator');

const router = Router();

router.use(authMiddleware, requireRole('admin'));

router.get('/', userController.list);
router.post('/', createUserValidator, validate, userController.create);
router.get('/:id', idParamValidator, validate, userController.getById);
router.put('/:id', updateUserValidator, validate, userController.update);
router.delete('/:id', idParamValidator, validate, userController.remove);

module.exports = router;
