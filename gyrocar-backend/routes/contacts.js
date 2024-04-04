const express = require('express');
const contactController = require('../controllers/contactController');
const router = express.Router();

router.post('/createContacts', contactController.createContacts);

module.exports = router;