import { useState } from 'react';
import { useCRM } from '../context/CRMContext';
import { OWNERS, INDUSTRIES, todayStr } from '../data/store';
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

const Select = ({ label, req, options, error, ...p }) => (
  <div className="form-group">
    <label className="form-label">
      {label}
      {req && <span className="required"> *</span>}
    </label>
    <select className={`form-control${error ? ' is-err' : ''}`} {...p}>
      {options.map((o) =>
        typeof o === 'string' ? (
          <option key={o}>{o}</option>
        ) : (
          <option key={o.v} value={o.v}>
            {o.l}
          </option>
        ),
      )}
    </select>
    {error && <div className="form-error show">{error}</div>}
  </div>
);

function ContactForm({ onSave, onCancel }) {
  const [f, setF] = useState({
    fname: '',
    lname: '',
    email: '',
    phone: '',
    company: '',
    role: '',
    city: '',
    industry: '',
    type: 'Lead',
    priority: 'Medium',
    owner: OWNERS[0],
  });
  const [err, setErr] = useState({});

  const s = (k) => (v) => {
    setF((p) => ({ ...p, [k]: v }));
    setErr((p) => ({ ...p, [k]: '' }));
  };

  function submit() {
    const e = {};
    if (!required(f.fname)) e.fname = REQUIRED_ERROR;
    if (!required(f.lname)) e.lname = REQUIRED_ERROR;
    if (!required(f.email)) e.email = REQUIRED_ERROR;
    else if (!isValidEmail(f.email)) e.email = 'Enter valid email address';
    if (!required(f.phone)) e.phone = REQUIRED_ERROR;
    else if (!isValidPhone(f.phone)) e.phone = PHONE_ERROR;
    if (!required(f.company)) e.company = REQUIRED_ERROR;

    if (Object.keys(e).length) {
      setErr(e);
      return;
    }

    onSave({
      name: `${f.fname} ${f.lname}`,
      email: f.email,
      phone: f.phone,
      company: f.company,
      role: f.role,
      city: f.city,
      industry: f.industry,
      type: f.type,
      priority: f.priority,
      owner: f.owner,
      status: 'active',
      created: todayStr(),
      lastContact: todayStr(),
    });
  }

  return (
    <>
      <div className="form-row">
        <div className="form-group">
          <label className="form-label">First Name <span className="required">*</span></label>
          <input className={`form-control${err.fname ? ' is-err' : ''}`} value={f.fname} onChange={(e) => s('fname')(e.target.value)} placeholder="e.g. Rahul" />
          {err.fname && <div className="form-error show">{err.fname}</div>}
        </div>
        <div className="form-group">
          <label className="form-label">Last Name <span className="required">*</span></label>
          <input className={`form-control${err.lname ? ' is-err' : ''}`} value={f.lname} onChange={(e) => s('lname')(e.target.value)} placeholder="e.g. Sharma" />
          {err.lname && <div className="form-error show">{err.lname}</div>}
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">Email <span className="required">*</span></label>
        <input className={`form-control${err.email ? ' is-err' : ''}`} type="email" value={f.email} onChange={(e) => s('email')(e.target.value)} placeholder="email@company.com" />
        {err.email && <div className="form-error show">{err.email}</div>}
      </div>

      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Phone <span className="required">*</span></label>
          <input
            className={`form-control${err.phone ? ' is-err' : ''}`}
            type="tel"
            inputMode="numeric"
            maxLength={10}
            value={f.phone}
            onChange={(e) => s('phone')(sanitizePhone(e.target.value))}
            onPaste={(e) => {
              e.preventDefault();
              s('phone')(sanitizePhone(e.clipboardData.getData('text')));
            }}
            placeholder="Enter 10 digit number"
          />
          {err.phone && <div className="form-error show">{err.phone}</div>}
        </div>
        <div className="form-group">
          <label className="form-label">Job Title</label>
          <input className="form-control" value={f.role} onChange={(e) => s('role')(e.target.value)} placeholder="e.g. CEO" />
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">Company <span className="required">*</span></label>
        <input className={`form-control${err.company ? ' is-err' : ''}`} value={f.company} onChange={(e) => s('company')(e.target.value)} placeholder="Company name" />
        {err.company && <div className="form-error show">{err.company}</div>}
      </div>

      <div className="form-row">
        <div className="form-group">
          <label className="form-label">City</label>
          <input className="form-control" value={f.city} onChange={(e) => s('city')(e.target.value)} placeholder="e.g. Mumbai" />
        </div>
        <Select label="Industry" options={[{ v: '', l: 'Select industry' }, ...INDUSTRIES.map((i) => ({ v: i, l: i }))]} value={f.industry} onChange={(e) => s('industry')(e.target.value)} />
      </div>

      <div className="form-row">
        <Select label="Type" options={['Customer', 'Lead', 'Prospect', 'Partner']} value={f.type} onChange={(e) => s('type')(e.target.value)} />
        <Select label="Priority" options={['High', 'Medium', 'Low']} value={f.priority} onChange={(e) => s('priority')(e.target.value)} />
      </div>

      <Select label="Owner" options={OWNERS} value={f.owner} onChange={(e) => s('owner')(e.target.value)} />

      <div className="form-actions">
        <button className="btn-secondary" onClick={onCancel}>Cancel</button>
        <button className="btn-primary" onClick={submit}><i className="fa fa-check" /> Save Contact</button>
      </div>
    </>
  );
}

