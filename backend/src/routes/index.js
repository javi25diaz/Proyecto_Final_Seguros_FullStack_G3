const { Router } = require('express');

const healthRoutes = require('./health.routes');
const authRoutes = require('./auth.routes');
const userRoutes = require('./user.routes');
const clientRoutes = require('./client.routes');
const policyRoutes = require('./policy.routes');
const paymentRoutes = require('./payment.routes');
const incidentRoutes = require('./incident.routes');
const claimRoutes = require('./claim.routes');
const notificationRoutes = require('./notification.routes');
const dashboardRoutes = require('./dashboard.routes');

const router = Router();

router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/clients', clientRoutes);
router.use('/policies', policyRoutes);
router.use('/payments', paymentRoutes);
router.use('/incidents', incidentRoutes);
router.use('/claims', claimRoutes);
router.use('/notifications', notificationRoutes);
router.use('/dashboard', dashboardRoutes);

module.exports = router;
