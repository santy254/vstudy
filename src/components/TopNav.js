import React from 'react';

const TopNav = ({ toggleSearch }) => {
  return (
    <header className="top-nav">
      <button onClick={toggleSearch}>🔍 Search</button>
    </header>
  );
};

export default TopNav;
