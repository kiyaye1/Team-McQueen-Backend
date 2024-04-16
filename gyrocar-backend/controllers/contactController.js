const express = require('express');
const dayjs = require('dayjs');
const db = require('../database');
const nodemailer = require('nodemailer');


//Collect user data, insert to the database and send response email to the user
const createContacts = async (req, res) => {
    const { name, email, reason, message, carID, customerID } = req.body;
    //leaving out customerID since it's not implemented on the front end

    try {
        // Save to database
        // let requestType = await db.select('requestTypeID')
        // .from("RequestType")
        // .where("name", reason);

        let requestType = 0;
        if(reason != "Vehicle Inquiries"){
            requestType = 3;
        } else{
            requestType = 2;
        }

        let requestID = await db('Request').insert({ description: message, requestTypeID: requestType, createdDatetime: dayjs().utc().format('YYYY-MM-DD HH:mm:ss'), statusID: 1})
        .then(async function (id){
            let insertObject = null;
            //insert based on what is provided
            if(customerID && carID && requestType == 2){
                insertObject = {requestID: id[0], customerName: name, customerEmail: email, type: reason, customerID: customerID, carID: carID};
            } else if((!customerID || !carID) && requestType == 3){
                console.error(error);
                res.status(400).send('You need to input a customerID and a carID for a Vehicle Inquirie');  
            } else if(customerID && carID && requestType == 2){
                insertObject = {requestID: id[0], customerName: name, customerEmail: email, type: reason, customerID: customerID, carID: carID}; 
            } else if(customerID && !carID && requestType == 2){
                insertObject = {requestID: id[0], customerName: name, customerEmail: email, type: reason, customerID: customerID}; 
            } else if(!customerID && carID && requestType == 2){
                insertObject = {requestID: id[0], customerName: name, customerEmail: email, type: reason, carID: carID}; 
            } else{
                insertObject = {requestID: id[0], customerName: name, customerEmail: email, type: reason};
            }

            console.log(insertObject);

            await db('CustomerServiceRequest')
            .insert(insertObject);
        });

        // // Send acknowledgment email to the user
        // let transporter = nodemailer.createTransport({
        //     host: "smtp.gmail.com", 
        //     port: 587, // or 465 for SSL
        //     secure: false, // true for 465, false for other ports
        //     auth: {
        //         user: process.env.EMAIL_USER,
        //         pass: process.env.EMAIL_PASS, //gmail application password
        //     },
        // });

        // await transporter.sendMail({
        //     from: '"GyroGoGo" <kiyaye1@gmail.com>',
        //     to: email,
        //     subject: "We received your inquiry",
        //     text: "Thank you for contacting us. We'll get back to you soon.",
        //     html: "<b>Thank you for contacting us. We'll get back to you soon.</b>",
        // });

        res.send('Inquiry submitted successfully.');
    } catch (error) {
        console.error(error);
        res.status(500).send('There was an error processing your request.');
    }
}

const getCustomerContacts = async (req, res) => {
    //get Customer Service Requests
    try {
        let request = await db.select("Request.requestID", "Request.description", "Request.createdDatetime", "Request.statusID",
        "CustomerServiceRequest.customerName", "CustomerServiceRequest.customerEmail", "CustomerServiceRequest.type", "CustomerServiceRequest.customerID", "CustomerServiceRequest.carID")
        .from("Request")
        .innerJoin('CustomerServiceRequest', function(){
            this.on('Request.requestID', '=', 'CustomerServiceRequest.requestID');
        })
        .whereIn('Request.requestTypeID', [2,3]);
        //.whereNot("CustomerServiceRequest.type", "Vehicle Inquiries");
        res.json(request);
    } catch (error) {
        console.error(error);
        res.status(500).send('There was an error processing your request.');
    }
}

const updateTicketStatus = async (req, res) => {
    const { requestID, newStatus } = req.body;

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

        // if(newStatus == 0){
        //     await transporter.sendMail({
        //         from: '"GyroGoGo" <kiyaye1@gmail.com>',
        //         to: email,
        //         subject: "Your ticket is on Hold",
        //         text: "Thank you for contacting us. Your Ticket is on Hold.",
        //         html: "<b>Thank you for contacting us. We'll get back to you soon.</b>",
        //     });
        // } else if(newStatus == 2){
        //     await transporter.sendMail({
        //         from: '"GyroGoGo" <kiyaye1@gmail.com>',
        //         to: email,
        //         subject: "Your Ticket is in Progress",
        //         text: "Thank you for contacting us. We'll get back to you soon.",
        //         html: "<b>Thank you for contacting us. We'll get back to you soon.</b>",
        //     });
        // }  else if(newStatus == 3){
        //     await transporter.sendMail({
        //         from: '"GyroGoGo" <kiyaye1@gmail.com>',
        //         to: email,
        //         subject: "Your Ticket is Completed",
        //         text: "Thank you for contacting us.",
        //         html: "<b>Thank you for contacting us.</b>",
        //     });
        // }
        
        res.send('Inquiry submitted successfully.');
    } catch (error) {
        console.error(error);
        res.status(500).send('There was an error processing your request.');
    }
}

const getMechanicRequests = async (req, res) => {
    //get Customer Service Requests
    try {
        let request = await db.select("CarInspection.carID", "CarInspection.employeeID", "CarInspection.disposition", "CarInspection.carPostStatus", "CarInspection.disposition", "CarInspection.carPrevStatus", "CarInspection.carPostStatus", "CarInspection.inspectionDatetime",
        "ServiceRequest.requestID")
        .from("CarInspection")
        .innerJoin('ServiceRequest', function(){
            this.on('ServiceRequest.requestID', '=', 'CarInspection.inspectionID');
        });
        res.json(request);
    } catch (error) {
        console.error(error);
        res.status(500).send('There was an error processing your request.');
    }
}

const createMechanicRequests = async (req, res) => {
    const { requestID, carID, disposition, status} = req.body;
    
    //CS Reps need to be shown request ID or it needs to be passed into this automatically when a request is made
    //tried to think of a workaround but many to many relationships stop me from doing a select based on customerID, carID or both

    //I think it could be useful to show request IDs to CS reps otherwise they have no way of matching a service request with their requesite ticket

    try {
         await db('CarInspection').insert({carID: carID, disposition: disposition, carPrevStatus: status })
        .then(async function (id){
            let insertObject = null;
                insertObject = {inspectionID: id[0], carID: carID, requestID:requestID};
            console.log(insertObject);
            await db('ServiceRequest')
            .insert(insertObject);
        });
        res.send('Inquiry submitted successfully.');
    } catch (error) {
        console.error(error);
        res.status(500).send('There was an error processing your request.');
    }
}

const updateMechanicRequests = async (req, res) => {
    
    const {employeeID, inspectionID, disposition, newStatus} = req.body;

    try {
        await db('CarInspection').where({inspectionID: inspectionID}).update({employeeID: employeeID, disposition: disposition, carPostStatus: newStatus, inspectionDatetime: dayjs().utc().format('YYYY-MM-DD HH:mm:ss')});
        
        res.send('Inquiry submitted successfully.');
    } catch (error) {
        console.error(error);
        res.status(500).send('There was an error processing your request.');
    }
}


module.exports = {createContacts, getCustomerContacts, updateTicketStatus, createMechanicRequests, getMechanicRequests, updateMechanicRequests}