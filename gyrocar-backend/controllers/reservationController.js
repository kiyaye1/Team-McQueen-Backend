const db = require('../database');
const validator = require("validator");

const dayjs = require('dayjs');
var utc = require('dayjs/plugin/utc')
dayjs.extend(utc)

const customerFields = [
    "customerID", "firstName", "lastName", "middleInitial", "suffix",
    "username", "createdDatetime", "phoneNumber", "emailAddress", "phoneVerified", "emailVerified",
    "driversLicenseNum", "driversLicenseState", "CustomerStatus.statusCode",
    "CustomerStatus.shortDescription", "CustomerStatus.longDescription"
]

const reservationFields = ["reservationID", "startStationID", "endStationID", "carID", "scheduledStartDatetime",
    "customerID", "scheduledEndDatetime", "actualStartDatetime", "actualEndDatetime", "isComplete"];

const createReservationFields = ["startStationID", "endStationID", "carID", "scheduledStartDatetime",
    "customerID", "scheduledEndDatetime"];

// full list of fields needed for getting all reservation
// information with full column names with tables becuase
// of column name overlap between tables
const joinedReservationFields = [
    "reservationID", "scheduledStartDatetime", "scheduledEndDatetime", "actualStartDatetime", "actualEndDatetime", "isComplete", "StartStation.stationID AS StartStation.stationID",
    "StartStation.country AS StartStation.country", "StartStation.state AS StartStation.state", "StartStation.county AS StartStation.county", "StartStation.city AS StartStation.city", 
    "StartStation.zip AS StartStation.zip", "StartStation.coordinates AS StartStation.coordinates", "StartStation.streetAddress AS StartStation.streetAddress",
    "EndStation.stationID AS EndStation.stationID", "EndStation.country AS EndStation.country", "EndStation.state AS EndStation.state", "EndStation.county AS EndStation.county",
    "EndStation.city AS EndStation.city", "EndStation.zip AS EndStation.zip", "EndStation.coordinates AS EndStation.coordinates", "EndStation.streetAddress AS EndStation.streetAddress",
    "Customer.customerID AS Customer.customerID", "Customer.firstName AS Customer.firstName", "Customer.lastName AS Customer.lastName", "Customer.middleInitial AS Customer.middleInitial",
    "Customer.suffix AS Customer.suffix", "Customer.username AS Customer.username", "Customer.createdDatetime AS Customer.createdDatetime", "Customer.phoneNumber AS Customer.phoneNumber",
    "Customer.emailAddress AS Customer.emailAddress", "Customer.phoneVerified AS Customer.phoneVerified", "Customer.emailVerified AS Customer.emailVerified", "Car.CarID AS Car.CarID",
    "Car.installDatetime AS Car.installDatetime", "Car.statusCode AS Car.statusCode", "CustomerStatus.statusCode AS CustomerStatus.statusCode", 
    "CustomerStatus.shortDescription AS CustomerStatus.shortDescription", "CustomerStatus.longDescription AS CustomerStatus.longDescription", "CarModel.carModelID AS CarModel.carModelID",
    "CarModel.carModelName AS CarModel.carModelName", "CarModel.description AS CarModel.description", "CarStatus.statusCode AS CarStatus.statusCode",
    "CarStatus.shortDescription AS CarStatus.shortDescription", "CarStatus.longDescription AS CarStatus.longDescription",
];

// base query that contains all of the
// joined tables necessary
let baseFullQuery = db.select(joinedReservationFields).from('CarReservation')
    .leftJoin('Customer', 'Customer.customerID', 'CarReservation.customerID')
    .leftJoin('CustomerStatus', 'CustomerStatus.statusCode', 'Customer.statusCode')
    .leftJoin('Car', 'Car.carID', 'CarReservation.carID')
    .leftJoin('CarModel', 'CarModel.carModelID', 'Car.carModelID')
    .leftJoin('CarStatus', 'CarStatus.statusCode', 'Car.statusCode')
    .leftJoin('Station AS StartStation', 'StartStation.stationID', 'CarReservation.startStationID')
    .leftJoin('Station AS EndStation', 'EndStation.stationID', 'CarReservation.endStationID');


