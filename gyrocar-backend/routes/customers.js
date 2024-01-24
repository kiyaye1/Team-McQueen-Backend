const express = require('express');
const router = express.Router();

const db = require('../database');

const customerObjectFields = [
    "customerID", "firstName", "lastName", "middleInitial", "suffix", "statusCode",
    "username", "createdDatetime", "phoneNumber", "emailAddress", "phoneVerified", "emailVerified",
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
                });
        }
    )
});

router.post('/', function(req, res) {
    // Check to make sure request body has minimally
    // required fields in order to create a customer
    requiredFields = ["firstName", "lastName", "emailAddress"]

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

    // Insert the row and fetch the row back from the 
    // database to be returned to the client
    // TODO: ensure uniqueness with email address
    // before inserting
    db.insert(
        {
            statusCode: 'PVN', // Pending Verification
            firstName: req.body['firstName'],
            lastName: req.body['lastName'],
            emailAddress: req.body['emailAddress'],
            phoneVerified: 0, // false
            emailVerified: 0 //false
        }
    ).into('Customer').then(function(result) {
        let customerID = result[0];

        db.select(customerObjectFields).from('Customer')
            .where('customerID', customerID)
            .then(function(result) {
                res.send(result);
            })
    });
})


module.exports = router;