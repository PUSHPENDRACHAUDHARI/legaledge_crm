import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCRM } from '../context/CRMContext';

const PlaybookList = () => {
  const navigate = useNavigate();
  const { showToast } = useCRM();
  const [searchTerm, setSearchTerm] = useState('');
  const [ownerFilter, setOwnerFilter] = useState('Any');
  const [selectedRows, setSelectedRows] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(25);

  const playbooks = [
    { id: 1, name: 'Sales Discovery Call', status: 'Published', views: 124, lastViewed: 'Oct 12, 2023', createdBy: 'Shailesh Bhange', modifiedAt: 'Oct 15, 2023' },
    { id: 2, name: 'Technical Demo Guide', status: 'Draft', views: 45, lastViewed: 'Oct 10, 2023', createdBy: 'Nainika Pounikar', modifiedAt: 'Oct 11, 2023' },
    { id: 3, name: 'Onboarding Checklist', status: 'Published', views: 89, lastViewed: 'Oct 14, 2023', createdBy: 'Gaurav Dotonde', modifiedAt: 'Oct 14, 2023' },
    { id: 4, name: 'Follow-up Strategy', status: 'Published', views: 231, lastViewed: 'Oct 15, 2023', createdBy: 'Subodh Badole', modifiedAt: 'Oct 15, 2023' },
    { id: 5, name: 'Cold Outreach Script', status: 'Draft', views: 12, lastViewed: 'Oct 8, 2023', createdBy: 'Shailesh Bhange', modifiedAt: 'Oct 9, 2023' },
    { id: 6, name: 'Renewal Playbook', status: 'Published', views: 67, lastViewed: 'Oct 13, 2023', createdBy: 'Nainika Pounikar', modifiedAt: 'Oct 13, 2023' },
  ];

  const filtered = playbooks.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchOwner = ownerFilter === 'Any' || p.createdBy === 'Shailesh Bhange'; // "Me" = current user mock
    return matchSearch && matchOwner;
  });

  const totalPages = Math.ceil(filtered.length / perPage);
  const paginated = filtered.slice((currentPage - 1) * perPage, currentPage * perPage);

  const toggleRow = (id) => {
    setSelectedRows(prev =>
      prev.includes(id) ? prev.filter(r => r !== id) : [...prev, id]
    );
  };

  const toggleAll = () => {
    if (selectedRows.length === paginated.length) {
      setSelectedRows([]);
    } else {
      setSelectedRows(paginated.map(p => p.id));
    }
  };

  const allSelected = paginated.length > 0 && selectedRows.length === paginated.length;

  const openPlaybookWorkspace = (playbook, mode = 'browse') => {
    navigate('/playbooks', {
      state: {
        playbookAction: mode,
        playbookId: playbook.id,
        playbookName: playbook.name,
      },
    });
  };

  return (
    <div className="page">
      {/* Header */}
      <div className="page-header d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="page-title mb-0">Playbooks</h1>
        </div>
        <div className="page-actions d-flex gap-2">
          <button className="btn btn-outline-secondary" onClick={() => showToast('New folder flow is coming soon.', 'info')}>
            <i className="fa-solid fa-folder-plus me-2"></i> New Folder
          </button>
          <button className="btn btn-primary" onClick={() => { navigate('/playbooks'); showToast('Opening playbooks workspace...'); }}>
            <i className="fa-solid fa-plus me-2"></i> Create Playbook
          </button>
        </div>
      </div>

      {/* Search + Filter */}
      <div className="card mb-3">
        <div className="card-body p-3">
          <div className="row g-3 align-items-center">
            <div className="col-md-4">
              <div className="input-group">
                <span className="input-group-text bg-transparent border-end-0">
                  <i className="fa-solid fa-search text-muted"></i>
                </span>
                <input
                  type="text"
                  className="form-control border-start-0 ps-0"
                  placeholder="Search playbooks..."
                  value={searchTerm}
                  onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                />
              </div>
            </div>
            <div className="col-md-auto ms-md-auto">
              <div className="d-flex align-items-center gap-2">
                <span className="text-muted small">Owner:</span>
                <select
                  className="form-select form-select-sm"
                  style={{ width: 'auto' }}
                  value={ownerFilter}
                  onChange={(e) => { setOwnerFilter(e.target.value); setCurrentPage(1); }}
                >
                  <option value="Any">Any</option>
                  <option value="Me">Me</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card">
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th style={{ width: 40 }} className="ps-3">
                    <input
                      type="checkbox"
                      className="form-check-input"
                      checked={allSelected}
                      onChange={toggleAll}
                    />
                  </th>
                  <th>Name</th>
                  <th>Total Views</th>
                  <th>Last Viewed</th>
                  <th>Created By</th>
                  <th>Modified At</th>
                  <th style={{ width: 60 }}></th>
                </tr>
              </thead>
              <tbody>
                {paginated.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center text-muted py-5">
                      No playbooks found.
                    </td>
                  </tr>
                ) : (
                  paginated.map(p => (
                    <tr key={p.id} className={selectedRows.includes(p.id) ? 'table-active' : ''}>
                      <td className="ps-3">
                        <input
                          type="checkbox"
                          className="form-check-input"
                          checked={selectedRows.includes(p.id)}
                          onChange={() => toggleRow(p.id)}
                        />
                      </td>
                      <td>
                        <div className="d-flex flex-column">
                          <a
                            href="#"
                            className="fw-semibold text-decoration-none text-dark pb-link"
                            onClick={(e) => e.preventDefault()}
                          >
                            {p.name}
                          </a>
                          <span className="mt-1">
                            <span className={`pb-status-dot ${p.status === 'Published' ? 'pb-dot-published' : 'pb-dot-draft'}`}></span>
                            <span className={`small ${p.status === 'Published' ? 'text-success' : 'text-secondary'}`}>
                              {p.status}
                            </span>
                          </span>
                        </div>
                      </td>
                      <td className="text-muted small">{p.views.toLocaleString()}</td>
                      <td className="text-muted small">{p.lastViewed}</td>
                      <td>
                        <div className="d-flex align-items-center gap-2">
                          <div
                            className="rounded-circle d-flex align-items-center justify-content-center text-white small fw-bold pb-avatar"
                            style={{ background: stringToColor(p.createdBy) }}
                          >
                            {initials(p.createdBy)}
                          </div>
                          <span className="small text-muted">{p.createdBy}</span>
                        </div>
                      </td>
                      <td className="text-muted small">{p.modifiedAt}</td>
                      <td>
                        <div className="d-flex gap-1">
                          <button className="btn btn-sm btn-outline-secondary p-1" title="Edit" onClick={() => openPlaybookWorkspace(p, 'edit')}>
                            <i className="fa-solid fa-pen fa-xs"></i>
                          </button>
                          <button className="btn btn-sm btn-outline-secondary p-1" title="More" onClick={() => openPlaybookWorkspace(p, 'browse')}>
                            <i className="fa-solid fa-ellipsis-vertical fa-xs"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        <div className="card-footer bg-white border-top d-flex justify-content-between align-items-center flex-wrap gap-2 py-2 px-3">
          <div className="text-muted small">
            Showing {filtered.length === 0 ? 0 : (currentPage - 1) * perPage + 1}–{Math.min(currentPage * perPage, filtered.length)} of {filtered.length}
          </div>
          <div className="d-flex align-items-center gap-3">
            <div className="d-flex align-items-center gap-2">
              <span className="text-muted small">Per page:</span>
              <select
                className="form-select form-select-sm"
                style={{ width: 'auto' }}
                value={perPage}
                onChange={(e) => { setPerPage(Number(e.target.value)); setCurrentPage(1); }}
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
            </div>
            <nav>
              <ul className="pagination pagination-sm mb-0">
                <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                  <button className="page-link" onClick={() => setCurrentPage(p => Math.max(1, p - 1))}>
                    <i className="fa-solid fa-chevron-left fa-xs"></i>
                  </button>
                </li>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(pg => (
                  <li key={pg} className={`page-item ${currentPage === pg ? 'active' : ''}`}>
                    <button className="page-link" onClick={() => setCurrentPage(pg)}>{pg}</button>
                  </li>
                ))}
                <li className={`page-item ${currentPage === totalPages || totalPages === 0 ? 'disabled' : ''}`}>
                  <button className="page-link" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}>
                    <i className="fa-solid fa-chevron-right fa-xs"></i>
                  </button>
                </li>
              </ul>
            </nav>
          </div>
        </div>
      </div>

      <style jsx>{`
        .pb-link:hover { color: #0d6efd !important; }
        .pb-status-dot {
          display: inline-block;
          width: 7px;
          height: 7px;
          border-radius: 50%;
          margin-right: 5px;
          vertical-align: middle;
        }
        .pb-dot-published { background: #198754; }
        .pb-dot-draft { background: #6c757d; }
        .pb-avatar {
          width: 28px;
          height: 28px;
          min-width: 28px;
          font-size: 11px;
        }
      `}</style>
    </div>
  );
};

function initials(name) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

function stringToColor(str) {
  const colors = ['#4f46e5', '#0891b2', '#059669', '#d97706', '#dc2626', '#7c3aed', '#db2777'];
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

export default PlaybookList;
