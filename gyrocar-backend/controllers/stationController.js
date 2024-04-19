const dayjs = require('dayjs');
var utc = require('dayjs/plugin/utc')
dayjs.extend(utc)

const validator = require('validator');

const db = require('../database');

const METERS_IN_MILE = 1609.344;

const stationFields = ['stationID', 'country', 'state', 'county', 'city', 'zip', 'coordinates', 'streetAddress', 'name'];

function renameCoordinates(obj) {
    // If the result has coordinate values
    // transform the values to latitude and longitude
    // instead of the database default of x and y
    if (obj["coordinates"] != null) {
        if (obj["coordinates"]["x"] && obj["coordinates"]["y"]) {
            obj["coordinates"]["lng"] = obj["coordinates"]["x"];
            obj["coordinates"]["lat"] = obj["coordinates"]["y"];

            delete obj["coordinates"]["x"];
            delete obj["coordinates"]["y"];
        }
    }
    return obj;
}

async function getSingleStation(req, res) {
    let station_id = req.params["station_id"];
    if (!station_id) {
        res.status(400).send("Bad station_id requested");
    }

    if (!validator.isInt(station_id)) {
        res.status(400).send("Bad station_id requested");
    }
    station_id = Number(station_id);

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

async function getStations(req, res) {
    let query = db.select(stationFields).from("Station");

    const coordinates = req.body["coordinates"];

    // if coordinates have been specified
    // use one of the filters
    if (coordinates) {
        if (!coordinates["lat"] && !coordinates["lng"]) {
            return res.status(400).send("Incorrect coordinate format");
        }
        let lat = req.body["coordinates"]["lat"];
        let lng = req.body["coordinates"]["lng"];

        // if the latitude/longitude values are not numeric values
        // try to convert them from strings to numbers
        if (typeof lat == "string") {
            if (validator.isNumeric(lat)) {
                lat = Number(lat);
            }
        }
        if (typeof lng == "string") {
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
        // validate it and add it to the query
        if (radius) {
            if (typeof radius != "number" && !validator.isNumeric(radius)) {
                return res.status(400).send("Bad Request: invalid radius given, it should a numerical value");
            }
            radius = Number(radius);        

            radius_meters = Number(radius) * METERS_IN_MILE;

            query = query.whereRaw("ST_Distance_Sphere(coordinates, point(?, ?)) <= ?", [lat, lng, radius_meters]);
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

async function updateStation(req, res) {
    if (!(req.role == 1 || req.role == 2 || req.role == 4)) {
        return res.status(401).send("This user is not authorized to update a station");
    }

    let query = db('Station');
    let station_id = req.params["station_id"];

    // ensure station_id is present
    if (!station_id) {
        res.status(400).send("Bad station_id requested");
    }

    // check if value can be converted to number
    if (!validator.isInt(station_id)) {
        res.status(400).send("Bad station_id requested");
    }
    station_id = Number(station_id);

    // ensure the station record is exists in the db
    // before proceeding
    let stationFound = false;
    stationFound = await db.select('stationID').from('Station').where('stationID', station_id)
                        .then(function(result) {
                            if (result.length == 1) {
                                return true;
                            }
                            else {
                                res.status(404).send(`No station was found by the id: ${station_id}`);
                                return false;
                            }
                        }).catch(function(err) {
                            res.status(500).send("Unexpeted server side error occurred");
                        });
    if (stationFound == false) {
        return; // don't continue if station can't be found
    }

    // since station_id is valid, add it to the query
    query = query.where('stationID', station_id);
    
    // check to make sure all elements in
    // the request body are understood
    invalidFields = []
    Object.keys(req.body).forEach(field => {
        if (!stationFields.includes(field)) {
            invalidFields.push(field);
        }
    });
    if (invalidFields.length > 0) {
        return res.status(400).send("The following fields are invalid for this request: " + invalidFields.join(', ')
            + "\nNo data was changed.");
    }

    if (req.body['station_id']) delete req.body['stationID']; // editing the station_id is not allowed

    // put the coordinates in the proper format for MySQL
    if (req.body['coordinates']) {
        if (!req.body['coordinates']['lat'] || !req.body['coordinates']['lng']) {
            return res.status(400).send("Bad request: invalid format for coordinates. No data was changed");
        }
        if (typeof req.body['coordinates']['lat'] == "string") {
                if(!validator.isNumeric(req.body['coordinates']['lat'])) {
                    return res.status(400).send("Bad request: Latitude is incorrectly formatted. It must be a number");
            }
        }
        if (typeof req.body['coordinates']['lng'] == "string") {
            if (!validator.isNumeric(req.body['coordinates']['lng'])) {
                return res.status(400).send("Bad request: longitude is incorrectly formatted. It must be a number");
            }
        }
        let lat = Number(req.body['coordinates']['lat']);
        let lng = Number(req.body['coordinates']['lng']);

        req.body['coordinates'] = db.raw('POINT(?,?)', [lat, lng]); // add the new coordinate data to the query
    }

    // use the fields in the request body to
    // perform the update
    query.update(req.body)
        .then(function(result) {
            return res.send("Updated successfully");
        }).catch(function(err) {
            console.log(err);
            return res.status(500).send("Unexpected server side error");
        });
}

async function deleteStation(req, res) {
    if (!(req.role == 1 || req.role == 2 || req.role == 4)) {
        return res.status(401).send("This user is not authorized to update a station");
    }

    let station_id = req.params["station_id"];

    // ensure station_id is present
    if (!station_id) {
        res.status(400).send("Bad station_id requested");
    }

    // check if value can be converted to number 
    if (!validator.isInt(station_id)) {
        res.status(400).send("Bad station_id requested");
    }
    station_id = Number(station_id);

    // attempt to select the stationID to make
    // sure that it exists. It will exit 
    // if it doesn't find anything
    let stationFound = false;
    stationFound = await db.select('stationID').from('Station').where('stationID', station_id)
        .then(function (result) {
            if (result.length == 0) {
                res.status(404).send(`Station with id ${station_id} was not found`);
                return false;
            }
            else {
                return true;
            }
        }).catch(function (err) {
            return res.status(500).send("Unexpected server side error occurred");
        });

    // don't continue if the 
    if (stationFound == false) {
        return;
    }

    db.delete().from('Station').where('stationID', station_id).then(function (result) {
        res.status(200).send("Station deleted successfully");
    }).catch(function (err) {
        return res.status(500).send("Unexpected server side error occurred");
    });
}

async function createStation(req, res) {
    if (!(req.role == 1 || req.role == 2 || req.role == 4)) {
        return res.status(401).send("This user is not authorized to update a station");
    }

    let query = db.into('Station'); // set to table to insert into

    let coordinates = req.body['coordinates'];
    if (coordinates) {
        if (!coordinates['lat'] || !coordinates['lng']) {
            return res.status(400).send("Bad request: latitude and longitude values are not present or incorrecly named");
        }

        if (typeof coordinates['lat'] == "string" && !validator.isNumeric(coordinates['lat'])) {
            return res.staus(400).send("Bad request: latitude value is invalid. It should be a numerical value");
        }

        if (typeof coordinates['lng'] == "string" && !validator.isNumeric(coordinates['lng'])) {
            return res.staus(400).send("Bad request: longitude value is invalid. It should be a numerical value");
        }

        let lat = Number(coordinates['lat']);
        let lng = Number(coordinates['lng']);

        req.body['coordinates'] = db.raw('POINT(?,?)', [lat, lng]);
    }

    // check to make sure all elements in
    // the request body are understood
    invalidFields = []
    Object.keys(req.body).forEach(field => {
        if (!stationFields.includes(field)) {
            invalidFields.push(field);
        }
    });
    if (invalidFields.length > 0) {
        return res.status(400).send("The following fields are invalid for this request: " + invalidFields.join(', ')
            + "\nNo data was changed.");
    }

    query.insert(req.body).then(function (result) {
        let stationID = result[0]; // the resulting auto incremented station ID
        db.select(stationFields).from('Station').where('stationID', stationID) // retrieve the data back and return to client
            .then(function (result) {
                renameCoordinates(result[0]);
                return res.json(result[0]);
            }).catch(function (err) {
                return res.status(500).send("Unexpected server side error occurred");
            });
    }).catch(function (err) {
        return res.status(500).send("Unexpected server side error");
    });
}

module.exports = { getSingleStation, getStations, updateStation, deleteStation, createStation };