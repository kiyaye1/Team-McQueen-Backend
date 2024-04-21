const express = require('express');
const hourlyRateController = require('../controllers/hourlyRateController');
const router = express.Router();


router.post('/', hourlyRateController.addHourlyRate);

module.exports = router;