const dayjs = require('dayjs');
var utc = require('dayjs/plugin/utc')
dayjs.extend(utc)

const validator = require('validator');

const db = require('../database');

const bcrypt = require('bcrypt');

const loginEmployeeFields = ['employeeID', 'username', 'password'];
const loginCustomerFields = ['customerID', 'username', 'password']

//Change Eventually
const secret = `s/[BQ|x8(}-)TW|Fkl-{)pvXrnGH`;

async function loginRequest(req, res){
    const { username, password } = req.body;
    // Call the Login function from the business layer
    employee = db.select(loginEmployeeFields)
        .from("Station")
        .where("username", username)
        .then(function (result) {
            if (result.length == 0) {
                return null;
            }

            result = Object.assign({}, result[0]);
            return result;
        })
        .catch(function (err) {
            res.status(500).send("Unexpected server error");
        });
    if(!employee){
        employee = db.select(loginCustomerFields)
            .from("Station")
            .where("username", username)
            .then(function (result) {
                if (result.length == 0) {
                    return null;
                }

                result = Object.assign({}, result[0]);
                return result;
            })
            .catch(function (err) {
                res.status(500).send("Unexpected server error");
            });
    }
    if(!employee && !user){
        loginResult = "Username Doesn't Exist";
    } else if(!employee && user){
        LoginResult = bcrypt.compare(password,user.password);
        result = user;
    } else if(employee && !user){
        loginResult = bcrypt.compare(password,employee.password);
        result = employee;
    }

    if (loginResult == true) {

        
        // If login is successful, create a token
        const token = jwt.sign({ username: result.username}, secret, { expiresIn: '6h' });
        
        // Send token to client
        res.cookie('token', token, { httpOnly: true });
        res.status(200).redirect('/home');

    } else if(loginResult == "Username Doesn't Exist"){
        res.status(401).json({ error: "Invalid Login", errorDescription: "Please Enter a correct Password"});
    } else{
        res.status(401).json({ error: "Invalid Login", errorDescription: "Please Enter a correct Password"});
    }
}


module.exports = { loginRequest };
