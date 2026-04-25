// src/components/Navbar.js
import React from "react";
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Navbar.css';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        {/* Brand */}
        <Link to="/dashboard" className="navbar-brand">
          <span className="brand-icon">◈</span>
          <span className="brand-text">FCRS</span>
        </Link>

        {/* Desktop nav links */}
        {user && (
          <div className="navbar-links">
            <Link to="/dashboard"  className={`nav-link ${isActive('/dashboard') ? 'active' : ''}`}>Dashboard</Link>
            <Link to="/projects"   className={`nav-link ${isActive('/projects')  ? 'active' : ''}`}>Projects</Link>
            <Link to="/profile"    className={`nav-link ${isActive('/profile')   ? 'active' : ''}`}>Profile</Link>
          </div>
        )}

        {/* Right side */}
        <div className="navbar-right">
          {user ? (
            <>
              <span className="nav-user">
                <span className={`role-dot role-${user.role}`}></span>
                {user.name.split(' ')[0]}
              </span>
              <button className="btn btn-outline btn-sm" onClick={handleLogout}>
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login"  className="btn btn-outline btn-sm">Login</Link>
              <Link to="/signup" className="btn btn-primary btn-sm">Sign Up</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
