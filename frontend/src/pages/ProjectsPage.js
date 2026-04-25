// src/pages/ProjectsPage.js
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { StarDisplay } from '../components/StarRating';
import './ProjectsPage.css';

const ProjectsPage = () => {
  const { user } = useAuth();
  const [projects, setProjects]     = useState([]);
  const [freelancers, setFreelancers] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [showForm, setShowForm]     = useState(false);
  const [error, setError]           = useState('');
  const [success, setSuccess]       = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Dispute form state
  const [disputeProject, setDisputeProject] = useState(null);
  const [disputeReason,  setDisputeReason]  = useState('');

  const [form, setForm] = useState({
    title: '', description: '', budget: '', freelancer_id: ''
  });

  const fetchProjects = async () => {
    try {
      const { data } = await api.get('/projects');
      setProjects(data.projects);
    } catch (err) {
      setError('Failed to load projects.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
    // Load freelancers for assignment dropdown (only for clients)
    if (user.role === 'client') {
      api.get('/users?role=freelancer').then(({ data }) => setFreelancers(data.users));
    }
  }, [user.role]);

  const handleFormChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
  };

  const handleCreateProject = async (e) => {
    e.preventDefault();
    if (!form.title) return setError('Project title is required.');
    try {
      setSubmitting(true);
      await api.post('/projects', form);
      setSuccess('Project created successfully!');
      setForm({ title: '', description: '', budget: '', freelancer_id: '' });
      setShowForm(false);
      fetchProjects();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create project.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleComplete = async (projectId) => {
    if (!window.confirm('Mark this project as completed?')) return;
    try {
      await api.patch(`/projects/${projectId}/complete`);
      setSuccess('Project marked as completed!');
      fetchProjects();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to complete project.');
    }
  };

  const handleDispute = async (projectId) => {
    if (!disputeReason.trim()) return setError('Please enter a reason for the dispute.');
    try {
      await api.post('/disputes', { project_id: projectId, reason: disputeReason });
      setSuccess('Dispute raised successfully.');
      setDisputeProject(null);
      setDisputeReason('');
      fetchProjects();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to raise dispute.');
    }
  };

  if (loading) return <div className="loader">Loading projects...</div>;

  return (
    <div>
      {/* Header */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1>Projects</h1>
          <p>Manage your projects and collaborations</p>
        </div>
        {user.role === 'client' && (
          <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
            {showForm ? '✕ Cancel' : '+ New Project'}
          </button>
        )}
      </div>

      {/* Alerts */}
      {error   && <div className="alert alert-error"   onClick={() => setError('')}>{error}</div>}
      {success && <div className="alert alert-success" onClick={() => setSuccess('')}>{success}</div>}

      {/* Create project form */}
      {showForm && user.role === 'client' && (
        <div className="card" style={{ marginBottom: 28 }}>
          <h3 className="card-title">Create New Project</h3>
          <form onSubmit={handleCreateProject}>
            <div className="grid-2">
              <div className="form-group">
                <label>Project Title *</label>
                <input name="title" value={form.title} onChange={handleFormChange} placeholder="e.g. Build an E-commerce Site" />
              </div>
              <div className="form-group">
                <label>Budget ($)</label>
                <input type="number" name="budget" value={form.budget} onChange={handleFormChange} placeholder="e.g. 1500" />
              </div>
            </div>
            <div className="form-group">
              <label>Description</label>
              <textarea name="description" value={form.description} onChange={handleFormChange} placeholder="Describe the project requirements..." rows={3} />
            </div>
            <div className="form-group">
              <label>Assign Freelancer (optional)</label>
              <select name="freelancer_id" value={form.freelancer_id} onChange={handleFormChange}>
                <option value="">— Assign later —</option>
                {freelancers.map(f => (
                  <option key={f.id} value={f.id}>
                    {f.name} — ★ {f.avg_rating > 0 ? Number(f.avg_rating).toFixed(1) : 'No rating'} — {f.total_completed} projects
                  </option>
                ))}
              </select>
            </div>
            <button className="btn btn-primary" type="submit" disabled={submitting}>
              {submitting ? 'Creating...' : 'Create Project'}
            </button>
          </form>
        </div>
      )}

      {/* Dispute form modal */}
      {disputeProject && (
        <div className="dispute-overlay" onClick={() => setDisputeProject(null)}>
          <div className="dispute-modal" onClick={e => e.stopPropagation()}>
            <h3>Raise a Dispute</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginBottom: 16 }}>
              Project: <strong>{disputeProject.title}</strong>
            </p>
            <div className="form-group">
              <label>Reason for Dispute</label>
              <textarea
                value={disputeReason}
                onChange={e => setDisputeReason(e.target.value)}
                placeholder="Describe the issue clearly..."
                rows={4}
              />
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-danger" onClick={() => handleDispute(disputeProject.id)}>
                Submit Dispute
              </button>
              <button className="btn btn-outline" onClick={() => setDisputeProject(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Projects list */}
      {projects.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📁</div>
          <h3>No projects yet</h3>
          <p>{user.role === 'client' ? 'Create your first project above.' : 'You\'ll appear here when a client assigns you to a project.'}</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {projects.map(p => (
            <div key={p.id} className="project-card">
              <div className="project-meta">
                <span className={`badge badge-${p.status}`}>{p.status}</span>
                {p.budget && <span className="project-budget">${Number(p.budget).toLocaleString()}</span>}
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  {new Date(p.created_at).toLocaleDateString()}
                </span>
              </div>

              <div className="project-title">{p.title}</div>

              {p.description && <p className="project-desc">{p.description}</p>}

              <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: 12 }}>
                {p.client_name && <span>Client: <strong style={{ color: 'var(--text)' }}>{p.client_name}</strong></span>}
                {p.freelancer_name && (
                  <span style={{ marginLeft: 12 }}>
                    Freelancer: <strong style={{ color: 'var(--text)' }}>{p.freelancer_name}</strong>
                    {p.freelancer_rating > 0 && <> <StarDisplay rating={p.freelancer_rating} size="0.8rem" /></>}
                  </span>
                )}
              </div>

              <div className="project-actions">
                {/* Client actions */}
                {user.role === 'client' && p.client_id === user.id && p.status === 'assigned' && (
                  <button className="btn btn-success btn-sm" onClick={() => handleComplete(p.id)}>
                    ✓ Mark Complete
                  </button>
                )}

                {/* Review button (after completion) */}
                {p.status === 'completed' && (
                  <Link to={`/review/${p.id}`} className="btn btn-outline btn-sm">
                    ★ Write Review
                  </Link>
                )}

                {/* Dispute button */}
                {(p.status === 'assigned' || p.status === 'completed') && p.status !== 'disputed' && (
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={() => setDisputeProject(p)}
                  >
                    ⚑ Raise Dispute
                  </button>
                )}

                {/* View profile links */}
                {p.freelancer_id && (
                  <Link to={`/profile/${p.freelancer_id}`} className="btn btn-outline btn-sm">
                    View Freelancer
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProjectsPage;
