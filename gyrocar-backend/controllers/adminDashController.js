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
    db('Customer').count('* as total')
    .then(result => {
        res.json(JSON.stringify(result[0].total));
    })
    .catch(error => {
        console.error('Error:', error);
    })
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

module.exports = {getTotalNumOfEmployees, getTotalNumOfCustomers, getTotalNumOfCars, getTotalNumOfStations, getNumOfNewCustomers, getNumOfRDYCustomers}

