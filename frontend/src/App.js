// src/App.js — Root component with routing
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

import LoginPage     from './pages/LoginPage';
import SignupPage    from './pages/SignupPage';
import DashboardPage from './pages/DashboardPage';
import ProfilePage   from './pages/ProfilePage';
import ProjectsPage  from './pages/ProjectsPage';
import ReviewPage    from './pages/ReviewPage';
import Navbar        from './components/Navbar';
import './App.css';

// Protected route wrapper — redirect to login if not authenticated
const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="loader">Loading...</div>;
  return user ? children : <Navigate to="/login" />;
};

// Public route wrapper — redirect to dashboard if already logged in
const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="loader">Loading...</div>;
  return !user ? children : <Navigate to="/dashboard" />;
};

const AppRoutes = () => (
  <>
    <Navbar />
    <main className="main-content">
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" />} />

        {/* Public routes */}
        <Route path="/login"  element={<PublicRoute><LoginPage /></PublicRoute>} />
        <Route path="/signup" element={<PublicRoute><SignupPage /></PublicRoute>} />

        {/* Protected routes */}
        <Route path="/dashboard"    element={<PrivateRoute><DashboardPage /></PrivateRoute>} />
        <Route path="/projects"     element={<PrivateRoute><ProjectsPage /></PrivateRoute>} />
        <Route path="/review/:projectId" element={<PrivateRoute><ReviewPage /></PrivateRoute>} />
        <Route path="/profile/:id"  element={<PrivateRoute><ProfilePage /></PrivateRoute>} />
        <Route path="/profile"      element={<PrivateRoute><ProfilePage /></PrivateRoute>} />
      </Routes>
    </main>
  </>
);

const App = () => (
  <AuthProvider>
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  </AuthProvider>
);

export default App;
