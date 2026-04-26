// src/pages/ReviewPage.js — Submit a review for a completed project
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import StarRating from '../components/StarRating';
import './ReviewPage.css';

const ReviewPage = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();

  const [rating,    setRating]    = useState(0);
  const [comment,   setComment]   = useState('');
  const [error,     setError]     = useState('');
  const [success,   setSuccess]   = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (rating === 0) return setError('Please select a rating (1–5 stars).');

    try {
      setSubmitting(true);
      await api.post('/reviews', {
        project_id: parseInt(projectId),
        rating,
        comment
      });
      setSuccess('Review submitted! Redirecting...');
      setTimeout(() => navigate('/projects'), 1800);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to submit review.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="review-wrapper">
      <div className="review-form-card">
        <div className="review-form-header">
          <div className="review-icon-wrap">★</div>
          <h1>Write a Review</h1>
          <p>Share your experience for Project #{projectId}</p>
        </div>

        {error   && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group" style={{ textAlign: 'center' }}>
            <label style={{ display: 'block', textAlign: 'left' }}>Your Rating *</label>
            <div style={{ marginTop: 10 }}>
              <StarRating value={rating} onChange={setRating} />
            </div>
            {rating > 0 && (
              <span className="rating-label">
                {['', 'Poor', 'Fair', 'Good', 'Great', 'Excellent!'][rating]}
              </span>
            )}
          </div>

          <div className="form-group">
            <label>Your Review (optional)</label>
            <textarea
              value={comment}
              onChange={e => setComment(e.target.value)}
              placeholder="Describe your experience working together. Was communication good? Was the work delivered on time?"
              rows={5}
            />
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn btn-primary" type="submit" disabled={submitting || rating === 0}>
              {submitting ? 'Submitting...' : 'Submit Review'}
            </button>
            <button
              className="btn btn-outline"
              type="button"
              onClick={() => navigate('/projects')}
            >
              Cancel
            </button>
          </div>
        </form>

        <div className="review-note">
          <strong>Note:</strong> Reviews can only be submitted once per project. Both the client and freelancer can review each other independently.
        </div>
      </div>
    </div>
  );
};

export default ReviewPage;
