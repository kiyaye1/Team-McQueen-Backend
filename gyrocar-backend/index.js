const express = require('express');
const database = require('./database');
const signUp = require('./routes/signUp');

const app = express();

app.use(express.json());
app.use(express.urlencoded({extended: false}));

database;

app.use(signUp);

app.listen(8080, () => {
    console.log('listening on port 8080');
});