async function isValidReservation(startStation, endStation, startTime, endTime, carID ) {
    const PRE_RESERVATION_TIME_GAP = 1; // 1 hour before reservations to allow for charging
    let valid = true;
    let errorMessage = "";

    // Check to make sure end time is after the start time
    if (!endTime.isAfter(startTime)) {
        valid = false;
        errorMessage = "Start time is after the end time";
        return [valid, errorMessage];
    }

    // TODO: Check to make sure reservation is within
    // Only reserve less than a month in advance?
    // reservation time limit?

    // add buffer to start and end times
    // and format as a string in the MySQL desired format
    startTimeWithBuffer = dayjs(startTime).subtract(PRE_RESERVATION_TIME_GAP, 'hour').format("YYYY-MM-DD HH:mm:ss");
    endTimeWithBuffer = dayjs(endTime).add(PRE_RESERVATION_TIME_GAP, 'hour').format("YYYY-MM-DD HH:mm:ss");

    // Check if car will be at the station at the start of the reservation
    // It finds the most recent reservation that ends
    // before the candidate reservatrion starts for that car
    // and checks if that station matches the requested starting station
    let prevStation = await db.select('endStationID').from('CarReservation')
        .where('scheduledEndDatetime', 
            db.max('scheduledEndDatetime').from('CarReservation')
                .where('carID', carID).andWhere('scheduledEndDatetime', '<', startTimeWithBuffer))
        .andWhere('carID', carID);
    prevStation = prevStation[0];

    if (prevStation != undefined && prevStation.endStationID != startStation) {
        valid = false;
        errorMessage = `Car ${carID} will not be located at station ${startStation} at the start of this reservation`;
        return [valid, errorMessage];
    }   

    // check to ensure the times will not overlap with other reservations
    // It does this by looking for reservations that would intersect
    // with the requested start or end times taking into 
    // account the time gap to allow for charging
    let overlappingReservations = await db.select('reservationID').from('CarReservation')
        .where('carID', carID)
        .andWhere((query) => query
            .orWhere((query) => query
                .where('scheduledStartDatetime', '>', startTimeWithBuffer).andWhere('scheduledStartDatetime', '<', endTimeWithBuffer))  // solid reservation starts during candidate
            .orWhere((query) => query
                .where('scheduledEndDatetime', '>', startTimeWithBuffer).andWhere('scheduledEndDatetime', '<', endTimeWithBuffer)) // solid reservation ends during candidate
        );
    if (overlappingReservations.length > 0) {
        valid = false;
        errorMessage = "Reservation will overlap with an existing reservation";
        return [valid, errorMessage];
    }

    return [valid, errorMessage];
}

