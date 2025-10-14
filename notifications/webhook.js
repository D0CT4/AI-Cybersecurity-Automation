/**
 * webhook.js
 * Outbound webhook notification module for alerting on new cybersecurity events.
 *
 * Configuration:
 * - Webhook URL is set via environment variable or config object
 * - Supports POST requests with alert payload
 *
 * Usage:
 *   const webhook = require('./notifications/webhook');
 *   webhook.sendAlertWebhook({ message, severity, timestamp });
 */
const fetch = require('node-fetch');

// Webhook configuration
const WEBHOOK_URL = process.env.WEBHOOK_URL || 'https://example.com/webhook';

/**
 * Send a webhook notification for a new alert.
 * @param {Object} alert - The alert object { message, severity, timestamp }
 * @returns {Promise}
 */
async function sendAlertWebhook(alert) {
    try {
        const response = await fetch(WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(alert),
        });
        if (!response.ok) {
            throw new Error(`Webhook failed: ${response.status} ${response.statusText}`);
        }
        console.log('Alert webhook sent:', await response.text());
        return response;
    } catch (error) {
        console.error('Error sending alert webhook:', error);
        throw error;
    }
}

module.exports = { sendAlertWebhook };
