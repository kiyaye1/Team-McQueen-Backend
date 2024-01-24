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

module.exports = router;