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
            res.status(500);
        });
    user = await db.select(loginCustomerFields)
        .from("Customer")
        .where("username", username)
        .then(function (result) {
            if (result.length == 0) {
                console.log("hi");
                return null;
            }
            console.log("hi");
            result = Object.assign({}, result[0]);
            return result;
        })
        .catch(function (err) {
            res.status(500);
        });
    loginResult = null;
    console.log(user);
    if(!employee && !user){
        loginResult = "Username Doesn't Exist";
    } else if(!employee && user){
        let base64string = user.password;
        console.log("encoded password" + base64string);
        let bufferObj = Buffer.from(base64string, "base64");
        let decodedString = bufferObj.toString("utf8");
        loginResult = bcrypt.compare(password,decodedString);
        result = user;
    } else if(employee && !user){
        let base64string = employee.password;
        console.log("encoded password" + base64string);
        let bufferObj = Buffer.from(base64string, "base64");
        let decodedString = bufferObj.toString("utf8");
        loginResult = bcrypt.compare(password,decodedString);
        result = employee;
    }

    if (loginResult == true) {
        
        // If login is successful, create a token
        const token = jwt.sign({ username: result.username}, secret, { expiresIn: '6h' });
        
        // Send token to client
        res.cookie('token', token, { httpOnly: true });
        res.status(200).redirect('/home');

    } else if(loginResult == "Username Doesn't Exist"){
        res.status(401).json({ error: "Invalid Login", errorDescription: "Please Enter a real username"});
    } else{
        console.log(loginResult);
        res.status(401).json({ error: "Invalid Login", errorDescription: "Please Enter a correct Password"});
    }
}


module.exports = { loginRequest };
