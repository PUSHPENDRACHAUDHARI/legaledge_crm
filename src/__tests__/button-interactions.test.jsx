import { beforeEach, describe, expect, it } from 'vitest';
import { act } from 'react';
import ReactDOM from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { CRMProvider } from '../context/CRMContext';
import Toast from '../components/Toast';
import AddedAgents from '../pages/AddedAgents';
import BuyerIntentPage from '../pages/BuyerIntentPage';
import Calls from '../pages/Calls';
import DataModal from '../pages/DataModal';

function renderWithProviders(element) {
  document.body.innerHTML = '<div id="root"></div>';
  const container = document.getElementById('root');
  const root = ReactDOM.createRoot(container);

  act(() => {
    root.render(
      <CRMProvider>
        <MemoryRouter>{element}</MemoryRouter>
        <Toast />
      </CRMProvider>,
    );
  });

  return { container, root };
}

async function click(element) {
  await act(async () => {
    element.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  });
}

describe('button interactions', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  it('shows feedback for added agent settings', async () => {
    const { container } = renderWithProviders(<AddedAgents />);
    const settingsButton = [...container.querySelectorAll('button')].find((button) => button.textContent.includes('Settings'));

    await click(settingsButton);

    expect(container.textContent).toContain('settings opened');
  });

  it('opens buyer intent editing flow from the empty state', async () => {
    const { container } = renderWithProviders(<BuyerIntentPage />);
    const editButton = [...container.querySelectorAll('button')].find((button) =>
      button.textContent.includes('Edit research intent topics'),
    );

    await click(editButton);

    expect(container.textContent).toContain('Add Intent Tracker');
    expect(container.textContent).toContain('Research intent topics are ready to edit.');
  });

  it('can place an active call on hold', async () => {
    const { container } = renderWithProviders(<Calls />);
    const callAgainButton = container.querySelector('button[title="Call Again"]');

    await click(callAgainButton);

    const holdButton = container.querySelector('button[title="Hold"]');
    await click(holdButton);

    expect(container.textContent).toContain('is on hold');
  });

  it('shows browse file guidance in the data modal', async () => {
    const { container } = renderWithProviders(
      <DataModal isOpen onClose={() => {}} recordType="Contacts" type="Import" />,
    );
    const browseButton = [...container.querySelectorAll('button')].find((button) =>
      button.textContent.includes('Browse Files'),
    );

    await click(browseButton);

    expect(container.textContent).toContain('Select a contacts file to continue.');
  });
});
