// src/pages/DashboardPage.js
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { StarDisplay } from '../components/StarRating';

const DashboardPage = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data } = await api.get(`/users/${user.id}`);
        setProfile(data);
      } catch (err) {
        console.error('Failed to load profile', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [user.id]);

  if (loading) return <div className="loader">Loading dashboard...</div>;

  const u = profile?.user || user;
  const recentProjects = (profile?.projects || []).slice(0, 4);
  const recentReviews  = (profile?.reviews  || []).slice(0, 3);

  return (
    <div>
      {/* Welcome banner */}
      <div className="dashboard-banner">
        <div className="banner-left">
          <div className="banner-avatar">{u.name?.charAt(0)}</div>
          <div>
            <h1>Hey, {u.name?.split(' ')[0]} 👋</h1>
            <p>
              <span className={`badge badge-${u.role}`}>{u.role}</span>
              &nbsp; Member since {new Date(u.created_at || Date.now()).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </p>
          </div>
        </div>
        <div className="banner-actions">
          <Link to="/profile" className="btn btn-outline btn-sm">View Profile</Link>
          {u.role === 'client' && (
            <Link to="/projects" className="btn btn-primary btn-sm">+ New Project</Link>
          )}
        </div>
      </div>

      {/* Stats row */}
      <div className="grid-3" style={{ marginBottom: 28 }}>
        <div className="stat-box">
          <div className="stat-value">{u.avg_rating > 0 ? Number(u.avg_rating).toFixed(1) : '—'}</div>
          <div className="stat-label">Avg Rating</div>
          {u.avg_rating > 0 && (
            <div style={{ marginTop: 6 }}>
              <StarDisplay rating={u.avg_rating} size="0.9rem" />
            </div>
          )}
        </div>
        <div className="stat-box">
          <div className="stat-value">{u.total_completed || 0}</div>
          <div className="stat-label">Completed Projects</div>
        </div>
        <div className="stat-box">
          <div className="stat-value">{u.total_reviews || 0}</div>
          <div className="stat-label">Reviews Received</div>
        </div>
      </div>

      {/* Two column layout */}
      <div className="grid-2">
        {/* Recent Projects */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <h2 style={{ fontSize: '1rem', fontFamily: 'Syne, sans-serif' }}>Recent Projects</h2>
            <Link to="/projects" style={{ fontSize: '0.82rem', color: 'var(--accent)' }}>View all →</Link>
          </div>

          {recentProjects.length === 0 ? (
            <div className="empty-state" style={{ padding: '32px 0' }}>
              <div className="empty-icon">📋</div>
              <h3>No projects yet</h3>
              <p>{u.role === 'client' ? 'Create your first project to get started.' : 'You\'ll see projects here once assigned.'}</p>
              {u.role === 'client' && (
                <Link to="/projects" className="btn btn-primary btn-sm" style={{ marginTop: 12 }}>Create Project</Link>
              )}
            </div>
          ) : (
            recentProjects.map(p => (
              <div key={p.id} className="card" style={{ marginBottom: 10, padding: '14px 16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 600, marginBottom: 4 }}>{p.title}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      {p.client_name && `Client: ${p.client_name}`}
                      {p.freelancer_name && ` · Freelancer: ${p.freelancer_name}`}
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                    <span className={`badge badge-${p.status}`}>{p.status}</span>
                    {p.budget && <span style={{ color: 'var(--accent)', fontWeight: 700, fontSize: '0.85rem' }}>${Number(p.budget).toLocaleString()}</span>}
                  </div>
                </div>
                {p.status === 'completed' && (
                  <div style={{ marginTop: 10 }}>
                    <Link to={`/review/${p.id}`} className="btn btn-outline btn-sm">Write Review</Link>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Recent Reviews */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <h2 style={{ fontSize: '1rem', fontFamily: 'Syne, sans-serif' }}>Recent Reviews</h2>
            <Link to="/profile" style={{ fontSize: '0.82rem', color: 'var(--accent)' }}>View all →</Link>
          </div>

          {recentReviews.length === 0 ? (
            <div className="empty-state" style={{ padding: '32px 0' }}>
              <div className="empty-icon">⭐</div>
              <h3>No reviews yet</h3>
              <p>Complete projects to start receiving reviews.</p>
            </div>
          ) : (
            recentReviews.map(r => (
              <div key={r.id} className="review-card">
                <div className="review-header">
                  <div>
                    <div className="reviewer-name">{r.reviewer_name}</div>
                    <div className="review-meta">{r.project_title}</div>
                  </div>
                  <StarDisplay rating={r.rating} size="0.9rem" />
                </div>
                {r.comment && <p className="review-comment">"{r.comment}"</p>}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
