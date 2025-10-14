/**
 * mailer.js
 * Email notification module for alerting on new cybersecurity events.
 *
 * Configuration:
 * - Uses nodemailer for SMTP email delivery
 * - Configure SMTP settings via environment variables or config object
 *
 * Usage:
 *   const mailer = require('./notifications/mailer');
 *   mailer.sendAlertEmail({ message, severity, timestamp });
 */
const nodemailer = require('nodemailer');

// SMTP configuration (use environment variables for security)
const smtpConfig = {
    host: process.env.SMTP_HOST || 'smtp.example.com',
    port: process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : 587,
    secure: false, // true for 465, false for other ports
    auth: {
        user: process.env.SMTP_USER || 'user@example.com',
        pass: process.env.SMTP_PASS || 'password',
    },
};

const transporter = nodemailer.createTransport(smtpConfig);

/**
 * Send an email notification for a new alert.
 * @param {Object} alert - The alert object { message, severity, timestamp }
 * @param {string} [to] - Optional recipient email address
 * @returns {Promise}
 */
async function sendAlertEmail(alert, to) {
    const mailOptions = {
        from: process.env.ALERT_FROM || 'alerts@example.com',
        to: to || process.env.ALERT_TO || 'admin@example.com',
        subject: `Cybersecurity Alert: ${alert.severity.toUpperCase()}`,
        text: `Alert Message: ${alert.message}\nSeverity: ${alert.severity}\nTimestamp: ${alert.timestamp}`,
    };
    try {
        const info = await transporter.sendMail(mailOptions);
        console.log('Alert email sent:', info.messageId);
        return info;
    } catch (error) {
        console.error('Error sending alert email:', error);
        throw error;
    }
}

module.exports = { sendAlertEmail };
