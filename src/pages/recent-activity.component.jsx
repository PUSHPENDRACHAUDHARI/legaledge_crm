import { useEffect, useState } from 'react';
import { useCRM } from '../context/CRMContext';
import { getRecentActivities } from '../utils/activityRetention';

const PAGE_SIZE = 5;

const actionBadgeClass = (action) => ({
  login: 'info',
  logout: 'secondary',
  update: 'warning',
  updated: 'warning',
  create: 'success',
  created: 'success',
  delete: 'danger',
  deleted: 'danger',
}[String(action || '').toLowerCase()] || 'secondary');

const statusBadgeClass = (status) => (String(status || '').toLowerCase() === 'success' ? 'success' : 'danger');

function formatDateTime(value) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;

  return parsed.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function RecentActivity() {
  const { store } = useCRM();
  const [page, setPage] = useState(1);
  const recentActivities = getRecentActivities(store.activities || []);
  const totalPages = Math.max(1, Math.ceil(recentActivities.length / PAGE_SIZE));
  const visibleRows = recentActivities.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  return (
    <div className="page-fade">
      <div className="page-header">
        <div>
          <h1 className="page-title">Recent Activity</h1>
          <p className="page-subtitle">{recentActivities.length} activity records from the last 12 hours</p>
        </div>
      </div>

      <div className="card">
        <div className="card-toolbar">
          <h3 className="card-title" style={{ margin: 0 }}>System Activity Log</h3>
          <span className="txt-muted txt-sm">Entries older than 12 hours are removed automatically.</span>
        </div>

        <div
          className="table-responsive"
          style={{ overflowX: 'auto', overflowY: 'hidden', WebkitOverflowScrolling: 'touch', scrollBehavior: 'smooth' }}
        >
          <div className="table-container">
            <table className="data-table" style={{ minWidth: 920 }}>
              <thead>
                <tr>
                  <th>Activity ID</th>
                  <th>User Name</th>
                  <th>Action</th>
                  <th>Module</th>
                  <th>Date &amp; Time</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {visibleRows.map((activity) => (
                  <tr key={activity.id}>
                    <td className="fw-600">{`ACT-${activity.id}`}</td>
                    <td>{activity.owner || 'System'}</td>
                    <td>
                      <span className={`badge badge-${actionBadgeClass(activity.action)}`}>{activity.action || 'Created'}</span>
                    </td>
                    <td>{activity.entity ? String(activity.entity).charAt(0).toUpperCase() + String(activity.entity).slice(1) : 'Activity'}</td>
                    <td>{formatDateTime(activity.at)}</td>
                    <td>
                      <span className={`badge badge-${statusBadgeClass(activity.status || 'Success')}`}>{activity.status || 'Success'}</span>
                    </td>
                  </tr>
                ))}
                {!visibleRows.length && (
                  <tr>
                    <td colSpan={6} className="empty-state">
                      <i className="fa fa-clock" />
                      <br />
                      No activity found in the last 12 hours
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div
        className="pagination"
        style={{ marginTop: 12, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 10 }}
      >
        <button className="btn-secondary" disabled={page === 1} onClick={() => setPage((prev) => prev - 1)}>
          Previous
        </button>
        <span>{page} / {totalPages}</span>
        <button className="btn-secondary" disabled={page >= totalPages} onClick={() => setPage((prev) => prev + 1)}>
          Next
        </button>
      </div>
    </div>
  );
}
