const express = require('express');
const db = require('../database');

// Count the reservations based on startStationID and categorize them by status according to the dates
function getReservationCountsByStationAndDate(startDate, endDate, sortField = 'reservationDate', sortOrder = 'asc') {
    const validSortFields = ['reservationDate', 'startStationID', 'Completed', 'Current', 'InProgress', 'Total'];
    const validSortOrders = ['asc', 'desc'];

    // Validate the sort field and sort order
    sortField = validSortFields.includes(sortField) ? sortField : 'reservationDate';
    sortOrder = validSortOrders.includes(sortOrder) ? sortOrder : 'asc';

    return db('CarReservation')
        .select(db.raw('DATE(scheduledStartDatetime) as reservationDate, startStationID'))
        .select(db.raw(`
            SUM(CASE 
                WHEN scheduledEndDatetime < CURDATE() THEN 1
                ELSE 0
            END) as Completed,
            SUM(CASE
                WHEN scheduledStartDatetime <= CURDATE() AND scheduledEndDatetime >= CURDATE() THEN 1
                ELSE 0
            END) as Current,
            SUM(CASE
                WHEN scheduledStartDatetime > CURDATE() THEN 1
                ELSE 0
            END) as InProgress,
            COUNT(*) as Total
        `))
        .whereBetween('scheduledStartDatetime', [startDate, endDate])
        .groupBy('reservationDate', 'startStationID')
        .orderBy(sortField, sortOrder);
}

// Return totals based on the two inputed dates
const getRentalTotal = async (req, res) => {
    const { startDate, endDate, sortField, sortOrder } = req.query;
    try {
        let data = await getReservationCountsByStationAndDate(startDate, endDate, sortField, sortOrder);
        data = data.map(item => ({
            ...item,
            reservationDate: item.reservationDate.toISOString().slice(0, 10)  // Formats the ISO string to 'YYYY-MM-DD'
        }));
        res.json(data);
    } catch (error) {
        console.error('Failed to fetch data:', error);
        res.status(500).send('Internal server error');
    }
}

module.exports = { getRentalTotal };
