const express = require('express');
const contactController = require('../controllers/contactController');
const router = express.Router();

router.post('/createContacts', contactController.createContacts);
router.get('/getCustomerContacts', contactController.getCustomerContacts);
router.get('/getMechanicContacts', contactController.getMechanicContacts);
router.post('/updateTicketStatus', contactController.updateTicketStatus);

module.exports = router;