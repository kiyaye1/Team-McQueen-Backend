const express = require('express');
const db = require('../raw_mysql');
const bcrypt = require("bcrypt");
const validator = require("validator");
const { isValid } = require('usdl-regex');
const valid = require("card-validator");
const nodemailer = require('nodemailer');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const dayjs = require('dayjs');
const timezone = require('dayjs/plugin/timezone');
const utc = require('dayjs/plugin/utc');
dayjs.extend(utc);
dayjs.extend(timezone);

//Dictates how many times the hashing process is performed (More rounds mean more security)
const saltRounds = 10;

//Endpoint for checking email uniqueness
const checkEmail = async (req, res) => {
    console.log("Request body:", req.body);
    const { email } = req.body;
    if (!email) {
        return res.status(400).json({ message: "Email parameter is required." });
    }
    const sql = 'SELECT COUNT(*) AS count FROM Customer WHERE emailAddress = ?';
    db.query(sql, [email], (err, results) => {
        if (err) {
            console.error('Database error:', err.message);
            return res.status(500).json({ message: "Internal server error. Please try again later." });
        }

        if (results[0].count > 0) {
            res.status(400).json({ message: "Email is not unique. Please use a different email." });
        } else {
            res.json({ message: "Email is unique." });
        }
    });
};
//******************************************************************************************************** */

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

//******************************************************************************************************** */
//The main logic to collect credit card information, do data validation, and finally add it into the database
const postCCI = async(req, res) => {
    const customerID = req.params['customer_id'];

    // Check customerID existence
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
        // Creating Stripe customer and attaching card
        const stripeCustomer = await stripe.customers.create({
            email: customer.emailAddress,
            name: `${customer.firstName} ${customer.lastName}`,
            phone: customer.phoneNumber
        });

        const paymentMethod = await stripe.paymentMethods.create({
            type: 'card',
            card: { token: cardToken },
        });

        await stripe.paymentMethods.attach(paymentMethod.id, {
            customer: stripeCustomer.id,
        });

        // Generate verification token
        const verificationToken = require('crypto').randomBytes(32).toString('hex');
        const tokenExpiry = dayjs().add(1, 'hour').utc().format(); // 1 hour from now

        // Update customer to store Stripe ID and verification token
        const sql = 'UPDATE Customer SET stripeCustomerID = ?, verificationToken = ?, tokenExpiry = ? WHERE customerID = ?';
        await db.query(sql, [stripeCustomer.id, verificationToken, tokenExpiry, customerID]);

        // Send acknowledgment email to the user
        let transporter = nodemailer.createTransport({
            host: "smtp.gmail.com", 
            port: 587, // or 465 for SSL
            secure: false, // true for 465, false for other ports
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS, //gmail application password
            },
        });

        const mailOptions = {
            from: '"GyroGoGo" <kiyaye1@gmail.com>',
            to: customer.emailAddress,
            subject: 'Verify Your Email',
            html: `<p>Thank you for registering. Please click <a href="https://www.mcqueen-gyrocar.com/verify-email?token=${verificationToken}">here</a> to verify your email.</p>`
        };

        transporter.sendMail(mailOptions, function(error, info) {
            if (error) {
                console.error('Failed to send verification email:', error);
                return res.status(500).send('Failed to send verification email.');
            } else {
                return res.status(200).send('Customer payment information and email verification link sent successfully.');
            }
        });

    } catch (error) {
        console.error('Error in handling credit card info:', error);
        res.status(500).send('Error processing credit card information');
    }
};
//******************************************************************************************************** */

//******************************************************************************************************** */
//This function handles the verification of the email
const verifyEmail = async (req, res) => {
    const tokenEmail = req.query.token;
    console.log("Token received:", req.query.token);
    if (!tokenEmail) {
        return res.status(400).send({error: "No token provided", errorDescription: "Token is required"});
    }
    const sql = "UPDATE Customer SET emailVerified = 1 WHERE verificationToken = ? AND tokenExpiry > CONVERT_TZ(NOW(), '+00:00', '-04:00')";
    db.query(sql, [tokenEmail], (err, result) => {
        if (err || result.affectedRows === 0) {
            console.log(result.affectedRows === 0);
            return res.status(400).send('Verification failed or token expired');
        }
        res.status(200).json({ success: true, message: "Email verified successfully" });
    });
};
//******************************************************************************************************** */

module.exports = {checkEmail, signUp, updateWdl, postCCI, verifyEmail}