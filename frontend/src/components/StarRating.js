// src/components/StarRating.js — Interactive and display star rating
import React, { useState } from 'react';

// Display-only star rating
export const StarDisplay = ({ rating, size = '1rem' }) => {
  const filled = Math.round(rating || 0);
  return (
    <span style={{ fontSize: size }}>
      {[1,2,3,4,5].map(i => (
        <span key={i} style={{ color: i <= filled ? '#f5a623' : '#2f3650' }}>★</span>
      ))}
      <span style={{ color: '#7a8099', fontSize: '0.85em', marginLeft: 4 }}>
        {rating ? Number(rating).toFixed(1) : 'N/A'}
      </span>
    </span>
  );
};

// Clickable star rating input
const StarRating = ({ value, onChange }) => {
  const [hovered, setHovered] = useState(0);

  return (
    <div style={{ display: 'flex', gap: 4, cursor: 'pointer', fontSize: '1.8rem' }}>
      {[1,2,3,4,5].map(i => (
        <span
          key={i}
          style={{
            color: i <= (hovered || value) ? '#f5a623' : '#2f3650',
            transition: 'color 0.15s'
          }}
          onMouseEnter={() => setHovered(i)}
          onMouseLeave={() => setHovered(0)}
          onClick={() => onChange(i)}
        >
          ★
        </span>
      ))}
      {value > 0 && (
        <span style={{ color: '#7a8099', fontSize: '0.7em', alignSelf: 'center', marginLeft: 4 }}>
          {value}/5
        </span>
      )}
    </div>
  );
};

export default StarRating;
