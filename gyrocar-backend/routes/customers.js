const express = require('express');
const router = express.Router();

const customerController = require('../controllers/customerController');
const customerPaymentController = require('../controllers/customerPaymentController');

router.get('/:customer_id/payments', customerPaymentController.getCustomerPayments);

router.get('/:customer_id', customerController.getCustomer);
router.get('/', customerController.getCustomers)
router.post('/', customerController.createCustomer);
router.patch('/:customer_id', customerController.updateCustomer);
router.delete('/:customer_id', customerController.deleteCustomer);


module.exports = router;