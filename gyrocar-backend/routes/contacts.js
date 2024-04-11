const express = require('express');
const contactController = require('../controllers/contactController');
const router = express.Router();

router.post('/createContacts', contactController.createContacts);
router.get('/getContacts', contactController.getContacts);
router.post('/updateTicketStatus', contactController.updateTicketStatus);

module.exports = router;