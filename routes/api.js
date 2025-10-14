// routes/api.js
const express = require('express');
const router = express.Router();
const AlertEngine = require('../alertEngine');

const alertEngine = new AlertEngine();

// GET /alerts - Retrieve all alerts
router.get('/alerts', (req, res) => {
    res.json(alertEngine.getAlerts());
});

// POST /alerts - Add a new alert
router.post('/alerts', (req, res) => {
    const { message, severity } = req.body;
    if (!message) {
        return res.status(400).json({ error: 'Message is required' });
    }
    alertEngine.triggerAlert(message, severity);
    res.status(201).json({ success: true });
});

// PATCH /alerts/:id - Update an alert by index
router.patch('/alerts/:id', (req, res) => {
    const id = parseInt(req.params.id, 10);
    const { message, severity } = req.body;
    const alerts = alertEngine.getAlerts();
    if (isNaN(id) || id < 0 || id >= alerts.length) {
        return res.status(404).json({ error: 'Alert not found' });
    }
    if (message) alerts[id].message = message;
    if (severity) alerts[id].severity = severity;
    res.json({ success: true, alert: alerts[id] });
});

module.exports = router;
