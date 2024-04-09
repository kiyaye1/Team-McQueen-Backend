const express = require('express')
const rentalMetricsController = require('../controllers/rentalMetricsController')
const router = express.Router()

//call the route method
router.get('/', rentalMetricsController.getRentalTotal)

module.exports = router