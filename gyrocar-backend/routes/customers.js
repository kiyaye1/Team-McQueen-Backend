const express = require('express');
const router = express.Router();

const dayjs = require('dayjs');
var utc = require('dayjs/plugin/utc')
dayjs.extend(utc)

const db = require('../database');

const customerObjectFields = [
    "customerID", "firstName", "lastName", "middleInitial", "suffix", "statusCode",
    "username", "createdDatetime", "phoneNumber", "emailAddress", "phoneVerified", "emailVerified",
    "driversLicenseNum", "driversLicenseState"
]


router.get('/:customer_id', function(req, res) {
    customerID = req.params['customer_id'];

    db.select(customerObjectFields).from('Customer')
        .where('customerID', customerID)
        .then(function(result) {

            if (result.length == 0) {
                res.status(404).send('No Customer found by customer_id ' + customerID);
                return
            }

            let customer = Object.assign({}, result[0]);

            db.select(['statusCode', 'shortDescription', 'longDescription']).from('CustomerStatus')
                .where('statusCode', customer['statusCode'])
                .then(function(result) {
                    let customerStatus = Object.assign({}, result[0]);
                    customer['status'] = customerStatus;
                    delete customer['statusCode'];

                    res.json(customer);
                }).catch(function(err) {
                    return res.sendStatus(500);
                });
        }
    ).catch(function(err) {
        return res.sendStatus(500);
    });
});

router.post('/', function(req, res) {
    // Check to make sure request body has minimally
    // required fields in order to create a customer
    requiredFields = ["firstName", "lastName", "emailAddress", "driversLicenseNum", "driversLicenseState"]

    missingFields = [];
    requiredFields.forEach(field => {
        if (!req.body[field]) {
            missingFields.push(field);
        }
    });
    if (missingFields.length > 0) {
        res.status(400).send("Missing required fields: " + missingFields.join(', '));
        return
    }
        
    // check to make sure all elements in
    // the request body are understood
    invalidFields = []
    Object.keys(req.body).forEach(field => {
        if (!customerObjectFields.includes(field)) {
            invalidFields.push(field);
        }
    });
    if (invalidFields.length > 0) {
        res.status(400).send("The following fields are invalid for this request: " + invalidFields.join(', '));
        return
    }

    // Insert the row and fetch the row back from the 
    // database to be returned to the client

    // check to make sure email address is not currently being used
    db.select('emailAddress').from('Customer')
        .where('emailAddress', req.body['emailAddress']).then(function(result) {
            if (result.length > 0) {
                // email was found in the database
                res.status(400).send("Email address " + req.body['emailAddress'] + " is already in use");
                return;
            }

            // email was not found, continue process
            db.insert(
                // merge base elements with request body
                Object.assign(
                {
                    statusCode: 'PVN', // Pending Verification
                    phoneVerified: 0, // false
                    emailVerified: 0, //false
                    createdDatetime: dayjs().utc().format('YYYY-MM-DD HH:mm:ss')
                },
                req.body)
            ).into('Customer').then(function(result) {
                let customerID = result[0];
        
                db.select(customerObjectFields).from('Customer')
                    .where('customerID', customerID)
                    .then(function(result) {
                        res.send(result);
                    }).catch(function(err) {
                        return res.sendStatus(500);
                    });
            });
    }).catch(function(err) {
        res.sendStatus(500);
    });
})

router.patch('/:customer_id', function(req, res) {
    let customerID = req.params['customer_id'];

    // check to make sure all elements in
    // the request body are understood
    invalidFields = []
    Object.keys(req.body).forEach(field => {
        if (!customerObjectFields.includes(field)) {
            invalidFields.push(field);
        }
    });
    if (invalidFields.length > 0) {
        res.status(400).send("The following fields are invalid for this request: " + invalidFields.join(', ')
            + "\nNo data was changed.");
        return
    }

    if (req.body['customerID']) delete req.body['customerID'] // don't allow editing the customerID

    // if they are trying to edit the email address
    // the candidate email address needs to be checked for uniqueness
    let emailIsUsed = false;
    if (req.body['emailAddress']) {
        db.select('emailAddress').from('Customer')
            .whereNot('customerID', customerID).andWhere('emailAddress', req.body['emailAddress']).then(
                function(result) {
                    if (result.length > 0) {
                        // email address is already being used
                        res.status(400).send("Email address " + req.body['emailAddress'] + " is already in use");
                        return
                    }
                    
                    db('Customer').update(req.body).where('customerID', customerID)
                        .then(function(result) {
                            res.status(200).send("Updated successfully");
                        }).catch(function(err) {
                            return res.sendStatus(500);
                        });
                }
            ).catch(function(err) {
                return res.sendStatus(500);
            });
    }
});


module.exports = router;