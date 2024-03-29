const express = require('express');
const router = express.Router();

const reservationController = require('../controllers/reservationController');

router.post('/availability', reservationController.getAvailableReservations)
router.get('/:reservation_id', reservationController.getReservation);
router.get('/', reservationController.getReservations)
router.post('/', reservationController.createReservation);
router.patch('/:reservation_id', reservationController.updateReservation);
router.delete('/:reservation_id', reservationController.deleteReservation);


module.exports = router;