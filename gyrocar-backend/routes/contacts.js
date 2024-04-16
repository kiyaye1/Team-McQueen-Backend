const express = require('express');
const contactController = require('../controllers/contactController');
const router = express.Router();

router.post('/createContacts', contactController.createContacts);
router.get('/getCustomerContacts', contactController.getCustomerContacts);
router.post('/updateTicketStatus', contactController.updateTicketStatus);
router.get('/getMechanicRequests', contactController.getMechanicRequests);
router.post('/createMechanicRequests', contactController.createMechanicRequests);
router.post('/updateMechanicRequests', contactController.updateMechanicRequests);

module.exports = router;