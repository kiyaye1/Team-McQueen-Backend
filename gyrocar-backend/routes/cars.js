const express = require('express')
const contactController = require('../controllers/carController')
const router = express.Router()

//call the different route methods
router.get('/', contactController.getCars)
router.get('/:carID;', contactController.getCar)
router.post('/', contactController.postCar)
router.put('/:carID', contactController.updateCar)
router.delete('/:carID', contactController.deleteCar)

module.exports = router