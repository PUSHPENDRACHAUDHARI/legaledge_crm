import { useNavigate } from 'react-router-dom';

const HERO_PILLS = [
  { icon: 'fa-shield-halved', label: 'Secure access' },
  { icon: 'fa-bolt', label: 'Quick team setup' },
  { icon: 'fa-chart-line', label: 'Better CRM visibility' },
];

const HERO_FEATURES = [
  {
    icon: 'fa-people-arrows',
    title: 'Lead Intake',
    text: 'Capture inquiries, qualify them quickly, and route work to the right people.',
  },
  {
    icon: 'fa-scale-balanced',
    title: 'Matter Visibility',
    text: 'Keep campaigns, deals, and client conversations clear without dashboard clutter.',
  },
  {
    icon: 'fa-wand-magic-sparkles',
    title: 'Sharper First Impression',
    text: 'Start the product with a more branded, modern welcome instead of a plain card.',
  },
];

const scopedCss = `
  html,
  body,
  #root {
    width: 100%;
    height: 100%;
    min-height: 100%;
    margin: 0;
    padding: 0;
    background: linear-gradient(135deg, #0f2940 0%, #132838 52%, #213741 100%);
  }

  body {
    overflow: hidden;
  }

  .app-root,
  .app-root .page-content {
    width: 100%;
    min-height: 100vh;
    height: 100vh;
    margin: 0;
    padding: 0 !important;
    background: transparent;
  }

  .app-root {
    overflow: hidden;
  }

  .app-root .page-content {
    overflow: hidden;
  }

  .auth-entry-shell {
    position: fixed;
    inset: 0;
    width: 100vw;
    height: 100vh;
    margin: 0;
    padding: 0;
    display: flex;
    align-items: stretch;
    justify-content: stretch;
    overflow: hidden;
    background: linear-gradient(135deg, #0f2940 0%, #132838 52%, #213741 100%);
    isolation: isolate;
  }

  .auth-entry-shell::before {
    content: "";
    position: absolute;
    inset: 0;
    background:
      radial-gradient(circle at top right, rgba(255, 255, 255, 0.06), transparent 30%),
      radial-gradient(circle at bottom left, rgba(241, 185, 79, 0.08), transparent 32%);
    pointer-events: none;
    z-index: 0;
  }

  .auth-entry-shell,
  .auth-entry-shell * {
    box-sizing: border-box;
    text-shadow: none !important;
    filter: none;
  }

  .auth-entry-shell .auth-entry-frame {
    position: relative;
    z-index: 1;
    width: 100%;
    height: 100vh;
    border-radius: 0;
    border: 0;
    background: transparent;
    box-shadow: none;
    padding: clamp(10px, 1.4vh, 18px) clamp(20px, 3vw, 42px) clamp(8px, 1vh, 14px);
    display: flex;
    flex-direction: column;
    justify-content: center;
    overflow: hidden;
  }

  .auth-entry-shell .auth-entry-frame::before {
    content: "";
    position: absolute;
    inset: 0;
    background:
      radial-gradient(circle at top right, rgba(255, 255, 255, 0.04), transparent 34%),
      linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.02) 68%, transparent 100%);
    pointer-events: none;
  }

  .auth-entry-shell .auth-entry-content {
    position: relative;
    display: flex;
    flex-direction: column;
    flex: 1;
    width: min(100%, 1320px);
    margin: 0 auto;
    min-height: 0;
    justify-content: center;
    align-items: center;
    padding: 0;
    gap: 24px;
  }

  .auth-entry-shell .auth-entry-main {
    width: min(100%, 1240px);
    margin: 0 auto;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .auth-entry-shell .auth-entry-intro {
    width: min(100%, 1080px);
    margin: 0 auto;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .auth-entry-shell .auth-entry-brand {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    gap: 12px;
    width: 100%;
  }

  .auth-entry-shell .auth-entry-logo-box {
    width: 76px;
    height: 76px;
    border-radius: 22px;
    background: rgba(255, 255, 255, 0.94);
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 10px 24px rgba(0, 0, 0, 0.16);
    flex-shrink: 0;
    position: relative;
    border: 1px solid rgba(242, 188, 85, 0.42);
  }

  .auth-entry-shell .auth-entry-logo-box::after {
    content: "";
    position: absolute;
    inset: -8px;
    border-radius: 28px;
    border: 1px solid rgba(242, 188, 85, 0.22);
    background: radial-gradient(circle, rgba(242, 188, 85, 0.14), transparent 70%);
    z-index: -1;
  }

  .auth-entry-shell .auth-entry-logo {
    width: 48px;
    height: 48px;
    object-fit: contain;
  }

  .auth-entry-shell .auth-entry-brand-copy {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
    width: 100%;
  }

  .auth-entry-shell .auth-entry-eyebrow {
    margin: 0;
    color: #f6cb73;
    font-size: clamp(1rem, 1.15vw, 1.18rem);
    font-weight: 800;
    letter-spacing: 0.08em;
    line-height: 1.2;
    text-transform: uppercase;
  }

  .auth-entry-shell .auth-entry-brand-title {
    margin: 0;
    color: #f2f6fb;
    font-size: clamp(1.4rem, 1.8vw, 2rem);
    line-height: 1.18;
    letter-spacing: -0.03em;
    font-weight: 800;
    max-width: 760px;
  }

  .auth-entry-shell .auth-entry-copy {
    width: 100%;
    max-width: 980px;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .auth-entry-shell .auth-entry-headline {
    margin: 0;
    color: #f1f5fb;
    font-size: clamp(2rem, 3vw, 3.3rem);
    line-height: 1.15;
    letter-spacing: -0.045em;
    font-weight: 800;
  }

  .auth-entry-shell .auth-entry-text {
    max-width: 740px;
    margin: 0;
    color: #a9b6c7;
    font-size: clamp(0.96rem, 1vw, 1.06rem);
    line-height: 1.6;
    font-weight: 600;
  }

  .auth-entry-shell .auth-entry-pill-row {
    display: flex;
    flex-wrap: wrap;
    width: 100%;
    gap: 12px;
  }

  .auth-entry-shell .auth-entry-pill {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    min-height: 32px;
    padding: 5px 13px;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.06);
    border: 1px solid rgba(140, 164, 191, 0.18);
    color: #eef4fb;
    font-size: 13px;
    font-weight: 700;
  }

  .auth-entry-shell .auth-entry-pill i {
    color: #f2bc55;
    font-size: 12px;
  }

  .auth-entry-shell .auth-entry-actions {
    display: flex;
    flex-wrap: wrap;
    width: 100%;
    gap: 12px;
  }

  .auth-entry-shell .auth-entry-login-btn,
  .auth-entry-shell .auth-entry-signup-btn {
    min-height: 46px;
    padding: 0 22px;
    border-radius: 14px;
    font-size: 14.5px;
    font-weight: 800;
    letter-spacing: 0.04em;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 9px;
    cursor: pointer;
    box-shadow: none !important;
    opacity: 1 !important;
    visibility: visible !important;
    transition: background 0.18s ease, border-color 0.18s ease, color 0.18s ease,
      transform 0.18s ease;
  }

  .auth-entry-shell .auth-entry-login-btn {
    background: #f1b94f !important;
    color: #0c1d31 !important;
    border: 1px solid #f1b94f !important;
  }

  .auth-entry-shell .auth-entry-login-btn:hover,
  .auth-entry-shell .auth-entry-login-btn:focus,
  .auth-entry-shell .auth-entry-login-btn:active {
    background: #f5c569 !important;
    border-color: #f5c569 !important;
    color: #0c1d31 !important;
    opacity: 1 !important;
    visibility: visible !important;
  }

  .auth-entry-shell .auth-entry-signup-btn {
    background: rgba(255, 255, 255, 0.05) !important;
    color: #f5f8fc !important;
    border: 1px solid rgba(145, 166, 193, 0.28) !important;
  }

  .auth-entry-shell .auth-entry-signup-btn:hover,
  .auth-entry-shell .auth-entry-signup-btn:focus,
  .auth-entry-shell .auth-entry-signup-btn:active {
    background: rgba(255, 255, 255, 0.09) !important;
    border-color: rgba(241, 185, 79, 0.36) !important;
    color: #ffffff !important;
    opacity: 1 !important;
    visibility: visible !important;
  }

  .auth-entry-shell .auth-entry-feature-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 16px;
    width: 100%;
    max-width: 1240px;
    margin-top: 0;
  }

  .auth-entry-shell .auth-entry-feature-card {
    width: 100%;
    border-radius: 18px;
    padding: clamp(13px, 1.3vh, 17px) clamp(14px, 1.4vw, 18px);
    display: flex;
    flex-direction: column;
    gap: 12px;
    background: rgba(255, 255, 255, 0.055);
    border: 1px solid rgba(140, 164, 191, 0.13);
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.025);
  }

  .auth-entry-shell .auth-entry-feature-icon {
    width: 38px;
    height: 38px;
    border-radius: 12px;
    background: rgba(241, 185, 79, 0.13);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    color: #f2bc55;
    font-size: 15px;
    flex-shrink: 0;
  }

  .auth-entry-shell .auth-entry-feature-title {
    margin: 0;
    color: #f3f7fb;
    font-size: 16px;
    line-height: 1.3;
    font-weight: 800;
  }

  .auth-entry-shell .auth-entry-feature-text {
    margin: 0;
    color: #a4b2c5;
    font-size: 13.5px;
    line-height: 1.55;
    font-weight: 600;
  }

  .auth-entry-shell .auth-entry-footer {
    position: relative;
    z-index: 1;
    margin: 0;
    padding-top: 10px;
    text-align: center;
    color: rgba(187, 201, 219, 0.60);
    font-size: 11.5px;
    font-weight: 600;
    flex-shrink: 0;
  }

  /* ── Tablet ── */
  @media (max-width: 991.98px) {
    body {
      overflow-y: auto;
    }

    .auth-entry-shell {
      position: relative;
      height: auto;
      min-height: 100vh;
    }

    .auth-entry-shell .auth-entry-frame {
      height: auto;
      min-height: 100vh;
      padding: 16px 20px 14px;
    }

    .auth-entry-shell .auth-entry-content {
      width: 100%;
      padding: 0;
      gap: 20px;
    }

    .auth-entry-shell .auth-entry-main,
    .auth-entry-shell .auth-entry-intro {
      width: 100%;
    }

    .auth-entry-shell .auth-entry-logo-box {
      width: 68px;
      height: 68px;
      border-radius: 20px;
    }

    .auth-entry-shell .auth-entry-logo {
      width: 42px;
      height: 42px;
    }

    .auth-entry-shell .auth-entry-feature-grid {
      grid-template-columns: repeat(2, 1fr);
      max-width: 100%;
      gap: 14px;
    }
  }

  /* ── Short desktop screens ── */
  @media (max-height: 820px) and (min-width: 992px) {
    .auth-entry-shell .auth-entry-frame {
      padding: 10px 36px 8px;
    }

    .auth-entry-shell .auth-entry-content {
      gap: 18px;
    }

    .auth-entry-shell .auth-entry-logo-box {
      width: 58px;
      height: 58px;
      border-radius: 18px;
    }

    .auth-entry-shell .auth-entry-logo {
      width: 36px;
      height: 36px;
    }

    .auth-entry-shell .auth-entry-headline {
      font-size: clamp(1.8rem, 2.45vw, 2.8rem);
    }

    .auth-entry-shell .auth-entry-feature-card {
      padding: 11px 14px;
      gap: 10px;
    }

    .auth-entry-shell .auth-entry-feature-icon {
      width: 34px;
      height: 34px;
      font-size: 14px;
    }

    .auth-entry-shell .auth-entry-feature-title {
      font-size: 14.5px;
    }

    .auth-entry-shell .auth-entry-feature-text {
      font-size: 12.5px;
    }

    .auth-entry-shell .auth-entry-login-btn,
    .auth-entry-shell .auth-entry-signup-btn {
      min-height: 42px;
      font-size: 13.5px;
      padding: 0 18px;
    }
  }

  /* ── Mobile ── */
  @media (max-width: 767.98px) {
    .auth-entry-shell {
      position: relative;
      height: auto;
    }

    .auth-entry-shell .auth-entry-frame {
      height: auto;
      min-height: 100vh;
      padding: 14px 16px 12px;
    }

    .auth-entry-shell .auth-entry-content {
      justify-content: flex-start;
      gap: 16px;
    }

    .auth-entry-shell .auth-entry-brand {
      gap: 10px;
    }

    .auth-entry-shell .auth-entry-logo-box {
      width: 60px;
      height: 60px;
      border-radius: 18px;
    }

    .auth-entry-shell .auth-entry-logo-box::after {
      inset: -6px;
      border-radius: 24px;
    }

    .auth-entry-shell .auth-entry-logo {
      width: 36px;
      height: 36px;
    }

    .auth-entry-shell .auth-entry-brand-copy {
      gap: 4px;
    }

    .auth-entry-shell .auth-entry-eyebrow {
      font-size: 0.95rem;
      letter-spacing: 0.06em;
    }

    .auth-entry-shell .auth-entry-brand-title {
      font-size: clamp(1.2rem, 4.8vw, 1.55rem);
      line-height: 1.22;
    }

    .auth-entry-shell .auth-entry-feature-grid {
      grid-template-columns: 1fr;
      max-width: 100%;
      gap: 14px;
    }

    .auth-entry-shell .auth-entry-login-btn,
    .auth-entry-shell .auth-entry-signup-btn {
      width: 100%;
      min-height: 48px;
    }

    .auth-entry-shell .auth-entry-headline {
      font-size: clamp(1.9rem, 7vw, 2.55rem);
    }
  }
`;

