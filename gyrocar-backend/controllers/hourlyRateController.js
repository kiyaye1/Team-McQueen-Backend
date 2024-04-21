const validator = require('validator');
const db = require('../database');
const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc')
dayjs.extend(utc);

async function addHourlyRate(req, res) {
    let { rate, effectiveDate } = req.body;
    
    if (!rate) {
        return res.status(400).send('rate is required');
    }
    if (typeof rate !== 'number' && !validator.isNumeric(rate)) {
        return res.status(400).send('rate must be a number');
    }
    rate = parseFloat(rate);

    if (!effectiveDate) {
        return res.status(400).send('effectiveDate is required');
    }
    if (!dayjs(effectiveDate).isValid()) {
        return res.status(400).send('effectiveDate must be a date');
    }
    effectiveDate = dayjs().utc(effectiveDate).format('YYYY-MM-DD HH:mm:ss');


    try {
        await db.insert({ hourlyRate: rate, effectiveDate }).into('HourlyRate');
        res.status(201).send("Hourly rate added successfully");
    } catch (error) {
        console.error("Error adding hourly rate", error);
        res.status(500).send("Server side error occurred");
    }
}

async function getCurrentHourlyRate(req, res) {
    try {
        const hourlyRate = await db.select('hourlyRate').from('HourlyRate').orderBy('effectiveDate', 'desc').first();
        res.status(200).send(hourlyRate);
    } catch (error) {
        console.error(error);
        res.status(500).send("Server side error occurred");
    }
}

async function getAllHourlyRates(req, res) {
    try {
        const hourlyRates = await db.select(['hourlyRateID', 'hourlyRate', 'effectiveDate']).from('HourlyRate');
        res.status(200).send(hourlyRates);
    } catch (error) {
        console.error(error);
        res.status(500).send("Server side error occurred");
    }
}

module.exports = { addHourlyRate, getCurrentHourlyRate, getAllHourlyRates };


