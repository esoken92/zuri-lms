// src/components/Toast.js
import React from 'react';

function Toast({ type = 'success', message }) {
  const bg = type === 'success' ? 'bg-green-600' : 'bg-red-600';
  return (
    <div className={`${bg} text-white px-4 py-2 rounded shadow fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50`}>
      {message}
    </div>
  );
}

export default Toast;