function LeadForm({ onSave, onCancel }) {
  const [f, setF] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    source: '',
    status: 'New',
    industry: '',
    temperature: 'Hot',
    value: '',
    owner: OWNERS[0],
    notes: '',
  });
  const [err, setErr] = useState({});

  const s = (k) => (v) => {
    setF((p) => ({ ...p, [k]: v }));
    setErr((p) => ({ ...p, [k]: '' }));
  };

  function submit() {
    const e = {};
    if (!required(f.name)) e.name = REQUIRED_ERROR;
    if (!required(f.email)) e.email = REQUIRED_ERROR;
    else if (!isValidEmail(f.email)) e.email = 'Enter valid email address';
    if (!required(f.phone)) e.phone = REQUIRED_ERROR;
    else if (!isValidPhone(f.phone)) e.phone = PHONE_ERROR;
    if (!required(f.company)) e.company = REQUIRED_ERROR;
    if (!required(f.source)) e.source = REQUIRED_ERROR;

    if (Object.keys(e).length) {
      setErr(e);
      return;
    }

    onSave({ ...f, created: todayStr() });
  }

  return (
    <>
      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Lead Name <span className="required">*</span></label>
          <input className={`form-control${err.name ? ' is-err' : ''}`} value={f.name} onChange={(e) => s('name')(e.target.value)} placeholder="Full name" />
          {err.name && <div className="form-error show">{err.name}</div>}
        </div>
        <div className="form-group">
          <label className="form-label">Email <span className="required">*</span></label>
          <input className={`form-control${err.email ? ' is-err' : ''}`} type="email" value={f.email} onChange={(e) => s('email')(e.target.value)} placeholder="email@company.com" />
          {err.email && <div className="form-error show">{err.email}</div>}
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Phone <span className="required">*</span></label>
          <input
            className={`form-control${err.phone ? ' is-err' : ''}`}
            type="tel"
            inputMode="numeric"
            maxLength={10}
            value={f.phone}
            onChange={(e) => s('phone')(sanitizePhone(e.target.value))}
            onPaste={(e) => {
              e.preventDefault();
              s('phone')(sanitizePhone(e.clipboardData.getData('text')));
            }}
            placeholder="Enter 10 digit number"
          />
          {err.phone && <div className="form-error show">{err.phone}</div>}
        </div>
        <div className="form-group">
          <label className="form-label">Company <span className="required">*</span></label>
          <input className={`form-control${err.company ? ' is-err' : ''}`} value={f.company} onChange={(e) => s('company')(e.target.value)} />
          {err.company && <div className="form-error show">{err.company}</div>}
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Lead Source <span className="required">*</span></label>
          <select className={`form-control${err.source ? ' is-err' : ''}`} value={f.source} onChange={(e) => s('source')(e.target.value)}>
            <option value="">Select source</option>
            {['Website', 'Referral', 'LinkedIn', 'Email Campaign', 'Event', 'Cold Call', 'Social Media', 'Walk-in'].map((o) => (
              <option key={o}>{o}</option>
            ))}
          </select>
          {err.source && <div className="form-error show">{err.source}</div>}
        </div>
        <Select label="Status" options={['New', 'Contacted', 'Qualified', 'Negotiation', 'Converted', 'Disqualified']} value={f.status} onChange={(e) => s('status')(e.target.value)} />
      </div>

      <div className="form-row">
        <Select label="Industry" options={[{ v: '', l: 'Select industry' }, ...INDUSTRIES.map((i) => ({ v: i, l: i }))]} value={f.industry} onChange={(e) => s('industry')(e.target.value)} />
        <Select label="Temperature" options={['Hot', 'Warm', 'Cold']} value={f.temperature} onChange={(e) => s('temperature')(e.target.value)} />
      </div>

      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Est. Value (INR)</label>
          <input className="form-control" type="number" value={f.value} onChange={(e) => s('value')(e.target.value)} placeholder="e.g. 250000" />
        </div>
        <Select label="Owner" options={OWNERS} value={f.owner} onChange={(e) => s('owner')(e.target.value)} />
      </div>

      <div className="form-group">
        <label className="form-label">Notes</label>
        <textarea className="form-control" rows={3} value={f.notes} onChange={(e) => s('notes')(e.target.value)} placeholder="Add notes about this lead..." />
      </div>

      <div className="form-actions">
        <button className="btn-secondary" onClick={onCancel}>Cancel</button>
        <button className="btn-primary" onClick={submit}><i className="fa fa-check" /> Save Lead</button>
      </div>
    </>
  );
}

