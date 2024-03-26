const express = require('express');
const db = require('../raw_mysql');

const bcrypt = require("bcrypt");
const validator = require("validator");
const { isValid } = require('usdl-regex');
const valid = require("card-validator");

const stripe = require('stripe')('sk_test_51OC3lZF33393XxHn73d30X9eRVrmyNb0L5oil5tATq4CleGApiF1ryNcIpEvgCi7VVsMAZVWktpwORUNxoVQJliJ00E1JPOfix');


const dayjs = require('dayjs');
const timezone = require('dayjs/plugin/timezone');
const utc = require('dayjs/plugin/utc');
dayjs.extend(utc);
dayjs.extend(timezone);

//Dictates how many times the hashing process is performed (More rounds mean more security)
const saltRounds = 10;

//RegExp pattern for mobile phone numbers
const phoneNumPattern = /^\(?([0-9]{3})\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})$/;

//RegExp pattern for names
const namePattern = /^[a-z ,.'-]+$/i;



//******************************************************************************************************** */
//The main logic to collect customer data, do data validation, and finally add it into the database
const signUp = async(req, res) => {

    //Create sql insert statement
    const sql = "INSERT INTO Customer (firstName, lastName, middleInitial, suffix, statusCode, hashedPassword, createdDatetime, phoneNumber, emailAddress, phoneVerified, emailVerified, mailingAddress) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
    
    //Get customer information
    const firstName = req.body.firstName;
    const lastName = req.body.lastName;
    const middleInitial = req.body.middleInitial;
    const suffix = req.body.suffix;
    const hashedPassword = req.body.hashedPassword;
    const phoneNumber = req.body.phoneNumber; 
    const emailAddress = req.body.emailAddress;
    const retypedPassword = req.body.retypedPassword;
    const mailingAddress = req.body.mailingAddress;

    //Initial customer status (pending verification)
    const statusCode = 'PVN';
    const createdDatetime = dayjs().format('YYYY-MM-DD HH:mm:ss');
    //Initial phone verification status (0 - not verified)
    const phoneVerified = 0;
    //Initial email verification status (0 - not verified)
    const emailVerified = 0;
    
    //Validate first name using the regex pattern 
    if((namePattern.test(validator.trim(firstName))) != true) {
        res.status(400).send("Error");
        return;
    }

    //Validate last name using the regex pattern
    if((namePattern.test(validator.trim(lastName))) != true) {
        res.status(400).send("Error");
        return;
    }

    //Validate for a 10 digit phone number using the regex pattern - phoneNumberPattern
    if((phoneNumPattern.test(validator.trim(phoneNumber))) != true) {
        res.status(400).send("Error");
        return;
    }

    //Validate whether the given string literal is an email or not
    if((validator.isEmail(validator.trim(emailAddress))) != true) {
        res.status(400).send("Error");
        return;
    }

    //Validate email uniqueness
    const sqlEmail = 'SELECT COUNT(*) AS count FROM Customer WHERE emailAddress = ?';
    let result = await new Promise((resolve, reject) => {
        db.query(sqlEmail, [emailAddress], (err, result) => {
            resolve(result);
        });
    });
    if (result[0].count >= 1) {
        return res.status(400).send("Email is not unique");
    }

    //Validate whether mailing address is provided or not
    if ((validator.isEmpty(validator.trim(mailingAddress))) === true) {
        res.status(400).send("Error");
        return;
    }

    //Check if the password can be considered a strong password or not 
    //[minLength: 8, minLowercase: 1, minUppercase: 1, minNumbers: 1, minSymbols: 1]
    if((validator.isStrongPassword(hashedPassword)) != true) {
        res.status(400).send("Error");
        return;
    }

    //Check whether the retyped password matches the password given or not
    if((validator.equals(hashedPassword, retypedPassword)) != true) {
        res.status(400).send("Password doesn't match");
        return;
    }
    console.log(hashedPassword)
    //Hash the password 
    bcrypt.hash(hashedPassword, saltRounds, (err, hash) => {
        console.log(hash)
        if (err) {
            console.log(err);
        }
        //Insert customer data into the database
        db.query(sql, [firstName, lastName, middleInitial, suffix, statusCode, hash, createdDatetime, phoneNumber, emailAddress, phoneVerified, emailVerified, mailingAddress], (err, data) => {
            if (err) return res.status(400).send("Error");
            return res.json({
                customerID: data.insertId
            });                
        });
    });                          
};

//******************************************************************************************************** */
//The main logic to collect drivers license data, do data validation, and finally add it into the database
const updateWdl = async(req, res) => {


    //Create sql update statement
    const sqlDl = 'UPDATE `Customer` SET driversLicenseNum = ?,  driversLicenseState = ? WHERE customerID = ?';

    const customerID = String(req.params.customer_id);
    if (!validator.isNumeric(customerID)) {
        return res.status(400).send("customerID is incorrectly formatted");
    }

    // check to make sure customerID exists
    let result = await new Promise((resolve, reject) => {
        db.query('SELECT customerID FROM Customer WHERE customerID = ?', [customerID], (err, result) => {
            resolve(result);
        })
    });
    if (result.length != 1) {
        return res.status(400).send("customerID does not exist");
    }

    //Get the drivers license number and the state it is issued
    const driversLicenseNum = req.body.driversLicenseNum;
    const driversLicenseState = req.body.driversLicenseState.toUpperCase();

    //Validate the drivers license numbers respective of the states they are issued
    if (isValid((validator.trim(driversLicenseState)), validator.trim(driversLicenseNum).toUpperCase()) != true) {
        res.status(400).send("Error");
        return;
    }

    //Update the table Customer with the drivers license information in the database
    db.query(sqlDl, [driversLicenseNum, driversLicenseState, customerID], (err, data) => {
        if(err) return res.json("Error");        
        return res.send("Driver's license information updated successfully");       
    });  
};

//******************************************************************************************************** */
//The main logic to collect credit card information, do data validation, and finally add it into the database
const postCCI = async(req, res) => {

    const customerID = req.params['customer_id'];
    // check to make sure customerID exists
    let customer = await new Promise((resolve, reject) => {
        db.query('SELECT customerID, firstName, lastName, emailAddress, phoneNumber FROM Customer WHERE customerID = ?', [customerID], (err, result) => {
            resolve(result);
        })
    });
    if (customer.length != 1) {
        return res.status(400).send("customerID does not exist");
    }
    customer = customer[0];

    if (!req.body.cardToken) {
        return res.status(400).send('cardToken is required');
    }
    const cardToken = validator.trim(req.body.cardToken);
    
    try {
        const stripeCustomer = await stripe.customers.create({
            email: customer.emailAddress,
            name: `${customer.firstName} ${customer.lastName}`,
            phone: customer.phoneNumber
        });

        // save stripe customer id to database
        const sql = 'UPDATE Customer SET stripeCustomerID = ? WHERE customerID = ?';
        let storeIDResult = db.query(sql, [stripeCustomer.id, customerID], (err, result) => {
            if (err) {
                return false;
            }
            return true;
        });

        // attach card token to customer
        const paymentMethod = await stripe.paymentMethods.create({
            type: 'card',
            card: {
              token: cardToken,
            },
        });
      
        // Attach the payment method to the customer
        await stripe.paymentMethods.attach(paymentMethod.id, {
            customer: stripeCustomer.id,
        });
        
        // ensure db update was successful
        if (!await Promise.resolve(storeIDResult)) {
            return res.status(500).send('Error creating customer');
        }

        return res.send('Customer payment information updated successfully');

    } catch (error) {
        res.status(500).send('Error creating customer');
    }
};

module.exports = {signUp, updateWdl, postCCI}