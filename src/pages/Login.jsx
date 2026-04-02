import { useEffect, useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useCRM } from '../context/CRMContext';
import { clearStoredAuth } from '../utils/auth';
import { authAPI } from '../services/api';

const MOCK_USERS = [
  { id: 1, email: 'shailesh@legaledge.in', password: 'Admin@123', role: 'admin', name: 'Shailesh Bhange', teamId: null, avatar: 'SB' },
  { id: 2, email: 'arjun@legaledge.in', password: 'Manager@123', role: 'manager', name: 'Arjun Mehta', teamId: 'team_01', avatar: 'AM' },
  { id: 3, email: 'priya@legaledge.in', password: 'User@123', role: 'user', name: 'Priya Sharma', teamId: 'team_01', avatar: 'PS' },
];

function _generateMockToken(user) {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = btoa(JSON.stringify({ id: user.id, email: user.email, role: user.role, name: user.name, teamId: user.teamId, avatar: user.avatar, exp: Math.floor(Date.now() / 1000) + 60 * 60 * 8 }));
  const signature = btoa('mock-signature');
  return `${header}.${payload}.${signature}`;
}

const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
const ALLOWED_LOGIN_DOMAINS = ['@legaledge.in'];
const isAllowedDomain = (email) => ALLOWED_LOGIN_DOMAINS.some((domain) => email.toLowerCase().endsWith(domain));
const ROLE_REDIRECT = { admin: '/admin/home', manager: '/manager/dashboard', user: '/user/dashboard' };
const OFFLINE_LOGIN_ENABLED = import.meta.env.VITE_ENABLE_OFFLINE_LOGIN === '1';

const HERO_PILLS = [
  { icon: 'fa-lock', label: 'Protected sessions' },
  { icon: 'fa-users', label: 'Team-ready roles' },
  { icon: 'fa-layer-group', label: 'Unified CRM view' },
];

const HERO_FEATURES = [
  { icon: 'fa-diagram-project', title: 'Role-aware navigation', text: 'Admins, managers, and users land in the right workspace after sign-in.' },
  { icon: 'fa-key', title: 'Quick password recovery', text: 'Reset access directly from the login flow without leaving the page.' },
];

const HERO_STATS = [
  { value: '3', text: 'ready-to-use demo roles for testing flows' },
  { value: '1', text: 'place to manage leads, outreach, and teams' },
  { value: '24/7', text: 'access to your workspace from the same login' },
];

