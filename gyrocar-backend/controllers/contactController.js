const express = require('express');
const db = require('../database');
const nodemailer = require('nodemailer');

//******************************************************************************************************** */
//Collect user data, insert to the database and send response email to the user
const createContacts = async (req, res) => {
    const { name, email, reason, message } = req.body;

    try {
        // Save to database
        await db('ContactInquiries').insert({ fullName: name, emailAddress: email, reason: reason, message: message });

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

        await transporter.sendMail({
            from: '"GyroGoGo" <kiyaye1@gmail.com>',
            to: email,
            subject: "We received your inquiry",
            text: "Thank you for contacting us. We'll get back to you soon.",
            html: "<b>Thank you for contacting us. We'll get back to you soon.</b>",
        });

        res.send('Inquiry submitted successfully.');
    } catch (error) {
        console.error(error);
        res.status(500).send('There was an error processing your request.');
    }
}
//******************************************************************************************************** */

module.exports = {createContacts}