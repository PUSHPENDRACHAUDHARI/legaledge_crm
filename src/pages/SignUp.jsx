import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCRM } from '../context/CRMContext';
import { authAPI, clearTokens } from '../services/api';
import { clearStoredAuth } from '../utils/auth';

const ROLE_OPTIONS = [
  { value: 'user', label: 'User (Default)' },
  { value: 'manager', label: 'Manager' },
  { value: 'admin', label: 'Admin' },
];

const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const signupScopedCss = `
.page-content{padding:0!important}
.signup-shell,.signup-shell *{box-sizing:border-box;text-shadow:none!important}
.signup-shell{color:#f4f7fb}
.signup-shell .signup-card{background:linear-gradient(180deg,rgba(14,34,53,.97) 0%,rgba(10,24,39,.99) 100%);border:1px solid rgba(116,146,180,.28);box-shadow:0 20px 44px rgba(4,12,20,.18)}
.signup-shell .page-title,.signup-shell .form-label,.signup-shell .txt-muted,.signup-shell .txt-muted a{color:#f4f7fb}
.signup-shell .page-subtitle{color:#a6b4c5}
.signup-shell .form-label{font-size:11px;font-weight:700;letter-spacing:.04em;text-transform:uppercase}
.signup-shell .form-control{background:#ffffff!important;border:1px solid #d5dde8!important;color:#1f2937!important;box-shadow:none!important}
.signup-shell input.form-control,.signup-shell select.form-control{color:#1f2937!important;-webkit-text-fill-color:#1f2937}
.signup-shell .form-control::placeholder{color:#6b7280!important}
.signup-shell .form-control:hover{background:#ffffff!important;border-color:#c7d2df!important;color:#1f2937!important}
.signup-shell .form-control:focus{background:#ffffff!important;border-color:#f0bf61!important;color:#1f2937!important;box-shadow:0 0 0 3px rgba(240,191,97,.12)!important}
.signup-shell select.form-control option{background:#ffffff;color:#1f2937}
.signup-shell .btn-primary{background:#f0b84b!important;border:1px solid #f0b84b!important;color:#0d1d2d!important;box-shadow:0 6px 18px rgba(240,184,75,.28)!important}
.signup-shell .btn-primary:hover,.signup-shell .btn-primary:focus,.signup-shell .btn-primary:active,.signup-shell .btn-primary:active:focus{background:#f4c767!important;border-color:#f4c767!important;color:#0d1d2d!important}
.signup-shell .txt-muted{color:#a6b4c5!important}
.signup-shell .txt-muted a{color:#f0bf61!important;font-weight:700}
`;

