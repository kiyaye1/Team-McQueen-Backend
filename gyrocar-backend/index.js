const express = require('express');
const database = require('./database');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const app = express();

// Use CORS package to allow requests from any domain
var allowedOrigins = ['http://localhost:3000', 'http://localhost:8080', 'api.mcqueen-gyrocar.com']
app.use(cors({credentials:true, origin:
    function(origin, callback){
        if(!origin) return callback(null, true);
        if(allowedOrigins.indexOf(origin) === -1){
          var msg = 'The CORS policy for this site does not ' +
                    'allow access from the specified Origin.';
          return callback(new Error(msg), false);
        }    return callback(null, true);
    }
}));

app.use(express.json())
app.use(express.urlencoded({extended: false}));
app.use(cookieParser());
//app.use(bodyParser.urlencoded({ extended: true }));

const secret = `s/[BQ|x8(}-)TW|Fkl-{)pvXrnGH`;

//Important to keep here so it gets called before login require middlewear is used
const signUpRoute = require('./routes/signUp');
app.use('/signup', signUpRoute);

const loginRoute = require('./routes/login');
app.use('/login', loginRoute);

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

const loginInfoRoute = require('./routes/loginInfo');
app.use('/loginInfo', loginInfoRoute);


app.listen(8080, () => {
    console.log('listening on port 8080');
});

