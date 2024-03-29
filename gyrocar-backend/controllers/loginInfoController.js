async function getInfo(req, res){
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ID: req.userID, role: req.role}));
}



module.exports = {getInfo};
