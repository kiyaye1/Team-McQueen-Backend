const express = require('express');
const router = express.Router();

const db = require('../database');
const customerController = require('../controllers/customerController');

router.get('/:customer_id', customerController.getCustomers);
router.post('/', customerController.createCustomer);
router.patch('/:customer_id', customerController.updateCustomer);
router.delete('/:customer_id', customerController.deleteCustomer);


module.exports = router;