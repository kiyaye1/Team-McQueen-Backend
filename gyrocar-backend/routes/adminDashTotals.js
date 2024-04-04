const express = require('express')
const adminDashController = require('../controllers/adminDashController')
const router = express.Router()

//call the different route methods
router.get('/employees', adminDashController.getTotalNumOfEmployees)
router.get('/customers', adminDashController.getTotalNumOfCustomers)
router.get('/cars', adminDashController.getTotalNumOfCars)
router.get('/stations', adminDashController.getTotalNumOfStations)

module.exports = router