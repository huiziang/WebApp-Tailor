const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const organizationModel = require('../models/organizationModel'); // Adjust path if necessary\
const loginModel = require("../models/loginModel")
const employeeModel = require('../models/employeeModel')
const db = require('../models/dbconnection');
const verifyToken = require('../middleware/authMiddleware')

const router = express.Router();
const { JWT_SECRET } = process.env; // Use your secret key from environment variables

// **Login route for organization**
// router.post('/', (req, res) => {
//     const { email, password } = req.body;

//     if (!email || !password) {
//         return res.status(400).send('Email and password are required');
//     }

//     organizationModel.getOrgPass(email, async (err, results) => {
//         if (err) {
//             console.error("Error retrieving organization", err);
//             return res.status(500).send("Error retrieving organization");
//         }

//         if (results.length === 0) {
//             return res.status(401).send('Account not found');
//         }

//         const organization = results[0];
//         console.log(organization)
//         console.log(password)

//         // return res.send(organization)
//         const match = await bcrypt.compare(password.toString(), organization.password)
//         if (!match) {
//             return res.status(403).send("Incorrect credentials");
//         }

//         // Create a token and send it to the client
//         const token = jwt.sign({ org_id: organization.org_id, email: organization.email, org_name: organization.name, address: organization.address_line1, industry: organization.industry, org_phone: organization.phone }, JWT_SECRET, { expiresIn: '1h' });
//         return res.json({ token });
//     });
// });

router.post('/', (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).send('Email and password are required');
    }

    loginModel.getAccountPass(email, async (err, results) => {
        if (err) {
            console.error("Error retrieving organization", err);
            return res.status(500).send("Error retrieving organization");
        }

        if (results.length === 0) {
            return res.status(401).send('Account not found');
        }

        const data = results[0];

        // return res.send(organization)
        const match = await bcrypt.compare(password.toString(), data.password)
        if (!match) {
            return res.status(403).send("Incorrect credentials");
        }
        switch (data.source) {
            case ("organization"):
                fetch("http://localhost:3000/api/org/email", {
                    headers: {
                        "email": email
                    }
                })
                    .then(response => response.json())
                    .then(data => {
                        const organization = data[0]
                        const orgToken = jwt.sign({ org_id: organization.org_id, email: organization.email, org_name: organization.name, address: organization.address_line1, industry: organization.industry, org_phone: organization.phone, source: "organization" }, JWT_SECRET, { expiresIn: '1h' });
                        return res.json({ token: orgToken });
                    })
                break
            case ("temporary"):
                fetch("http://localhost:3000/api/temp/email", {
                    headers: {
                        "email": email
                    }
                })
                    .then(response => response.json())
                    .then(data => {
                        const tempAccount = data[0]
                        const tempAccToken = jwt.sign({ org_id: tempAccount.org_id, email: tempAccount.email, org_name: tempAccount.name, source: "temporary" }, JWT_SECRET, { expiresIn: '1h' });
                        return res.json({ token: tempAccToken });
                    })
                break
            default:
                return res.status(400).send("Something went wrong");
        }
    });
});

// Login route for employee
router.post('/employee', (req, res) => {
    const { email, password, encodedOrgID } = req.body;

    const org_id = jwt.decode(encodedOrgID).orgID

    if (!email || !password) {
        return res.status(400).send('Email and password are required');
    }
    else if (!org_id) {
        return res.status(400).send("Organization ID not found")
    }

    employeeModel.getEmpPass(email, org_id, async (err, results) => {
        if (err) {
            console.error("Error retrieving employee", err);
            return res.status(500).send("Error retrieving employee");
        }

        if (results.length === 0) {
            return res.status(401).send('Account not found');
        }

        const employee = results[0];
        // return res.send(employee)
        const match = await bcrypt.compare(password.toString(), employee.password)
        if (!match) {
            return res.status(403).send("Incorrect credentials")
        }

        // Create a token and send it to the client
        console.log(employee)
        const token = jwt.sign({ org_id: employee.org_id, email: employee.email, org_name: employee.name }, JWT_SECRET, { expiresIn: '1h' });
        return res.json({ token });
    })
});



// Login route for admin
router.post('/admin', (req, res) => { // add a verifytoken ti secure api, not yet added due to testing
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).send('Email and password are required');
    }

    // Assuming admin passwords are hashed as well 
    const query = 'SELECT admin_id AS id, email, role, password FROM admin WHERE email = ?';

    db.query(query, [email], async (err, results) => {
        if (err) {
            return res.status(500).send('Database error');
        }

        if (results.length === 0) {
            return res.status(401).send('Invalid email or password');
        }

        const data = results[0];
        const match = await bcrypt.compare(password.toString(), data.password); // Admin password should be hashed
        if (!match) {
            return res.status(403).send("Incorrect credentials");
        }

        // Create a token with admin role and send it to the client
        const token = jwt.sign({
            admin_id: data.id,
            email: data.email,
            role: data.role
        }, JWT_SECRET, { expiresIn: '1h' });

        res.json({ token });
    });
});


// **Protected admin route**
router.get('/dashboard', (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Admin access only' });
    }
    res.send(`Welcome, Admin ${req.user.email}! This is your dashboard.`);
});

module.exports = router;
