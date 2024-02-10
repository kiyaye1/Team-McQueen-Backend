const dayjs = require('dayjs');
var utc = require('dayjs/plugin/utc')
dayjs.extend(utc)

const validator = require('validator');

const db = require('../database');

const METERS_IN_MILE = 1609.344;

const stationFields = ['stationID', 'country', 'state', 'county', 'city', 'zip', 'coordinates', 'streetAddress'];

function renameCoordinates(obj) {
    // If the result has coordinate values
    // transform the values to latitude and longitude
    // instead of the database default of x and y
    if (obj["coordinates"] != null) {
        if (obj["coordinates"]["x"] && obj["coordinates"]["y"]) {
            obj["coordinates"]["lat"] = obj["coordinates"]["x"];
            obj["coordinates"]["lng"] = obj["coordinates"]["y"];

            delete obj["coordinates"]["x"];
            delete obj["coordinates"]["y"];
        }
    }
    return obj;
}

function getSingleStation(req, res) {
    const station_id = req.params["station_id"];
    if (!station_id) {
        res.status(400).send("Bad location_id requested");
    }

    if (!validator.isInt(station_id)) {
        res.status(400).send("Bad location_id requested");
    }

    db.select(stationFields)
        .from("Station")
        .where("stationID", station_id)
        .then(function (result) {
            if (result.length == 0) {
                return res
                    .status(404)
                    .send(`No station was found by the id ${station_id}`);
            }

            result = Object.assign({}, result[0]);
            result = renameCoordinates(result);

            res.json(result);
        })
        .catch(function (err) {
            res.status(500).send("Unexpected server error");
        });
}

function getStations(req, res) {
    let query = db.select(stationFields).from("Station");

    const coordinates = req.body["coordinates"];

    // if coordinates have been specified
    // use one of the filters
    if (coordinates) {
        if (!coordinates["lat"] && !coordinates["lng"]) {
            return res.status(400).send("Incoorect coordinate format");
        }
        let lat = req.body["coordinates"]["lat"];
        let lng = req.body["coordinates"]["lng"];

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

        let radius = req.body["radius"];
        let numClosestStations = req.body["topN"];
        // if neither a radius nor a number of closest stations
        // is supplied then the request cannot continue
        if (!radius && !numClosestStations) {
            return res.status(400).send("Bad Request: coordinates were supplied \
                but no query specifier");
        }

        // if a radius has been specified
        // validate it and it to the query
        if (radius) {
            if (typeof radius != "number" && !validator.isNumeric(radius)) {
                return res.status(400).send("Bad Request: invalid radius given, it should a numerical value");
            }
            radius = Number(radius);        

            radius_meters = Number(radius) * METERS_IN_MILE;

            query = query.whereRaw("ST_Distance_Sphere(coordinates, point(?, ?)) < ?", [lat, lng, radius_meters]);
        }

        // if a top number of closest stations has been specified
        // add it to the query
        if (numClosestStations) {
            if (typeof numClosestStations != "number" && !validator.isNumeric(numClosestStations)) {
                return res.status(400).send("Bad Request: invalid topN given, it should a numerical value");
            }
            numClosestStations = Number(numClosestStations);

            // limit the number of rows output
            // it will be ordered by distance before the limit
            // is applied so this will function properly
            query = query.limit(numClosestStations);
        }

        // sort the output by closest station first
        // and get the distance in miles to that station
        query.select(db.raw('ST_Distance_Sphere(coordinates, point(?, ?)) / ? AS \'distanceInMiles\'', [lat, lng, METERS_IN_MILE]))
            .orderByRaw("ST_Distance_Sphere(coordinates, point(?, ?)) ASC", [lat, lng]).then(function (result) {
                result = Object.assign([], result).map(renameCoordinates);
                return res.json(result);
            })
            .catch(function (err) {
                console.log(query.toSQL());
                return res.status(500).send("A server side error occurred");
            });
    }
    else {
        // if no filter is applied, get all stations
        query
            .then(function (result) {
                result = Object.assign([], result).map(renameCoordinates);
                return res.json(result);
            })
            .catch(function (err) {
                return res.status(500).send("A server side error occurred");
            });
    }
}

module.exports = { getSingleStation, getStations };