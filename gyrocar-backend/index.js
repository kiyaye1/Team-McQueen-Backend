const express = require('express');
const cookieParser = require('cookie-parser');
const signUp = require('./routes/signUp');


const app = express();

// Automatically parse request body
app.use(express.json())
app.use(express.urlencoded({extended: false}));
app.use(cookieParser());

const secret = `s/[BQ|x8(}-)TW|Fkl-{)pvXrnGH`;

//Important to keep here so it gets called before login require middlewear is used
const loginRoute = require('./routes/login');

// Middleware to verify token
app.use((req, res, next) => {
    console.log(req);
    const token  = req.cookies.token;
    if (!token) {
        return res.status(401).json({ error: 'No token provided', errorDescription: 'Token is required' });
    }
    try{
        const decoded = jwt.verify(token, secret);

        //add userId to the request
        req.tokenUsername = decoded.username;
        next();
    } catch(error){
        res.status(401).json({ error: 'Invalid token', errorDescription: 'Token is invalid' });
    }
});

//app.use(verifyToken());

// Defining route location

const customersRoute = require('./routes/customers');
const signUpRoute = require('./routes/signUp');


// Bind requests to route
app.use('/login', loginRoute);
app.use('/customers', customersRoute);
app.use('/signup', signUpRoute);


app.listen(8080, function () {
    console.log("Started application on port %d", 8080);
});