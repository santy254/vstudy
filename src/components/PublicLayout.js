// src/layouts/PublicLayout.js
import React from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
 // Optional: For styling

const PublicLayout = ({ children }) => {
  return (
    <div className="public-layout">
      {/* Navbar */}
      <Navbar />
      
      {/* Main content of the page */}
      <main className="content">
        {children}
      </main>
      
      {/* Footer */}
      <Footer />
    </div>
  );
};

export default PublicLayout;