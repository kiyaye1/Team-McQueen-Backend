const express = require('express');
const router = express.Router();

const db = require('../database');
const reservationController = require('../controllers/reservationController');

router.get('/:reservation_id', reservationController.getReservation);
router.get('/', reservationController.getReservations)
router.post('/', reservationController.createReservation);
router.patch('/:reservation_id', reservationController.updateReservation);
router.delete('/:reservation_id', reservationController.deleteReservation);


module.exports = router;