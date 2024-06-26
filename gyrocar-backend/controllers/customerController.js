
const dayjs = require('dayjs');
var utc = require('dayjs/plugin/utc')
dayjs.extend(utc)

const db = require('../database');

const customerObjectFields = [
    "customerID", "firstName", "lastName", "middleInitial", "suffix", "statusCode",
    "createdDatetime", "phoneNumber", "emailAddress", "phoneVerified", "emailVerified",
    "driversLicenseNum", "driversLicenseState"
]


function getCustomer(req, res) {
    customerID = req.params['customer_id'];
    
    // security filtering
    if (req.role === 0) {
        // requestor is a customer
        if (req.userID != customerID) { // allow the user to access their own information
            return res.status(401).send("This user is not authorized to access this data");
        }
    }

	else if (!(req.role == 1 || req.role == 2 || req.role == 4)) {
        return res.status(401).send("This user is not authorized to access this data");
    }

    db.select(customerObjectFields).from('Customer')
        .where('customerID', customerID)
        .then(function (result) {
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
}

function getCustomers(req, res) {
    // security filtering
    if (!(req.role == 1 || req.role == 2 || req.role == 4)) {
        return res.status(401).send("This user is not authorized to access this data");
    }

    fields = Array.from(customerObjectFields);
    fields[fields.indexOf('statusCode')] = 'CustomerStatus.statusCode';
    fields = fields.concat(['CustomerStatus.statusCode', 'shortDescription', 'longDescription']);
    db.select(fields).from('Customer')
        .leftJoin('CustomerStatus', {'Customer.statusCode': 'CustomerStatus.statusCode'})
        .then(function(result) {
            result = Object.assign([], result);
            result.map((x) => {
                x['status'] = {
                    'statusCode': x['statusCode'],
                    'shortDescription': x['shortDescription'],
                    'longDescription': x['longDescription']
                }
                delete x['statusCode'];
                delete x['shortDescription'];
                delete x['longDescription'];
            });

            res.json(result);
        }).catch(function(err) {
            res.sendStatus(500);
        });
}

function createCustomer(req, res) {
    // security filtering
    if (!(req.role == 1 || req.role == 2 || req.role == 4)) {
        return res.status(401).send("This user is not authorized to create a customer");
    }

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
}

async function updateCustomer(req, res) {
    let customerID = req.params['customer_id'];
    
    // security filtering
    if (req.role === 0) {
        // requestor is a customer
        if (req.userID != customerID) { // allow the user to access their own information
            return res.status(401).send("This user is not authorized to access this data");
        }
    }

    else if (!(req.role == 1 || req.role == 2 || req.role == 4)) {
        return res.status(401).send("This user is not authorized to access this data");
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
        res.status(400).send("The following fields are invalid for this request: " + invalidFields.join(', ')
            + "\nNo data was changed.");
        return
    }

    if (req.body['customerID']) delete req.body['customerID'] // don't allow editing the customerID


    // if they are trying to edit the email address
    // the candidate email address needs to be checked for uniqueness
    if (req.body['emailAddress']) {
        let emailIsUsed = true;
        emailIsUsed = await db.select('emailAddress').from('Customer')
            .whereNot('customerID', customerID).andWhere('emailAddress', req.body['emailAddress']).then(
                function (result) {
                    if (result.length > 0) {
                        // email address is already being used
                        res.status(400).send("Email address " + req.body['emailAddress'] + " is already in use");
                        return true;
                    }
                    else {
                        return false;
                    }
                }
        ).catch(function (err) {
                return res.sendStatus(500);
            });
        if (emailIsUsed == true) return;
    }

    // update all the elements given
    db('Customer').update(req.body).where('customerID', customerID)
        .then(function(result) {
            res.status(200).send("Updated successfully");
        }).catch(function(err) {
            return res.sendStatus(500);
        });
}


function deleteCustomer(req, res) {
    // security filtering
    if (!(req.role == 1 || req.role == 2 || req.role == 4)) {
        return res.status(401).send("This user is not authorized to delete a customer");
    }

    let customerID = req.params['customer_id'];
    if (customerID.length == 0) {
        res.sendStatus(400);
        return;
    }

    db('Customer').delete().from('Customer').where('customerID', customerID).then(function(result) {
        res.status(200).send("Deleted successfully");
    }).catch(function(err) {
        return res.sendStatus(500);
    });
}

module.exports = {getCustomer, getCustomers, createCustomer, updateCustomer, deleteCustomer};
