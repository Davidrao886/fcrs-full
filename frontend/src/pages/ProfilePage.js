// src/pages/ProfilePage.js — Full user profile with reputation
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { StarDisplay } from '../components/StarRating';
import './ProfilePage.css';

const ProfilePage = () => {
  const { id } = useParams();
  const { user: currentUser } = useAuth();
  const targetId = id || currentUser.id;

  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');
  const [tab,     setTab]     = useState('reviews'); // 'reviews' | 'projects'

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/users/${targetId}`);
        setData(res.data);
      } catch (err) {
        setError('Failed to load profile.');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [targetId]);

  if (loading) return <div className="loader">Loading profile...</div>;
  if (error)   return <div className="alert alert-error">{error}</div>;
  if (!data)   return null;

  const { user, reviews, projects } = data;
  const isOwnProfile = parseInt(targetId) === currentUser.id;

  return (
    <div>
      {/* Profile hero */}
      <div className="profile-hero">
        <div className="profile-avatar-lg">{user.name?.charAt(0)}</div>
        <div className="profile-info">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <h1>{user.name}</h1>
            <span className={`badge badge-${user.role}`}>{user.role}</span>
            {isOwnProfile && <span className="own-badge">You</span>}
          </div>
          <p className="profile-email">{user.email}</p>
          {user.bio && <p className="profile-bio">{user.bio}</p>}
          <p className="profile-since">
            Member since {new Date(user.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </p>
        </div>
      </div>

      {/* Reputation stats */}
      <div className="grid-3" style={{ marginBottom: 28 }}>
        <div className="stat-box">
          <div className="stat-value">
            {user.avg_rating > 0 ? Number(user.avg_rating).toFixed(1) : '—'}
          </div>
          <div className="stat-label">Average Rating</div>
          {user.avg_rating > 0 && (
            <div style={{ marginTop: 8 }}>
              <StarDisplay rating={user.avg_rating} size="1rem" />
            </div>
          )}
        </div>
        <div className="stat-box">
          <div className="stat-value">{user.total_completed || 0}</div>
          <div className="stat-label">Projects Completed</div>
        </div>
        <div className="stat-box">
          <div className="stat-value">{user.total_reviews || 0}</div>
          <div className="stat-label">Reviews Received</div>
        </div>
      </div>

      {/* Reputation bar */}
      {user.avg_rating > 0 && (
        <div className="reputation-bar-wrapper">
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 500 }}>REPUTATION SCORE</span>
            <span style={{ fontSize: '0.82rem', color: 'var(--accent)', fontWeight: 700 }}>
              {Math.round((user.avg_rating / 5) * 100)}%
            </span>
          </div>
          <div className="reputation-track">
            <div
              className="reputation-fill"
              style={{ width: `${(user.avg_rating / 5) * 100}%` }}
            />
          </div>
        </div>
      )}

      <div className="divider" />

      {/* Tabs */}
      <div className="profile-tabs">
        <button
          className={`tab-btn ${tab === 'reviews' ? 'active' : ''}`}
          onClick={() => setTab('reviews')}
        >
          Reviews ({reviews.length})
        </button>
        <button
          className={`tab-btn ${tab === 'projects' ? 'active' : ''}`}
          onClick={() => setTab('projects')}
        >
          Projects ({projects.length})
        </button>
      </div>

      {/* Reviews tab */}
      {tab === 'reviews' && (
        <div style={{ marginTop: 20 }}>
          {reviews.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">⭐</div>
              <h3>No reviews yet</h3>
              <p>Reviews will appear here after completing projects.</p>
            </div>
          ) : (
            reviews.map(r => (
              <div key={r.id} className="review-card" style={{ marginBottom: 12 }}>
                <div className="review-header">
                  <div>
                    <div className="reviewer-name">{r.reviewer_name}</div>
                    <div className="review-meta">
                      {r.project_title} · {new Date(r.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  <StarDisplay rating={r.rating} size="1rem" />
                </div>
                {r.comment && <p className="review-comment">"{r.comment}"</p>}
              </div>
            ))
          )}
        </div>
      )}

      {/* Projects tab */}
      {tab === 'projects' && (
        <div style={{ marginTop: 20 }}>
          {projects.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📁</div>
              <h3>No projects yet</h3>
            </div>
          ) : (
            projects.map(p => (
              <div key={p.id} className="card" style={{ marginBottom: 10, padding: '14px 18px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                  <div>
                    <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 600 }}>{p.title}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 2 }}>
                      {new Date(p.created_at).toLocaleDateString()}
                      {p.budget && <> · <span style={{ color: 'var(--accent)', fontWeight: 600 }}>${Number(p.budget).toLocaleString()}</span></>}
                    </div>
                  </div>
                  <span className={`badge badge-${p.status}`}>{p.status}</span>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default ProfilePage;
