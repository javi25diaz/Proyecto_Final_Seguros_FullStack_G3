const { Router } = require('express');
const clientController = require('../controllers/client.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const requireRole = require('../middlewares/role.middleware');
const validate = require('../middlewares/validate.middleware');
const { createClientValidator, updateClientValidator, idParamValidator } = require('../validators/client.validator');

const router = Router();

router.use(authMiddleware, requireRole('user', 'admin'));

router.get('/', clientController.list);
router.post('/', createClientValidator, validate, clientController.create);
router.get('/:id', idParamValidator, validate, clientController.getById);
router.get('/:id/history', idParamValidator, validate, clientController.getHistory);
router.put('/:id', updateClientValidator, validate, clientController.update);
router.delete('/:id', idParamValidator, validate, clientController.remove);

module.exports = router;
