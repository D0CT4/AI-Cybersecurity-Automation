/**
 * Automated Alerting System - Frontend Dashboard
 * React component for alert management interface
 * Displays alerts, allows filtering, and provides management actions
 */

import React, { useState, useEffect } from 'react';
import './dashboard.css';

/**
 * Main Dashboard Component
 * Manages alert display, filtering, and user interactions
 */
const Dashboard = () => {
  const [alerts, setAlerts] = useState([]);
  const [filteredAlerts, setFilteredAlerts] = useState([]);
  const [filterSeverity, setFilterSeverity] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  /**
   * Fetch alerts from API on component mount
   */
  useEffect(() => {
    fetchAlerts();
    // Set up polling for new alerts every 30 seconds
    const interval = setInterval(fetchAlerts, 30000);
    return () => clearInterval(interval);
  }, []);

  /**
   * Apply filters when alerts or filter criteria change
   */
  useEffect(() => {
    applyFilters();
  }, [alerts, filterSeverity, filterStatus]);

  /**
   * Fetch alerts from backend API
   */
  const fetchAlerts = async () => {
    try {
      const response = await fetch('/api/alerts');
      if (!response.ok) throw new Error('Failed to fetch alerts');
      const data = await response.json();
      setAlerts(data.alerts || []);
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  /**
   * Apply severity and status filters to alerts
   */
  const applyFilters = () => {
    let filtered = [...alerts];

    if (filterSeverity !== 'all') {
      filtered = filtered.filter(alert => alert.severity === filterSeverity);
    }

    if (filterStatus !== 'all') {
      filtered = filtered.filter(alert => alert.status === filterStatus);
    }

    setFilteredAlerts(filtered);
  };

  /**
   * Acknowledge an alert
   * @param {String} alertId - Alert ID to acknowledge
   */
  const acknowledgeAlert = async (alertId) => {
    try {
      const response = await fetch(`/api/alerts/${alertId}/acknowledge`, {
        method: 'POST'
      });
      if (!response.ok) throw new Error('Failed to acknowledge alert');
      // Update local state
      setAlerts(alerts.map(alert => 
        alert.id === alertId ? { ...alert, status: 'acknowledged' } : alert
      ));
    } catch (err) {
      alert('Error acknowledging alert: ' + err.message);
    }
  };

  /**
   * Dismiss an alert
   * @param {String} alertId - Alert ID to dismiss
   */
  const dismissAlert = async (alertId) => {
    try {
      const response = await fetch(`/api/alerts/${alertId}/dismiss`, {
        method: 'POST'
      });
      if (!response.ok) throw new Error('Failed to dismiss alert');
      // Remove from local state
      setAlerts(alerts.filter(alert => alert.id !== alertId));
    } catch (err) {
      alert('Error dismissing alert: ' + err.message);
    }
  };

  /**
   * Get severity badge color
   * @param {String} severity - Alert severity level
   * @returns {String} CSS class name
   */
  const getSeverityClass = (severity) => {
    const classes = {
      critical: 'severity-critical',
      high: 'severity-high',
      medium: 'severity-medium',
      low: 'severity-low'
    };
    return classes[severity] || 'severity-default';
  };

  /**
   * Format timestamp for display
   * @param {String} timestamp - ISO timestamp
   * @returns {String} Formatted time string
   */
  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  if (loading) {
    return <div className="dashboard-loading">Loading alerts...</div>;
  }

  if (error) {
    return <div className="dashboard-error">Error: {error}</div>;
  }

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <h1>Security Alert Dashboard</h1>
        <div className="dashboard-stats">
          <span className="stat">Total: {alerts.length}</span>
          <span className="stat critical">Critical: {alerts.filter(a => a.severity === 'critical').length}</span>
          <span className="stat high">High: {alerts.filter(a => a.severity === 'high').length}</span>
        </div>
      </header>

      <div className="dashboard-filters">
        <div className="filter-group">
          <label>Severity:</label>
          <select value={filterSeverity} onChange={(e) => setFilterSeverity(e.target.value)}>
            <option value="all">All</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>

        <div className="filter-group">
          <label>Status:</label>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
            <option value="all">All</option>
            <option value="pending">Pending</option>
            <option value="acknowledged">Acknowledged</option>
            <option value="sent">Sent</option>
          </select>
        </div>

        <button className="btn-refresh" onClick={fetchAlerts}>Refresh</button>
      </div>

      <div className="alerts-list">
        {filteredAlerts.length === 0 ? (
          <div className="no-alerts">No alerts to display</div>
        ) : (
          filteredAlerts.map(alert => (
            <div key={alert.id} className={`alert-card ${getSeverityClass(alert.severity)}`}>
              <div className="alert-header">
                <span className={`severity-badge ${getSeverityClass(alert.severity)}`}>
                  {alert.severity.toUpperCase()}
                </span>
                <span className="alert-time">{formatTime(alert.timestamp)}</span>
              </div>

              <div className="alert-body">
                <h3>{alert.ruleName}</h3>
                <p className="alert-type">Event Type: {alert.event.type}</p>
                <div className="alert-details">
                  <pre>{JSON.stringify(alert.event.data, null, 2)}</pre>
                </div>
              </div>

              <div className="alert-footer">
                <span className={`status-badge status-${alert.status}`}>
                  {alert.status}
                </span>
                <div className="alert-actions">
                  {alert.status === 'pending' && (
                    <button 
                      className="btn-acknowledge"
                      onClick={() => acknowledgeAlert(alert.id)}
                    >
                      Acknowledge
                    </button>
                  )}
                  <button 
                    className="btn-dismiss"
                    onClick={() => dismissAlert(alert.id)}
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Dashboard;
