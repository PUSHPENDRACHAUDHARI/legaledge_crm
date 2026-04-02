import { useCallback, useEffect, useState } from 'react';
import { useCRM } from '../context/CRMContext';
import { OWNERS, todayStr } from '../data/store';
import { filterByRole } from '../utils/permissions';
import DeleteConfirm from '../components/DeleteConfirm';
import { leadsAPI } from '../services/api';
import {
  PHONE_ERROR,
  REQUIRED_ERROR,
  isValidEmail,
  isValidPhone,
  required,
  sanitizePhone,
} from '../utils/formValidation';

const STAGES = ['New', 'Contacted', 'Qualified', 'Negotiation', 'Converted', 'Disqualified'];
const INDUSTRIES = ['Technology', 'Legal', 'Finance', 'Healthcare', 'Retail', 'Manufacturing', 'Education', 'Real Estate', 'Other'];
const TEMP_META = {
  Hot: { icon: 'fa-fire', cls: 'danger' },
  Warm: { icon: 'fa-cloud-sun', cls: 'warning' },
  Cold: { icon: 'fa-snowflake', cls: 'info' },
};

const EMPTY_FORM = {
  name: '', email: '', phone: '', company: '',
  source: '', status: 'New', industry: '', temperature: 'Hot',
  value: '', owner: OWNERS[0], notes: '',
};

const statusBadge = (s) => ({
  New: 'info', Contacted: 'warning', Qualified: 'success',
  Negotiation: 'primary', Converted: 'success', Disqualified: 'secondary',
}[s] || 'secondary');

const normalizeAssignedToValue = (value) => {
  if (value && typeof value === 'object') {
    return value.id ?? value.pk ?? null;
  }
  return value ?? null;
};

