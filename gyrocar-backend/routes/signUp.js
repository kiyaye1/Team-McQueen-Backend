const express = require('express')
const { signUp, updateWdl, postCCI } = require('../controllers/signupController')
const router = express.Router()

//call the different route methods
router.post('/', signUp)
router.put('/updateWdl/:customer_id', updateWdl)
router.post('/postcci/:customer_id', postCCI)

module.exports = router