const express = require('express');
const contactController = require('../controllers/contactController');
const router = express.Router();

router.post('/createContacts', contactController.createContacts);
router.get('/getCustomerContacts', contactController.getCustomerContacts);
router.post('/updateTicketStatus', contactController.updateTicketStatus);

router.get('/MechanicRequests', contactController.getMechanicRequests);
router.post('/MechanicRequests', contactController.createMechanicRequests);
router.patch('/MechanicRequests', contactController.updateMechanicRequests);

module.exports = router;