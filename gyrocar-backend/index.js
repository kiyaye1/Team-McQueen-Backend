const express = require('express');
const signUp = require('./routes/signUp');

const app = express();

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