function DealForm({ onSave, onCancel }) {
  const [f, setF] = useState({ name: '', company: '', contact: '', value: '', stage: 'New Lead', closeDate: '', probability: 50, owner: OWNERS[0] });
  const [err, setErr] = useState({});

  const s = (k) => (v) => {
    setF((p) => ({ ...p, [k]: v }));
    setErr((p) => ({ ...p, [k]: '' }));
  };

  function submit() {
    const e = {};
    if (!required(f.name)) e.name = REQUIRED_ERROR;
    if (!required(f.company)) e.company = REQUIRED_ERROR;
    if (!required(f.contact)) e.contact = REQUIRED_ERROR;
    if (!required(f.value)) e.value = REQUIRED_ERROR;
    if (!required(f.closeDate)) e.closeDate = REQUIRED_ERROR;

    if (Object.keys(e).length) {
      setErr(e);
      return;
    }

    onSave({
      ...f,
      value: parseInt(f.value, 10) || 0,
      probability: parseInt(f.probability, 10) || 0,
      created: todayStr(),
    });
  }

  return (
    <>
      <div className="form-group">
        <label className="form-label">Deal Name <span className="required">*</span></label>
        <input className={`form-control${err.name ? ' is-err' : ''}`} value={f.name} onChange={(e) => s('name')(e.target.value)} placeholder="e.g. Enterprise CRM License" />
        {err.name && <div className="form-error show">{err.name}</div>}
      </div>

      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Company <span className="required">*</span></label>
          <input className={`form-control${err.company ? ' is-err' : ''}`} value={f.company} onChange={(e) => s('company')(e.target.value)} />
          {err.company && <div className="form-error show">{err.company}</div>}
        </div>
        <div className="form-group">
          <label className="form-label">Contact <span className="required">*</span></label>
          <input
            className={`form-control${err.contact ? ' is-err' : ''}`}
            value={f.contact}
            onChange={(e) => s('contact')(e.target.value)}
            placeholder="Enter contact name"
          />
          {err.contact && <div className="form-error show">{err.contact}</div>}
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Deal Value (INR) <span className="required">*</span></label>
          <input
            className={`form-control${err.value ? ' is-err' : ''}`}
            type="text"
            inputMode="numeric"
            value={f.value}
            onChange={(e) => s('value')(sanitizeDigits(e.target.value))}
            onPaste={(e) => {
              e.preventDefault();
              s('value')(sanitizeDigits(e.clipboardData.getData('text')));
            }}
            placeholder="e.g. 500000"
          />
          {err.value && <div className="form-error show">{err.value}</div>}
        </div>
        <Select label="Pipeline Stage" options={['New Lead', 'Contacted', 'Proposal', 'Negotiation', 'Closed Won', 'Closed Lost']} value={f.stage} onChange={(e) => s('stage')(e.target.value)} />
      </div>

      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Close Date <span className="required">*</span></label>
          <input className={`form-control${err.closeDate ? ' is-err' : ''}`} type="date" value={f.closeDate} onChange={(e) => s('closeDate')(e.target.value)} />
          {err.closeDate && <div className="form-error show">{err.closeDate}</div>}
        </div>
        <div className="form-group">
          <label className="form-label">Win Probability (%)</label>
          <input
            className="form-control"
            type="text"
            inputMode="numeric"
            value={f.probability}
            onChange={(e) => s('probability')(sanitizePercentage(e.target.value))}
            onPaste={(e) => {
              e.preventDefault();
              s('probability')(sanitizePercentage(e.clipboardData.getData('text')));
            }}
          />
        </div>
      </div>

      <Select label="Owner" options={OWNERS} value={f.owner} onChange={(e) => s('owner')(e.target.value)} />

      <div className="form-actions">
        <button className="btn-secondary" onClick={onCancel}>Cancel</button>
        <button className="btn-primary" onClick={submit}><i className="fa fa-check" /> Save Deal</button>
      </div>
    </>
  );
}

