const dayjs = require('dayjs');
var utc = require('dayjs/plugin/utc')
dayjs.extend(utc)

const validator = require('validator');

const db = require('../database');


const stationFields = ['stationID', 'country', 'state', 'county', 'city', 'zip', 'coordinates', 'streetAddress'];

function getSingleStation(req, res) {
    const station_id = req.params['station_id'];
    if (!station_id) {
        res.status(400).send("Bad location_id requested");
    }

    if (!validator.isInt(station_id)) {
        res.status(400).send("Bad location_id requested");
    }

    db.select(stationFields).from('Station').where('stationID', station_id)
        .then(function(result) {
            if (result.length == 0) {
                return res.status(404).send(`No station was found by the id ${station_id}`)
            }

            result = Object.assign({}, result[0]);
            
            // If the result has coordinate values
            // transform the values to latitude and longitude
            // instead of the database default of x and y
            if (result['coordinates'] != null) {
                if (result['coordinates']['x'] && result['coordinates']['y']) {
                    result['coordinates']['lat'] = result['coordinates']['x'];
                    result['coordinates']['lng'] = result['coordinates']['y'];

                    delete result['coordinates']['x'];
                    delete result['coordinates']['y'];
                }
            }

            res.json(result);
        }).catch(function(err) {
            res.status(500).send('Unexpected server error');
        });
}

module.exports = {getSingleStation};