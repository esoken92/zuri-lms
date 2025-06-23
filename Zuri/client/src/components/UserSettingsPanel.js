import React from 'react';

const UserSettingsPanel = ({ user }) => {
  const initials = user.name
    .split(' ')
    .map((n) => n[0])
    .join('');

  return (
    <div className="p-6 w-full max-w-3xl mx-auto">
      <div className="rounded-2xl shadow-xl bg-white dark:bg-gray-800 p-6">
        <div className="flex items-center space-x-4">
          {user.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt="Profile"
              className="w-16 h-16 rounded-full object-cover"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-gray-300 text-black flex items-center justify-center text-xl font-bold">
              {initials}
            </div>
          )}
          <div>
            <h2 className="text-xl font-semibold">{user.name}</h2>
            <p className="text-sm text-gray-500">{user.role}</p>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h3 className="font-medium mb-2">Contact Info</h3>
            <p>Email: {user.email}</p>
            <p>Phone: {user.phone}</p>
          </div>

          <div>
            <h3 className="font-medium mb-2">Preferences</h3>
            <div className="flex items-center justify-between mb-2">
              <label htmlFor="dark-mode">Dark Mode</label>
              <input
                type="checkbox"
                id="dark-mode"
                checked={user.prefersDarkMode}
                readOnly
              />
            </div>
            <div className="flex items-center justify-between mb-2">
              <label htmlFor="language">Language</label>
              <select
                id="language"
                className="border rounded px-2 py-1"
                defaultValue={user.language}
              >
                <option value="en">English</option>
                <option value="af">Afrikaans</option>
                <option value="zu">Zulu</option>
              </select>
            </div>
            <button className="mt-2 px-4 py-2 border border-gray-500 rounded hover:bg-gray-200 dark:hover:bg-gray-700">
              Reset Password
            </button>
          </div>
        </div>

        <div className="mt-6">
          <h3 className="font-medium mb-2">Performance Stats</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold">{user.stats.inspections}</p>
              <p className="text-sm">Inspections</p>
            </div>
            <div>
              <p className="text-2xl font-bold">{user.stats.scraps}</p>
              <p className="text-sm">Scraps Completed</p>
            </div>
            <div>
              <p className="text-2xl font-bold">{user.stats.surveys}</p>
              <p className="text-sm">Tyres Surveyed</p>
            </div>
            <div>
              <p className="text-2xl font-bold">{user.stats.measurements}</p>
              <p className="text-sm">Measurements Taken</p>
            </div>
          </div>
        </div>

        <div className="mt-6">
          <h3 className="font-medium mb-2">Badges</h3>
          <div className="flex flex-wrap gap-2">
            {user.badges.map((badge) => (
              <span
                key={badge.name}
                className={`px-3 py-1 rounded-full text-sm font-medium border ${
                  badge.earned
                    ? 'bg-green-200 text-green-800 border-green-400'
                    : 'bg-gray-200 text-gray-500 border-gray-300 opacity-50'
                }`}
              >
                {badge.name}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserSettingsPanel;
