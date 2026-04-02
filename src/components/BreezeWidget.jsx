import { useState } from 'react';
import BreezeAI from './BreezeAI';
import '../styles/BreezeWidget.css';

export default function BreezeWidget() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        className={`bw-trigger ${open ? 'bw-trigger--open' : ''}`}
        onClick={() => setOpen(p => !p)}
        aria-label={open ? 'Close Breeze AI' : 'Open Breeze AI'}
      >
        {open
          ? <span className="bw-icon">✕</span>
          : <span className="bw-icon"><i className="fa-solid fa-wand-magic-sparkles" /></span>
        }
      </button>

      <BreezeAI open={open} onClose={() => setOpen(false)} />
    </>
  );
}