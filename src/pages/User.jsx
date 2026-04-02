import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCRM } from '../context/CRMContext';
import { usersAPI } from '../services/api';
import {
    PHONE_ERROR,
    REQUIRED_ERROR,
    isValidEmail,
    isValidPhone,
    required,
    sanitizePhone,
} from '../utils/formValidation';

const TIMEZONES = ['Asia/Kolkata', 'Asia/Dubai', 'Europe/London', 'America/New_York', 'America/Los_Angeles', 'UTC'];
const ROLES = ['CRM Admin', 'Sales Rep', 'Support Agent', 'Viewer', 'Marketing'];

export default function AddUser() {
    const navigate = useNavigate();
    const { currentUser, showToast } = useCRM();
    const availableRoles =
        currentUser?.role === 'admin'
            ? ROLES
            : ROLES.filter((roleName) => roleName !== 'CRM Admin');

    const [form, setForm] = useState({
        name: '', email: '', phone: '', role: '', company: '', timezone: '',
    });
    const [errors, setErrors] = useState({});
    const [submitted, setSubmitted] = useState(false);
    const [saving, setSaving] = useState(false);

    /* ── Validation ─────────────────────────────────────── */
    function validate(data) {
        const e = {};
        if (!required(data.name)) e.name = REQUIRED_ERROR;
        if (!required(data.email)) e.email = REQUIRED_ERROR;
        else if (!isValidEmail(data.email)) e.email = 'Enter valid email address';
        if (!required(data.phone)) e.phone = REQUIRED_ERROR;
        else if (!isValidPhone(data.phone)) e.phone = PHONE_ERROR;
        if (!required(data.role)) e.role = REQUIRED_ERROR;
        if (!required(data.company)) e.company = REQUIRED_ERROR;
        if (!required(data.timezone)) e.timezone = REQUIRED_ERROR;
        return e;
    }

    /* ── Handlers ────────────────────────────────────────── */
    function handleChange(field, value) {
        setForm(p => ({ ...p, [field]: value }));
        if (submitted) {
            const e = validate({ ...form, [field]: value });
            setErrors(e);
        }
    }

    /* Phone: digits only, max 10 */
    function handlePhone(e) {
        const val = sanitizePhone(e.target.value);
        handleChange('phone', val);
    }

    async function handleSubmit(e) {
        e.preventDefault();
        setSubmitted(true);
        const e2 = validate(form);
        setErrors(e2);
        if (Object.keys(e2).length) return;

        const normalizedRole =
            currentUser?.role === 'admin' && form.role === 'CRM Admin' ? 'admin' : 'user';

        const newUser = {
            name: form.name.trim(),
            email: form.email.trim().toLowerCase(),
            role: normalizedRole,
            teamId: currentUser?.teamId || 'team_01',
            phone: form.phone.trim(),
            company: form.company,
            timezone: form.timezone,
            source: 'created',
        };

        setSaving(true);
        try {
            await usersAPI.create({
                name: newUser.name,
                email: newUser.email,
                phone: newUser.phone,
                role: newUser.role,
                company: newUser.company,
                timezone: newUser.timezone,
                team_id: newUser.role === 'admin' ? null : newUser.teamId,
            });
            showToast('User created successfully!');
            navigate('/user-management');
        } catch (err) {
            showToast(err.message || 'Unable to create user', 'error');
        } finally {
            setSaving(false);
        }
    }

    const isValid = Object.keys(validate(form)).length === 0;

    /* ── UI ──────────────────────────────────────────────── */
    return (
        <div className="page-fade">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Add New User</h1>
                    <p className="page-subtitle">Fill in the details to create a new user account</p>
                </div>
            </div>

            <div className="card" style={{ maxWidth: 720, margin: '0 auto', padding: 32 }}>
                <form onSubmit={handleSubmit} noValidate>

                    <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>

                        {/* Full Name */}
                        <div className="form-group">
                            <label className="form-label">Full Name <span className="required">*</span></label>
                            <input
                                type="text"
                                className={`form-control${errors.name ? ' is-err' : ''}`}
                                placeholder="e.g. Rahul Sharma"
                                value={form.name}
                                onChange={e => handleChange('name', e.target.value)}
                            />
                            {errors.name && <span className="form-error show">{errors.name}</span>}
                        </div>

                        {/* Email */}
                        <div className="form-group">
                            <label className="form-label">Email <span className="required">*</span></label>
                            <input
                                type="email"
                                className={`form-control${errors.email ? ' is-err' : ''}`}
                                placeholder="e.g. rahul@company.com"
                                value={form.email}
                                onChange={e => handleChange('email', e.target.value)}
                            />
                            {errors.email && <span className="form-error show">{errors.email}</span>}
                        </div>

                        {/* Phone */}
                        <div className="form-group">
                            <label className="form-label">Phone Number <span className="required">*</span></label>
                            <input
                                type="tel"
                                className={`form-control${errors.phone ? ' is-err' : ''}`}
                                placeholder="Enter 10 digit number"
                                value={form.phone}
                                onChange={handlePhone}
                                onPaste={e => {
                                    e.preventDefault();
                                    handleChange('phone', sanitizePhone(e.clipboardData.getData('text')));
                                }}
                                inputMode="numeric"
                                maxLength={10}
                            />
                            {errors.phone && <span className="form-error show">{errors.phone}</span>}
                        </div>

                        {/* Role */}
                        <div className="form-group">
                            <label className="form-label">Role <span className="required">*</span></label>
                            <select
                                className={`form-control${errors.role ? ' is-err' : ''}`}
                                value={form.role}
                                onChange={e => handleChange('role', e.target.value)}
                            >
                                <option value="">Select role…</option>
                                {availableRoles.map(r => <option key={r} value={r}>{r}</option>)}
                            </select>
                            {errors.role && <span className="form-error show">{errors.role}</span>}
                        </div>

                        {/* Company */}
                        <div className="form-group">
                            <label className="form-label">Company <span className="required">*</span></label>
                            <input
                                type="text"
                                className={`form-control${errors.company ? ' is-err' : ''}`}
                                placeholder="e.g. LegalEdge India"
                                value={form.company}
                                onChange={e => handleChange('company', e.target.value)}
                            />
                            {errors.company && <span className="form-error show">{errors.company}</span>}
                        </div>

                        {/* Timezone */}
                        <div className="form-group">
                            <label className="form-label">Timezone <span className="required">*</span></label>
                            <select
                                className={`form-control${errors.timezone ? ' is-err' : ''}`}
                                value={form.timezone}
                                onChange={e => handleChange('timezone', e.target.value)}
                            >
                                <option value="">Select timezone…</option>
                                {TIMEZONES.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                            {errors.timezone && <span className="form-error show">{errors.timezone}</span>}
                        </div>

                    </div>

                    {/* Actions */}
                    <div className="form-actions" style={{ marginTop: 32, display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                        <button
                            type="button"
                            className="btn-secondary"
                            onClick={() => navigate('/profile')}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="btn-primary"
                            disabled={saving || (submitted && !isValid)}
                            style={{ opacity: saving || (submitted && !isValid) ? 0.6 : 1, cursor: saving || (submitted && !isValid) ? 'not-allowed' : 'pointer' }}
                        >
                            <i className={`fa ${saving ? 'fa-spinner fa-spin' : 'fa-user-plus'}`} /> {saving ? 'Creating...' : 'Add User'}
                        </button>
                    </div>

                </form>
            </div>
        </div>
    );
}
