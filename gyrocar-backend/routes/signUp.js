const express = require('express')
const { signUp, updateWdl, postCCI } = require('../controllers/signupController')
const router = express.Router()

//call the different route methods
router.post('/signup', signUp)
router.put('/signup/updateWdl', updateWdl)
router.post('/signup/postcci', postCCI)

module.exports = router