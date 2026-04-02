import React from 'react';

const SearchDropdown = ({ results, settingsResults, recordResults = [], query, onSelect, activeIndex }) => {
  if (query && results.length === 0 && settingsResults.length === 0 && recordResults.length === 0) {
    return (
      <div className="search-dropdown no-results">
        <i className="fa fa-frown-open"></i>
        <span>No results found for "{query}"</span>
      </div>
    );
  }

  const highlightMatch = (text, query) => {
    if (!query) return text;
    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return (
      <span>
        {parts.map((part, i) => 
          part.toLowerCase() === query.toLowerCase() ? 
            <mark key={i}>{part}</mark> : part
        )}
      </span>
    );
  };

  return (
    <div className="search-dropdown">
      {recordResults.length > 0 && (
        <div className="search-section">
          <div className="search-section-title">Records Found</div>
          {recordResults.map((item, index) => (
            <div
              key={item.id || item.path + index}
              className={`search-item ${index === activeIndex ? 'active' : ''}`}
              onClick={() => onSelect(item)}
            >
              <span className="search-item-icon"><i className={`fa-solid ${item.icon}`}></i></span>
              <div className="search-item-info">
                <div className="search-item-name">{highlightMatch(item.name, query)}</div>
                {item.description && (
                  <div className="search-item-desc">{item.description}</div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      {results.length > 0 && (
        <div className="search-section">
          <div className="search-section-title">Tools</div>
          {results.map((item, index) => (
            <div
              key={item.path}
              className={`search-item ${(recordResults.length + index) === activeIndex ? 'active' : ''}`}
              onClick={() => onSelect(item)}
            >
              <span className="search-item-icon"><i className={`fa-solid ${item.icon}`}></i></span>
              <div className="search-item-info">
                <div className="search-item-name">{highlightMatch(item.name, query)}</div>
                {item.description && (
                  <div className="search-item-desc">{item.description}</div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {settingsResults.length > 0 && (
        <div className="search-section">
          <div className="search-section-title">Settings</div>
          {settingsResults.map((item, index) => {
            const globalIndex = recordResults.length + results.length + index;
            return (
              <div
                key={item.path}
                className={`search-item ${globalIndex === activeIndex ? 'active' : ''}`}
                onClick={() => onSelect(item)}
              >
                <span className="search-item-icon"><i className={`fa-solid ${item.icon}`}></i></span>
                <div className="search-item-info">
                  <div className="search-item-name">{highlightMatch(item.name, query)}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default SearchDropdown;
