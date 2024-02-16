const express = require('express');
const db = require('../database');

const bcrypt = require("bcrypt");
const validator = require("validator");
const { isValid } = require('usdl-regex');
const valid = require("card-validator");

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

//Initialize username to track the user throughout the signup process
let username = "";

//******************************************************************************************************** */
//The main logic to collect customer data, do data validation, and finally add it into the database
const signUp = async(req, res) => {

    //Create sql insert statement
    const sql = "INSERT INTO Customer (firstName, lastName, middleInitial, suffix, statusCode, username, hashedPassword, createdDatetime, phoneNumber, emailAddress, phoneVerified, emailVerified, mailingAddress) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
    
    //Get customer information
    const firstName = req.body.firstName;
    const lastName = req.body.lastName;
    const middleInitial = req.body.middleInitial;
    const suffix = req.body.suffix;
    username = req.body.username;
    const hashedPassword = req.body.hashedPassword;
    const phoneNumber = req.body.phoneNumber; 
    const emailAddress = req.body.emailAddress;
    const retypedPassword = req.body.retypedPassword;
    const mailingAddress = req.body.mailingAddress;

    //Initial customer status (pending verification)
    const statusCode = 'PVN';
    const createdDatetime = dayjs.tz(dayjs(), 'America/New_York').format('YYYY-MM-DD HH:mm:ss');
    //Initial phone verification status (0 - not verified)
    const phoneVerified = 0;
    //Initial email verification status (0 - not verified)
    const emailVerified = 0;
    
    //Validate first name using the regex pattern 
    if((namePattern.test(validator.trim(firstName))) != true) {
        res.send("Error");
        return;
    }

    //Validate last name using the regex pattern
    if((namePattern.test(validator.trim(lastName))) != true) {
        res.send("Error");
        return;
    }

    //Validate for a 10 digit phone number using the regex pattern - phoneNumberPattern
    if((phoneNumPattern.test(validator.trim(phoneNumber))) != true) {
        res.send("Error");
        return;
    }

    //Validate whether the given string literal is an email or not
    if((validator.isEmail(validator.trim(emailAddress))) != true) {
        res.send("Error");
        return;
    }

    //Validate email uniqueness
    const sqlEmail = 'SELECT COUNT(*) AS count FROM Customer WHERE emailAddress = ?';
    db.query(sqlEmail, [emailAddress], (err, result) => {
        if(result[0].count === 1) {
            res.send("Error");
            return;
        }
    });

    //Validate whether mailing address is provided or not
    if ((validator.isEmpty(validator.trim(mailingAddress))) === true) {
        res.send("Error");
        return;
    }

    //Validate whether username is provided or not
    if ((validator.isEmpty(validator.trim(username))) === true) {
        res.send("Error");
        return;
    }

    //Validate username uniqueness
    const sqlUserName = 'SELECT COUNT(*) AS countUserName FROM Customer WHERE username = ?';
    db.query(sqlUserName, [username], (err, result) => {
        if(result[0].countUserName === 1) {
            res.send("Error");
            return;
        }
    });

    //Check if the password can be considered a strong password or not 
    //[minLength: 8, minLowercase: 1, minUppercase: 1, minNumbers: 1, minSymbols: 1]
    if((validator.isStrongPassword(hashedPassword)) != true) {
        res.send("Error");
        return;
    }

    //Check whether the retyped password matches the password given or not
    if((validator.equals(hashedPassword, retypedPassword)) != true) {
        res.send("Error");
        return;
    }

    //Hash the password 
    bcrypt.hash(hashedPassword, saltRounds, (err, hash) => {
        if (err) {
            console.log(err);
        }
        //Insert customer data into the database
        db.query(sql, [firstName, lastName, middleInitial, suffix, statusCode, username, hash, createdDatetime, phoneNumber, emailAddress, phoneVerified, emailVerified, mailingAddress], (err, data) => {
            if(err) return res.json("Error");     
            return res.json(data);                
        });
    });                          
};

//******************************************************************************************************** */
//The main logic to collect drivers license data, do data validation, and finally add it into the database
const updateWdl = async(req, res) => {

    //Create sql update statement
    const sqlDl = 'UPDATE `Customer` SET driversLicenseNum = ?,  driversLicenseState = ? WHERE username = ?';

    //Get the drivers license number and the state it is issued
    const driversLicenseNum = req.body.driversLicenseNum;
    const driversLicenseState = req.body.driversLicenseState;

    //Validate the drivers license numbers respective of the states they are issued
    if(isValid((validator.trim(driversLicenseState)).toUpperCase(), validator.trim(driversLicenseNum).toUpperCase()) != true) {
        res.send("Error");
        return;
    }

    //Update the table Customer with the drivers license information in the database
    db.query(sqlDl, [driversLicenseNum, driversLicenseState, username], (err, data) => {
        if(err) return res.json("Error");        
        return res.json(data);       
    });  
};

//******************************************************************************************************** */
//The main logic to collect credit card information, do data validation, and finally add it into the database
const postCCI = async(req, res) => {
    
    //Get the credit card information
    const cardholderName = req.body.cardholderName;
    const creditCardNumberHash = req.body.creditCardNumberHash;
    const expirationDate = req.body.expirationDate;
    const securityCodeHash = req.body.securityCodeHash;

    //Prepare the card expiration date for validation
    let newExpDate = expirationDate.slice(0, 2) + "-20" + expirationDate.slice(2);
    const expDateArray = newExpDate.split("-");
    let expMonth = expDateArray[0];
    let expYear = expDateArray[1];

    //Validate credit card holder name using the regex pattern - namePattern 
    if((namePattern.test(validator.trim(cardholderName))) != true) {
        res.send("Error");
        return;
    }

    //Validate credit card number 
    if(valid.number(creditCardNumberHash).isValid != true) {
        res.send("Error");
        return;
    }

    //Validate card expiration date 
    if(valid.expirationDate(expirationDate, expYear).isValid != true) {
        res.send("Error");
        return;
    }

    //Validate card security code 
    if(valid.cvv(securityCodeHash).isValid != true) {
        res.send("Error");
        return;
    } 

    //Create sql select statement to fetch customerID
    const sqlCI = "SELECT customerID FROM Customer WHERE username = ?";

    //Fetch customerID from the table Customer in the database
    db.query(sqlCI, [username], (err, data) => {
        if (data.length == 0 || err) {
            res.send("Error");
            return
        }
        
        //Create sql insert statement
        const sqlCCI = "INSERT INTO CustomerPayment (customerID, cardholderName, creditCardNumberHash, expirationDate, securityCodeHash) VALUES (?, ?, ?, ?, ?)";

        //Hash the card number 
        bcrypt.hash(creditCardNumberHash, saltRounds, (err, hashCC) => {
            if (err) {
                console.log(err);
            }

            //Hash the security code
            bcrypt.hash(securityCodeHash, saltRounds, (err, hashCV) => {
                if (err) {
                    console.log(err);
                }
                    
                //Add the credit card information into the table Customer in the database
                db.query(sqlCCI, [data[0].customerID, cardholderName, hashCC, expirationDate, hashCV], (err, result) => {
                    if(err) return res.json("Error");        
                    return res.json(result);       
                }); 
            });
        }); 
    }); 
};

module.exports = {signUp, updateWdl, postCCI}