async function getInfo(req, res){
    console.log(req.tokenID);
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({role: req.role, userID: req.userID, firstName: req.firstName, lastName: req.lastName, emailAddress: req.emailAddress, xtra: req.xtra}));
}

module.exports = {getInfo};
