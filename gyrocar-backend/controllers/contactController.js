const express = require('express');
const dayjs = require('dayjs');
const db = require('../database');
const nodemailer = require('nodemailer');

const serviceRequestFields = [ 'Request.requestID AS Request.requestID',  'Request.requestTypeID AS Request.requestTypeID', 'Request.description AS Request.description', 
    'Request.creatorID AS Request.creatorID', 'Request.assignedToID AS Request.assignedToID', 'Request.createdDatetime AS Request.createdDatetime', 
    'Request.completedDatetime AS Request.completedDatetime', 'Request.statusID AS Request.statusID', 'ServiceRequest.carID AS ServiceRequest.carID', 
    'RequestType.name AS RequestType.name', 'RequestStatus.name AS RequestStatus.name', 'CarStatus.statusCode AS CarStatus.statusCode', 'RequestStatus.description AS RequestStatus.description',
    'CarStatus.shortDescription AS CarStatus.shortDescription', 'CarStatus.longDescription AS CarStatus.longDescription', 'Car.installDatetime AS Car.installDatetime', 'ServiceRequest.fixDescription AS ServiceRequest.fixDescription'
];



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
        let requests = await db.select("Request.requestID", "Request.description", "Request.createdDatetime", "Request.statusID AS Request.statusID", 'RequestStatus.name AS RequestStatus.name', 'RequestStatus.description AS RequestStatus.description', 
                "CustomerServiceRequest.customerName", "CustomerServiceRequest.customerEmail", "CustomerServiceRequest.type", "CustomerServiceRequest.customerID", "CustomerServiceRequest.carID")
            .from("Request")
            .innerJoin('CustomerServiceRequest', function(){
                this.on('Request.requestID', '=', 'CustomerServiceRequest.requestID');
            })
            .innerJoin('RequestStatus', 'Request.statusID', 'RequestStatus.requestStatusID')
            .whereIn('Request.requestTypeID', [2,3]);
        //.whereNot("CustomerServiceRequest.type", "Vehicle Inquiries");

        requests.map(request => {
            request.requestStatus = {
                statusID: request['Request.statusID'],
                name: request['RequestStatus.name'],
                description: request['RequestStatus.description']
            }

            delete request['Request.statusID'];
            delete request['RequestStatus.name'];
            delete request['RequestStatus.description'];
        });
    
        res.json(requests);
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

function transformServiceRequest(request) {
    return {
        requestID: request['Request.requestID'],
        description: request['Request.description'],
        fixDescription: request['ServiceRequest.fixDescription'],
        creatorID: request['Request.creatorID'],
        assignedToID: request['Request.assignedToID'],
        createdDatetime: request['Request.createdDatetime'],
        completedDatetime: request['Request.completedDatetime'],

        requestType: {
            requestTypeID: request['Request.requestTypeID'],
            name: request['RequestType.name']
        },

        requestStatus: {
            statusID: request['Request.statusID'],
            name: request['RequestStatus.name'],
            description: request['RequestStatus.description']
        },

        car: {
            carID: request['ServiceRequest.carID'],
            installDatetime: request['Car.installDatetime'],

            status: {
                statusCode: request['CarStatus.statusCode'],
                shortDescription: request['CarStatus.shortDescription'],
                longDescription: request['CarStatus.longDescription']
            }
        }
    };
}


const getMechanicRequests = async (req, res) => {
    //get Customer Service Requests
    try {
        let request = await db.select(serviceRequestFields).from('Request')
            .innerJoin('ServiceRequest', 'Request.requestID', 'ServiceRequest.requestID')
            .innerJoin('RequestType', 'Request.requestTypeID', 'RequestType.requestTypeID')
            .innerJoin('RequestStatus', 'Request.statusID', 'RequestStatus.requestStatusID')
            .innerJoin('Car', 'ServiceRequest.carID', 'Car.carID')
            .innerJoin('CarStatus', 'Car.statusCode', 'CarStatus.statusCode')
            .where('Request.requestTypeID', 2); // only service requests
        res.json(request.map(transformServiceRequest));
    } catch (error) {
        console.error(error);
        res.status(500).send('There was an error processing your request.');
    }
}

const createMechanicRequests = async (req, res) => {
    const { description, assignedToID, carID, creatorID  } = req.body;

    try {
        let requestID = await db.transaction(async trx => {
            return trx.insert({description: description, creatorID: creatorID, assignedToID: assignedToID, createdDatetime: dayjs().utc().format('YYYY-MM-DD HH:mm:ss'), statusID: 1, requestTypeID: 2})
                .into('Request')
                .then(async ([requestID]) => {
                    await trx.insert({requestID: requestID, carID: carID}).into('ServiceRequest');
                    return requestID;
                })
                .catch(error => {
                    throw error;
                });
        });

        if (!requestID) {
            return res.status(500).send('There was an error in creating the request');
        }

        return res.json({requestID: requestID});

    } catch (error) {
        console.error(error);
        res.status(500).send('There was an error processing your request.');
    }
}

const updateMechanicRequests = async (req, res) => {
    
    const {requestID, description, fixDescription, assignedToID, completedDatetime, requestStatusID, carID} = req.body;

    if (!requestID) {
        return res.status(400).send('Request ID is required');
    }

    let request = await db.select('requestID').from('ServiceRequest').where({requestID: requestID});
    if (request.length == 0) {
        return res.status(404).send('Request not found');
    }
    
    try {
        await db.transaction(async trx => {
            await trx('Request').where({requestID: requestID}).update({description: description, assignedToID: assignedToID, completedDatetime: completedDatetime, statusID: requestStatusID})
                .then(async () => {
                    await trx('ServiceRequest').where({requestID: requestID}).update({fixDescription: fixDescription, carID: carID});
                })
                .catch(error => {
                    throw error;
                });
        });

        res.send('Request updated successfully');
    } catch (error) {
        console.error(error);
        res.status(500).send('There was an error processing your request.');
    }
}


module.exports = {createContacts, getCustomerContacts, updateTicketStatus, createMechanicRequests, getMechanicRequests, updateMechanicRequests}