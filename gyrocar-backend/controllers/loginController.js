const dayjs = require('dayjs');
var utc = require('dayjs/plugin/utc')
dayjs.extend(utc)

const validator = require('validator');

const db = require('../database');

const jwt = require('jsonwebtoken');

const bcrypt = require('bcrypt');

require('dotenv').config();

//const loginEmployeeFields = ['employeeID', 'emailAddress', 'hashedPassword'];
//const loginCustomerFields = ['customerID', 'emailAddress', 'hashedPassword'];

//Change Eventually
const secret = process.env.JWT_SECRET;

async function loginRequest(req, res){
    const { emailAddress, password } = req.body;
    // Call the Login function from the business layer
    employee = await db.select('*')
        .from("Employee")
        .where("emailAddress", emailAddress)
        .then(function (result) {
            if (result.length == 0) {
                return null;
            }

            result = Object.assign({}, result[0]);
            console.log(result);
            return result;
        })
        .catch(function (err) {
            res.sendStatus(500);
        });
    user = await db.select('*')
        .from('Customer')
        .where('emailAddress', emailAddress)
        .whereNot({'statusCode': 'PVN'})
        .then(function (result) {
            if (result.length == 0) {
                return null;
            }
            result = Object.assign({}, result[0]);
            console.log(result);
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
        console.log("Login Successful!");
        let token = null;

        //set user role to integer value
        //0 = customer
        //1 = Administrator
        //2 = Customer Service
        //3 = Mechanic
        //4 = Manager
        if(user){         
            token = jwt.sign({role: 0, userID: user.customerID, firstName: user.firstName, lastName: user.lastName, emailAddress: user.emailAddress, xtra: user.phoneNumber}, secret, { expiresIn: '6h' });
        } else{
            let employeeRole = await db.select('roleID')
            .from('EmployeeRole')
            .where('employeeID', result.employeeID)
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
            token = jwt.sign({role: employeeRole.roleID, userID: employee.employeeID, firstName: employee.firstName, lastName: employee.lastName, emailAddress: employee.emailAddress, xtra: employee.title}, secret, { expiresIn: '6h' });
        }
        // Send token to client
        res.cookie('token', token, {maxAge: 21600000, sameSite: 'none', secure: true});
        //res.redirect('http://localhost:3000');
        res.sendStatus(200);
    } else if(loginResult == "Email Address Doesn't Exist"){
        res.status(401).json({ error: "Invalid Login", errorDescription: "Please Enter a real Email Address"});
    } else{
        res.status(401).json({ error: "Invalid Login", errorDescription: "Please Enter a correct Password"});
    }
}

const logout = async (req, res) => {
    res.cookie('token', '', { httpOnly: true, expires: new Date(0) });
    // Server informs the client to clear storage
    res.status(200).json({ message: 'Logged out successfully', clearToken: true });
}

module.exports = { loginRequest, logout };


