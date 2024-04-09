const express = require('express');
const db = require('../database');

//******************************************************************************************************** */
//return totals based on status an inputed dates
const getAppTotal = async(req, res) => {
    const { startDate, endDate, statusCode, sortField, sortOrder } = req.body;
    const query = db('Customer')
        .select(db.raw("DATE_FORMAT(createdDateTime, '%Y-%m') as month"), 'statusCode')
        .count('* as count')
        .whereBetween('createdDateTime', [startDate, endDate]);

    if (statusCode) {
        query.andWhere('statusCode', statusCode);
    }

    if (sortField && sortOrder) {
        query.orderBy(sortField, sortOrder);
    }

    query.groupByRaw("DATE_FORMAT(createdDateTime, '%Y-%m'), statusCode")
        .then(results => res.json(results))
        .catch(error => res.status(500).json({ error: error.message }));
}
//******************************************************************************************************** */

module.exports = {getAppTotal}