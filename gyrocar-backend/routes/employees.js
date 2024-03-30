const express = require('express')
const employeeController = require('../controllers/employeeController')
const router = express.Router()

//call the different route methods
router.get('/', employeeController.getEmployees)
router.get('/:employeeID', employeeController.getEmployee)
router.post('/', employeeController.postEmployee)
router.put('/:employeeID', employeeController.updateEmployee)
router.delete('/:employeeID', employeeController.deleteEmployee)

module.exports = router