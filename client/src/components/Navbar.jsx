import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { assetUrl } from '../api.js';

export default function Navbar() {
  const { business, logout } = useAuth();
  const navigate = useNavigate();

  if (!business) return null;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="navbar">
      <Link to="/" className="navbar-brand">
        {business.logoUrl ? (
          <img src={assetUrl(business.logoUrl)} alt={business.name} className="navbar-logo" />
        ) : (
          <span className="navbar-logo-placeholder">{business.name.charAt(0).toUpperCase()}</span>
        )}
        <span className="navbar-title">{business.name}</span>
      </Link>
      <nav className="navbar-links">
        <Link to="/">Folders</Link>
        <Link to="/settings">Settings</Link>
        <button className="btn btn-ghost" onClick={handleLogout}>Log out</button>
      </nav>
    </header>
  );
}
