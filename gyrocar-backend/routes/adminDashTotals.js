const express = require('express')
const adminDashController = require('../controllers/adminDashController')
const router = express.Router()

//call the different route methods
router.get('/employees', adminDashController.getTotalNumOfEmployees)
router.get('/customers', adminDashController.getTotalNumOfCustomers)
router.get('/customers/new', adminDashController.getNumOfNewCustomers)
router.get('/customers/completed', adminDashController.getNumOfRDYCustomers)
router.get('/service-requests/new', adminDashController.getNumOfNewServiceRequests)
router.get('/service-requests/in-progress', adminDashController.getNumOfInProgressServiceRequests)
router.get('/service-requests/completed', adminDashController.getNumOfCompletedServiceRequests)
router.get('/customer-inquiries/new', adminDashController.getNumOfNewInquiries)
router.get('/customer-inquiries/in-progress', adminDashController.getNumOfInProgressInquiries)
router.get('/customer-inquiries/completed', adminDashController.getNumOfCompletedInquiries)
router.get('/cars', adminDashController.getTotalNumOfCars)
router.get('/stations', adminDashController.getTotalNumOfStations)

module.exports = router