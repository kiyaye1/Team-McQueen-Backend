const express = require('express')
const { signUp, updateWdl, postCCI } = require('../controllers/signupController')
const router = express.Router()

//call the different route methods
router.post('/', signUp)
router.put('/updateWdl', updateWdl)
router.post('/postcci', postCCI)

module.exports = router