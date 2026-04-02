import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { searchModules, searchSettings } from '../config/searchConfig';
import SearchDropdown from './SearchDropdown';
import { useCRM } from '../context/CRMContext';

const SearchBar = () => {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [results, setResults] = useState([]);
  const [settingsResults, setSettingsResults] = useState([]);
  const [recordResults, setRecordResults] = useState([]);
  const navigate = useNavigate();
  const searchRef = useRef(null);
  const { store } = useCRM();

  const searchRecords = useCallback((q) => {
    if (!q || q.length < 2) { setRecordResults([]); return; }
    const lq = q.toLowerCase();
    const contacts = (store.contacts || [])
      .filter(c => String(c.name || '').toLowerCase().includes(lq) || String(c.email || '').toLowerCase().includes(lq) || String(c.company || '').toLowerCase().includes(lq))
      .slice(0, 3)
      .map(c => ({ id: `contact-${c.id}`, name: c.name, description: `${c.company} — Contact`, path: '/contacts', icon: 'fa-user', type: 'record' }));

    const leads = (store.leads || [])
      .filter(l => String(l.name || '').toLowerCase().includes(lq) || String(l.company || '').toLowerCase().includes(lq))
      .slice(0, 3)
      .map(l => ({ id: `lead-${l.id}`, name: l.name, description: `${l.company} — Lead`, path: '/leads', icon: 'fa-user-plus', type: 'record' }));

    const deals = (store.deals || [])
      .filter(d => String(d.name || '').toLowerCase().includes(lq) || String(d.company || '').toLowerCase().includes(lq))
      .slice(0, 3)
      .map(d => ({ id: `deal-${d.id}`, name: d.name, description: `${d.company} — Deal`, path: '/deals', icon: 'fa-handshake', type: 'record' }));

    setRecordResults([...contacts, ...leads, ...deals].slice(0, 6));
  }, [store.contacts, store.leads, store.deals]);

  useEffect(() => {
    const filteredModules = searchModules.filter(m =>
      m.name.toLowerCase().includes(query.toLowerCase())
    );
    const filteredSettings = searchSettings.filter(s =>
      s.name.toLowerCase().includes(query.toLowerCase())
    );
    setResults(filteredModules);
    setSettingsResults(filteredSettings);
    searchRecords(query);
    setActiveIndex(0);
  }, [query, searchRecords]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const totalResults = results.length + settingsResults.length + recordResults.length;

  const handleKeyDown = (e) => {
    if (!totalResults && ['ArrowDown', 'ArrowUp', 'Enter'].includes(e.key)) {
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex(prev => (prev + 1) % totalResults);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex(prev => (prev - 1 + totalResults) % totalResults);
    } else if (e.key === 'Enter') {
      const allResults = [...results, ...settingsResults, ...recordResults];
      if (allResults[activeIndex]) {
        handleSelect(allResults[activeIndex]);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  const handleSelect = (item) => {
    navigate(item.path);
    setQuery('');
    setIsOpen(false);
  };

  return (
    <div className="topbar-search-wrapper" ref={searchRef}>
      <div className={`topbar-search ${isOpen ? 'focused' : ''}`}>
        <i className="fa fa-search"></i>
        <input
          type="text"
          placeholder="Search tools, settings..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
        />
        {query && (
          <button className="search-clear" onClick={() => setQuery('')}>
            ✕
          </button>
        )}
      </div>

      {isOpen && (
        <SearchDropdown
          results={results}
          settingsResults={settingsResults}
          recordResults={recordResults}
          query={query}
          activeIndex={activeIndex}
          onSelect={handleSelect}
        />
      )}
    </div>
  );
};

export default SearchBar;
