/**
 * Dashboard.jsx
 * React dashboard component for displaying and managing alerts from the API.
 *
 * Features:
 * - Fetches alerts from the backend API (GET /alerts)
 * - Displays alerts with severity, message, and timestamp
 * - Provides actions: Resolve, Acknowledge, Ignore
 * - Updates alerts using PATCH /alerts/:id
 * - Well-documented for maintainability
 */
import React, { useEffect, useState } from 'react';

const API_BASE = '/alerts';

const Dashboard = () => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch alerts from API
  const fetchAlerts = async () => {
    setLoading(true);
    try {
      const res = await fetch(API_BASE);
      if (!res.ok) throw new Error('Failed to fetch alerts');
      const data = await res.json();
      setAlerts(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, []);

  // Handle alert actions
  const handleAction = async (id, action) => {
    let update = {};
    if (action === 'resolve') update.severity = 'resolved';
    if (action === 'acknowledge') update.severity = 'acknowledged';
    if (action === 'ignore') update.severity = 'ignored';
    try {
      const res = await fetch(`${API_BASE}/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(update),
      });
      if (!res.ok) throw new Error('Failed to update alert');
      await fetchAlerts();
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) return <div>Loading alerts...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="dashboard">
      <h2>Alert Dashboard</h2>
      {alerts.length === 0 ? (
        <div>No alerts found.</div>
      ) : (
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Message</th>
              <th>Severity</th>
              <th>Timestamp</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {alerts.map((alert, idx) => (
              <tr key={idx}>
                <td>{idx}</td>
                <td>{alert.message}</td>
                <td>{alert.severity}</td>
                <td>{alert.timestamp}</td>
                <td>
                  <button onClick={() => handleAction(idx, 'resolve')}>Resolve</button>
                  <button onClick={() => handleAction(idx, 'acknowledge')}>Acknowledge</button>
                  <button onClick={() => handleAction(idx, 'ignore')}>Ignore</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default Dashboard;
