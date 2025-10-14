/**
 * Automated Alerting System - Backend Alert Engine
 * Main entry point for the alerting system
 * Listens for security events and triggers appropriate alerts
 */

const EventEmitter = require('events');
const alertRules = require('./config/alerts.json');
const { sendEmail } = require('./utils/mailer');
const { sendWebhook } = require('./utils/webhook');

/**
 * Alert Engine Class
 * Monitors security events and dispatches notifications based on configured rules
 */
class AlertEngine extends EventEmitter {
  constructor() {
    super();
    this.rules = alertRules;
    this.eventQueue = [];
    this.isProcessing = false;
    
    // Initialize event listeners
    this.setupEventListeners();
    console.log('Alert Engine initialized with', this.rules.length, 'rules');
  }

  /**
   * Set up event listeners for various security events
   */
  setupEventListeners() {
    this.on('security-event', (event) => this.handleSecurityEvent(event));
    this.on('alert-triggered', (alert) => this.dispatchAlert(alert));
  }

  /**
   * Process incoming security event
   * @param {Object} event - Security event data
   */
  async handleSecurityEvent(event) {
    console.log('Processing security event:', event.type);
    
    // Match event against configured rules
    const matchedRules = this.rules.filter(rule => 
      rule.eventType === event.type && 
      rule.enabled &&
      this.evaluateConditions(rule.conditions, event)
    );

    if (matchedRules.length === 0) {
      console.log('No matching rules for event type:', event.type);
      return;
    }

    // Create alerts for matched rules
    for (const rule of matchedRules) {
      const alert = {
        id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        ruleId: rule.id,
        ruleName: rule.name,
        severity: rule.severity,
        event: event,
        timestamp: new Date().toISOString(),
        status: 'pending'
      };
      
      this.emit('alert-triggered', alert);
    }
  }

  /**
   * Evaluate rule conditions against event data
   * @param {Array} conditions - Rule conditions to evaluate
   * @param {Object} event - Event data
   * @returns {Boolean} - True if conditions match
   */
  evaluateConditions(conditions, event) {
    if (!conditions || conditions.length === 0) return true;
    
    return conditions.every(condition => {
      const eventValue = event.data?.[condition.field];
      
      switch(condition.operator) {
        case 'equals':
          return eventValue === condition.value;
        case 'contains':
          return String(eventValue).includes(condition.value);
        case 'greater_than':
          return Number(eventValue) > Number(condition.value);
        case 'less_than':
          return Number(eventValue) < Number(condition.value);
        default:
          return false;
      }
    });
  }

  /**
   * Dispatch alert to configured notification channels
   * @param {Object} alert - Alert object to dispatch
   */
  async dispatchAlert(alert) {
    console.log(`Dispatching ${alert.severity} alert:`, alert.ruleName);
    
    const rule = this.rules.find(r => r.id === alert.ruleId);
    if (!rule) return;

    const notifications = [];
    
    // Send email notifications
    if (rule.notifications.email && rule.notifications.email.length > 0) {
      notifications.push(
        sendEmail({
          to: rule.notifications.email,
          subject: `[${alert.severity.toUpperCase()}] ${alert.ruleName}`,
          body: this.formatAlertMessage(alert)
        })
      );
    }

    // Send webhook notifications
    if (rule.notifications.webhook) {
      notifications.push(
        sendWebhook({
          url: rule.notifications.webhook,
          payload: alert
        })
      );
    }

    try {
      await Promise.all(notifications);
      console.log('Alert dispatched successfully:', alert.id);
      alert.status = 'sent';
    } catch (error) {
      console.error('Failed to dispatch alert:', error);
      alert.status = 'failed';
    }
  }

  /**
   * Format alert message for human-readable notifications
   * @param {Object} alert - Alert object
   * @returns {String} - Formatted message
   */
  formatAlertMessage(alert) {
    return `
Security Alert: ${alert.ruleName}
Severity: ${alert.severity}
Timestamp: ${alert.timestamp}
Event Type: ${alert.event.type}

Event Details:
${JSON.stringify(alert.event.data, null, 2)}

Alert ID: ${alert.id}
    `;
  }

  /**
   * Start the alert engine
   */
  start() {
    console.log('Alert Engine started');
    this.isProcessing = true;
  }

  /**
   * Stop the alert engine
   */
  stop() {
    console.log('Alert Engine stopped');
    this.isProcessing = false;
  }
}

// Initialize and export alert engine instance
const alertEngine = new AlertEngine();

module.exports = { alertEngine, AlertEngine };
