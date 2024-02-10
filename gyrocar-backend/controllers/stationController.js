const dayjs = require('dayjs');
var utc = require('dayjs/plugin/utc')
dayjs.extend(utc)

const validator = require('validator');

const db = require('../database');

const METERS_IN_MILE = 1609.344;

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

function getStations(req, res) {
    
    const baseStmt = db.select(stationFields).from('Station');
    
    const coordinates = req.body['coordinates'];
    

    // if coordinates have been specified
    if (coordinates) {
        if (!coordinates['lat'] && !coordinates['lng']) {
            return res.status(400).send("Incoorect coordinate format");
        }
        let lat = req.body['coordinates']['lat'];
        let lng = req.body['coordinates']['lng'];

        // if the latitude/longitude values are not numeric values
        // try to convert them from strings to numbers
        if (typeof lat != "number") {
            if (validator.isNumeric(lat)) {
                lat = Number(lat);
            }
        }
        if (typeof lng != "number") {
            if (validator.isNumeric(lng)) {
                lng = Number(lng);
            }
        } 

        let radius = req.body['radius'];
        if (!radius && validator.isNumeric(radius)) {
            return res.status.send("Bad request: No radius specified in request body");
        }    

        radius_meters = Number(radius) * METERS_IN_MILE;


        return baseStmt.whereRaw('ST_Distance_Sphere(coordinates, point(?, ?)) < ?', [lat, lng, radius_meters])
            .then(function(result) {
                res.json(result);
            }).catch(function(err) {
                res.status(500).send();
            });
    }

    // if no filter is applied, get all stations
    baseStmt.then(function(result) {
        res.json(result);
    }).catch(function(err) {
        res.status(500).send();
    });

}

module.exports = {getSingleStation, getStations};