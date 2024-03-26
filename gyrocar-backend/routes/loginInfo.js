const express = require('express');
const router = express.Router();

const db = require('../database');
const loginInfoController = require('../controllers/loginInfoController');

console.log("hi");
router.get('/getID', loginInfoController.getID);



module.exports = router;