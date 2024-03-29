const express = require('express');
const router = express.Router();

const db = require('../database');
const loginInfoController = require('../controllers/loginInfoController');

router.get('/getInfo', loginInfoController.getInfo);



module.exports = router;