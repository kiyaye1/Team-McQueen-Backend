const express = require('express');
const contactController = require('../controllers/contactController');
const router = express.Router();

router.post('/createContacts', contactController.createContacts);
router.get('/getCustomerContacts', contactController.getContacts);
router.get('/getMechanicContacts', contactController.getContacts);
router.post('/updateTicketStatus', contactController.updateTicketStatus);

module.exports = router;