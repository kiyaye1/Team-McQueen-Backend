const express = require('express');
const approvalController = require('../controllers/approvalController');
const router = express.Router();

router.post('/send-approval-email', approvalController.sendApprovalEmail);

module.exports = router;