function transformReservation(result) {
    return {
        reservationID: result["reservationID"],
        scheduledStartDatetime: result["scheduledStartDatetime"],
        scheduledEndDatetime: result["scheduledEndDatetime"],
        actualStartDatetime: result["actualStartDatetime"],
        actualEndDatetime: result["actualEndDatetime"],
        isComplete: result["isComplete"],
        startStation: {
            stationID: result["StartStation.stationID"],
            country: result["StartStation.country"],
            state: result["StartStation.state"],
            county: result["StartStation.county"],
            city: result["StartStation.city"],
            zip: result["StartStation.zip"],
            coordinates: renameCoordinates(result["StartStation.coordinates"])
        },
        endStation: {
            stationID: result["EndStation.stationID"],
            country: result["EndStation.country"],
            state: result["EndStation.state"],
            county: result["EndStation.county"],
            city: result["EndStation.city"],
            zip: result["EndStation.zip"],
            coordinates: renameCoordinates(result["EndStation.coordinates"])
        },
        customer: {
            customerID: result["Customer.customerID"],
            firstName: result["Customer.firstName"],
            lastName: result["Customer.lastName"],
            middleInitial: result["Customer.middleInitial"],
            suffix: result["Customer.suffix"],
            username: result["Customer.username"],
            createdDatetime: result["Customer.createdDatetime"],
            phoneNumber: result["Customer.phoneNumber"],
            emailAddress: result["Customer.emailAddress"],
            phoneVerified: result["Customer.phoneVerified"],
            emailVerified: result["Customer.emailVerified"],
            status: {
                statusCode: result["CustomerStatus.statusCode"],
                shortDescription: result["CustomerStatus.shortDescription"],
                longDescription: result["CustomerStatus.longDescription"]
            }
        },
        car: {
            CarID: result["Car.CarID"],
            installDatetime: result["Car.installDatetime"],
            model: {
                modelID: result["CarModel.carModelID"],
                carModelName: result["CarModel.carModelName"],
                description: result["CarModel.description"]
            },
            status: {
                statusCode: result["CarStatus.statusCode"],
                shortDescription: result["CarStatus.shortDescription"],
                longDescription: result["CarStatus.longDescription"]
            }
        }
    };
}

function renameCoordinates(obj) {
    // If the result has coordinate values
    // transform the values to latitude and longitude
    // instead of the database default of x and y
    if (obj != null) {
        if (obj["x"] && obj["y"]) {
            obj["lat"] = obj["x"];
            obj["lng"] = obj["y"];

            delete obj["x"];
            delete obj["y"];
        }
    }
    return obj;
}

async function getReservation(req, res) {
    if (!validator.isInt(req.params["reservation_id"])) {
        return res.status(400).send("Bad Request: reservationID id invalid");
    }
    const reservation_id = Number(req.params["reservation_id"]);

    // check for reservation in db
    let reservationExists = await db.select('reservationID').from('CarReservation')
        .where('reservationID', reservation_id)
        .then(function (result) {
            if (result.length == 0) {
                return false;
            }
            return true;
        }).catch(function (err) {
            return res.status(500).send("Unexpected server side error occurred");
        });
    // bail out if reservation is not found
    if (reservationExists != true) {
        return res.status(404).send(`No reservation was found by id ${reservation_id}`);
    }

    try {
        // use base query and clear the where clause 
        // from when it could have been applied in a 
        // different function
        let result = await baseFullQuery.where('reservationID', reservation_id);
        result = result[0];
        res.json(transformReservation(result));
    }
    catch (exception) {
        res.status(500).send("Unexpected server side error");
    }
}

async function getReservations(req, res) {
    try {
        let result = await baseFullQuery.clear("where"); // clear where clause if exists

        transformed = result.map(transformReservation);
        res.json(transformed);
    }
    catch {
        res.status(500).send("Unexpected server side error occurred");
    }
}

