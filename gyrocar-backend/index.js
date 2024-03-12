const express = require('express');
const cors = require('cors');

const signUp = require('./routes/signUp');

const app = express();

// Use CORS package to allow requests from any domain
app.use(cors())

// Automatically parse request body
app.use(express.json())
app.use(express.urlencoded({extended: false}));


// Defining route location
const customersRoute = require('./routes/customers');
const signUpRoute = require('./routes/signUp');

// Bind requests to route
app.use('/customers', customersRoute);
app.use('/signup', signUpRoute);


app.listen(8080, function () {
    console.log("Started application on port %d", 8080);
});