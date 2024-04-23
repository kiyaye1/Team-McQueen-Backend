const db = require('../database');
const validator = require('validator');

async function getDailyMax(req, res) {
    let dailyMax  = await db.select('dailyMax').from('DailyMax').first();
    res.json(dailyMax);
}

async function updateDailyMax(req, res) {
    // security filtering
    if (req.userID != req.body.customerID) {
        if (!(req.role == 1 || req.role == 2 || req.role == 4)) {
            return res.status(401).send("This user is not authorized to update this reservation");
        }
    }

    let dailyMax = req.body.dailyMax;
    if (!dailyMax) {
        return res.status(400).send('dailyMax is required');
    }

    if (typeof dailyMax === "string" && validator.isNumeric(dailyMax) === false) {
        return res.status(400).send('dailyMax must be a number');
    }
    dailyMax = parseFloat(dailyMax);

    try {
        let updatedDailyMax = await db('DailyMax').update({ dailyMax });
        res.send('Daily Max updated successfully');
    }
    catch (error) {
        console.error(error);
        res.status(500).send('Error updating daily max');
    }
}

module.exports = { getDailyMax, updateDailyMax }