import React from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { assetUrl } from '../api.js';
import { GridIcon, SettingsIcon, LogoutIcon } from './Icons.jsx';

export default function Sidebar() {
  const { business, logout } = useAuth();
  const navigate = useNavigate();

  if (!business) return null;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside className="sidebar">
      <Link to="/" className="sidebar-brand">
        {business.logoUrl ? (
          <img src={assetUrl(business.logoUrl)} alt={business.name} className="sidebar-logo" />
        ) : (
          <span className="sidebar-logo-placeholder">{business.name.charAt(0).toUpperCase()}</span>
        )}
        <span className="sidebar-title">{business.name}</span>
      </Link>

      <nav className="sidebar-nav">
        <NavLink to="/" end className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}>
          <GridIcon /> <span>Folders</span>
        </NavLink>
        <NavLink to="/settings" className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}>
          <SettingsIcon /> <span>Settings</span>
        </NavLink>
      </nav>

      <button className="sidebar-link sidebar-logout" onClick={handleLogout}>
        <LogoutIcon /> <span>Log out</span>
      </button>
    </aside>
  );
}
