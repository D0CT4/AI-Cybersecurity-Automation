// alertEngine.js
// This module provides basic alerting functionality for cybersecurity automation.

class AlertEngine {
    constructor() {
        this.alerts = [];
    }

    addAlert(alert) {
        this.alerts.push(alert);
    }

    getAlerts() {
        return this.alerts;
    }

    clearAlerts() {
        this.alerts = [];
    }

    triggerAlert(message, severity = 'info') {
        const alert = {
            message,
            severity,
            timestamp: new Date().toISOString()
        };
        this.addAlert(alert);
        // Here you could integrate with external notification systems
        console.log(`[${severity.toUpperCase()}] ${message}`);
    }
}

module.exports = AlertEngine;
