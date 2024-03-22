const express = require('express');
const router = express.Router();

const db = require('../database');
const loginController = require('../controllers/loginController');

router.post('/loginRequest', loginController.loginRequest);



module.exports = router;