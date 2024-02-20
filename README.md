## signup Endpoint

> - This endpoint contains three routes, two POST and one update requests.

> - The first post request ('/signup') handles the creation of a new customer by accepting data from the request body, performing input validation, and inserting it into a MySQL database table - Customer.

> - The update request ('/signup/updateWdl') accepts the customers' drivers license information, performs data validation, and updates the table - customer in the database.

> - The second post request ('/signup/postcci') collects customer credit card information, performs data validation, and inserts it into a MySQL database table - CustomerPayment.

> - Each request is developed in such a way that it responds to the client with a success/error message according to the result of the operation.

## Test Cases

POST [http://localhost:8080\signup]

    {
        "firstName": "Simon",
        "lastName": "D'Arras",
        "username": "gsimon03",
        "hashedPassword": "Sgregorylove@12",
        "retypedPassword": "Sgregorylove@12",
        "phoneNumber": "123-456-7890",
        "emailAddress": "sgrego@gmail.com",
        "mailingAddress": "15 abc street Rochester, NY 14620"
    }

PUT [http://localhost:8080\signup\updateWdl]

    {
        "driversLicenseNum": "ab123456c",
        "driversLicenseState": "id"
    }

POST [http://localhost:8080\signup\postcci]

    {
        "cardholderName": "Simon D'Arras",
        "creditCardNumberHash": "4111 1111 1111 1111",
        "expirationDate": "1225",
        "securityCodeHash": "999"
    }
