const dayjs = require('dayjs');
var utc = require('dayjs/plugin/utc')
dayjs.extend(utc)

const validator = require('validator');

const db = require('../database');

const jwt = require('jsonwebtoken');

const bcrypt = require('bcrypt');

const loginEmployeeFields = ['employeeID', 'emailAddress', 'hashedPassword'];
const loginCustomerFields = ['customerID', 'emailAddress', 'hashedPassword']

//Change Eventually
const secret = `s/[BQ|x8(}-)TW|Fkl-{)pvXrnGH`;

async function loginRequest(req, res){
    const { emailAddress, password } = req.body;
    // Call the Login function from the business layer
    employee = await db.select(loginEmployeeFields)
        .from("Employee")
        .where("emailAddress", emailAddress)
        .then(function (result) {
            if (result.length == 0) {
                return null;
            }

            result = Object.assign({}, result[0]);
            return result;
        })
        .catch(function (err) {
            res.sendStatus(500);
        });
    user = await db.select(loginCustomerFields)
        .from('Customer')
        .where('emailAddress', emailAddress)
        .then(function (result) {
            if (result.length == 0) {
                return null;
            }
            result = Object.assign({}, result[0]);
            return result;
        })
        .catch(function (err) {
            res.sendStatus(500);
        });
    loginResult = null;
    if(!employee && !user){
        loginResult = "Email Address Doesn't Exist";
    } else if(!employee && user){
        loginResult = await bcrypt.compare(password,user.hashedPassword);
        result = user;
    } else if(employee && !user){
;
        loginResult = await bcrypt.compare(password,employee.hashedPassword);
        result = employee;
    }

    if (loginResult == true) {
        
        let token = null;

        // If login is successful, create a token
        if(user){
            token = jwt.sign({ emailAddress: result.emailAddress, customerID: result.customerID}, secret, { expiresIn: '6h' });
        } else{
            token = jwt.sign({ emailAddress: result.emailAddress, employeeID: result.employeeID}, secret, { expiresIn: '6h' });
        }
        // Send token to client
        res.cookie('token', token, { httpOnly: true });
        res.status(200).redirect('/home');

    } else if(loginResult == "Email Address Doesn't Exist"){
        res.status(401).json({ error: "Invalid Login", errorDescription: "Please Enter a real Email Address"});
    } else{
        res.status(401).json({ error: "Invalid Login", errorDescription: "Please Enter a correct Password"});
    }
}


module.exports = { loginRequest };
