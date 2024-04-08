// Importing necessary modules
const express = require('express');
//const database = require('./database');
const cookieParser = require('cookie-parser'); 
const cors = require('cors');
const jwt = require('jsonwebtoken'); 
require('dotenv').config();
const path = require('path');
const app = express(); 

// Configuring CORS to allow requests from specified origins for increased security
const allowedOrigins = ['http://localhost:3000', 'http://localhost:8080', 'https://api.mcqueen-gyrocar.com', 'https://mcqueen-gyrocar.com'];
app.use(cors({ 
    credentials: true, // Allows servers to specify whether or not to use credentials
    origin: (origin, callback) => {
        // Check if the origin of the request is in the list of allowed origins
        if (!origin || allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error('The CORS policy for this site does not allow access from the specified origin.'), false);
        }
    }
}));

// Middlewares for parsing request bodies and cookies
app.use(express.json()); 
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser()); 

// Environment variables for JWT secret and server port
const secret = process.env.JWT_SECRET;
const port = process.env.PORT;

// Route handlers for contact us path
const contactsRoute = require('./routes/contacts');
app.use('/contacts', contactsRoute);

// Signup route, important to keep here before login middleware to allow access
const signUpRoute = require('./routes/signUp');
app.use('/signup', signUpRoute);

// Login route
const loginRoute = require('./routes/login');
app.use('/login', loginRoute);

// Middleware for token verification and attaching user details to the request object
app.use((req, res, next) => {
    const token  = req.cookies.token; // Extract token from cookies
    if (!token) {
        return res.status(401).json({ error: 'No token provided', errorDescription: 'Token is required' });
    }
    try {
        // Verifying token
        const decoded = jwt.verify(token, secret);
        // Attaching decoded user details to the request object
        req.userID = decoded.userID;
        req.role = decoded.role;
        req.firstName = decoded.firstName; 
        req.lastName = decoded.lastName; 
        req.emailAddress = decoded.emailAddress; 
        req.xtra = decoded.xtra;
        next();
    } catch(error) {
        res.status(401).json({ error: 'Invalid token', errorDescription: 'Token is invalid' });
    }
});

// Endpoint for refreshing tokens
app.get('/refresh', (req, res) => {
    const token = req.cookies.token;
    if (!token) {
        return res.status(401).json({ error: 'No token provided', errorDescription: 'Token is required for authentication.' });
    }
    jwt.verify(token, secret, (err, decoded) => {
        if (err) {
            return res.status(401).json({ error: 'Invalid token', errorDescription: 'Failed to authenticate token.' });
        }
        const userInfo = {
            userID: decoded.userID,
            role: decoded.role,
            firstName: decoded.firstName,
            lastName: decoded.lastName,
            emailAddress: decoded.emailAddress,
            xtra: decoded.xtra,
        };
        res.json(userInfo);
    });
});

// More route handlers for other parts of the application
const loginInfoRoute = require('./routes/loginInfo');
const customersRoute = require('./routes/customers');
const employeesRoute = require('./routes/employees');
const reservationsRoute = require('./routes/reservations');
const stationsRoute = require('./routes/stations');
const carsRoute = require('./routes/cars');
const adminDashTotalsRoute = require('./routes/adminDashTotals');

app.use('/loginInfo', loginInfoRoute);
app.use('/customers', customersRoute);
app.use('/employees', employeesRoute);
app.use('/reservations', reservationsRoute);
app.use('/stations', stationsRoute);
app.use('/cars', stationsRoute);
app.use('/admindashtotals', adminDashTotalsRoute);

// Root endpoint to quickly check if the API is running
app.get("/", (request, response) => {
    response.send("API OK");
});

// Starting the server on the specified port
app.listen(port, () => {
    console.log(`Listening on port ${port}`);
});

