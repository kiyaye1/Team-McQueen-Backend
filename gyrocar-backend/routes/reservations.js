const express = require('express');
const router = express.Router();

const db = require('../database');
const reservationController = require('../controllers/reservationController');

router.get('/:customer_id', reservationController.getReservation);
router.get('/', reservationController.getReservations)
router.post('/', reservationController.createReservation);
router.patch('/:customer_id', reservationController.updateReservation);
router.delete('/:customer_id', reservationController.deleteReservation);


module.exports = router;