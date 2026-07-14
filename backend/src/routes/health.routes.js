const { Router } = require('express');

const router = Router();

router.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    service: 'InsureTech API',
    status: 'ok'
  });
});

module.exports = router;