export default function Leads() {
  const { store, addRecord, addActivity, showToast, currentUser, refreshEntity } = useCRM();
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [sortBy, setSortBy] = useState('-created');
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('All');
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [editingLeadId, setEditingLeadId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [viewLead, setViewLead] = useState(null);
  const PAGE_SIZE = 20;

  const role = currentUser?.role;
  const canManageLeads = ['admin', 'manager'].includes(role);
  const canDeleteLead = role === 'admin';
  const scopedLeads = filterByRole(items.length ? items : (store.leads || []), currentUser);

  const fetchLeads = useCallback(async ({ background = false } = {}) => {
    if (!background) {
      setLoading(true);
    }

    try {
      const res = await leadsAPI.getAll({
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
    } catch {
      if (!background) {
        showToast('Failed to load data.', 'error');
      }
    } finally {
      if (!background) {
        setLoading(false);
      }
    }
  }, [page, search, showToast, sortBy]);

  useEffect(() => {
    void fetchLeads();
  }, [fetchLeads]);

  useEffect(() => {
    if (!currentUser) return undefined;

    const refreshLeads = () => {
      void fetchLeads({ background: true });
      void refreshEntity('leads').catch(() => {});
    };

    const intervalId = window.setInterval(refreshLeads, 15000);
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        refreshLeads();
      }
    };

    window.addEventListener('focus', handleVisibility);
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener('focus', handleVisibility);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [currentUser, fetchLeads, refreshEntity]);

  const rows = scopedLeads.filter((l) => {
    const q = search.toLowerCase();
    const matchQ =
      !q ||
      String(l?.name || '').toLowerCase().includes(q) ||
      String(l?.company || '').toLowerCase().includes(q);
    const matchF = filter === 'All' || l.status === filter || l.temperature === filter;
    return matchQ && matchF;
  });

  const set = (k, v) => {
    setForm((p) => ({ ...p, [k]: v }));
    setErrors((p) => ({ ...p, [k]: '' }));
  };

  const activityRows = (store.activities || [])
    .filter((a) => a.entity === 'lead')
    .slice()
    .sort((a, b) => new Date(b.at || 0) - new Date(a.at || 0))
    .slice(0, 5);

  const handleEdit = (lead) => {
    setForm({ ...lead, phone: sanitizePhone(lead.phone || '') });
    setEditingLeadId(lead.id);
    setModalOpen(true);
  };

  const buildLeadPayload = (base) => {
    const {
      teamId: _teamId,
      assignedTo: _assignedTo,
      assignedName: _assignedName,
      displayDate: _displayDate,
      ...rest
    } = base;

    return {
      ...rest,
      team_id: base.teamId ?? base.team_id ?? currentUser?.teamId ?? null,
      assigned_to: normalizeAssignedToValue(
        base.assignedTo ?? base.assigned_to ?? currentUser?.id ?? null
      ),
    };
  };

  const handleSubmit = async () => {
    const e = {};
    if (!required(form.name)) e.name = REQUIRED_ERROR;
    if (!required(form.email)) e.email = REQUIRED_ERROR;
    else if (!isValidEmail(form.email)) e.email = 'Enter valid email address';
    if (!required(form.phone)) e.phone = REQUIRED_ERROR;
    else if (!isValidPhone(form.phone)) e.phone = PHONE_ERROR;
    if (!required(form.company)) e.company = REQUIRED_ERROR;
    if (!required(form.source)) e.source = REQUIRED_ERROR;
    if (Object.keys(e).length) {
      setErrors(e);
      return;
    }

    try {
      if (editingLeadId) {
        const res = await leadsAPI.update(editingLeadId, buildLeadPayload({
          ...form,
          id: editingLeadId,
        }));
        const updated = res?.data || { ...form, id: editingLeadId };
        setItems((prev) => prev.map((i) => (i.id === editingLeadId ? updated : i)));
        await refreshEntity('leads');
        addActivity({
          entity: 'lead',
          entityId: editingLeadId,
          action: 'updated',
          detail: `Lead ${form.name} updated`,
          owner: currentUser?.name || form.owner,
        });
        showToast('Updated successfully.');
      } else {
        const res = await leadsAPI.create(buildLeadPayload({
          ...form,
          created: todayStr(),
        }));
        const created = res?.data || { ...form, id: Date.now() };
        setItems((prev) => [created, ...prev]);
        setTotal((prev) => prev + 1);
        await refreshEntity('leads');
        addActivity({
          entity: 'lead',
          action: 'created',
          detail: `Lead ${form.name} added from ${form.source || 'manual'} source`,
          owner: currentUser?.name || form.owner,
        });
        showToast('Created successfully.');
      }
      handleClose();
    } catch (err) {
      showToast(err?.message || 'Failed to save lead.', 'error');
    }
  };

  const handleConvertLead = async (lead) => {
    if (lead.status === 'Converted') {
      showToast('Lead is already converted.');
      return;
    }

    const contactExists = (store.contacts || []).some((c) => {
      const leadPhone = sanitizePhone(lead.phone || '');
      const contactPhone = sanitizePhone(c.phone || '');
      return c.email?.toLowerCase() === lead.email?.toLowerCase() || (leadPhone && contactPhone && leadPhone === contactPhone);
    });

    if (!contactExists) {
      addRecord('contacts', {
        name: lead.name,
        email: lead.email,
        phone: sanitizePhone(lead.phone || ''),
        company: lead.company,
        role: '',
        city: '',
        industry: lead.industry || '',
        type: 'Lead',
        priority: lead.temperature === 'Hot' ? 'High' : lead.temperature === 'Warm' ? 'Medium' : 'Low',
        owner: lead.owner,
        status: 'active',
        created: todayStr(),
        lastContact: todayStr(),
        sourceLeadId: lead.id,
        teamId: lead.teamId ?? currentUser?.teamId ?? null,
        assignedTo: lead.assignedTo ?? currentUser?.id ?? null,
      });
    }

    try {
      const res = await leadsAPI.update(lead.id, buildLeadPayload({
        ...lead,
        status: 'Converted',
        convertedAt: todayStr(),
      }));
      const updated = res?.data || { ...lead, status: 'Converted', convertedAt: todayStr() };
      setItems((prev) => prev.map((i) => (i.id === lead.id ? updated : i)));
      await refreshEntity('leads');
    } catch {
      showToast('Failed to convert lead.', 'error');
      return;
    }
    addActivity({
      entity: 'lead',
      entityId: lead.id,
      action: 'converted',
      detail: `Lead ${lead.name} converted to contact`,
      owner: currentUser?.name || lead.owner,
    });
    addActivity({
      entity: 'contact',
      action: 'created',
      detail: `Contact created from lead ${lead.name}`,
      owner: currentUser?.name || lead.owner,
    });
    showToast('Lead converted to contact successfully!');
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await leadsAPI.delete(deleteTarget.id);
      setItems((prev) => prev.filter((i) => i.id !== deleteTarget.id));
      setTotal((prev) => Math.max(0, prev - 1));
      await refreshEntity('leads');
      addActivity({
        entity: 'lead',
        entityId: deleteTarget.id,
        action: 'deleted',
        detail: `Lead ${deleteTarget.name} deleted`,
        owner: currentUser?.name || deleteTarget.owner,
      });
      showToast('Deleted successfully.');
      setDeleteTarget(null);
    } catch {
      showToast('Failed to delete.', 'error');
    }
  };

  const handleSort = (field) => {
    setSortBy((prev) => (prev === field ? `-${field}` : field));
  };

  const handleClose = () => {
    setModalOpen(false);
    setForm(EMPTY_FORM);
    setErrors({});
    setEditingLeadId(null);
  };

  return (
    <div className="page-fade">
      <div className="page-header">
        <div>
          <h1 className="page-title">Leads</h1>
          <p className="page-subtitle">
            {scopedLeads.length} leads | {scopedLeads.filter((l) => l.temperature === 'Hot').length} hot
          </p>
        </div>
        {canManageLeads && (
          <button className="btn-primary" onClick={() => setModalOpen(true)}>
            <i className="fa fa-plus" /> Add Lead
          </button>
        )}
      </div>

      <div className="card">
        <div className="card-toolbar">
          <div className="search-box">
            <i className="fa fa-search" />
            <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Search leads..." />
          </div>
          <div className="filter-tabs">
            {['All', 'New', 'Contacted', 'Qualified', 'Hot', 'Warm', 'Cold'].map((f) => (
              <button key={f} className={`filter-tab${filter === f ? ' active' : ''}`} onClick={() => setFilter(f)}>{f}</button>
            ))}
          </div>
        </div>

        <div className="table-responsive">
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th onClick={() => handleSort('name')} style={{ cursor:'pointer' }}>Lead</th><th onClick={() => handleSort('source')} style={{ cursor:'pointer' }}>Source</th><th onClick={() => handleSort('industry')} style={{ cursor:'pointer' }}>Industry</th>
                  <th onClick={() => handleSort('temperature')} style={{ cursor:'pointer' }}>Temperature</th><th onClick={() => handleSort('status')} style={{ cursor:'pointer' }}>Status</th><th onClick={() => handleSort('value')} style={{ cursor:'pointer' }}>Value</th><th onClick={() => handleSort('owner')} style={{ cursor:'pointer' }}>Owner</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr><td colSpan={8} className="empty-state"><i className="fa fa-spinner fa-spin" /><br />Loading leads...</td></tr>
                )}
                {rows.map((l) => {
                  const tm = TEMP_META[l.temperature] || TEMP_META.Cold;
                  return (
                    <tr key={l.id} onClick={() => setViewLead(l)} className="clickable-row" style={{ cursor: 'pointer' }}>
                      <td>
                        <div className="fw-600">{l.name}</div>
                        <div className="txt-muted txt-sm">{l.email} | {l.company}</div>
                      </td>
                      <td><span className="badge badge-secondary">{l.source}</span></td>
                      <td>{l.industry}</td>
                      <td><span className={`badge badge-${tm.cls}`}><i className={`fa-solid ${tm.icon}`}></i> {l.temperature}</span></td>
                      <td><span className={`badge badge-${statusBadge(l.status)}`}>{l.status}</span></td>
                      <td className="fw-600" style={{ color: 'var(--success)' }}>INR {l.value}</td>
                      <td className="txt-sm">{l.owner}</td>
                      <td>
                        <div className="action-btns">
                          {canManageLeads && (
                            <>
                              <button
                                className="btn-icon"
                                title="Convert to Contact"
                                onClick={(e) => { e.stopPropagation(); handleConvertLead(l); }}
                                disabled={l.status === 'Converted'}
                              >
                                <i className="fa-solid fa-user-check"></i>
                              </button>
                              <button className="btn-icon" title="Edit" onClick={(e) => { e.stopPropagation(); handleEdit(l); }}><i className="fa-solid fa-pencil"></i></button>
                            </>
                          )}
                            {canDeleteLead && (
                              <button className="btn-icon btn-icon-danger" title="Delete" onClick={(e) => { e.stopPropagation(); setDeleteTarget(l); }}>
                                <i className="fa fa-trash" />
                              </button>
                            )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {!rows.length && (
                  <tr><td colSpan={8} className="empty-state">
                    <i className="fa fa-user-plus" /><br />No leads found
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="pagination" style={{ marginTop: 12, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 10 }}>
        <button className="btn-secondary" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>Previous</button>
        <span>{page} / {Math.max(1, Math.ceil(total / PAGE_SIZE))}</span>
        <button className="btn-secondary" disabled={page >= Math.max(1, Math.ceil(total / PAGE_SIZE))} onClick={() => setPage((p) => p + 1)}>Next</button>
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <div className="card-toolbar">
          <h3 className="card-title" style={{ margin: 0 }}>Lead Activity</h3>
        </div>
        {!activityRows.length ? (
          <div className="empty-state">
            <i className="fa fa-clock-rotate-left" /><br />No lead activity yet
          </div>
        ) : (
          <div style={{ padding: '0 16px 16px', display: 'grid', gap: 10 }}>
            {activityRows.map((a) => (
              <div key={a.id} style={{ border: '1px solid var(--border)', borderRadius: 8, padding: '10px 12px' }}>
                <div className="fw-600 txt-sm">{a.detail}</div>
                <div className="txt-muted txt-sm">{a.owner} | {new Date(a.at).toLocaleString()}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {modalOpen && (
        <div className="modal-overlay show" onClick={(e) => { if (e.target.classList.contains('modal-overlay')) handleClose(); }}>
          <div className="modal" style={{ maxWidth: 520 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <button className="btn-icon" onClick={handleClose} title="Back"><i className="fa fa-arrow-left" /></button>
                <h3>{editingLeadId ? 'Edit Lead' : 'Create Lead'}</h3>
              </div>
              <button className="modal-close" onClick={handleClose} aria-label="Close">&times;</button>
            </div>

            <div className="form-body">
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Lead Name <span className="required">*</span></label>
                  <input className={`form-control${errors.name ? ' is-err' : ''}`} value={form.name} onChange={(e) => set('name', e.target.value)} />
                  {errors.name && <div className="form-error show">{errors.name}</div>}
                </div>
                <div className="form-group">
                  <label className="form-label">Email <span className="required">*</span></label>
                  <input className={`form-control${errors.email ? ' is-err' : ''}`} type="email" value={form.email} onChange={(e) => set('email', e.target.value)} />
                  {errors.email && <div className="form-error show">{errors.email}</div>}
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Phone <span className="required">*</span></label>
                  <input
                    className={`form-control${errors.phone ? ' is-err' : ''}`}
                    type="tel"
                    inputMode="numeric"
                    maxLength={10}
                    value={form.phone}
                    onChange={(e) => set('phone', sanitizePhone(e.target.value))}
                    onPaste={(e) => {
                      e.preventDefault();
                      set('phone', sanitizePhone(e.clipboardData.getData('text')));
                    }}
                  />
                  {errors.phone && <div className="form-error show">{errors.phone}</div>}
                </div>
                <div className="form-group">
                  <label className="form-label">Company <span className="required">*</span></label>
                  <input className={`form-control${errors.company ? ' is-err' : ''}`} value={form.company} onChange={(e) => set('company', e.target.value)} />
                  {errors.company && <div className="form-error show">{errors.company}</div>}
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Lead Source <span className="required">*</span></label>
                  <select className={`form-control${errors.source ? ' is-err' : ''}`} value={form.source} onChange={(e) => set('source', e.target.value)}>
                    <option value="">Select source</option>
                    {['Website', 'Referral', 'LinkedIn', 'Email Campaign', 'Event', 'Cold Call', 'Social Media', 'Walk-in'].map((s) => <option key={s}>{s}</option>)}
                  </select>
                  {errors.source && <div className="form-error show">{errors.source}</div>}
                </div>
                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select className="form-control" value={form.status} onChange={(e) => set('status', e.target.value)}>
                    {STAGES.map((s) => <option key={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Industry</label>
                  <select className="form-control" value={form.industry} onChange={(e) => set('industry', e.target.value)}>
                    <option value="">Select industry</option>
                    {INDUSTRIES.map((i) => <option key={i}>{i}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Temperature</label>
                  <select className="form-control" value={form.temperature} onChange={(e) => set('temperature', e.target.value)}>
                    {['Hot', 'Warm', 'Cold'].map((t) => <option key={t}>{t}</option>)}
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Est. Value (INR)</label>
                  <input className="form-control" type="number" value={form.value} onChange={(e) => set('value', e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Owner</label>
                  <select className="form-control" value={form.owner} onChange={(e) => set('owner', e.target.value)}>
                    {OWNERS.map((o) => <option key={o}>{o}</option>)}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Notes</label>
                <textarea className="form-control" rows={2} value={form.notes} onChange={(e) => set('notes', e.target.value)} />
              </div>
            </div>

            <div className="form-actions">
              <button className="btn-secondary" onClick={handleClose}>Cancel</button>
              <button className="btn-primary" onClick={handleSubmit}>
                <i className="fa fa-check" /> {editingLeadId ? 'Update Lead' : 'Save Lead'}
              </button>
            </div>
          </div>
        </div>
      )}

      {viewLead && (
        <div className="modal-overlay show" onClick={() => setViewLead(null)} style={{ display: 'flex', justifyContent: 'flex-end', padding: 0 }}>
          <div className="side-panel" onClick={(e) => e.stopPropagation()} style={{ width: 450, background: 'var(--bg-primary)', height: '100%', overflowY: 'auto', padding: '24px', boxShadow: '-5px 0 15px rgba(0,0,0,0.1)', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: 16, marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: 18, color: 'var(--text-primary)' }}>{viewLead.name}</h3>
                  <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: 13 }}>{viewLead.company}</p>
                </div>
              </div>
              <button className="btn-icon" onClick={() => setViewLead(null)}><i className="fa fa-times" /></button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, flex: 1 }}>
              <div>
                <strong style={{ display: 'block', fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>Email</strong>
                <a href={`mailto:${viewLead.email}`} style={{ color: 'var(--primary)', textDecoration: 'none' }}>{viewLead.email}</a>
              </div>
              <div>
                <strong style={{ display: 'block', fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>Phone</strong>
                <span>{viewLead.phone || '--'}</span>
              </div>
              <div>
                <strong style={{ display: 'block', fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>Company</strong>
                <span>{viewLead.company || '--'}</span>
              </div>
              <div>
                <strong style={{ display: 'block', fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>Industry</strong>
                <span>{viewLead.industry || '--'}</span>
              </div>
              <div>
                <strong style={{ display: 'block', fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>Source</strong>
                <span className="badge badge-secondary">{viewLead.source || '--'}</span>
              </div>
              <div style={{ display: 'flex', gap: 16 }}>
                <div>
                  <strong style={{ display: 'block', fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>Status</strong>
                  <span className={`badge badge-${statusBadge(viewLead.status)}`}>{viewLead.status}</span>
                </div>
                <div>
                  <strong style={{ display: 'block', fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>Temperature</strong>
                  <span className={`badge badge-${(TEMP_META[viewLead.temperature] || TEMP_META.Cold).cls}`}><i className={`fa-solid ${(TEMP_META[viewLead.temperature] || TEMP_META.Cold).icon}`}></i> {viewLead.temperature}</span>
                </div>
              </div>
              <div>
                <strong style={{ display: 'block', fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>Owner</strong>
                <span>{viewLead.owner || '--'}</span>
              </div>
            </div>

            <div style={{ marginTop: 'auto', paddingTop: 24, display: 'flex', gap: 12 }}>
              <button className="btn-primary" style={{ flex: 1 }} onClick={() => { setViewLead(null); handleEdit(viewLead); }}><i className="fa fa-edit" /> Edit</button>
              {viewLead.status !== 'Converted' && (
                <button className="btn-secondary" style={{ flex: 1 }} onClick={() => { setViewLead(null); handleConvertLead(viewLead); }}><i className="fa-solid fa-user-check" /> Convert</button>
              )}
            </div>
          </div>
        </div>
      )}

      {deleteTarget && (
        <DeleteConfirm
          title="Delete Lead"
          message={`Are you sure you want to delete ${deleteTarget.name}? This action cannot be undone.`}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={handleDelete}
        />
      )}
    </div>
  );
}
