/**
 * Automated Alerting System - API Routes
 * RESTful API endpoints for notification management and alert actions
 */

const express = require('express');
const router = express.Router();
const { alertEngine } = require('../index');

// In-memory alert storage (replace with database in production)
const alertStore = [];

/**
 * GET /api/alerts
 * Retrieve all alerts with optional filtering
 * Query params: severity, status, limit
 */
router.get('/alerts', (req, res) => {
  try {
    const { severity, status, limit } = req.query;
    let alerts = [...alertStore];

    // Apply filters
    if (severity) {
      alerts = alerts.filter(alert => alert.severity === severity);
    }
    if (status) {
      alerts = alerts.filter(alert => alert.status === status);
    }

    // Apply limit
    if (limit) {
      alerts = alerts.slice(0, parseInt(limit));
    }

    // Sort by timestamp (newest first)
    alerts.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    res.json({
      success: true,
      count: alerts.length,
      alerts: alerts
    });
  } catch (error) {
    console.error('Error fetching alerts:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/alerts/:id
 * Retrieve a specific alert by ID
 */
router.get('/alerts/:id', (req, res) => {
  try {
    const alert = alertStore.find(a => a.id === req.params.id);
    
    if (!alert) {
      return res.status(404).json({ success: false, error: 'Alert not found' });
    }

    res.json({ success: true, alert: alert });
  } catch (error) {
    console.error('Error fetching alert:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/alerts/:id/acknowledge
 * Mark an alert as acknowledged
 */
router.post('/alerts/:id/acknowledge', (req, res) => {
  try {
    const alert = alertStore.find(a => a.id === req.params.id);
    
    if (!alert) {
      return res.status(404).json({ success: false, error: 'Alert not found' });
    }

    alert.status = 'acknowledged';
    alert.acknowledgedAt = new Date().toISOString();
    alert.acknowledgedBy = req.user?.id || 'system';

    res.json({ success: true, alert: alert });
  } catch (error) {
    console.error('Error acknowledging alert:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/alerts/:id/dismiss
 * Dismiss an alert (soft delete)
 */
router.post('/alerts/:id/dismiss', (req, res) => {
  try {
    const alertIndex = alertStore.findIndex(a => a.id === req.params.id);
    
    if (alertIndex === -1) {
      return res.status(404).json({ success: false, error: 'Alert not found' });
    }

    const alert = alertStore[alertIndex];
    alert.status = 'dismissed';
    alert.dismissedAt = new Date().toISOString();
    alert.dismissedBy = req.user?.id || 'system';

    // Remove from active store
    alertStore.splice(alertIndex, 1);

    res.json({ success: true, message: 'Alert dismissed', alert: alert });
  } catch (error) {
    console.error('Error dismissing alert:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/events
 * Receive and process security events
 * Body: { type, data, source, priority }
 */
router.post('/events', (req, res) => {
  try {
    const { type, data, source, priority } = req.body;

    if (!type || !data) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required fields: type, data' 
      });
    }

    // Create security event
    const event = {
      type: type,
      data: data,
      source: source || 'unknown',
      priority: priority || 'normal',
      receivedAt: new Date().toISOString()
    };

    // Emit event to alert engine
    alertEngine.emit('security-event', event);

    // Listen for any triggered alerts
    const alertListener = (alert) => {
      alertStore.push(alert);
      alertEngine.off('alert-triggered', alertListener);
    };
    alertEngine.on('alert-triggered', alertListener);

    res.json({
      success: true,
      message: 'Event received and processing',
      event: event
    });
  } catch (error) {
    console.error('Error processing event:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/notifications/test
 * Test notification delivery
 * Body: { channel, config }
 */
router.post('/notifications/test', async (req, res) => {
  try {
    const { channel, config } = req.body;

    if (!channel || !config) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required fields: channel, config' 
      });
    }

    // Test notification based on channel type
    let result;
    if (channel === 'email') {
      const { sendEmail } = require('../utils/mailer');
      result = await sendEmail({
        to: config.to,
        subject: 'Test Alert from Automated Alerting System',
        body: 'This is a test notification. If you receive this, your email configuration is working correctly.'
      });
    } else if (channel === 'webhook') {
      const { sendWebhook } = require('../utils/webhook');
      result = await sendWebhook({
        url: config.url,
        payload: {
          test: true,
          message: 'Test webhook from Automated Alerting System',
          timestamp: new Date().toISOString()
        }
      });
    } else {
      return res.status(400).json({ 
        success: false, 
        error: 'Unsupported channel type' 
      });
    }

    res.json({
      success: true,
      message: `Test notification sent via ${channel}`,
      result: result
    });
  } catch (error) {
    console.error('Error sending test notification:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/stats
 * Get alerting system statistics
 */
router.get('/stats', (req, res) => {
  try {
    const stats = {
      totalAlerts: alertStore.length,
      bySeverity: {
        critical: alertStore.filter(a => a.severity === 'critical').length,
        high: alertStore.filter(a => a.severity === 'high').length,
        medium: alertStore.filter(a => a.severity === 'medium').length,
        low: alertStore.filter(a => a.severity === 'low').length
      },
      byStatus: {
        pending: alertStore.filter(a => a.status === 'pending').length,
        acknowledged: alertStore.filter(a => a.status === 'acknowledged').length,
        sent: alertStore.filter(a => a.status === 'sent').length,
        failed: alertStore.filter(a => a.status === 'failed').length
      },
      recent: alertStore.slice(0, 5).map(a => ({
        id: a.id,
        ruleName: a.ruleName,
        severity: a.severity,
        timestamp: a.timestamp
      }))
    };

    res.json({ success: true, stats: stats });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
