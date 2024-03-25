async function getID(req, res){
    console.log(req.tokenID);
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ID: req.tokenID }));
}

module.exports = { getID };
