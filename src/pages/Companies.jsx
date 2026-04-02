import { useCallback, useEffect, useState } from 'react';
import { useCRM } from '../context/CRMContext';
import { OWNERS } from '../data/store';
import { companiesAPI } from '../services/api';
import { can as canAction } from '../utils/permissions';

const INDUSTRIES = ['Technology', 'Legal', 'Finance', 'Healthcare', 'Retail', 'Manufacturing', 'Education', 'Real Estate', 'Other'];
const SIZES = ['', '1-10', '11-50', '50-200', '200-500', '500-1000', '1000+'];
const STATUSES = ['Lead', 'Prospect', 'Customer', 'Partner'];

const EMPTY_FORM = {
  name: '',
  industry: '',
  size: '',
  city: '',
  website: '',
  revenue: '',
  status: 'Lead',
  owner: OWNERS[0],
};

const buildEmptyForm = (ownerName = OWNERS[0]) => ({
  ...EMPTY_FORM,
  owner: ownerName || OWNERS[0],
});

const actionCellStyle = {
  minWidth: 116,
  width: 116,
  textAlign: 'center',
};

export default function Companies() {
  const { store, showToast, currentUser, refreshEntity } = useCRM();
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [sortBy, setSortBy] = useState('-created');
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('All');
  const [modalOpen, setModalOpen] = useState(false);
  const [viewCompany, setViewCompany] = useState(null);
  const [editingCompanyId, setEditingCompanyId] = useState(null);
  const [form, setForm] = useState(() => buildEmptyForm(currentUser?.name));
  const [errors, setErrors] = useState({});
  const PAGE_SIZE = 20;

  const canDeleteCompany = canAction(currentUser?.role, 'canDeleteRecord');
  const canAssignCompany = canAction(currentUser?.role, 'canAssignRecord');
  const canEditCompany = canAction(currentUser?.role, 'canEditRecord');

  const fetchCompanies = useCallback(async ({ withToast = false } = {}) => {
    setLoading(true);
    try {
      const res = await companiesAPI.getAll({
        search,
        page,
        ordering: sortBy,
        page_size: PAGE_SIZE,
      });
      const payload = res?.data;
      const results = Array.isArray(payload?.results) ? payload.results : (Array.isArray(payload) ? payload : []);
      const count = Number(payload?.count ?? results.length ?? 0);
      setItems(results);
      setTotal(count);
      if (withToast) showToast('Companies loaded.');
    } catch {
      showToast('Failed to load data.', 'error');
    } finally {
      setLoading(false);
    }
  }, [page, search, showToast, sortBy]);

  useEffect(() => {
    void fetchCompanies();
  }, [fetchCompanies]);

  const filtered = (items.length ? items : store.companies).filter((company) => {
    const q = search.toLowerCase();
    const matchQ =
      !q ||
      String(company?.name || '').toLowerCase().includes(q) ||
      String(company?.industry || '').toLowerCase().includes(q) ||
      String(company?.city || '').toLowerCase().includes(q);
    const matchF =
      filter === 'All' ||
      company.status === filter ||
      (filter === 'Active' && company.status !== 'Inactive');
    return matchQ && matchF;
  });

  const setField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: '' }));
  };

  const openCreateModal = () => {
    setEditingCompanyId(null);
    setForm(buildEmptyForm(currentUser?.name));
    setErrors({});
    setModalOpen(true);
  };

  const openEditModal = (company) => {
    setEditingCompanyId(company.id);
    setForm({
      name: company.name || '',
      industry: company.industry || '',
      size: company.size || '',
      city: company.city || '',
      website: company.website || '',
      revenue: company.revenue || '',
      status: company.status || 'Lead',
      owner: company.owner || currentUser?.name || OWNERS[0],
    });
    setErrors({});
    setModalOpen(true);
  };

  const handleClose = () => {
    setModalOpen(false);
    setEditingCompanyId(null);
    setForm(buildEmptyForm(currentUser?.name));
    setErrors({});
  };

  const handleSaveCompany = async () => {
    const nextErrors = {};
    if (!form.name.trim()) nextErrors.name = 'Company name is required';
    if (!form.industry) nextErrors.industry = 'Industry is required';
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      return;
    }

    try {
      const payload = {
        ...form,
        owner: canAssignCompany ? form.owner : (currentUser?.name || form.owner),
      };

      if (editingCompanyId) {
        await companiesAPI.update(editingCompanyId, payload);
        showToast('Updated successfully.');
      } else {
        await companiesAPI.create({ ...payload, contacts: 0, deals: 0 });
        showToast('Created successfully.');
      }

      await fetchCompanies();
      await refreshEntity('companies');
      handleClose();
    } catch {
      showToast(`Failed to ${editingCompanyId ? 'update' : 'create'}.`, 'error');
    }
  };

  const handleDeleteCompany = async (id) => {
    try {
      await companiesAPI.delete(id);
      await fetchCompanies();
      await refreshEntity('companies');
      showToast('Deleted successfully.');
    } catch {
      showToast('Failed to delete.', 'error');
    }
  };

  const statusBadge = (status) => ({
    Customer: 'success',
    Prospect: 'info',
    Lead: 'warning',
    Inactive: 'secondary',
  }[status] || 'secondary');

  const handleSort = (field) => {
    setSortBy((prev) => (prev === field ? `-${field}` : field));
  };

  return (
    <div className="page-fade">
      <div className="page-header">
        <div>
          <h1 className="page-title">Companies</h1>
          <p className="page-subtitle">{total || store.companies.length} companies</p>
        </div>
        <button className="btn-primary" onClick={openCreateModal}>
          <i className="fa fa-plus" /> Add Company
        </button>
      </div>

      <div className="card">
        <div className="card-toolbar">
          <div className="search-box">
            <i className="fa fa-search" />
            <input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search companies..."
            />
          </div>
          <div className="filter-tabs">
            {['All', 'Customer', 'Lead', 'Prospect', 'Active', 'Inactive'].map((value) => (
              <button key={value} className={`filter-tab${filter === value ? ' active' : ''}`} onClick={() => setFilter(value)}>
                {value}
              </button>
            ))}
          </div>
        </div>

        <div className="table-responsive" style={{ overflowX: 'auto', overflowY: 'hidden', WebkitOverflowScrolling: 'touch', scrollBehavior: 'smooth' }}>
          <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th onClick={() => handleSort('name')} style={{ cursor: 'pointer' }}>Company</th>
                <th onClick={() => handleSort('industry')} style={{ cursor: 'pointer' }}>Industry</th>
                <th onClick={() => handleSort('size')} style={{ cursor: 'pointer' }}>Size</th>
                <th onClick={() => handleSort('city')} style={{ cursor: 'pointer' }}>City</th>
                <th onClick={() => handleSort('revenue')} style={{ cursor: 'pointer' }}>Revenue</th>
                <th onClick={() => handleSort('contacts')} style={{ cursor: 'pointer' }}>Contacts</th>
                <th onClick={() => handleSort('deals')} style={{ cursor: 'pointer' }}>Deals</th>
                <th onClick={() => handleSort('status')} style={{ cursor: 'pointer' }}>Status</th>
                <th onClick={() => handleSort('owner')} style={{ cursor: 'pointer' }}>Owner</th>
                <th style={actionCellStyle}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={10} className="empty-state">
                    <i className="fa fa-spinner fa-spin" />
                    <br />
                    Loading companies...
                  </td>
                </tr>
              )}
              {!loading && filtered.map((company) => (
                <tr key={company.id}>
                  <td>
                    <div className="fw-600">{company.name}</div>
                    <div className="txt-muted txt-sm">{company.website}</div>
                  </td>
                  <td>{company.industry}</td>
                  <td>{company.size}</td>
                  <td>{company.city}</td>
                  <td>{company.revenue}</td>
                  <td>{company.contacts}</td>
                  <td>{company.deals}</td>
                  <td><span className={`badge badge-${statusBadge(company.status)}`}>{company.status}</span></td>
                  <td className="txt-sm">{company.owner}</td>
                  <td style={actionCellStyle}>
                    <div className="action-btns">
                      {canEditCompany && (
                        <button className="btn-icon view" title="View" onClick={() => setViewCompany(company)}>
                          <i className="fa fa-eye" />
                        </button>
                      )}
                      {canEditCompany && (
                        <button className="btn-icon" title="Edit" onClick={() => openEditModal(company)}>
                          <i className="fa fa-pen" />
                        </button>
                      )}
                      {canDeleteCompany && (
                        <button className="btn-icon btn-icon-danger" title="Delete" onClick={() => { void handleDeleteCompany(company.id); }}>
                          <i className="fa fa-trash" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {!loading && !filtered.length && (
                <tr>
                  <td colSpan={10} className="empty-state">
                    <i className="fa fa-building" />
                    <br />
                    No companies found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          </div>
        </div>
      </div>

      <div className="pagination" style={{ marginTop: 12, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 10 }}>
        <button className="btn-secondary" disabled={page === 1} onClick={() => setPage((prev) => prev - 1)}>Previous</button>
        <span>{page} / {Math.max(1, Math.ceil(total / PAGE_SIZE))}</span>
        <button className="btn-secondary" disabled={page >= Math.max(1, Math.ceil(total / PAGE_SIZE))} onClick={() => setPage((prev) => prev + 1)}>Next</button>
      </div>

      {viewCompany && (
        <div className="modal-overlay show" onClick={(e) => { if (e.target.classList.contains('modal-overlay')) setViewCompany(null); }}>
          <div className="modal" style={{ maxWidth: 520 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Company Details</h3>
              <button className="modal-close" onClick={() => setViewCompany(null)}>&times;</button>
            </div>
            <div className="form-body">
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Company</label>
                  <input className="form-control" value={viewCompany.name || ''} readOnly />
                </div>
                <div className="form-group">
                  <label className="form-label">Industry</label>
                  <input className="form-control" value={viewCompany.industry || ''} readOnly />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Size</label>
                  <input className="form-control" value={viewCompany.size || ''} readOnly />
                </div>
                <div className="form-group">
                  <label className="form-label">City</label>
                  <input className="form-control" value={viewCompany.city || ''} readOnly />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Revenue</label>
                  <input className="form-control" value={viewCompany.revenue || ''} readOnly />
                </div>
                <div className="form-group">
                  <label className="form-label">Status</label>
                  <input className="form-control" value={viewCompany.status || ''} readOnly />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Contacts</label>
                  <input className="form-control" value={String(viewCompany.contacts ?? '')} readOnly />
                </div>
                <div className="form-group">
                  <label className="form-label">Deals</label>
                  <input className="form-control" value={String(viewCompany.deals ?? '')} readOnly />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Owner</label>
                  <input className="form-control" value={viewCompany.owner || ''} readOnly />
                </div>
                <div className="form-group">
                  <label className="form-label">Website</label>
                  <input className="form-control" value={viewCompany.website || ''} readOnly />
                </div>
              </div>
            </div>
            <div className="form-actions">
              <button className="btn-secondary" onClick={() => setViewCompany(null)}>Close</button>
              {canEditCompany && (
                <button
                  className="btn-primary"
                  onClick={() => {
                    const target = viewCompany;
                    setViewCompany(null);
                    openEditModal(target);
                  }}
                >
                  <i className="fa fa-pen" /> Edit Company
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {modalOpen && (
        <div className="modal-overlay show" onClick={(e) => { if (e.target.classList.contains('modal-overlay')) handleClose(); }}>
          <div className="modal" style={{ maxWidth: 520 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <button className="btn-icon" onClick={handleClose} title="Back"><i className="fa fa-arrow-left" /></button>
                <h3>{editingCompanyId ? 'Edit Company' : 'Create Company'}</h3>
              </div>
              <button className="modal-close" onClick={handleClose}>&times;</button>
            </div>

            <div className="form-body">
              <div className="form-group">
                <label className="form-label">Company Name <span className="required">*</span></label>
                <input className={`form-control${errors.name ? ' is-err' : ''}`} value={form.name} onChange={(e) => setField('name', e.target.value)} />
                {errors.name && <div className="form-error show">{errors.name}</div>}
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Industry <span className="required">*</span></label>
                  <select className={`form-control${errors.industry ? ' is-err' : ''}`} value={form.industry} onChange={(e) => setField('industry', e.target.value)}>
                    <option value="">Select industry</option>
                    {INDUSTRIES.map((industry) => <option key={industry}>{industry}</option>)}
                  </select>
                  {errors.industry && <div className="form-error show">{errors.industry}</div>}
                </div>
                <div className="form-group">
                  <label className="form-label">Size</label>
                  <select className="form-control" value={form.size} onChange={(e) => setField('size', e.target.value)}>
                    {SIZES.map((size) => <option key={size}>{size}</option>)}
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">City</label>
                  <input className="form-control" value={form.city} onChange={(e) => setField('city', e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Website</label>
                  <input className="form-control" value={form.website} onChange={(e) => setField('website', e.target.value)} />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Annual Revenue</label>
                  <input className="form-control" value={form.revenue} onChange={(e) => setField('revenue', e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select className="form-control" value={form.status} onChange={(e) => setField('status', e.target.value)}>
                    {STATUSES.map((status) => <option key={status}>{status}</option>)}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Owner</label>
                {canAssignCompany ? (
                  <select className="form-control" value={form.owner} onChange={(e) => setField('owner', e.target.value)}>
                    {OWNERS.map((owner) => <option key={owner}>{owner}</option>)}
                  </select>
                ) : (
                  <input className="form-control" value={currentUser?.name || form.owner} readOnly />
                )}
              </div>
            </div>

            <div className="form-actions">
              <button className="btn-secondary" onClick={handleClose}>Cancel</button>
              <button className="btn-primary" onClick={handleSaveCompany}>
                <i className="fa fa-check" /> {editingCompanyId ? 'Update Company' : 'Save Company'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
