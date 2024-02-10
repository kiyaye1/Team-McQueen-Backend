const express = require('express');
const router = express.Router();

const stationController = require('../controllers/stationController');

router.get('/:station_id', stationController.getSingleStation);
router.get('/', stationController.getStations);
/*router.post('/', stationController.createStation);
router.patch('/:station_id', stationController.updateStation);
router.delete('/:station_id', stationController.deleteStation);*/


module.exports = router;