const authScopedCss = `
.page-content{padding:0!important}
.auth-shell,.auth-shell *{box-sizing:border-box;text-shadow:none!important}
.auth-shell{min-height:100vh;padding:20px;display:flex;flex-direction:column;background:radial-gradient(circle at top left,rgba(47,96,151,.18),transparent 32%),linear-gradient(180deg,#183142 0%,#10293b 54%,#133044 100%);color:#f4f7fb}
.auth-shell__grid{width:min(100%,1240px);margin:0 auto;flex:1;display:grid;grid-template-columns:minmax(0,1.18fr) minmax(340px,.9fr);gap:22px;align-items:stretch}
.auth-showcase,.auth-panel{border-radius:26px;border:1px solid rgba(116,146,180,.28);background:linear-gradient(180deg,rgba(14,34,53,.97) 0%,rgba(10,24,39,.99) 100%);box-shadow:0 20px 44px rgba(4,12,20,.18)}
.auth-showcase{padding:24px 24px 22px;display:flex;flex-direction:column;justify-content:space-between;gap:20px;min-height:calc(100vh - 52px)}
.auth-brand{display:flex;align-items:center;gap:12px;margin-bottom:20px}
.auth-brand__logo-wrap{width:52px;height:52px;border-radius:16px;background:rgba(255,255,255,.94);display:flex;align-items:center;justify-content:center;flex-shrink:0;box-shadow:0 10px 24px rgba(0,0,0,.16);position:relative;border:1px solid rgba(242,188,85,.42)}
.auth-brand__logo-wrap::after{content:"";position:absolute;inset:-6px;border-radius:20px;border:1px solid rgba(242,188,85,.22);background:radial-gradient(circle,rgba(242,188,85,.14),transparent 70%);z-index:-1}
.auth-brand__logo{width:30px;height:30px;object-fit:contain}
.auth-brand__text{display:flex;flex-direction:column;gap:3px}
.auth-brand__eyebrow{display:block;color:#f0bf61;font-size:10px;font-weight:800;line-height:1;letter-spacing:.16em;text-transform:uppercase}
.auth-brand__name{display:block;color:#f6f8fb;font-size:12px;line-height:1.25;font-weight:700}
.auth-showcase__title{max-width:560px;margin:0;color:#f4f7fb;font-size:clamp(2.55rem,4.7vw,4.55rem);line-height:.95;letter-spacing:-.05em;font-weight:800}
.auth-showcase__subtitle{max-width:500px;margin:16px 0 0;color:#aebbd0;font-size:13px;line-height:1.6;font-weight:500}
.auth-showcase__chips{display:flex;flex-wrap:wrap;gap:8px;margin-top:18px}
.auth-chip{display:inline-flex;align-items:center;gap:7px;min-height:32px;padding:6px 12px;border-radius:999px;background:rgba(255,255,255,.06);border:1px solid rgba(134,158,186,.18);color:#f6f8fb;font-size:11px;font-weight:700}
.auth-chip i{color:#f0bf61;font-size:12px}
.auth-showcase__metrics{margin-top:22px;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}
.auth-metric{min-height:88px;padding:12px 12px 10px;border-radius:16px;background:rgba(255,255,255,.06);border:1px solid rgba(134,158,186,.14);display:flex;flex-direction:column;gap:8px}
.auth-metric__value{color:#f7f9fc;font-size:20px;line-height:1;font-weight:800}
.auth-metric__label{color:#a9b5c8;font-size:11px;line-height:1.4;font-weight:600}
.auth-showcase__stack,.auth-showcase__list,.auth-demo-list{display:flex;flex-direction:column}
.auth-showcase__stack{gap:10px}
.auth-showcase__card{padding:15px 18px;border-radius:18px;background:rgba(240,191,97,.08);border:1px solid rgba(240,191,97,.28)}
.auth-showcase__card-label{display:inline-flex;align-items:center;color:#f0bf61;font-size:11px;letter-spacing:.14em;text-transform:uppercase;font-weight:800}
.auth-showcase__card-text{margin:10px 0 0;max-width:430px;color:#f4f7fb;font-size:12px;line-height:1.55;font-weight:600}
.auth-showcase__list{gap:10px}
.auth-showcase__list-item{display:flex;align-items:flex-start;gap:10px;padding:12px 14px;border-radius:16px;background:rgba(255,255,255,.05);border:1px solid rgba(134,158,186,.08)}
.auth-showcase__list-item i{color:#87afe0;font-size:13px;line-height:1;margin-top:2px;flex-shrink:0}
.auth-showcase__list-item strong{display:block;margin-bottom:3px;color:#f4f7fb;font-size:12px;line-height:1.3;font-weight:700}
.auth-showcase__list-item span{display:block;color:#97a8bc;font-size:11px;line-height:1.4;font-weight:500}
.auth-panel{min-height:calc(100vh - 52px);padding:24px 22px 20px;display:flex;flex-direction:column}
.auth-panel__badge{width:fit-content;min-height:32px;padding:0 14px;display:inline-flex;align-items:center;gap:8px;border-radius:999px;background:rgba(38,86,136,.34);border:1px solid rgba(99,140,184,.28);color:#e6effa;font-size:11px;letter-spacing:.08em;text-transform:uppercase;font-weight:800}
.auth-panel__header{margin-top:14px}
.auth-panel__title{margin:0;color:#fff;font-size:clamp(2.1rem,2.8vw,3rem);line-height:.96;letter-spacing:-.05em;font-weight:800}
.auth-panel__subtitle{max-width:350px;margin:12px 0 0;color:#a6b4c5;font-size:13px;line-height:1.55;font-weight:500}
.auth-alert{margin-top:12px;padding:9px 11px;display:flex;align-items:center;gap:8px;border-radius:14px;background:rgba(224,92,107,.14);border:1px solid rgba(224,92,107,.26);color:#f6a6af;font-size:11px;font-weight:600}
.auth-form{margin-top:14px}
.auth-field{margin-bottom:14px}
.auth-field__label{display:block;margin-bottom:7px;color:#f1f4f8;font-size:10px;letter-spacing:.08em;text-transform:uppercase;font-weight:800}
.auth-input-wrap{position:relative}
.auth-input-icon{position:absolute;left:14px;top:50%;transform:translateY(-50%);color:#637892;font-size:13px;z-index:2;pointer-events:none}
.auth-input{min-height:40px;padding:9px 14px 9px 40px!important;border-radius:13px!important;border:1px solid rgba(90,113,139,.42)!important;color:#f4f7fb!important;box-shadow:none!important;transition:border-color .18s ease,box-shadow .18s ease,background .18s ease}
.auth-input::placeholder{color:#71829a!important}
.auth-input:focus{background:rgba(28,42,58,1)!important;border-color:rgba(240,191,97,.72)!important;box-shadow:0 0 0 3px rgba(240,191,97,.12)!important}
.auth-input.is-err{border-color:rgba(224,92,107,.52)!important}
.auth-password-toggle{position:absolute;right:10px;top:50%;transform:translateY(-50%);width:30px;height:30px;border:0;border-radius:999px;background:rgba(255,255,255,.06);color:#8ea1b8;display:inline-flex;align-items:center;justify-content:center;cursor:pointer;transition:background .18s ease,color .18s ease}
.auth-password-toggle:hover{background:rgba(255,255,255,.1);color:#f0bf61}
.auth-meta{margin-top:0;display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap}
.auth-check{display:inline-flex;align-items:center;gap:8px;color:#b8c5d6;font-size:11px;font-weight:500;cursor:pointer;user-select:none}
.auth-check input{margin:0;accent-color:#f0bf61}
.auth-link{color:#f0bf61;font-size:11px;font-weight:700;cursor:pointer}
.auth-submit{width:100%;min-height:42px;margin-top:16px;border:1px solid #f0b84b!important;border-radius:14px!important;background:#f0b84b!important;color:#0d1d2d!important;display:inline-flex;align-items:center;justify-content:center;gap:10px;font-size:12px;letter-spacing:.08em;text-transform:uppercase;font-weight:800;box-shadow:0 6px 18px rgba(240,184,75,.28)!important;transition:background .18s ease,border-color .18s ease,transform .18s ease}
.auth-submit:hover,.auth-submit:focus,.auth-submit:active,.auth-submit:active:focus{background:#f4c767!important;border-color:#f4c767!important;color:#0d1d2d!important;transform:translateY(-1px)}
.auth-panel__footer{margin:12px 0 8px;text-align:center;color:#94a8bf;font-size:11px;font-weight:500}
.auth-panel__footer a{color:#f5f7fb;font-weight:700;text-decoration:underline;text-underline-offset:2px}
.auth-mini-card{margin-top:auto;padding:12px 12px 10px;border-radius:18px;background:rgba(255,255,255,.05);border:1px solid rgba(134,158,186,.14)}
.auth-mini-card__title{margin:0;color:#f4f7fb;font-size:13px;font-weight:700}
.auth-mini-card__text{margin:5px 0 0;color:#9aaabc;font-size:10px;line-height:1.45;font-weight:500}
.auth-demo-list{margin-top:10px;gap:7px}
.auth-demo-row{width:100%;padding:9px 11px;border-radius:13px;border:1px solid rgba(134,158,186,.18);background:rgba(255,255,255,.04);display:flex;align-items:center;gap:9px;color:inherit;text-align:left;cursor:pointer;transition:background .18s ease,border-color .18s ease}
.auth-demo-row:hover{background:rgba(255,255,255,.06);border-color:rgba(240,191,97,.2)}
.auth-demo-row__role{min-width:60px;padding:5px 9px;border-radius:999px;background:rgba(240,191,97,.18);color:#f4d48c;font-size:9px;letter-spacing:.05em;text-transform:uppercase;font-weight:800;text-align:center;flex-shrink:0}
.auth-demo-row__user{min-width:0;flex:1;display:flex;flex-direction:column;gap:2px}
.auth-demo-row__user strong{color:#f5f8fc;font-size:11px;line-height:1.25;font-weight:700}
.auth-demo-row__user span{color:#aebbd0;font-size:9px;line-height:1.3;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.auth-demo-row__pass{color:#93a4b8;font-size:9px;font-weight:700;white-space:nowrap;flex-shrink:0}
.auth-note{margin:8px 0 0;color:#8496aa;font-size:9px;line-height:1.4;font-weight:500}
.auth-legal{margin:10px 0 0;text-align:center;color:rgba(180,196,217,.74);font-size:10px;font-weight:500}
@media (max-width:1199.98px){.auth-shell{padding:16px}.auth-shell__grid{gap:16px;grid-template-columns:minmax(0,1fr) minmax(320px,.9fr)}.auth-showcase{padding:20px;gap:18px}.auth-panel{padding:20px 18px 18px}.auth-showcase__title{font-size:clamp(2.2rem,4.2vw,3.8rem)}.auth-panel__title{font-size:clamp(1.9rem,2.6vw,2.65rem)}}
@media (max-width:991.98px){.auth-shell{padding:16px}.auth-shell__grid{width:min(100%,460px);grid-template-columns:1fr}.auth-showcase{display:none}.auth-panel{min-height:auto;padding:22px 18px 18px}.auth-mini-card{margin-top:18px}}
@media (max-height:820px) and (min-width:992px){.auth-shell{padding:14px 16px 10px}.auth-shell__grid{gap:18px}.auth-showcase,.auth-panel{min-height:calc(100vh - 38px)}.auth-showcase{padding:20px 20px 18px;gap:16px}.auth-panel{padding:20px 18px 16px}.auth-brand{margin-bottom:14px}.auth-showcase__title{font-size:clamp(2.15rem,4vw,3.7rem)}.auth-showcase__subtitle{margin-top:12px;font-size:12px;line-height:1.5}.auth-showcase__metrics{margin-top:16px}.auth-metric{min-height:76px;padding:10px}.auth-metric__value{font-size:18px}.auth-metric__label{font-size:10px}.auth-showcase__card{padding:12px 14px}.auth-showcase__card-text{font-size:11px;line-height:1.45}.auth-showcase__list-item{padding:10px 12px}.auth-showcase__list-item strong{font-size:11px}.auth-showcase__list-item span{font-size:10px}.auth-panel__header{margin-top:12px}.auth-panel__subtitle{margin-top:10px;font-size:12px;line-height:1.45}.auth-form{margin-top:12px}.auth-field{margin-bottom:12px}.auth-input{min-height:38px;padding:8px 12px 8px 36px!important}.auth-input-icon{left:12px;font-size:12px}.auth-submit{min-height:40px;margin-top:14px}.auth-mini-card{padding:10px 10px 8px}.auth-demo-list{margin-top:8px;gap:6px}.auth-demo-row{padding:8px 9px}.auth-panel__footer{margin-top:10px}}
@media (max-width:575.98px){.auth-panel{padding:20px 14px 16px;border-radius:22px}.auth-panel__title{font-size:2.2rem}.auth-panel__subtitle{font-size:12px}.auth-demo-row{align-items:flex-start;flex-wrap:wrap}.auth-demo-row__pass{margin-left:69px}}
`;

