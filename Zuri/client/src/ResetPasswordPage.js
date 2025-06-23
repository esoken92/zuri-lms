import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [status, setStatus] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (newPassword !== confirm) {
      setStatus({ type: 'error', msg: 'Passwords do not match' });
      return;
    }
    try {
      const res = await fetch('/api/reset-password/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword }),
      });
      const data = await res.json();
      setStatus({ type: res.ok ? 'success' : 'error', msg: data.message });
    } catch (err) {
      setStatus({ type: 'error', msg: 'Something went wrong' });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <div className="bg-white dark:bg-gray-800 shadow-md p-6 rounded-md max-w-md w-full">
        <h2 className="text-2xl font-bold mb-4">Reset Your Password</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="password"
            placeholder="New password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="w-full px-4 py-2 rounded bg-gray-100 dark:bg-gray-700 focus:outline-none"
          />
          <input
            type="password"
            placeholder="Confirm password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className="w-full px-4 py-2 rounded bg-gray-100 dark:bg-gray-700 focus:outline-none"
          />
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
          >
            Reset Password
          </button>
        </form>
        {status && (
          <p className={`mt-4 text-sm ${status.type === 'error' ? 'text-red-500' : 'text-green-500'}`}>
            {status.msg}
          </p>
        )}
      </div>
    </div>
  );
}
