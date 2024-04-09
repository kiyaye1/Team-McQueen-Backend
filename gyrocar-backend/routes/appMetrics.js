const express = require('express')
const appMetricsController = require('../controllers/appMetricsController')
const router = express.Router()

//call the route method
router.post('/', appMetricsController.getAppTotal)

module.exports = router