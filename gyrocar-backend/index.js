const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const app = express();

// Use CORS package to allow requests from any domain
app.use(cors())

// Automatically parse request body

app.use(express.json())
app.use(express.urlencoded({extended: false}));
app.use(cookieParser());

const secret = `s/[BQ|x8(}-)TW|Fkl-{)pvXrnGH`;

//Important to keep here so it gets called before login require middlewear is used
const signUpRoute = require('./routes/signUp');
app.use('/signup', signUpRoute);

const loginRoute = require('./routes/login');
app.use('/login', loginRoute);


// Middleware to verify token
app.use((req, res, next) => {
    const token  = req.cookies.token;
    if (!token) {
        return res.status(401).json({ error: 'No token provided', errorDescription: 'Token is required' });
    }
    try{
        const decoded = jwt.verify(token, secret);

        //add userId to the request
        if(decoded.employeeID != null){
            req.tokenID = decoded.employeeID;
        } else{
            req.tokenID = decoded.customerID;
        }
        next();
    } catch(error){
        res.status(401).json({ error: 'Invalid token', errorDescription: 'Token is invalid' });
    }
});

//app.use(verifyToken());

// Defining route location

const customersRoute = require('./routes/customers');
const reservationsRoute = require('./routes/reservations');
const stationsRoute = require('./routes/stations');

// Bind requests to route
app.use('/customers', customersRoute);
app.use('/reservations', reservationsRoute);
app.use('/stations', stationsRoute);

app.get("/", function(request, response){
  response.send("API OK");
});


app.listen(8080, function () {
    console.log("Started application on port %d", 8080);
});
