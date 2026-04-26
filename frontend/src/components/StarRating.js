// src/components/StarRating.js — Interactive and display star rating
import React, { useState } from 'react';

// Display-only star rating
export const StarDisplay = ({ rating, size = '1rem' }) => {
  const filled = Math.round(rating || 0);
  return (
    <span style={{ fontSize: size }}>
      {[1,2,3,4,5].map(i => (
        <span key={i} style={{ color: i <= filled ? '#f59e0b' : '#e2e8f0' }}>★</span>
      ))}
      <span style={{ color: '#94a3b8', fontSize: '0.85em', marginLeft: 5 }}>
        {rating ? Number(rating).toFixed(1) : 'N/A'}
      </span>
    </span>
  );
};

// Clickable star rating input
const StarRating = ({ value, onChange }) => {
  const [hovered, setHovered] = useState(0);

  return (
    <div style={{ display: 'inline-flex', gap: 6, cursor: 'pointer', fontSize: '2rem' }}>
      {[1,2,3,4,5].map(i => (
        <span
          key={i}
          style={{
            color: i <= (hovered || value) ? '#f59e0b' : '#e2e8f0',
            transition: 'color 0.12s, transform 0.12s',
            display: 'inline-block',
            transform: i <= (hovered || value) ? 'scale(1.15)' : 'scale(1)',
          }}
          onMouseEnter={() => setHovered(i)}
          onMouseLeave={() => setHovered(0)}
          onClick={() => onChange(i)}
        >
          ★
        </span>
      ))}
      {value > 0 && (
        <span style={{ color: '#64748b', fontSize: '0.65em', alignSelf: 'center', marginLeft: 6, fontWeight: 600 }}>
          {value}/5
        </span>
      )}
    </div>
  );
};

export default StarRating;
