const express = require('express');
const db = require('../database');

//******************************************************************************************************** */

//The logout logic to destroy the session
const getEmployeesTotal = async(req, res) => {
    db('Employee').count('* as total')
    .then(result => {
        console.log('Total number of records:', result[0].total);
        res.json(JSON.stringify(result[0].total));
    })
    .catch(error => {
        console.error('Error:', error);
    })
}
//******************************************************************************************************** */

//******************************************************************************************************** */

//The logout logic to destroy the session
const getCustomersTotal = async(req, res) => {
    db('Customer').count('* as total')
    .then(result => {
        console.log('Total number of records:', result[0].total);
        res.json(JSON.stringify(result[0].total));
    })
    .catch(error => {
        console.error('Error:', error);
    })
}
//******************************************************************************************************** */

module.exports = {getEmployeesTotal, getCustomersTotal}