function TaskForm({ onSave, onCancel }) {
  const [f, setF] = useState({ title: '', type: 'Call', priority: 'High', dueDate: '', status: 'Pending', related: '', owner: OWNERS[0], notes: '' });
  const [err, setErr] = useState({});

  const s = (k) => (v) => {
    setF((p) => ({ ...p, [k]: v }));
    setErr((p) => ({ ...p, [k]: '' }));
  };

  function submit() {
    const e = {};
    if (!required(f.title)) e.title = REQUIRED_ERROR;
    if (!required(f.dueDate)) e.dueDate = REQUIRED_ERROR;

    if (Object.keys(e).length) {
      setErr(e);
      return;
    }

    onSave({ ...f });
  }

  return (
    <>
      <div className="form-group">
        <label className="form-label">Task Title <span className="required">*</span></label>
        <input className={`form-control${err.title ? ' is-err' : ''}`} value={f.title} onChange={(e) => s('title')(e.target.value)} placeholder="e.g. Follow-up call with client" />
        {err.title && <div className="form-error show">{err.title}</div>}
      </div>

      <div className="form-row">
        <Select label="Task Type" options={['Call', 'Email', 'Meeting', 'Document', 'Follow-up', 'Other']} value={f.type} onChange={(e) => s('type')(e.target.value)} />
        <Select label="Priority" options={['High', 'Medium', 'Low']} value={f.priority} onChange={(e) => s('priority')(e.target.value)} />
      </div>

      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Due Date <span className="required">*</span></label>
          <input className={`form-control${err.dueDate ? ' is-err' : ''}`} type="date" value={f.dueDate} onChange={(e) => s('dueDate')(e.target.value)} />
          {err.dueDate && <div className="form-error show">{err.dueDate}</div>}
        </div>
        <Select label="Status" options={['Pending', 'In Progress', 'Completed']} value={f.status} onChange={(e) => s('status')(e.target.value)} />
      </div>

      <div className="form-group">
        <label className="form-label">Related To</label>
        <input className="form-control" value={f.related} onChange={(e) => s('related')(e.target.value)} placeholder="e.g. Lead: Priya Mehta" />
      </div>

      <Select label="Owner" options={OWNERS} value={f.owner} onChange={(e) => s('owner')(e.target.value)} />

      <div className="form-group">
        <label className="form-label">Notes</label>
        <textarea className="form-control" rows={3} value={f.notes} onChange={(e) => s('notes')(e.target.value)} />
      </div>

      <div className="form-actions">
        <button className="btn-secondary" onClick={onCancel}>Cancel</button>
        <button className="btn-primary" onClick={submit}><i className="fa fa-check" /> Save Task</button>
      </div>
    </>
  );
}

