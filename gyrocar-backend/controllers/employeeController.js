const express = require('express');
const db = require('../database');
const bcrypt = require("bcrypt");

//Dictates how many times the hashing process is performed (More rounds mean more security)
const saltRounds = 10;

//******************************************************************************************************** */
//select all employees
const getEmployees = async (req, res) => {
    try {
        const { page = 1, limit = 10, search = '', orderBy = 'employeeID', order = 'asc' } = req.query;
        const offset = (page - 1) * limit;
        const query = db.select(
            'Employee.*',
            'Role.roleName as roleName'
        )
        .from('Employee')
        .innerJoin('EmployeeRole', 'Employee.employeeID', 'EmployeeRole.employeeID')
        .innerJoin('Role', 'EmployeeRole.roleID', 'Role.roleID');
        if (search) {
            query.orWhere('firstName', 'like', `%${search}%`)
            .orWhere('lastName', 'like', `%${search}%`)
            .orWhere('roleName', 'like', `%${search}%`)
            .orWhere('employeeStatus', 'like', `%${search}%`)   
        }
        query.offset(offset).limit(limit).orderBy(orderBy, order);
        const employees = await query;
        res.json(employees);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}
//******************************************************************************************************** */

//******************************************************************************************************** */
//select an employee
const getEmployee = async(req, res) => { 
    const employeeID = req.params.employeeID;
    db.select(
        'Employee.*',
        'Role.roleName AS roleName'
    )
    .from('Employee')
    .join('EmployeeRole', 'Employee.employeeID', '=', 'EmployeeRole.employeeID')
    .join('Role', 'EmployeeRole.roleID', '=', 'Role.roleID')
    .where('Employee.employeeID', '=', employeeID)
    .then((results) => {
        console.log(results[0]);
        return res.json(results[0]);
    })
    .catch((error) => {
        console.error(error);
    }); 
}
//******************************************************************************************************** */

//******************************************************************************************************** */
//insert an employee 
const postEmployee = async(req, res) => { 
    //Get employee information
    const add_employeeID = req.body.add_employeeID;
    const add_employee_firstName = req.body.add_employee_firstName;
    const add_employee_lastName = req.body.add_employee_lastName;
    const add_employee_mi = req.body.add_employee_mi;
    const add_employee_suffix = req.body.add_employee_suffix;
    const add_employee_title = req.body.add_employee_title;
    const add_employee_emailAddress = req.body.add_employee_emailAddress;
    const add_employee_password = req.body.add_employee_password;
    const add_employee_roleID = req.body.add_employee_roleID; 
    const add_employee_status = req.body.add_employee_status;    
    //Validate email uniqueness
    db.count('* as count').from('Employee').where('emailAddress', '=', add_employee_emailAddress)
    .then(rows => {
        if(rows[0].count == 0) { 
            bcrypt.hash(add_employee_password, saltRounds, (err, hash) => {
                if (err) {
                    console.log(err);
                }
                db('Employee').insert({
                    employeeID: add_employeeID,
                    firstName: add_employee_firstName, 
                    lastName: add_employee_lastName, 
                    middleInitial: add_employee_mi, 
                    suffix: add_employee_suffix,
                    title: add_employee_title,
                    emailAddress: add_employee_emailAddress, 
                    hashedPassword: hash,
                    employeeStatus: add_employee_status
                })
                .then((result) => {
                    db('EmployeeRole').insert({
                        employeeID: add_employeeID,
                        roleID: add_employee_roleID
                    })
                    .then((results) => {
                        console.log('Data inserted successfully');
                    }).catch((error) => {
                        console.error(error);
                    })
                })
                .catch((error) => {
                    console.error('Error inserting data:', error);
                })
            })          
        } else {
            return res.send("Account already exists");
        }                        
    })
    .catch(error => { 
        console.error(error); 
    })
}
//******************************************************************************************************** */

//******************************************************************************************************** */
//update employee data
const updateEmployee = async(req, res) => { 
    //Get employee information
    const firstName = req.body.firstName;
    const lastName = req.body.lastName;
    const middleInitial = req.body.middleInitial;
    const suffix = req.body.suffix;
    const title = req.body.title;
    const emailAddress = req.body.emailAddress;
    const employee_password = req.body.employee_password;
    const employeeStatus = req.body.employeeStatus;
    const roleID = req.body.roleID;
    const employeeID = req.params.employeeID;

    if(employee_password === "" || employee_password === null) { 
        bcrypt.hash(employee_password, saltRounds, (err, hash) => {
            if (err) {
                console.log(err);
            }
            if ((firstName !== undefined || lastName !== undefined || emailAddress !== undefined || 
            employeeStatus !== undefined || middleInitial !== undefined || suffix !== undefined || 
            title !== undefined) && roleID !== undefined) {
                db('Employee')
                .where('employeeID', employeeID)
                .update({
                        firstName: firstName, 
                        lastName: lastName, 
                        middleInitial: middleInitial, 
                        suffix: suffix,
                        title: title,
                        emailAddress: emailAddress, 
                        hashedPassword: hash,
                        employeeStatus: employeeStatus})
                .then((result) => {
                    db('EmployeeRole')
                    .where('employeeID', employeeID)
                    .update({'roleID': roleID})
                    .then((resultS) => {
                        console.log('Tables updated successfully.');
                    })
                    .catch ((error) => {
                        console.error('Error updating tables:', error);
                    }) 
                })
                .catch ((error) => {
                    console.error('Error updating tables:', error);
                })
            } else if ((firstName !== undefined || lastName !== undefined || emailAddress !== undefined || 
            employeeStatus !== undefined || middleInitial !== undefined || suffix !== undefined || 
            title !== undefined) && roleID === undefined) {
                db('Employee')
                .where('employeeID', employeeID)
                .update({
                    firstName: firstName, 
                    lastName: lastName, 
                    middleInitial: middleInitial, 
                    suffix: suffix,
                    title: title,
                    emailAddress: emailAddress, 
                    hashedPassword: hash,
                    employeeStatus: employeeStatus})
                .then((result) => {                          
                    console.log('Tables updated successfully.');     
                })
                .catch ((error) => {
                    console.error('Error updating tables:', error);
                })
            }  else {
                db('EmployeeRole')
                .where('employeeID', employeeID)
                .update({'roleID': roleID})
                .then((resultS) => {
                    console.log('Tables updated successfully.');
                })
                .catch ((error) => {
                    console.error('Error updating tables:', error);
                })
            } 
        })
    } else {
        if ((firstName !== undefined || lastName !== undefined || emailAddress !== undefined || 
        employeeStatus !== undefined || middleInitial !== undefined || suffix !== undefined || 
        title !== undefined) && roleID !== undefined) {
            db('Employee')
            .where('employeeID', employeeID)
            .update({
                firstName: firstName, 
                lastName: lastName, 
                middleInitial: middleInitial, 
                suffix: suffix,
                title: title,
                emailAddress: emailAddress,
                employeeStatus: employeeStatus})
            .then((result) => {
                if (result.length === 0) {
                    console.log('No rows updated.');
                    return;
                }                
                db('EmployeeRole')
                .where('employeeID', employeeID)
                .update({'roleID': roleID})
                .then((resultS) => {
                    console.log('Tables updated successfully.');
                })
                .catch ((error) => {
                    console.error('Error updating tables:', error);
                })   
            })
            .catch ((error) => {
                console.error('Error updating tables:', error);
            })
        } else if ((firstName !== undefined || lastName !== undefined || emailAddress !== undefined || 
        employeeStatus !== undefined || middleInitial !== undefined || suffix !== undefined || 
        title !== undefined) && roleID === undefined) {
            db('Employee')
            .where('employeeID', employeeID)
            .update({
                firstName: firstName, 
                lastName: lastName, 
                middleInitial: middleInitial, 
                suffix: suffix,
                title: title,
                emailAddress: emailAddress,
                employeeStatus: employeeStatus})
            .then((result) => {
                    
                console.log('Tables updated successfully.');     
            })
            .catch ((error) => {
                console.error('Error updating tables:', error);
            })
        } else {
            db('EmployeeRole')
            .where('employeeID', employeeID)
            .update({'roleID': roleID})
            .then((resultS) => {
                console.log('Tables updated successfully.');
            })
            .catch ((error) => {
                console.error('Error updating tables:', error);
            })
        }
    }                      
}
//******************************************************************************************************** */

//******************************************************************************************************** */
//delete employee data
const deleteEmployee = async(req, res) => {
    const employeeID = req.params.employeeID;
    db('EmployeeRole').where({ employeeID: employeeID }).del()
    .then((results) => {
        console.log('Employee deleted successfully');
        db('Employee').where({ employeeID: employeeID }).del()
        .then((result) => {
            console.log('Employee deleted successfully');
        }).catch((error) => {
            console.error('Error deleting employee:', error);
        })
    }).catch((error) => {
        console.error('Error deleting employee:', error);
    }) 
}
//******************************************************************************************************** */

module.exports = {getEmployees, getEmployee, postEmployee, updateEmployee, deleteEmployee}