export default function SignUp() {
  const navigate = useNavigate();
  const { showToast } = useCRM();
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'user',
  });
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: '' }));
    if (apiError) setApiError('');
  };

  const validate = () => {
    const nextErrors = {};
    if (!form.name.trim()) nextErrors.name = 'Name is required';
    if (!form.email.trim()) nextErrors.email = 'Email is required';
    else if (!isValidEmail(form.email.trim())) nextErrors.email = 'Enter a valid email address';
    if (!form.password.trim()) nextErrors.password = 'Password is required';
    else if (form.password.length < 6) nextErrors.password = 'Password must be at least 6 characters';
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleCreate = async () => {
    if (!validate()) return;
    setLoading(true);
    setApiError('');

    try {
      await new Promise((r) => setTimeout(r, 600));
      const normalizedEmail = form.email.trim().toLowerCase();
      await authAPI.signup({
        name: form.name.trim(),
        email: normalizedEmail,
        password: form.password,
        confirm_password: form.password,
        role: form.role || 'user',
      });
      clearTokens();
      clearStoredAuth();

      showToast('Account created successfully!');
      navigate('/login', {
        state: { email: normalizedEmail, password: form.password },
      });
    } catch (err) {
      setApiError(err.message || 'Unable to create account.');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleCreate();
  };

  return (
    <div className="signup-shell" style={styles.page}>
      <style>{signupScopedCss}</style>
      <div className="card signup-card" style={styles.card}>
        <div style={styles.logoWrap}>
          <img
            src="/logo_legaledge.png"
            alt="LegalEdge"
            style={styles.logo}
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
        </div>

        <div style={{ marginBottom: 24 }}>
          <h2 className="page-title" style={{ margin: 0, fontSize: 22 }}>
            Create Account
          </h2>
          <p className="page-subtitle" style={{ margin: '4px 0 0' }}>
            Set up your LegalEdge CRM account
          </p>
        </div>

        {apiError && (
          <div style={styles.alertError}>
            <i className="fa-solid fa-circle-exclamation" style={{ marginRight: 8 }} />
            {apiError}
          </div>
        )}

        <div className="form-group" style={{ marginBottom: 14 }}>
          <label className="form-label">Name</label>
          <input
            type="text"
            className={`form-control${errors.name ? ' is-err' : ''}`}
            value={form.name}
            onChange={(e) => handleChange('name', e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Enter your full name"
            autoComplete="name"
            disabled={loading}
          />
          {errors.name && <span className="form-error show">{errors.name}</span>}
        </div>

        <div className="form-group" style={{ marginBottom: 14 }}>
          <label className="form-label">Email</label>
          <input
            type="email"
            className={`form-control${errors.email ? ' is-err' : ''}`}
            value={form.email}
            onChange={(e) => handleChange('email', e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="you@legaledge.in"
            autoComplete="email"
            disabled={loading}
          />
          {errors.email && <span className="form-error show">{errors.email}</span>}
        </div>

        <div className="form-group" style={{ marginBottom: 14 }}>
          <label className="form-label">Password</label>
          <div style={styles.passWrap}>
            <input
              type={showPass ? 'text' : 'password'}
              className={`form-control${errors.password ? ' is-err' : ''}`}
              value={form.password}
              onChange={(e) => handleChange('password', e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Enter password"
              autoComplete="new-password"
              disabled={loading}
              style={{ paddingRight: 40 }}
            />
            <button
              type="button"
              onClick={() => setShowPass((prev) => !prev)}
              style={styles.eyeBtn}
              tabIndex={-1}
              title={showPass ? 'Hide password' : 'Show password'}
            >
              <i className={`fa-solid ${showPass ? 'fa-eye-slash' : 'fa-eye'}`} />
            </button>
          </div>
          {errors.password && <span className="form-error show">{errors.password}</span>}
        </div>

        <div className="form-group">
          <label className="form-label">Role (Optional)</label>
          <select
            className="form-control"
            value={form.role}
            onChange={(e) => handleChange('role', e.target.value)}
            disabled={loading}
          >
            {ROLE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <button
          className="btn-primary"
          onClick={handleCreate}
          disabled={loading}
          style={{ width: '100%', marginTop: 22, padding: '12px', fontSize: 15 }}
        >
          {loading ? (
            <>
              <i className="fa-solid fa-spinner fa-spin" style={{ marginRight: 8 }} />
              Creating...
            </>
          ) : (
            <>
              <i className="fa-solid fa-user-plus" style={{ marginRight: 8 }} />
              Create Account
            </>
          )}
        </button>

        <p className="txt-sm txt-muted" style={styles.loginRow}>
          Already have an account? <Link to="/login">Sign In</Link>
        </p>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background:
      'radial-gradient(circle at top left, rgba(47, 96, 151, 0.18), transparent 32%), linear-gradient(180deg, #183142 0%, #10293b 54%, #133044 100%)',
    padding: '24px 16px',
  },
  card: {
    width: '100%',
    maxWidth: 440,
    padding: 36,
    boxSizing: 'border-box',
    borderRadius: 22,
  },
  logoWrap: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  logo: {
    height: 36,
    objectFit: 'contain',
    filter: 'brightness(0) invert(1)',
  },
  alertError: {
    background: 'rgba(224, 92, 107, 0.14)',
    color: '#f6a6af',
    border: '1px solid rgba(224, 92, 107, 0.26)',
    borderRadius: 8,
    padding: '10px 14px',
    fontSize: 13,
    marginBottom: 14,
    display: 'flex',
    alignItems: 'center',
  },
  passWrap: {
    position: 'relative',
  },
  eyeBtn: {
    position: 'absolute',
    right: 12,
    top: '50%',
    transform: 'translateY(-50%)',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: '#8ea1b8',
    padding: 0,
    fontSize: 14,
  },
  loginRow: {
    marginTop: 14,
    textAlign: 'center',
  },
};