function CompanyForm({ onSave, onCancel }) {
  const [f, setF] = useState({ name: '', industry: '', size: '', city: '', website: '', revenue: '', status: 'Lead', owner: OWNERS[0] });
  const [err, setErr] = useState({});

  const s = (k) => (v) => {
    setF((p) => ({ ...p, [k]: v }));
    setErr((p) => ({ ...p, [k]: '' }));
  };

  function submit() {
    const e = {};
    if (!required(f.name)) e.name = REQUIRED_ERROR;
    if (!required(f.industry)) e.industry = REQUIRED_ERROR;

    if (Object.keys(e).length) {
      setErr(e);
      return;
    }

    onSave({ ...f, contacts: 0, deals: 0 });
  }

  return (
    <>
      <div className="form-group">
        <label className="form-label">Company Name <span className="required">*</span></label>
        <input className={`form-control${err.name ? ' is-err' : ''}`} value={f.name} onChange={(e) => s('name')(e.target.value)} placeholder="e.g. TechCorp India" />
        {err.name && <div className="form-error show">{err.name}</div>}
      </div>

      <div className="form-row">
        <Select
          label="Industry"
          req
          error={err.industry}
          options={[{ v: '', l: 'Select industry' }, ...INDUSTRIES.map((i) => ({ v: i, l: i }))]}
          value={f.industry}
          onChange={(e) => s('industry')(e.target.value)}
        />
        <Select label="Size" options={['', '1-10', '11-50', '50-200', '200-500', '500-1000', '1000+']} value={f.size} onChange={(e) => s('size')(e.target.value)} />
      </div>

      <div className="form-row">
        <div className="form-group">
          <label className="form-label">City</label>
          <input className="form-control" value={f.city} onChange={(e) => s('city')(e.target.value)} />
        </div>
        <div className="form-group">
          <label className="form-label">Website</label>
          <input className="form-control" value={f.website} onChange={(e) => s('website')(e.target.value)} />
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Annual Revenue</label>
          <input className="form-control" value={f.revenue} onChange={(e) => s('revenue')(e.target.value)} placeholder="e.g. 50 Cr" />
        </div>
        <Select label="Status" options={['Lead', 'Prospect', 'Customer', 'Partner']} value={f.status} onChange={(e) => s('status')(e.target.value)} />
      </div>

      <Select label="Owner" options={OWNERS} value={f.owner} onChange={(e) => s('owner')(e.target.value)} />

      <div className="form-actions">
        <button className="btn-secondary" onClick={onCancel}>Cancel</button>
        <button className="btn-primary" onClick={submit}><i className="fa fa-check" /> Save Company</button>
      </div>
    </>
  );
}

