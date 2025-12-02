import React, { useState, useEffect } from 'react';
import { login } from './api';

export default function LoginPage({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const [serverStatus, setServerStatus] = useState('checking');
  const [forgotOpen, setForgotOpen] = useState(false);
  const [resetMessage, setResetMessage] = useState('');
  const [theme, setTheme] = useState('light');

  // Handle light/dark theme toggle
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Collect client information for analytics
      const clientInfo = {
        language: navigator.language,
        languages: navigator.languages || [navigator.language],
        platform: navigator.platform,
        userAgent: navigator.userAgent,
        screenResolution: `${window.screen.width}x${window.screen.height}`,
        viewportSize: `${window.innerWidth}x${window.innerHeight}`,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        cookieEnabled: navigator.cookieEnabled,
        doNotTrack: navigator.doNotTrack === '1',
        deviceType: /Mobile|Android|iPhone|iPad/i.test(navigator.userAgent) ? 'mobile' : 'desktop',
        browserVersion: navigator.userAgent.match(/(Chrome|Firefox|Safari|Edge)\/(\d+\.\d+)/)?.[2] || null,
        osVersion: navigator.userAgent.match(/(Windows NT|Mac OS X|Android|iOS) ([\d._]+)/)?.[2] || null
      };
      
      const user = await login(username, password, clientInfo);
      onLogin(user);
    } catch (err) {
      setError('Login failed');
    }
  };

  const handleResetPassword = async () => {
    setResetMessage('');
    if (!username) {
      setResetMessage('Please enter your username first.');
      return;
    }
    try {
      const res = await fetch('/api/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username }),
      });
      if (res.ok) {
        setResetMessage('Password reset link sent to your registered email.');
      } else {
        setResetMessage('Could not send reset link. Please check your username.');
      }
    } catch {
      setResetMessage('An error occurred. Please try again later.');
    }
  };

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const res = await fetch('/api/status');
        setServerStatus(res.ok ? 'online' : 'offline');
      } catch {
        setServerStatus('offline');
      }
    };
    checkStatus();
    const interval = setInterval(checkStatus, 10000);
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = () => {
    if (serverStatus === 'online') return 'bg-green-500';
    if (serverStatus === 'offline') return 'bg-red-500';
    return 'bg-orange-400';
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-100 to-white dark:from-gray-800 dark:to-gray-900 text-gray-900 dark:text-gray-100 transition-colors">
      {/* Header */}
      <header className="flex justify-between items-center p-4 bg-gray-100 dark:bg-gray-800 shadow-sm">
        <div className="flex items-center gap-2">
          <svg className="w-6 h-6 text-blue-600" viewBox="0 0 48 48" fill="currentColor">
            <path d="M36.7273 44C33.9891 44 31.6043 39.8386 30.3636 33.69C29.123 39.8386 26.7382 44 24 44C21.2618 44 18.877 39.8386 17.6364 33.69C16.3957 39.8386 14.0109 44 11.2727 44C7.25611 44 4 35.0457 4 24C4 12.9543 7.25611 4 11.2727 4C14.0109 4 16.3957 8.16144 17.6364 14.31C18.877 8.16144 21.2618 4 24 4C26.7382 4 29.123 8.16144 30.3636 14.31C31.6043 8.16144 33.9891 4 36.7273 4C40.7439 4 44 12.9543 44 24C44 35.0457 40.7439 44 36.7273 44Z" />
          </svg>
          <h1 className="text-lg font-semibold">Zuri Tyre Inspection</h1>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center">
            <span className={`w-3 h-3 rounded-full ${getStatusColor()} mr-1`}></span>
            <span className="text-sm capitalize">{serverStatus}</span>
          </div>

          {/* Theme toggle */}
          <button
            onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
            className="ml-2 px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded text-sm"
          >
            {theme === 'light' ? '🌙' : '☀️'}
          </button>
        </div>
      </header>

      {/* Login Form */}
      <main className="flex-1 flex items-center justify-center px-4">
        <div className="bg-white dark:bg-gray-800 shadow-xl rounded-2xl p-8 w-full max-w-md mt-6">
          <h2 className="text-2xl font-bold text-center mb-4">Welcome Back</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <p className="text-red-500">{error}</p>}
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoComplete="off"
            />
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 pr-10 bg-gray-100 dark:bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-300 text-sm"
              >
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>

            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-semibold"
            >
              Login
            </button>
          </form>

          {/* Forgot password section */}
          <div className="mt-4 text-center text-sm">
            <button
              type="button"
              className="text-blue-600 hover:underline"
              onClick={() => setForgotOpen(!forgotOpen)}
            >
              Forgot Password?
            </button>
            {forgotOpen && (
              <div className="mt-2 space-y-2">
                <p className="text-gray-600 dark:text-gray-300 text-sm">
                  Enter your username above and click below to reset your password.
                </p>
                <button
                  className="text-blue-500 underline text-sm"
                  onClick={handleResetPassword}
                >
                  Send Reset Email
                </button>
                {resetMessage && (
                  <p className="text-xs text-green-500 dark:text-green-400">{resetMessage}</p>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
