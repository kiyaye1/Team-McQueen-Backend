const express = require('express');
const db = require('../database');

//******************************************************************************************************** */
//select all cars
const getCars = async(req, res) => {
    db.select('*').from('Car')
    .then((results) => {
        return res.json(results);
    })
    .catch((error) => {
        console.error('Error fetching cars:', error);
    });
}
//******************************************************************************************************** */

//******************************************************************************************************** */
//select a single car
const getCar = async(req, res) => { 
    const carID = req.params.carID;
    db('Car').select('*').where('carID', carID)
    .then((results) => {
        return res.json(results);
    })
    .catch((error) => {
        console.error('Error selecting rows by ID:', error);
    });
}
//******************************************************************************************************** */

//******************************************************************************************************** */
//insert a car 
const postCar = async(req, res) => { 
    const carModelID = req.body.carModelID;
    const installDatetime = req.body.installDatetime;        
    const statusCode = req.body.statusCode;
    db('Car').insert({
        carModelID: carModelID, 
        installDatetime: installDatetime, 
        statusCode: statusCode
    })
    .then((result) => {
        console.log('Data created successfully');
    })
    .catch((error) => {
        console.error('Error inserting data:', error);
    })
}
//******************************************************************************************************** */

//******************************************************************************************************** */
//update a car
const updateCar = async(req, res) => {
    const carModelID = req.body.carModelID;
    const installDatetime = req.body.installDatetime;        
    const statusCode = req.body.statusCode; 
    const carID = req.params.carID; 
    db('Car').where({ carID: carID }).update({
        carModelID: carModelID, 
        installDatetime: installDatetime, 
        statusCode: statusCode
    })
    .then((results) => {
        console.log('Data updated successfully');
    })
    .catch((error) => {
        console.error('Error updating data:', error);
    });
}
//******************************************************************************************************** */

//******************************************************************************************************** */
//delete a car
const deleteCar = async(req, res) => { 
    const carID = req.params.carID;
    db('Car').where({ carID: carID }).del()
    .then((results) => {
        console.log('Car deleted successfully');
    })
    .catch((error) => {
        console.error('Error deleting car:', error);
    });
}
//******************************************************************************************************** */

module.exports = {getCars, getCar, postCar, updateCar, deleteCar}