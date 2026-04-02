import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCRM } from '../context/CRMContext';
import { initials, AVATAR_COLORS, OWNERS, todayStr } from '../data/store';
import DeleteConfirm from '../components/DeleteConfirm';
import { filterByRole } from '../utils/permissions';
import { contactsAPI } from '../services/api';
import {
  PHONE_ERROR,
  REQUIRED_ERROR,
  isValidEmail,
  isValidPhone,
  required,
  sanitizeDigits,
  sanitizePercentage,
  sanitizePhone,
} from '../utils/formValidation';

const INDUSTRIES = ['Technology', 'Legal', 'Finance', 'Healthcare', 'Retail', 'Manufacturing', 'Education', 'Real Estate', 'Other'];
const DEAL_STAGES = ['New Lead', 'Contacted', 'Proposal', 'Negotiation', 'Closed Won', 'Closed Lost'];

const EMPTY_FORM = {
  fname: '', lname: '', email: '', phone: '', company: '',
  role: '', city: '', industry: '', type: 'Lead', priority: 'Medium', owner: OWNERS[0],
};
const EMPTY_DEAL_FORM = {
  name: '', company: '', contact: '', value: '',
  stage: 'New Lead', closeDate: '', probability: 50, owner: OWNERS[0], sourceContactId: null,
};

const CONTACT_IMPORT_HEADERS = {
  name: ['name', 'full name', 'contact name'],
  fname: ['fname', 'first name', 'firstname'],
  lname: ['lname', 'last name', 'lastname'],
  email: ['email', 'email address'],
  phone: ['phone', 'mobile', 'phone number', 'mobile number'],
  company: ['company', 'company name', 'organization'],
  role: ['role', 'job title', 'designation'],
  city: ['city', 'location'],
  industry: ['industry'],
  type: ['type', 'contact type'],
  priority: ['priority'],
  owner: ['owner'],
  status: ['status'],
};