export default function Login() {
  const { setCurrentUser, showToast } = useCRM();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [showPass, setShowPass] = useState(false);
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');
  const [allUsers, setAllUsers] = useState(() => MOCK_USERS);
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotForm, setForgotForm] = useState({ email: '', newPassword: '', confirmPassword: '' });
  const [forgotErrors, setForgotErrors] = useState({});

  useEffect(() => {
    const prefill = location.state;
    if (prefill?.email && prefill?.password) setForm({ email: prefill.email, password: prefill.password });
  }, [location.state]);

  const handleChange = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
    if (errors[field]) setErrors((current) => ({ ...current, [field]: '' }));
    if (apiError) setApiError('');
  };

  const validate = () => {
    const nextErrors = {};
    const normalizedEmail = form.email.trim().toLowerCase();
    if (!normalizedEmail) nextErrors.email = 'Email is required';
    else if (!isValidEmail(normalizedEmail)) nextErrors.email = 'Enter a valid email address';
    else if (!isAllowedDomain(normalizedEmail)) nextErrors.email = 'Use your company email';
    if (!form.password.trim()) nextErrors.password = 'Password is required';
    else if (form.password.length < 6) nextErrors.password = 'Password must be at least 6 characters';
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validate()) return;
    setLoading(true);
    setApiError('');
    try {
      const user = await authAPI.login(form.email.trim().toLowerCase(), form.password, remember);
      setCurrentUser(user);
      showToast(`Welcome back, ${user.name.split(' ')[0]}!`);
      navigate(ROLE_REDIRECT[user.role] || '/dashboards', { replace: true });
    } catch (backendErr) {
      if (!OFFLINE_LOGIN_ENABLED) {
        setApiError(backendErr?.message || 'Unable to login. Please try again.');
        return;
      }
      try {
        await new Promise((resolve) => setTimeout(resolve, 400));
        const normalizedEmail = form.email.trim().toLowerCase();
        const matched = allUsers.find((user) => (user.email || '').toLowerCase() === normalizedEmail && user.password === form.password);
        if (!matched) {
          setApiError(backendErr.message || 'Invalid email or password. Please try again.');
          return;
        }
        const user = { id: matched.id, name: matched.name, email: matched.email, role: matched.role, teamId: matched.teamId, avatar: matched.avatar };
        clearStoredAuth();
        const storage = remember ? localStorage : sessionStorage;
        const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
        const payload = btoa(JSON.stringify({ ...user, exp: Math.floor(Date.now() / 1000) + 28800 }));
        storage.setItem('crm_token', `${header}.${payload}.mock`);
        storage.setItem('crm_user', JSON.stringify(user));
        setCurrentUser(user);
        showToast(`Welcome back, ${user.name.split(' ')[0]}! (offline mode)`);
        navigate(ROLE_REDIRECT[user.role] || '/dashboards', { replace: true });
      } catch {
        setApiError('Something went wrong. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleLogin();
  };

  const closeForgotModal = () => {
    setShowForgotModal(false);
    setForgotErrors({});
    setForgotForm({ email: '', newPassword: '', confirmPassword: '' });
  };

  const handleResetPassword = () => {
    if (!OFFLINE_LOGIN_ENABLED) {
      const message = 'Use Profile > Reset Password after signing in, or contact your admin.';
      setForgotErrors({ email: message });
      showToast(message, 'info');
      return;
    }

    const nextErrors = {};
    const normalizedEmail = forgotForm.email.trim().toLowerCase();
    if (!normalizedEmail) nextErrors.email = 'Email is required';
    else if (!isValidEmail(normalizedEmail)) nextErrors.email = 'Enter a valid email address';
    if (!forgotForm.newPassword.trim()) nextErrors.newPassword = 'New password is required';
    else if (forgotForm.newPassword.length < 6) nextErrors.newPassword = 'Password must be at least 6 characters';
    if (!forgotForm.confirmPassword.trim()) nextErrors.confirmPassword = 'Confirm password is required';
    else if (forgotForm.newPassword !== forgotForm.confirmPassword) nextErrors.confirmPassword = 'Passwords do not match';
    setForgotErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;
    const userIndex = allUsers.findIndex((user) => (user?.email || '').trim().toLowerCase() === normalizedEmail);
    if (userIndex === -1) {
      setForgotErrors({ email: 'Email not found' });
      showToast('Email not found', 'error');
      return;
    }
    const updatedUsers = [...allUsers];
    updatedUsers[userIndex] = { ...updatedUsers[userIndex], password: forgotForm.newPassword };
    setAllUsers(updatedUsers);
    setForm({ email: normalizedEmail, password: forgotForm.newPassword });
    showToast('Password reset successful');
    closeForgotModal();
  };

  return (
    <div className="auth-shell">
      <style>{authScopedCss}</style>
      <div className="auth-shell__grid">
        <section className="auth-showcase">
          <div>
            <div className="auth-brand">
              <div className="auth-brand__logo-wrap">
                <img src="/logo_legaledge.png" alt="LegalEdge" className="auth-brand__logo" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
              </div>
              <div className="auth-brand__text">
                <span className="auth-brand__eyebrow">LegalEdge CRM</span>
                <span className="auth-brand__name">Client growth, simplified for every team</span>
              </div>
            </div>
            <h1 className="auth-showcase__title">Welcome back to the command center.</h1>
            <p className="auth-showcase__subtitle">Pick up exactly where your pipeline, campaigns, and legal operations left off. Everything you need is already staged for the next move.</p>
            <div className="auth-showcase__chips">
              {HERO_PILLS.map((item) => (
                <span key={item.label} className="auth-chip"><i className={`fa-solid ${item.icon}`} />{item.label}</span>
              ))}
            </div>
            <div className="auth-showcase__metrics">
              {HERO_STATS.map((item) => (
                <div key={item.value} className="auth-metric">
                  <span className="auth-metric__value">{item.value}</span>
                  <span className="auth-metric__label">{item.text}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="auth-showcase__stack">
            <div className="auth-showcase__card">
              <span className="auth-showcase__card-label">Today&apos;s Focus</span>
              <p className="auth-showcase__card-text">Review campaigns, move active matters forward, and keep every lead response tight, timely, and organized.</p>
            </div>
            <div className="auth-showcase__list">
              {HERO_FEATURES.map((item) => (
                <div key={item.title} className="auth-showcase__list-item">
                  <i className={`fa-solid ${item.icon}`} />
                  <div>
                    <strong>{item.title}</strong>
                    <span>{item.text}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="auth-panel">
          <span className="auth-panel__badge"><i className="fa-solid fa-right-to-bracket" />Sign In</span>
          <div className="auth-panel__header">
            <h2 className="auth-panel__title">Access your LegalEdge workspace</h2>
            <p className="auth-panel__subtitle">Sign in to continue managing leads, teams, and client journeys from one place.</p>
          </div>
          {apiError && <div className="auth-alert"><i className="fa-solid fa-circle-exclamation" /><span>{apiError}</span></div>}
          <div className="auth-form">
            <div className="auth-field">
              <label className="auth-field__label">Email Address</label>
              <div className="auth-input-wrap">
                <i className="fa-regular fa-envelope auth-input-icon" />
                <input type="email" className={`auth-input form-control${errors.email ? ' is-err' : ''}`} value={form.email} onChange={(e) => handleChange('email', e.target.value)} onKeyDown={handleKeyDown} placeholder="you@legaledge.in" autoComplete="email" disabled={loading} />
              </div>
              {errors.email && <span className="form-error show">{errors.email}</span>}
            </div>
            <div className="auth-field">
              <label className="auth-field__label">Password</label>
              <div className="auth-input-wrap">
                <i className="fa-solid fa-lock auth-input-icon" />
                <input type={showPass ? 'text' : 'password'} className={`auth-input form-control${errors.password ? ' is-err' : ''}`} value={form.password} onChange={(e) => handleChange('password', e.target.value)} onKeyDown={handleKeyDown} placeholder="Enter your password" autoComplete="current-password" disabled={loading} style={{ paddingRight: 52 }} />
                <button type="button" onClick={() => setShowPass((current) => !current)} className="auth-password-toggle" tabIndex={-1} title={showPass ? 'Hide password' : 'Show password'}>
                  <i className={`fa-solid ${showPass ? 'fa-eye-slash' : 'fa-eye'}`} />
                </button>
              </div>
              {errors.password && <span className="form-error show">{errors.password}</span>}
            </div>
            <div className="auth-meta">
              <label className="auth-check"><input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />Remember me on this device</label>
              <span className="auth-link" role="button" tabIndex={0} onClick={() => setShowForgotModal(true)} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setShowForgotModal(true); }}>Forgot password?</span>
            </div>
            <button className="btn auth-submit" onClick={handleLogin} disabled={loading}>
              {loading ? <><i className="fa-solid fa-spinner fa-spin" />Signing in...</> : <><i className="fa-solid fa-arrow-right" />Enter Workspace</>}
            </button>
          </div>
          <p className="auth-panel__footer">{`Don't have an account? `}<Link to="/signup">Create one now</Link></p>
          <div className="auth-mini-card">
            <p className="auth-mini-card__title">Demo credentials</p>
            <p className="auth-mini-card__text">Tap any profile below to autofill the form and preview different access levels.</p>
            <div className="auth-demo-list">
              {MOCK_USERS.map((user) => (
                <button key={user.id} type="button" className="auth-demo-row" onClick={() => { setForm({ email: user.email, password: user.password }); setErrors({}); setApiError(''); }}>
                  <span className="auth-demo-row__role">{user.role}</span>
                  <span className="auth-demo-row__user"><strong>{user.name}</strong><span>{user.email}</span></span>
                  <span className="auth-demo-row__pass">{user.password}</span>
                </button>
              ))}
            </div>
            <p className="auth-note">Click any row to fill email and password automatically.</p>
          </div>
        </section>
      </div>

      {showForgotModal && (
        <div className="modal-overlay show" onClick={(e) => { if (e.target.classList.contains('modal-overlay')) closeForgotModal(); }}>
          <div className="modal" style={{ maxWidth: 520 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Reset Password</h3>
              <button className="modal-close" onClick={closeForgotModal}><i className="fa fa-times" /></button>
            </div>
            <div className="form-body">
              <div className="form-group">
                <label className="form-label">Email ID</label>
                <input type="email" className={`form-control${forgotErrors.email ? ' is-err' : ''}`} value={forgotForm.email} onChange={(e) => { setForgotForm((current) => ({ ...current, email: e.target.value })); if (forgotErrors.email) setForgotErrors((current) => ({ ...current, email: '' })); }} placeholder="Enter your account email" />
                {forgotErrors.email && <span className="form-error show">{forgotErrors.email}</span>}
              </div>
              <div className="form-group">
                <label className="form-label">New Password</label>
                <input type="password" className={`form-control${forgotErrors.newPassword ? ' is-err' : ''}`} value={forgotForm.newPassword} onChange={(e) => { setForgotForm((current) => ({ ...current, newPassword: e.target.value })); if (forgotErrors.newPassword) setForgotErrors((current) => ({ ...current, newPassword: '' })); }} placeholder="Create a new password" />
                {forgotErrors.newPassword && <span className="form-error show">{forgotErrors.newPassword}</span>}
              </div>
              <div className="form-group">
                <label className="form-label">Confirm Password</label>
                <input type="password" className={`form-control${forgotErrors.confirmPassword ? ' is-err' : ''}`} value={forgotForm.confirmPassword} onChange={(e) => { setForgotForm((current) => ({ ...current, confirmPassword: e.target.value })); if (forgotErrors.confirmPassword) setForgotErrors((current) => ({ ...current, confirmPassword: '' })); }} placeholder="Re-enter the new password" />
                {forgotErrors.confirmPassword && <span className="form-error show">{forgotErrors.confirmPassword}</span>}
              </div>
            </div>
            <div className="form-actions">
              <button className="btn-secondary" onClick={closeForgotModal}>Cancel</button>
              <button className="btn-primary" onClick={handleResetPassword}>Reset Password</button>
            </div>
          </div>
        </div>
      )}

      <p className="auth-legal">{`© ${new Date().getFullYear()} LegalEdge India. All rights reserved.`}</p>
    </div>
  );
}

export { decodeToken, isTokenExpired } from '../utils/auth';
