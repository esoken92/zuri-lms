import React from 'react';

function Breadcrumb({ path, onNavigate }) {
  return (
    <nav className="flex items-center gap-2 px-4 py-3 bg-gray-100 dark:bg-gray-700 border-b border-gray-300 dark:border-gray-600 text-sm">
      {path && path.length > 0 ? (
        path.map((item, idx) => (
          <div key={idx} className="flex items-center gap-2">
            {idx > 0 && <span className="text-gray-500 dark:text-gray-400">/</span>}
            {item.clickable ? (
              <button
                type="button"
                onClick={() => onNavigate(item.id)}
                className="text-blue-600 dark:text-blue-400 hover:underline"
              >
                {item.label}
              </button>
            ) : (
              <span className="text-gray-900 dark:text-white font-medium">{item.label}</span>
            )}
          </div>
        ))
      ) : (
        <span className="text-gray-500 dark:text-gray-400">Inspection Form</span>
      )}
    </nav>
  );
}

export default Breadcrumb;
