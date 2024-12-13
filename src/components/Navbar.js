import React,{ useState } from 'react';
import { NavLink } from 'react-router-dom';
import './Navbar.css';

const Navbar = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false); // Close the mobile menu when a link is clicked
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        {/* Logo Section */}
        <div className="navbar-logo">
  <NavLink to="/" onClick={closeMobileMenu}>
    <img src="/logo512.png" alt="Study" className="logo" />
    <span>Study</span> {/* VStudy Text */}
  </NavLink>
</div>


        {/* Mobile Menu Icon */}
        <button className="mobile-menu-toggle" onClick={toggleMobileMenu}>
          {isMobileMenuOpen ? '✕' : '☰'}
        </button>

        {/* Navbar Links */}
        <ul className={`navbar-links ${isMobileMenuOpen ? 'active' : ''}`}>
          <li><NavLink to="/features" onClick={closeMobileMenu} activeclassname="active">Features</NavLink></li>
          <li><NavLink to="/pricing" onClick={closeMobileMenu} activeclassname="active">Pricing</NavLink></li>
          <li><NavLink to="/signin" onClick={closeMobileMenu} activeclassname="active">Sign In</NavLink></li>
          <li><NavLink to="/get-started" onClick={closeMobileMenu} className="btn-get-started" activeclassname="active">Get Started</NavLink></li>
        </ul>
      </div>
    </nav>
  );
};

export default Navbar;