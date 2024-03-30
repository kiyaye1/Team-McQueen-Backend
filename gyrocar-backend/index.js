const express = require('express');
const database = require('./database');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const app = express();

// Use CORS package to allow requests from specified origins
const allowedOrigins = ['http://localhost:3000', 'http://localhost:8080', 'https://api.mcqueen-gyrocar.com'];
app.use(cors({ credentials: true, origin: (origin, callback) => {
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
    } else {
        callback(new Error('The CORS policy for this site does not allow access from the specified origin.'), false);
    }
}}));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

const secret = `s/[BQ|x8(}-)TW|Fkl-{)pvXrnGH`;

//Important to keep here so it gets called before login require middlewear is used
const signUpRoute = require('./routes/signUp');
app.use('/signup', signUpRoute);

const loginRoute = require('./routes/login');
app.use('/login', loginRoute);

// Middleware to verify JWT token
app.use((req, res, next) => {
    const token  = req.cookies.token;
    if (!token) {
        return res.status(401).json({ error: 'No token provided', errorDescription: 'Token is required' });
    }
    try{
        const decoded = jwt.verify(token, secret);
        req.userID = decoded.userID;
        req.role = decoded.role;
        req.firstName = decoded.firstName; 
        req.lastName = decoded.lastName; 
        req.emailAddress = decoded.emailAddress; 
        req.xtra = decoded.xtra;
        next();
    } catch(error){
        res.status(401).json({ error: 'Invalid token', errorDescription: 'Token is invalid' });
    }
});

// Refresh token endpoint
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

const loginInfoRoute = require('./routes/loginInfo');
const customersRoute = require('./routes/customers');
const employeesRoute = require('./routes/employees');
const reservationsRoute = require('./routes/reservations');
const stationsRoute = require('./routes/stations');
const adminDashTotalsRoute = require('./routes/adminDashTotals');

app.use('/loginInfo', loginInfoRoute);
app.use('/customers', customersRoute);
app.use('/employees', employeesRoute);
app.use('/reservations', reservationsRoute);
app.use('/stations', stationsRoute);
app.use('/admindashtotals', adminDashTotalsRoute);

// Root endpoint
app.get("/", (request, response) => {
    response.send("API OK");
});

app.listen(8080, () => {
    console.log('Listening on port 8080');
});
