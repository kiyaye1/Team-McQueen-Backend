const express = require('express');
const db = require('../database');

//******************************************************************************************************** */
//The logic to get total number of employees
const getTotalNumOfEmployees = async(req, res) => {
    db('Employee').count('* as total')
    .then(result => {
        res.json(JSON.stringify(result[0].total));
    })
    .catch(error => {
        console.error('Error:', error);
    })
}
//******************************************************************************************************** */

//******************************************************************************************************** */
//The logic to get total number of customers
const getTotalNumOfCustomers = async(req, res) => {
    db('Customer')
    .whereNot('statusCode', 'PVN')
    .count('* as total')
    .then(result => {
        res.json(JSON.stringify(result[0].total));
    })
    .catch(error => {
        console.error('Error:', error);
    });
}
//******************************************************************************************************** */

//******************************************************************************************************** */
//The logic to get total number of cars
const getTotalNumOfCars = async(req, res) => {
    db('Car').count('* as total')
    .then(result => {
        res.json(JSON.stringify(result[0].total));
    })
    .catch(error => {
        console.error('Error:', error);
    })
}
//******************************************************************************************************** */

//******************************************************************************************************** */
//The logic to get total number of stations
const getTotalNumOfStations = async(req, res) => {
    db('Station').count('* as total')
    .then(result => {
        res.json(JSON.stringify(result[0].total));
    })
    .catch(error => {
        console.error('Error:', error);
    })
}
//******************************************************************************************************** */

//******************************************************************************************************** */
const getNumOfNewCustomers = async (req, res) => {
    db('Customer').where('statusCode', 'PVN').count('* as total')
    .then(result => {
        res.json(JSON.stringify(result[0].total));
    })
    .catch(error => {
        console.error('Error:', error);
    })
}
//******************************************************************************************************** */

//******************************************************************************************************** */
const getNumOfRDYCustomers = async (req, res) => {
    db('Customer').where('statusCode', 'RDY').count('* as total')
    .then(result => {
        res.json(JSON.stringify(result[0].total));
    })
    .catch(error => {
        console.error('Error:', error);
    })
}
//******************************************************************************************************** */

//******************************************************************************************************** */
const getNumOfNewServiceRequests = async (req, res) => {
    db.select('Request.requestID') // This selects the request ID for counting
    .count('Request.requestID as total_count') // This counts the number of unique request IDs
    .from('Request')
    .innerJoin('ServiceRequest', 'Request.requestID', 'ServiceRequest.requestID')
    .innerJoin('RequestType', 'Request.requestTypeID', 'RequestType.requestTypeID')
    .innerJoin('RequestStatus', 'Request.statusID', 'RequestStatus.requestStatusID')
    .innerJoin('Car', 'ServiceRequest.carID', 'Car.carID')
    .innerJoin('CarStatus', 'Car.statusCode', 'CarStatus.statusCode')
    .where('Request.requestTypeID', 2)
    .andWhere('Request.statusID', 1)
    .then(results => {
        res.json(JSON.stringify(results[0].total_count));
    })
    .catch(error => {
        console.error('Error executing query:', error);
    });
}
//******************************************************************************************************** */

//******************************************************************************************************** */
const getNumOfInProgressServiceRequests = async (req, res) => {
    db.select('Request.requestID') // This selects the request ID for counting
    .count('Request.requestID as total_count') // This counts the number of unique request IDs
    .from('Request')
    .innerJoin('ServiceRequest', 'Request.requestID', 'ServiceRequest.requestID')
    .innerJoin('RequestType', 'Request.requestTypeID', 'RequestType.requestTypeID')
    .innerJoin('RequestStatus', 'Request.statusID', 'RequestStatus.requestStatusID')
    .innerJoin('Car', 'ServiceRequest.carID', 'Car.carID')
    .innerJoin('CarStatus', 'Car.statusCode', 'CarStatus.statusCode')
    .where('Request.requestTypeID', 2)
    .andWhere('Request.statusID', 2)
    .then(results => {
        res.json(JSON.stringify(results[0].total_count));
    })
    .catch(error => {
        console.error('Error executing query:', error);
    });
}
//******************************************************************************************************** */

