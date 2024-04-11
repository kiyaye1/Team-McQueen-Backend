const express = require('express');
const dayjs = require('dayjs');
const db = require('../database');
const nodemailer = require('nodemailer');


//Collect user data, insert to the database and send response email to the user
const createContacts = async (req, res) => {
    const { name, email, reason, message } = req.body;
    //leaving out customerID since it's not implemented on the front end

    try {
        // Save to database
        let requestType = await db.select('requestTypeID')
        .from("RequestType")
        .where("name", reason);
        
        let requestID = await db('Request').insert({ description: message, requestTypeID: requestType, createdDatetime: dayjs().utc().format('YYYY-MM-DD HH:mm:ss'), statusID: 1})
        .returning('requestID').then(function (id){
            db('CustomerServiceRequest')
            .insert({requestID: id, customerName: name, customerEmail: email});
        });

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

const getContacts = async (req, res) => {
    try {
        let request = await db.select("requestID", "description", "createdDatetime", "statusID")
        .from("Request")
        .whereNot("requestTypeID", 3);
        res.json(request);
    } catch (error) {
        console.error(error);
        res.status(500).send('There was an error processing your request.');
    }
}

const updateTicketStatus = async (req, res) => {
    const { requestID, newStatus } = req.body;
    //What is being sent, the status int or string?
    //asuming status int

    try {
        await db('Request').where({requestID: requestID}).update({statusID: newStatus});
        
        let transporter = nodemailer.createTransport({
            host: "smtp.gmail.com", 
            port: 587, // or 465 for SSL
            secure: false, // true for 465, false for other ports
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS, //gmail application password
            },
        });

        let email = db('Request').select('customerEmail').where({requestID: requestID});

        if(newStatus == 0){
            await transporter.sendMail({
                from: '"GyroGoGo" <kiyaye1@gmail.com>',
                to: email,
                subject: "Your ticket is on Hold",
                text: "Thank you for contacting us. Your Ticket is on Hold.",
                html: "<b>Thank you for contacting us. We'll get back to you soon.</b>",
            });
        } else if(newStatus == 2){
            await transporter.sendMail({
                from: '"GyroGoGo" <kiyaye1@gmail.com>',
                to: email,
                subject: "Your Ticket is in Progress",
                text: "Thank you for contacting us. We'll get back to you soon.",
                html: "<b>Thank you for contacting us. We'll get back to you soon.</b>",
            });
        }  else if(newStatus == 3){
            await transporter.sendMail({
                from: '"GyroGoGo" <kiyaye1@gmail.com>',
                to: email,
                subject: "Your Ticket is Completed",
                text: "Thank you for contacting us.",
                html: "<b>Thank you for contacting us.</b>",
            });
        }
        
        res.send('Inquiry submitted successfully.');
    } catch (error) {
        console.error(error);
        res.status(500).send('There was an error processing your request.');
    }
}


module.exports = {createContacts, getContacts, updateTicketStatus}