async function createReservation(req, res) {
    // look for fields that need to be included
    // and output if any are not found
    emptyFields = []
    createReservationFields.forEach(function (field) {
        if (!req.body[field]) {
            emptyFields.push(field);
        }
    })
    if (emptyFields.length > 0) {
        return res.status(400).send(`The following fields are required and were not included in the request body: ${emptyFields.join(', ')}`);
    }

    // check to make sure all elements in
    // the request body are understood
    invalidFields = []
    Object.keys(req.body).forEach(field => {
        if (!createReservationFields.includes(field)) {
            invalidFields.push(field);
        }
    });
    if (invalidFields.length > 0) {
        res.status(400).send("The following fields are invalid for this request: " + invalidFields.join(', '));
        return
    }

    // validate the incoming data
    let scheduledStartDatetime = dayjs(req.body["scheduledStartDatetime"]);
    if (!scheduledStartDatetime.isValid()) {
        return res.status(400).send("Bad Request: The scheduledStartDatetime is invalid. It must be an ISO 8601 formatted string");
    }

    let scheduledEndDatetime = dayjs(req.body["scheduledEndDatetime"]);
    if (!scheduledEndDatetime.isValid()) {
        return res.status(400).send("Bad Request: The scheduledEndDatetime is invalid. It must be an ISO 8601 formatted string");
    }

    if (typeof req.body["customerID"] == "string" && !validator.isInt(req.body["customerID"])) {
        return res.status(400).send("Bad Request: customerID is invalid, it must be an int");
    }
    let customerID = Number(req.body["customerID"]);

    if (typeof req.body["startStationID"] == "string" && !validator.isNumeric(req.body["startStationID"])) {
        return res.status(400).send("Bad Request: startStationID is invalid, it must be an int");
    }
    let startStationID = Number(req.body["startStationID"]);

    if (typeof req.body["endStationID"] == "string" && !validator.isNumeric(req.body["endStationID"])) {
        return res.status(400).send("Bad Request: endStationID is invalid, it must be an int");
    }
    let endStationID = Number(req.body["endStationID"]);

    if (typeof req.body["carID"] == "string" && !validator.isNumeric(req.body["carID"])) {
        return res.status(400).send("Bad Request: carID is invalid, it must be an int");
    }
    let carID = Number(req.body["carID"]);

    // Check to make sure the customer, stations, and car
    // actually exist in the database so that there 
    // aren't any foreign key constraint issues
    //
    // All queries will be handled asynchronously
    // and gathered at the end
    fieldsNotFound = [];
    let customer = db.select(customerFields).from('Customer')
        .leftJoin('CustomerStatus', 'CustomerStatus.statusCode', 'Customer.statusCode')
        .where('customerID', customerID)
        .then(function (result) {
            if (result.length == 0) {
                fieldsNotFound.push(`customerID: ${startStationID}`);
            };
            return result[0];
        });

    let startStation = db.select('stationID').from('Station').where('stationID', startStationID)
        .then(function (result) {
            if (result.length == 0) {
                fieldsNotFound.push(`startStationID: ${startStationID}`);
            }
            return result[0];
        })

    let endStation;
    if (startStationID != endStationID) {
        endStation = db.select('stationID').from('Station').where('stationID', endStationID)
            .then(function (result) {
                if (result.length == 0) {
                    fieldsNotFound.push(`endStationID: ${endStationID}`);
                }
                return result[0];
            })
    }

    let car = db.select('carID').from('Car').where('carID', carID)
        .then(function (result) {
            if (result.length == 0) {
                fieldsNotFound.push(`carID: ${carID}`);
            }
            return result[0];
        })

    // wait for queries to finish and
    // extract the results into their own
    let results = await Promise.all([customer, startStation, endStation, car]);
    customer = results[0];
    startStation = results[1];
    endStation = results[2];
    car = results[3];

    if (fieldsNotFound.length > 0) {
        return res.status(400).send(`Bad Request: The following fields were not found in the database: ${fieldsNotFound.join(', ')}`);
    }

    // All items exist, we can continue with validation
    // Check to make sure customer is allowed to reserve.
    // The customer statusCode needs to be RDY for Ready
    if (customer["statusCode"] != "RDY") {
        return res.status(400).send(`Customer state of ${customer["statusCode"]} does not allow for creating reservations. \
                                    The state needs to be 'RDY'`);
    }

    // check that the customer's phone number and email has been verified
    if (customer["phoneVerified"] == 0) {
        return res.status(400).send("Customer's phone has not been verified and needs to be verified before reservations can be made");
    }
    if (customer["emailVerified"] == 0) {
        return res.status(400).send("Customer's email has not been verified and needs to be verified before reservations can be made");
    }

    let [valid, errorMessage] = await isValidReservation(startStationID, endStationID, scheduledStartDatetime, scheduledEndDatetime, carID);
    if (!valid) {
        return res.status(400).send(errorMessage);
    }

    res.send("OK");
}
async function updateReservation(req, res) { }
async function deleteReservation(req, res) { }

module.exports = { getReservation, getReservations, createReservation, updateReservation, deleteReservation };