//******************************************************************************************************** */
const getNumOfCompletedServiceRequests = async (req, res) => {
    db.select('Request.requestID') // This selects the request ID for counting
    .count('Request.requestID as total_count') // This counts the number of unique request IDs
    .from('Request')
    .innerJoin('ServiceRequest', 'Request.requestID', 'ServiceRequest.requestID')
    .innerJoin('RequestType', 'Request.requestTypeID', 'RequestType.requestTypeID')
    .innerJoin('RequestStatus', 'Request.statusID', 'RequestStatus.requestStatusID')
    .innerJoin('Car', 'ServiceRequest.carID', 'Car.carID')
    .innerJoin('CarStatus', 'Car.statusCode', 'CarStatus.statusCode')
    .where('Request.requestTypeID', 2)
    .andWhere('Request.statusID', 3)
    .then(results => {
        res.json(JSON.stringify(results[0].total_count));
    })
    .catch(error => {
        console.error('Error executing query:', error);
    });
}
//******************************************************************************************************** */

//******************************************************************************************************** */
const getNumOfNewInquiries = async (req, res) => {
    db('Request')
    .innerJoin('CustomerServiceRequest', function() {
        this.on('Request.requestID', '=', 'CustomerServiceRequest.requestID');
    })
    .innerJoin('RequestStatus', 'Request.statusID', 'RequestStatus.requestStatusID')
    .where('Request.statusID', 1) 
    .whereIn('Request.requestTypeID', [2, 3]) 
    .countDistinct('Request.requestID as total_count') 
    .then(results => {
        res.json(JSON.stringify(results[0].total_count)); 
    })
    .catch(error => {
        console.error('Error executing query:', error);
    });
}
//******************************************************************************************************** */

//******************************************************************************************************** */
const getNumOfInProgressInquiries = async (req, res) => {
    db('Request')
    .innerJoin('CustomerServiceRequest', function() {
        this.on('Request.requestID', '=', 'CustomerServiceRequest.requestID');
    })
    .innerJoin('RequestStatus', 'Request.statusID', 'RequestStatus.requestStatusID')
    .where('Request.statusID', 2) 
    .whereIn('Request.requestTypeID', [2, 3]) 
    .countDistinct('Request.requestID as total_count') 
    .then(results => {
        res.json(JSON.stringify(results[0].total_count)); 
    })
    .catch(error => {
        console.error('Error executing query:', error);
    });
}
//******************************************************************************************************** */

//******************************************************************************************************** */
const getNumOfCompletedInquiries = async (req, res) => {
    db('Request')
    .innerJoin('CustomerServiceRequest', function() {
        this.on('Request.requestID', '=', 'CustomerServiceRequest.requestID');
    })
    .innerJoin('RequestStatus', 'Request.statusID', 'RequestStatus.requestStatusID')
    .where('Request.statusID', 3) 
    .whereIn('Request.requestTypeID', [2, 3]) 
    .countDistinct('Request.requestID as total_count') 
    .then(results => {
        res.json(JSON.stringify(results[0].total_count)); 
    })
    .catch(error => {
        console.error('Error executing query:', error);
    });
}
//******************************************************************************************************** */

module.exports = {getTotalNumOfEmployees, getTotalNumOfCustomers, getTotalNumOfCars, 
    getTotalNumOfStations, getNumOfNewCustomers, getNumOfRDYCustomers, getNumOfNewServiceRequests, 
    getNumOfInProgressServiceRequests, getNumOfCompletedServiceRequests, getNumOfNewInquiries,
    getNumOfInProgressInquiries, getNumOfCompletedInquiries}

