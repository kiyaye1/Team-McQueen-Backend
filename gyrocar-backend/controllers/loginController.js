const dayjs = require('dayjs');
var utc = require('dayjs/plugin/utc')
dayjs.extend(utc)

const validator = require('validator');

const db = require('../database');

const jwt = require('jsonwebtoken');

const bcrypt = require('bcrypt');

const loginEmployeeFields = ['employeeID', 'username', 'hashedPassword'];
const loginCustomerFields = ['customerID', 'username', 'hashedPassword']

//Change Eventually
const secret = `s/[BQ|x8(}-)TW|Fkl-{)pvXrnGH`;

async function loginRequest(req, res){
    const { username, password } = req.body;
    // Call the Login function from the business layer
    employee = await db.select(loginEmployeeFields)
        .from("Employee")
        .where("username", username)
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
        .where('username', username)
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
        loginResult = "Username Doesn't Exist";
    } else if(!employee && user){
        let base64string = user.hashedPassword;
        let bufferObj = Buffer.from(base64string, "base64");
        let decodedString = bufferObj.toString("utf8");
        loginResult = await bcrypt.compare(password,decodedString);
        result = user;
    } else if(employee && !user){
        let base64string = employee.hashedPassword;
        let bufferObj = Buffer.from(base64string, "base64");
        let decodedString = bufferObj.toString("utf8");
        loginResult = await bcrypt.compare(password,decodedString);
        result = employee;
    }

    if (loginResult == true) {
        
        let token = null;

        // If login is successful, create a token
        if(user){
            token = jwt.sign({ username: result.username, customerID: result.customerID}, secret, { expiresIn: '6h' });
        } else{
            token = jwt.sign({ username: result.username, employeeID: result.employeeID}, secret, { expiresIn: '6h' });
        }
        // Send token to client
        res.cookie('token', token, { httpOnly: true });
        res.status(200).redirect('/home');

    } else if(loginResult == "Username Doesn't Exist"){
        res.status(401).json({ error: "Invalid Login", errorDescription: "Please Enter a real username"});
    } else{
        res.status(401).json({ error: "Invalid Login", errorDescription: "Please Enter a correct Password"});
    }
}


module.exports = { loginRequest };
