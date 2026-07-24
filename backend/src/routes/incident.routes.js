const { Router } = require('express');
const incidentController = require('../controllers/incident.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const requireRole = require('../middlewares/role.middleware');
const validate = require('../middlewares/validate.middleware');
const { createIncidentValidator, updateIncidentValidator, statusValidator, idParamValidator } = require('../validators/incident.validator');

const router = Router();

router.use(authMiddleware, requireRole('user', 'admin'));

router.get('/', incidentController.list);
router.post('/', createIncidentValidator, validate, incidentController.create);
router.get('/:id', idParamValidator, validate, incidentController.getById);
router.put('/:id', updateIncidentValidator, validate, incidentController.update);
router.patch('/:id/status', statusValidator, validate, incidentController.changeStatus);
router.delete('/:id', idParamValidator, validate, incidentController.remove);

module.exports = router;
