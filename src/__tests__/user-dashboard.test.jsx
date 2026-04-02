import { beforeEach, describe, expect, it } from 'vitest';
import { act } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from '../App';

function makeToken(user) {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = btoa(
    JSON.stringify({
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
      teamId: user.teamId,
      avatar: user.avatar,
      exp: Math.floor(Date.now() / 1000) + 60 * 60,
    }),
  );
  return `${header}.${payload}.signature`;
}

describe('user dashboard route', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="root"></div>';
    localStorage.clear();
    sessionStorage.clear();
    window.history.pushState({}, '', '/user/dashboard');
  });

  it('renders the user dashboard for a logged-in user', async () => {
    const user = {
      id: 3,
      name: 'Priya Sharma',
      email: 'priya@legaledge.in',
      role: 'user',
      teamId: 'team_01',
      avatar: 'PS',
    };

    sessionStorage.setItem('crm_user', JSON.stringify(user));
    sessionStorage.setItem('crm_token', makeToken(user));

    const container = document.getElementById('root');
    const root = ReactDOM.createRoot(container);

    await act(async () => {
      root.render(
        <BrowserRouter
          future={{
            v7_startTransition: true,
            v7_relativeSplatPath: true,
          }}
        >
          <App />
        </BrowserRouter>,
      );
    });

    expect(container.textContent).toContain('User Dashboard');
  });
});
