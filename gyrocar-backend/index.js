const express = require("express");
var app = express();

const db = require('./database');

// Automatically parse request body
app.use(express.json())

// Defining route location
const customersRoute = require('./routes/customers');
const reservationsRoute = require('./routes/reservations');

// Bind requests to route
app.use('/customers', customersRoute);
app.use('/reservations', reservationsRoute);


app.get("/", function(request, response){
    // This is only a test
    db.select().from('CustomerStatus')
        .then(function(result) {
            response.json(result);
        });
});

app.listen(8080, function () {
    console.log("Started application on port %d", 8080);
});

