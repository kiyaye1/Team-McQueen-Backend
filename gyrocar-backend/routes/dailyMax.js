const express = require('express')
const dailyMaxController = require('../controllers/dailyMaxController')
const router = express.Router()

router.get('/', dailyMaxController.getDailyMax)
router.put('/', dailyMaxController.updateDailyMax)

module.exports = router