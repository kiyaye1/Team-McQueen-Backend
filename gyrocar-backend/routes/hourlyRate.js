const express = require('express');
const hourlyRateController = require('../controllers/hourlyRateController');
const router = express.Router();


router.post('/', hourlyRateController.addHourlyRate);
router.get('/', hourlyRateController.getAllHourlyRates);
router.get('/current', hourlyRateController.getCurrentHourlyRate);

module.exports = router;