export default function AuthEntry() {
  const navigate = useNavigate();

  return (
    <div className="auth-entry-shell">
      <style>{scopedCss}</style>

      <div className="auth-entry-frame">
        <div className="auth-entry-content">
          <div className="auth-entry-main">
            <div className="auth-entry-intro">
              <div className="auth-entry-brand">
                <div className="auth-entry-logo-box">
                  <img
                    src="/logo_legaledge.png"
                    alt="LegalEdge CRM"
                    className="auth-entry-logo"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                </div>

                <div className="auth-entry-brand-copy">
                  <p className="auth-entry-eyebrow">LEGALEDGE CRM</p>
                  <h1 className="auth-entry-brand-title">
                    Revenue workspace for modern legal teams
                  </h1>
                </div>
              </div>

              <div className="auth-entry-copy">
                <h2 className="auth-entry-headline">
                  Bring clients, campaigns, and follow-ups into one sharp workspace.
                </h2>

                <p className="auth-entry-text">
                  A more premium first impression for your CRM: faster onboarding, cleaner
                  workflows, and a front door that feels aligned with the rest of the product.
                </p>
              </div>

              <div className="auth-entry-pill-row">
                {HERO_PILLS.map((item) => (
                  <div key={item.label} className="auth-entry-pill">
                    <i className={`fa-solid ${item.icon}`} />
                    <span>{item.label}</span>
                  </div>
                ))}
              </div>

              <div className="auth-entry-actions">
                <button className="auth-entry-login-btn" onClick={() => navigate('/login')}>
                  <i className="fa-solid fa-right-to-bracket" />
                  <span>LOG IN</span>
                </button>

                <button className="auth-entry-signup-btn" onClick={() => navigate('/signup')}>
                  <i className="fa-solid fa-user-plus" />
                  <span>CREATE ACCOUNT</span>
                </button>
              </div>
            </div>

            <div className="auth-entry-feature-grid">
              {HERO_FEATURES.map((feature) => (
                <article key={feature.title} className="auth-entry-feature-card">
                  <div className="auth-entry-feature-icon">
                    <i className={`fa-solid ${feature.icon}`} />
                  </div>
                  <h3 className="auth-entry-feature-title">{feature.title}</h3>
                  <p className="auth-entry-feature-text">{feature.text}</p>
                </article>
              ))}
            </div>
          </div>
        </div>

        <p className="auth-entry-footer">
          {`\u00A9 ${new Date().getFullYear()} LegalEdge India. All rights reserved.`}
        </p>
      </div>
    </div>
  );
}
