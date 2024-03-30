const express = require('express')
const adminDashController = require('../controllers/adminDashController')
const router = express.Router()

//call the different route methods
router.get('/employees', adminDashController.getEmployeesTotal)
router.get('/customers', adminDashController.getCustomersTotal)

module.exports = router