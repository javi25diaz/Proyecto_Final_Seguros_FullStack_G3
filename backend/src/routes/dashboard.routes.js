const { Router } = require('express');
const dashboardController = require('../controllers/dashboard.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const requireRole = require('../middlewares/role.middleware');

const router = Router();

router.use(authMiddleware, requireRole('user', 'admin'));

router.get('/summary', dashboardController.summary);
router.get('/recent-activity', requireRole('admin'), dashboardController.recentActivity);

module.exports = router;
