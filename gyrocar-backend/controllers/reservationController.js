const db = require('../database');
const validator = require("validator");


const reservationFields = ["reservationID", "startStationID", "endStationID", "carID", "scheduledStartDatetime",
    "customerID", "scheduledEndDatetime", "actualStartDatetime", "actualEndDatetime", "isComplete"];

// full list of fields needed for getting all reservation
// information with full column names with tables becuase
// of column name overlap between tables
const joinedReservationFields = [
    "reservationID",
    "scheduledStartDatetime",
    "scheduledEndDatetime",
    "actualStartDatetime",
    "actualEndDatetime",
    "isComplete",
    "StartStation.stationID AS StartStation.stationID",
    "StartStation.country AS StartStation.country",
    "StartStation.state AS StartStation.state",
    "StartStation.county AS StartStation.county",
    "StartStation.city AS StartStation.city",
    "StartStation.zip AS StartStation.zip",
    "StartStation.coordinates AS StartStation.coordinates",
    "StartStation.streetAddress AS StartStation.streetAddress",
    "EndStation.stationID AS EndStation.stationID",
    "EndStation.country AS EndStation.country",
    "EndStation.state AS EndStation.state",
    "EndStation.county AS EndStation.county",
    "EndStation.city AS EndStation.city",
    "EndStation.zip AS EndStation.zip",
    "EndStation.coordinates AS EndStation.coordinates",
    "EndStation.streetAddress AS EndStation.streetAddress",
    "Customer.customerID AS Customer.customerID",
    "Customer.firstName AS Customer.firstName",
    "Customer.lastName AS Customer.lastName",
    "Customer.middleInitial AS Customer.middleInitial",
    "Customer.suffix AS Customer.suffix",
    "Customer.username AS Customer.username",
    "Customer.createdDatetime AS Customer.createdDatetime",
    "Customer.phoneNumber AS Customer.phoneNumber",
    "Customer.emailAddress AS Customer.emailAddress",
    "Customer.phoneVerified AS Customer.phoneVerified",
    "Customer.emailVerified AS Customer.emailVerified",
    "Car.CarID AS Car.CarID",
    "Car.installDatetime AS Car.installDatetime",
    "Car.statusCode AS Car.statusCode",
    "CustomerStatus.statusCode AS CustomerStatus.statusCode",
    "CustomerStatus.shortDescription AS CustomerStatus.shortDescription",
    "CustomerStatus.longDescription AS CustomerStatus.longDescription",
    "CarModel.carModelID AS CarModel.carModelID",
    "CarModel.carModelName AS CarModel.carModelName",
    "CarModel.description AS CarModel.description",
    "CarStatus.statusCode AS CarStatus.statusCode",
    "CarStatus.shortDescription AS CarStatus.shortDescription",
    "CarStatus.longDescription AS CarStatus.longDescription",
];

let baseFullQuery = db.select(joinedReservationFields).from('CarReservation')
    .leftJoin('Customer', 'Customer.customerID', 'CarReservation.customerID')
    .leftJoin('CustomerStatus', 'CustomerStatus.statusCode', 'Customer.statusCode')
    .leftJoin('Car', 'Car.carID', 'CarReservation.carID')
    .leftJoin('CarModel', 'CarModel.carModelID', 'Car.carModelID')
    .leftJoin('CarStatus', 'CarStatus.statusCode', 'Car.statusCode')
    .leftJoin('Station AS StartStation', 'StartStation.stationID', 'CarReservation.startStationID')
    .leftJoin('Station AS EndStation', 'EndStation.stationID', 'CarReservation.endStationID');


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

    // check for reservation in db, 404
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
    if (reservationExists != true) {
        return res.status(404).send(`No reservation was found by id ${reservation_id}`);
    }

    try {
        let result = await baseFullQuery.where('reservationID', reservation_id);
        result = result[0];
        res.json(transformReservation(result));
    }
    catch (exception) {
        res.status(500).send("Unexpected server side error");
    }
}

async function getReservations(req, res) { }
async function createReservation(req, res) { }
async function updateReservation(req, res) { }
async function deleteReservation(req, res) { }

module.exports = { getReservation, getReservations, createReservation, updateReservation, deleteReservation };