function TicketForm({ onSave, onCancel }) {
  const [f, setF] = useState({ title: '', contact: '', company: '', priority: 'Medium', status: 'Open', category: 'Technical', owner: 'Siddehesh Waske' });
  const [err, setErr] = useState({});

  const s = (k) => (v) => {
    setF((p) => ({ ...p, [k]: v }));
    setErr((p) => ({ ...p, [k]: '' }));
  };

  function submit() {
    const e = {};
    if (!required(f.title)) e.title = REQUIRED_ERROR;

    if (Object.keys(e).length) {
      setErr(e);
      return;
    }

    onSave({ ...f, created: todayStr() });
  }

  return (
    <>
      <div className="form-group">
        <label className="form-label">Ticket Title <span className="required">*</span></label>
        <input className={`form-control${err.title ? ' is-err' : ''}`} value={f.title} onChange={(e) => s('title')(e.target.value)} placeholder="e.g. Cannot login to CRM" />
        {err.title && <div className="form-error show">{err.title}</div>}
      </div>

      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Contact</label>
          <input className="form-control" value={f.contact} onChange={(e) => s('contact')(e.target.value)} />
        </div>
        <div className="form-group">
          <label className="form-label">Company</label>
          <input className="form-control" value={f.company} onChange={(e) => s('company')(e.target.value)} />
        </div>
      </div>

      <div className="form-row">
        <Select label="Priority" options={['High', 'Medium', 'Low']} value={f.priority} onChange={(e) => s('priority')(e.target.value)} />
        <Select label="Category" options={['Technical', 'Billing', 'Feature Request', 'Other']} value={f.category} onChange={(e) => s('category')(e.target.value)} />
      </div>

      <div className="form-actions">
        <button className="btn-secondary" onClick={onCancel}>Cancel</button>
        <button className="btn-primary" onClick={submit}><i className="fa fa-check" /> Save Ticket</button>
      </div>
    </>
  );
}

const TYPES = [
  { key: 'contact', icon: 'fa-address-book', label: 'Contact', desc: 'Add a new customer or client' },
  { key: 'lead', icon: 'fa-user-plus', label: 'Lead', desc: 'Add a new sales lead' },
  { key: 'deal', icon: 'fa-handshake', label: 'Deal', desc: 'Create a new deal in pipeline' },
  { key: 'task', icon: 'fa-tasks', label: 'Task', desc: 'Assign a new task' },
  { key: 'company', icon: 'fa-building', label: 'Company', desc: 'Add a new company' },
  { key: 'ticket', icon: 'fa-ticket-alt', label: 'Ticket', desc: 'Log a support ticket' },
];

const ENTITY_MAP = {
  contact: 'contacts',
  lead: 'leads',
  deal: 'deals',
  task: 'tasks',
  company: 'companies',
  ticket: 'tickets',
};

export default function CreateModal({ open, onClose }) {
  const { addRecord, showToast } = useCRM();
  const [step, setStep] = useState(null);

  if (!open) return null;

  function save(entity, data) {
    addRecord(entity, data);
    showToast(`${entity.slice(0, -1).charAt(0).toUpperCase() + entity.slice(1, -1)} created successfully!`);
    setStep(null);
    onClose();
  }

  if (step) {
    const title = TYPES.find((t) => t.key === step)?.label;
    const entity = ENTITY_MAP[step];
    const back = () => setStep(null);
    const closer = () => {
      setStep(null);
      onClose();
    };

    const FormComp = {
      contact: ContactForm,
      lead: LeadForm,
      deal: DealForm,
      task: TaskForm,
      company: CompanyForm,
      ticket: TicketForm,
    }[step];

    return (
      <div className="modal-overlay show" onClick={(e) => { if (e.target.classList.contains('modal-overlay')) closer(); }}>
        <div className="modal" style={{ maxWidth: 520 }}>
          <div className="modal-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <button className="btn-icon" onClick={back} title="Back"><i className="fa fa-arrow-left" /></button>
              <h3>Create {title}</h3>
            </div>
            <button className="modal-close" onClick={closer}>&times;</button>
          </div>
          <div className="form-body">
            <FormComp onSave={(d) => save(entity, d)} onCancel={back} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay show" onClick={(e) => { if (e.target.classList.contains('modal-overlay')) onClose(); }}>
      <div className="modal" style={{ maxWidth: 420 }}>
        <div className="modal-header">
          <h3>Create New</h3>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>
        <div className="create-options">
          {TYPES.map((t) => (
            <div key={t.key} className="create-option" onClick={() => setStep(t.key)}>
              <i className={`fa ${t.icon}`} />
              <div>
                <b>{t.label}</b>
                <p>{t.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