const csvEscape = (value) => {
  const text = String(value ?? '');
  if (/[",\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
};

const splitCsvLine = (line) => {
  const values = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    const next = line[i + 1];

    if (ch === '"') {
      if (inQuotes && next === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (ch === ',' && !inQuotes) {
      values.push(current.trim());
      current = '';
      continue;
    }

    current += ch;
  }

  values.push(current.trim());
  return values;
};

const normalizeHeader = (value) => String(value || '').trim().toLowerCase();

const getHeaderValue = (row, keys) => {
  for (const key of keys) {
    const match = row[normalizeHeader(key)];
    if (match !== undefined && match !== null && String(match).trim() !== '') {
      return String(match).trim();
    }
  }
  return '';
};

export default function Contacts() {
  const { store, addRecord, addActivity, showToast, currentUser } = useCRM();
  const navigate = useNavigate();
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
  const [dealModalOpen, setDealModalOpen] = useState(false);
  const [dealForm, setDealForm] = useState(EMPTY_DEAL_FORM);
  const [dealErrors, setDealErrors] = useState({});
  const [editingContactId, setEditingContactId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [viewContact, setViewContact] = useState(null);
  const importInputRef = useRef(null);
  const PAGE_SIZE = 20;

  const role = currentUser?.role;
  const canManageContacts = ['admin', 'manager'].includes(role);
  const canDeleteContact = role === 'admin';
  const scopedContacts = filterByRole(items.length ? items : (store.contacts || []), currentUser);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const res = await contactsAPI.getAll({
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
        showToast('Contacts loaded.');
      } catch {
        showToast('Failed to load data.', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [search, page, sortBy, showToast]);

  const rows = scopedContacts.filter((c) => {
    const q = search.toLowerCase();
    const matchQ =
      !q ||
      String(c?.name || '').toLowerCase().includes(q) ||
      String(c?.email || '').toLowerCase().includes(q) ||
      String(c?.company || '').toLowerCase().includes(q);
    const matchF = filter === 'All' || c.type === filter || (filter === 'Active' && c.status === 'active') || (filter === 'Inactive' && c.status === 'inactive');
    return matchQ && matchF;
  });

  const set = (k, v) => {
    setForm((p) => ({ ...p, [k]: v }));
    setErrors((p) => ({ ...p, [k]: '' }));
  };

  const handleEdit = (contact) => {
    const parts = String(contact.name || '').trim().split(/\s+/);
    const fname = parts.shift() || '';
    const lname = parts.join(' ');
    setForm({
      fname,
      lname,
      email: contact.email || '',
      phone: sanitizePhone(contact.phone || ''),
      company: contact.company || '',
      role: contact.role || '',
      city: contact.city || '',
      industry: contact.industry || '',
      type: contact.type || 'Lead',
      priority: contact.priority || 'Medium',
      owner: contact.owner || OWNERS[0],
      status: contact.status,
      created: contact.created,
      lastContact: contact.lastContact,
      teamId: contact.teamId,
      assignedTo: contact.assignedTo,
    });
    setEditingContactId(contact.id);
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    const e = {};
    if (!required(form.fname)) e.fname = REQUIRED_ERROR;
    if (!required(form.lname)) e.lname = REQUIRED_ERROR;
    if (!required(form.email)) e.email = REQUIRED_ERROR;
    else if (!isValidEmail(form.email)) e.email = 'Enter valid email address';
    if (!required(form.phone)) e.phone = REQUIRED_ERROR;
    else if (!isValidPhone(form.phone)) e.phone = PHONE_ERROR;
    if (!required(form.company)) e.company = REQUIRED_ERROR;
    if (Object.keys(e).length) {
      setErrors(e);
      return;
    }

    const payload = {
      name: `${form.fname} ${form.lname}`.trim(),
      email: form.email,
      phone: form.phone,
      company: form.company,
      role: form.role,
      city: form.city,
      industry: form.industry,
      type: form.type,
      priority: form.priority,
      owner: form.owner,
      status: form.status || 'active',
      created: form.created || todayStr(),
      lastContact: todayStr(),
      teamId: form.teamId ?? currentUser?.teamId ?? null,
      assignedTo: form.assignedTo ?? currentUser?.id ?? null,
    };

    try {
      if (editingContactId) {
        const res = await contactsAPI.update(editingContactId, { ...payload, id: editingContactId });
        const updated = res?.data || { ...payload, id: editingContactId };
        setItems((prev) => prev.map((i) => (i.id === editingContactId ? updated : i)));
        addActivity({
          entity: 'contact',
          entityId: editingContactId,
          action: 'updated',
          detail: `Contact ${payload.name} updated`,
          owner: currentUser?.name || payload.owner,
        });
        showToast('Updated successfully.');
      } else {
        const res = await contactsAPI.create(payload);
        const created = res?.data || { ...payload, id: Date.now() };
        setItems((prev) => [created, ...prev]);
        setTotal((prev) => prev + 1);
        addActivity({
          entity: 'contact',
          action: 'created',
          detail: `Contact ${payload.name} created`,
          owner: currentUser?.name || payload.owner,
        });
        showToast('Created successfully.');
      }
      handleClose();
    } catch (err) {
      showToast(err?.message || 'Failed to update.', 'error');
    }
  };

  const handleClose = () => {
    setModalOpen(false);
    setForm(EMPTY_FORM);
    setErrors({});
    setEditingContactId(null);
  };

  const openInboxCompose = (contact) => {
    const email = String(contact?.email || '').trim();
    if (!email) {
      showToast('Contact email is not available.', 'warning');
      return;
    }

    const firstName = String(contact?.name || '').trim().split(' ')[0] || '';
    navigate('/inbox', {
      state: {
        compose: {
          to: email,
          subject: firstName ? `Hello ${firstName}` : 'Hello',
        },
      },
    });
  };

  const setDeal = (k, v) => {
    setDealForm((p) => ({ ...p, [k]: v }));
    setDealErrors((p) => ({ ...p, [k]: '' }));
  };

  const openDealFromContact = (contact) => {
    setDealForm({
      ...EMPTY_DEAL_FORM,
      name: `${contact.company} Opportunity`,
      company: contact.company,
      contact: contact.name || '',
      owner: contact.owner || OWNERS[0],
      sourceContactId: contact.id,
    });
    setDealErrors({});
    setDealModalOpen(true);
  };

  const closeDealModal = () => {
    setDealModalOpen(false);
    setDealForm(EMPTY_DEAL_FORM);
    setDealErrors({});
  };

  const handleCreateDealFromContact = () => {
    const e = {};
    if (!required(dealForm.name)) e.name = REQUIRED_ERROR;
    if (!required(dealForm.company)) e.company = REQUIRED_ERROR;
    if (!required(dealForm.contact)) e.contact = REQUIRED_ERROR;
    if (!required(dealForm.value)) e.value = REQUIRED_ERROR;
    if (!required(dealForm.closeDate)) e.closeDate = REQUIRED_ERROR;
    if (Object.keys(e).length) {
      setDealErrors(e);
      return;
    }

    addRecord('deals', {
      ...dealForm,
      value: parseInt(dealForm.value, 10) || 0,
      probability: parseInt(dealForm.probability, 10) || 0,
      created: todayStr(),
      teamId: currentUser?.teamId ?? null,
      assignedTo: currentUser?.id ?? null,
    });
    addActivity({
      entity: 'deal',
      action: 'created',
      detail: `Deal ${dealForm.name} created from contact`,
      owner: currentUser?.name || dealForm.owner,
    });
    showToast('Deal created from contact successfully!');
    closeDealModal();
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await contactsAPI.delete(deleteTarget.id);
      setItems((prev) => prev.filter((i) => i.id !== deleteTarget.id));
      setTotal((prev) => Math.max(0, prev - 1));
      addActivity({
        entity: 'contact',
        entityId: deleteTarget.id,
        action: 'deleted',
        detail: `Contact ${deleteTarget.name} deleted`,
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

  const handleExportContacts = () => {
    if (!rows.length) {
      showToast('No contacts available to export.', 'info');
      return;
    }

    const headers = ['Name', 'Email', 'Phone', 'Company', 'Role', 'City', 'Industry', 'Type', 'Priority', 'Owner', 'Status'];
    const dataRows = rows.map((contact) => ([
      contact.name,
      contact.email,
      contact.phone,
      contact.company,
      contact.role,
      contact.city,
      contact.industry,
      contact.type,
      contact.priority,
      contact.owner,
      contact.status,
    ].map(csvEscape).join(',')));

    const csv = [headers.join(','), ...dataRows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `contacts-${todayStr()}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast(`Exported ${rows.length} contacts.`);
  };

  const handleImportButtonClick = () => {
    importInputRef.current?.click();
  };

  const handleImportContacts = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';

    if (!file) return;

    try {
      const text = await file.text();
      const lines = text
        .replace(/^\uFEFF/, '')
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean);

      if (lines.length < 2) {
        showToast('Import file is empty or missing rows.', 'warning');
        return;
      }

      const headers = splitCsvLine(lines[0]).map(normalizeHeader);
      const parsedRows = lines.slice(1).map((line) => {
        const cells = splitCsvLine(line);
        return headers.reduce((acc, header, idx) => {
          acc[header] = cells[idx] ?? '';
          return acc;
        }, {});
      });

      const payloads = parsedRows.map((row) => {
        const fullName = getHeaderValue(row, CONTACT_IMPORT_HEADERS.name);
        const firstName = getHeaderValue(row, CONTACT_IMPORT_HEADERS.fname);
        const lastName = getHeaderValue(row, CONTACT_IMPORT_HEADERS.lname);
        const derivedName = fullName || `${firstName} ${lastName}`.trim();
        const email = getHeaderValue(row, CONTACT_IMPORT_HEADERS.email);
        const phone = sanitizePhone(getHeaderValue(row, CONTACT_IMPORT_HEADERS.phone));
        const company = getHeaderValue(row, CONTACT_IMPORT_HEADERS.company);

        if (!derivedName || !email || !phone || !company) return null;
        if (!isValidEmail(email) || !isValidPhone(phone)) return null;

        return {
          name: derivedName,
          email,
          phone,
          company,
          role: getHeaderValue(row, CONTACT_IMPORT_HEADERS.role),
          city: getHeaderValue(row, CONTACT_IMPORT_HEADERS.city),
          industry: getHeaderValue(row, CONTACT_IMPORT_HEADERS.industry),
          type: getHeaderValue(row, CONTACT_IMPORT_HEADERS.type) || 'Lead',
          priority: getHeaderValue(row, CONTACT_IMPORT_HEADERS.priority) || 'Medium',
          owner: getHeaderValue(row, CONTACT_IMPORT_HEADERS.owner) || OWNERS[0],
          status: getHeaderValue(row, CONTACT_IMPORT_HEADERS.status) || 'active',
          created: todayStr(),
          lastContact: todayStr(),
          teamId: currentUser?.teamId ?? null,
          assignedTo: currentUser?.id ?? null,
        };
      }).filter(Boolean);

      if (!payloads.length) {
        showToast('No valid contacts found in the CSV file.', 'warning');
        return;
      }

      const results = await Promise.allSettled(
        payloads.map((payload) => contactsAPI.create(payload))
      );

      const createdContacts = results
        .filter((result) => result.status === 'fulfilled')
        .map((result) => result.value?.data)
        .filter(Boolean);
      const successCount = createdContacts.length;
      const failedCount = payloads.length - successCount;

      if (createdContacts.length) {
        setItems((prev) => [...createdContacts, ...prev]);
        setTotal((prev) => prev + createdContacts.length);
        addActivity({
          entity: 'contact',
          action: 'imported',
          detail: `${createdContacts.length} contacts imported`,
          owner: currentUser?.name || OWNERS[0],
        });
      }

      if (!successCount) {
        showToast('Import failed for all contacts.', 'error');
        return;
      }

      if (failedCount > 0) {
        showToast(`Imported ${successCount} contacts. ${failedCount} rows were skipped.`, 'warning');
        return;
      }

      showToast(`Imported ${successCount} contacts successfully.`);
    } catch (err) {
      showToast(err?.message || 'Failed to import contacts.', 'error');
    }
  };

  return (
    <div className="page-fade">
      <div className="page-header">
        <div>
          <h1 className="page-title">Contacts</h1>
          <p className="page-subtitle">{scopedContacts.length} total | {scopedContacts.filter((c) => c.status === 'active').length} active</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <input
            ref={importInputRef}
            type="file"
            accept=".csv"
            style={{ display: 'none' }}
            onChange={handleImportContacts}
          />
          {canManageContacts && (
            <button className="btn-primary" onClick={() => setModalOpen(true)}>
              <i className="fa fa-plus" /> Add Contact
            </button>
          )}
          <button className="btn-secondary" onClick={handleImportButtonClick}><i className="fa fa-upload" /> Import</button>
          <button className="btn-secondary" onClick={handleExportContacts}><i className="fa fa-download" /> Export</button>
        </div>
      </div>

      <div className="card">
        <div className="card-toolbar">
          <div className="search-box">
            <i className="fa fa-search" />
            <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Search contacts..." />
          </div>
          <div className="filter-tabs">
            {['All', 'Customer', 'Lead', 'Prospect', 'Active', 'Inactive'].map((f) => (
              <button key={f} className={`filter-tab${filter === f ? ' active' : ''}`} onClick={() => setFilter(f)}>{f}</button>
            ))}
          </div>
        </div>

        <div className="table-responsive">
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th onClick={() => handleSort('name')} style={{ cursor:'pointer' }}>Contact</th><th onClick={() => handleSort('company')} style={{ cursor:'pointer' }}>Company</th><th onClick={() => handleSort('industry')} style={{ cursor:'pointer' }}>Industry</th>
                  <th onClick={() => handleSort('type')} style={{ cursor:'pointer' }}>Type</th><th onClick={() => handleSort('priority')} style={{ cursor:'pointer' }}>Priority</th><th onClick={() => handleSort('owner')} style={{ cursor:'pointer' }}>Owner</th><th onClick={() => handleSort('status')} style={{ cursor:'pointer' }}>Status</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr><td colSpan={8} className="empty-state"><i className="fa fa-spinner fa-spin" /><br />Loading contacts...</td></tr>
                )}
                {rows.map((c, i) => (
                  <tr key={c.id} onClick={() => setViewContact(c)} className="clickable-row" style={{ cursor: 'pointer' }}>
                    <td>
                      <div className="contact-cell">
                        <div className={`avatar ${AVATAR_COLORS[i % AVATAR_COLORS.length]}`}>{initials(c.name)}</div>
                        <div>
                          <div className="fw-600">{c.name}</div>
                          <div className="txt-muted txt-sm">{c.email}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="fw-500">{c.company}</div>
                      <div className="txt-muted txt-sm">{c.role} | {c.city}</div>
                    </td>
                    <td>{c.industry}</td>
                    <td><span className={`badge badge-${c.type === 'Customer' ? 'success' : c.type === 'Lead' ? 'warning' : 'info'}`}>{c.type}</span></td>
                    <td><span className={`badge badge-${c.priority === 'High' ? 'danger' : c.priority === 'Medium' ? 'warning' : 'secondary'}`}>{c.priority}</span></td>
                    <td className="txt-sm">{c.owner}</td>
                    <td><span className={`badge badge-${c.status === 'active' ? 'success' : 'secondary'}`}>{c.status}</span></td>
                    <td>
                      <div className="action-btns">
                        <button
                          className="btn-icon"
                          title="Send Email"
                          onClick={(e) => {
                            e.stopPropagation();
                            openInboxCompose(c);
                          }}
                        >
                          <i className="fa fa-envelope" />
                        </button>
                        {canManageContacts && (
                          <>
                            <button className="btn-icon" title="Edit" onClick={(e) => { e.stopPropagation(); handleEdit(c); }}>
                              <i className="fa fa-edit" />
                            </button>
                            <button className="btn-icon" title="Create Deal" onClick={(e) => { e.stopPropagation(); openDealFromContact(c); }}>
                              <i className="fa fa-handshake" />
                            </button>
                          </>
                        )}
                        {canDeleteContact && (
                          <button className="btn-icon btn-icon-danger" title="Delete" onClick={(e) => { e.stopPropagation(); setDeleteTarget(c); }}>
                            <i className="fa fa-trash" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {!rows.length && (
                  <tr><td colSpan={8} className="empty-state">
                    <i className="fa fa-users" /><br />No contacts found
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

      {viewContact && (
        <div className="modal-overlay show" onClick={() => setViewContact(null)} style={{ display: 'flex', justifyContent: 'flex-end', padding: 0 }}>
          <div className="side-panel" onClick={(e) => e.stopPropagation()} style={{ width: 450, background: 'var(--bg-primary)', height: '100%', overflowY: 'auto', padding: '24px', boxShadow: '-5px 0 15px rgba(0,0,0,0.1)', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: 16, marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div className="avatar" style={{ background: 'var(--primary)', color: '#fff', width: 48, height: 48, fontSize: 18 }}>{initials(viewContact.name)}</div>
                <div>
                  <h3 style={{ margin: 0, fontSize: 18, color: 'var(--text-primary)' }}>{viewContact.name}</h3>
                  <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: 13 }}>{viewContact.role} at {viewContact.company}</p>
                </div>
              </div>
              <button className="btn-icon" onClick={() => setViewContact(null)}><i className="fa fa-times" /></button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, flex: 1 }}>
              <div>
                <strong style={{ display: 'block', fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>Email</strong>
                <a href={`mailto:${viewContact.email}`} style={{ color: 'var(--primary)', textDecoration: 'none' }}>{viewContact.email}</a>
              </div>
              <div>
                <strong style={{ display: 'block', fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>Phone</strong>
                <span>{viewContact.phone || '--'}</span>
              </div>
              <div>
                <strong style={{ display: 'block', fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>Company</strong>
                <span>{viewContact.company || '--'}</span>
              </div>
              <div>
                <strong style={{ display: 'block', fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>Industry</strong>
                <span>{viewContact.industry || '--'}</span>
              </div>
              <div>
                <strong style={{ display: 'block', fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>City</strong>
                <span>{viewContact.city || '--'}</span>
              </div>
              <div style={{ display: 'flex', gap: 16 }}>
                <div>
                  <strong style={{ display: 'block', fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>Type</strong>
                  <span className={`badge badge-${viewContact.type === 'Customer' ? 'success' : viewContact.type === 'Lead' ? 'warning' : 'info'}`}>{viewContact.type}</span>
                </div>
                <div>
                  <strong style={{ display: 'block', fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>Priority</strong>
                  <span className={`badge badge-${viewContact.priority === 'High' ? 'danger' : viewContact.priority === 'Medium' ? 'warning' : 'secondary'}`}>{viewContact.priority}</span>
                </div>
              </div>
              <div>
                <strong style={{ display: 'block', fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>Owner</strong>
                <span>{viewContact.owner || '--'}</span>
              </div>
            </div>

            <div style={{ marginTop: 'auto', paddingTop: 24, display: 'flex', gap: 12 }}>
              <button className="btn-primary" style={{ flex: 1 }} onClick={() => { setViewContact(null); handleEdit(viewContact); }}><i className="fa fa-edit" /> Edit</button>
              <button className="btn-secondary" style={{ flex: 1 }} onClick={() => { setViewContact(null); openDealFromContact(viewContact); }}><i className="fa fa-handshake" /> Create Deal</button>
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
                <h3>{editingContactId ? 'Edit Contact' : 'Create Contact'}</h3>
              </div>
              <button className="modal-close" onClick={handleClose} aria-label="Close">&times;</button>
            </div>

            <div className="form-body">
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">First Name <span className="required">*</span></label>
                  <input className={`form-control${errors.fname ? ' is-err' : ''}`} value={form.fname} onChange={(e) => set('fname', e.target.value)} />
                  {errors.fname && <div className="form-error show">{errors.fname}</div>}
                </div>
                <div className="form-group">
                  <label className="form-label">Last Name <span className="required">*</span></label>
                  <input className={`form-control${errors.lname ? ' is-err' : ''}`} value={form.lname} onChange={(e) => set('lname', e.target.value)} />
                  {errors.lname && <div className="form-error show">{errors.lname}</div>}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Email <span className="required">*</span></label>
                <input className={`form-control${errors.email ? ' is-err' : ''}`} type="email" value={form.email} onChange={(e) => set('email', e.target.value)} />
                {errors.email && <div className="form-error show">{errors.email}</div>}
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Phone <span className="required">*</span></label>
                  <input
                    type="tel"
                    className={`form-control${errors.phone ? ' is-err' : ''}`}
                    value={form.phone}
                    onChange={(e) => set('phone', sanitizePhone(e.target.value))}
                    onPaste={(e) => {
                      e.preventDefault();
                      set('phone', sanitizePhone(e.clipboardData.getData('text')));
                    }}
                    placeholder="Enter 10 digit number"
                    maxLength={10}
                  />
                  {errors.phone && <div className="form-error show">{errors.phone}</div>}
                </div>
                <div className="form-group">
                  <label className="form-label">Job Title</label>
                  <input className="form-control" value={form.role} onChange={(e) => set('role', e.target.value)} />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Company <span className="required">*</span></label>
                <input className={`form-control${errors.company ? ' is-err' : ''}`} value={form.company} onChange={(e) => set('company', e.target.value)} />
                {errors.company && <div className="form-error show">{errors.company}</div>}
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">City</label>
                  <input className="form-control" value={form.city} onChange={(e) => set('city', e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Industry</label>
                  <select className="form-control" value={form.industry} onChange={(e) => set('industry', e.target.value)}>
                    <option value="">Select industry</option>
                    {INDUSTRIES.map((i) => <option key={i}>{i}</option>)}
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Type</label>
                  <select className="form-control" value={form.type} onChange={(e) => set('type', e.target.value)}>
                    {['Customer', 'Lead', 'Prospect', 'Partner'].map((t) => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Priority</label>
                  <select className="form-control" value={form.priority} onChange={(e) => set('priority', e.target.value)}>
                    {['High', 'Medium', 'Low'].map((p) => <option key={p}>{p}</option>)}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Owner</label>
                <select className="form-control" value={form.owner} onChange={(e) => set('owner', e.target.value)}>
                  {OWNERS.map((o) => <option key={o}>{o}</option>)}
                </select>
              </div>
            </div>

            <div className="form-actions">
              <button className="btn-secondary" onClick={handleClose}>Cancel</button>
              <button className="btn-primary" onClick={handleSubmit}>
                <i className="fa fa-check" /> {editingContactId ? 'Update Contact' : 'Save Contact'}
              </button>
            </div>
          </div>
        </div>
      )}

      {dealModalOpen && (
        <div className="modal-overlay show" onClick={(e) => { if (e.target.classList.contains('modal-overlay')) closeDealModal(); }}>
          <div className="modal" style={{ maxWidth: 520 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <button className="btn-icon" onClick={closeDealModal} title="Back"><i className="fa fa-arrow-left" /></button>
                <h3>Create Deal</h3>
              </div>
              <button className="modal-close" onClick={closeDealModal} aria-label="Close">&times;</button>
            </div>

            <div className="form-body">
              <div className="form-group">
                <label className="form-label">Deal Name <span className="required">*</span></label>
                <input className={`form-control${dealErrors.name ? ' is-err' : ''}`} value={dealForm.name} onChange={(e) => setDeal('name', e.target.value)} />
                {dealErrors.name && <div className="form-error show">{dealErrors.name}</div>}
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Company <span className="required">*</span></label>
                  <input className={`form-control${dealErrors.company ? ' is-err' : ''}`} value={dealForm.company} onChange={(e) => setDeal('company', e.target.value)} />
                  {dealErrors.company && <div className="form-error show">{dealErrors.company}</div>}
                </div>
                <div className="form-group">
                  <label className="form-label">Contact <span className="required">*</span></label>
                  <input className={`form-control${dealErrors.contact ? ' is-err' : ''}`} value={dealForm.contact} onChange={(e) => setDeal('contact', e.target.value)} />
                  {dealErrors.contact && <div className="form-error show">{dealErrors.contact}</div>}
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Deal Value (INR) <span className="required">*</span></label>
                  <input
                    className={`form-control${dealErrors.value ? ' is-err' : ''}`}
                    type="text"
                    inputMode="numeric"
                    value={dealForm.value}
                    onChange={(e) => setDeal('value', sanitizeDigits(e.target.value))}
                    onPaste={(e) => {
                      e.preventDefault();
                      setDeal('value', sanitizeDigits(e.clipboardData.getData('text')));
                    }}
                  />
                  {dealErrors.value && <div className="form-error show">{dealErrors.value}</div>}
                </div>
                <div className="form-group">
                  <label className="form-label">Pipeline Stage</label>
                  <select className="form-control" value={dealForm.stage} onChange={(e) => setDeal('stage', e.target.value)}>
                    {DEAL_STAGES.map((s) => <option key={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Close Date <span className="required">*</span></label>
                  <input className={`form-control${dealErrors.closeDate ? ' is-err' : ''}`} type="date" value={dealForm.closeDate} onChange={(e) => setDeal('closeDate', e.target.value)} />
                  {dealErrors.closeDate && <div className="form-error show">{dealErrors.closeDate}</div>}
                </div>
                <div className="form-group">
                  <label className="form-label">Win Probability (%)</label>
                  <input
                    className="form-control"
                    type="text"
                    inputMode="numeric"
                    value={dealForm.probability}
                    onChange={(e) => setDeal('probability', sanitizePercentage(e.target.value))}
                    onPaste={(e) => {
                      e.preventDefault();
                      setDeal('probability', sanitizePercentage(e.clipboardData.getData('text')));
                    }}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Owner</label>
                <select className="form-control" value={dealForm.owner} onChange={(e) => setDeal('owner', e.target.value)}>
                  {OWNERS.map((o) => <option key={o}>{o}</option>)}
                </select>
              </div>
            </div>

            <div className="form-actions">
              <button className="btn-secondary" onClick={closeDealModal}>Cancel</button>
              <button className="btn-primary" onClick={handleCreateDealFromContact}>
                <i className="fa fa-check" /> Save Deal
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteTarget && (
        <DeleteConfirm
          title="Delete Contact"
          message={`Are you sure you want to delete ${deleteTarget.name}? This action cannot be undone.`}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={handleDelete}
        />
      )}
    </div>
  );
}

