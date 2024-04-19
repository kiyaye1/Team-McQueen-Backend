const express = require('express');
const db = require('../database');
const nodemailer = require('nodemailer');

//******************************************************************************************************** */
//Main logic to send application request approval email to the user
const sendApprovalEmail = async (req, res) => {
    const { email, firstName, lastName } = req.body;

    try {
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
            subject: 'Approval Notification',
            text: `Dear ${firstName} ${lastName},\n\nYour application has been approved. Congratulations!\n\nBest Regards,\n\nGyroGoGo`,
        });

        res.send('Inquiry submitted successfully.');
    } catch (error) {
        console.error(error);
        res.status(500).send('There was an error processing your request.');
    }
}
//******************************************************************************************************** */

module.exports = {sendApprovalEmail}