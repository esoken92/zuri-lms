import React, { useState, useEffect } from 'react';
import Toast from '../Toast';

/**
 * SuggestionsPanel - Admin panel for reviewing and approving user suggestions
 * Only available to admins and managers
 */
const SuggestionsPanel = ({ user }) => {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [selectedSuggestion, setSelectedSuggestion] = useState(null);
  const [rejectNotes, setRejectNotes] = useState('');
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [filter, setFilter] = useState('pending'); // pending, approved, rejected, all

  // Fetch pending suggestions
  const fetchSuggestions = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/suggestions?status=${filter}`, {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch suggestions');
      }

      const data = await response.json();
      setSuggestions(data);
    } catch (error) {
      console.error('Error fetching suggestions:', error);
      setToast({
        message: `Error: ${error.message}`,
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuggestions();
  }, [filter]);

  const handleApproveSuggestion = async (suggestionId) => {
    try {
      const response = await fetch(`/api/suggestions/${suggestionId}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to approve suggestion');
      }

      setToast({
        message: 'Suggestion approved and added to database!',
        type: 'success',
      });

      // Refresh suggestions
      setSelectedSuggestion(null);
      fetchSuggestions();
    } catch (error) {
      console.error('Error approving suggestion:', error);
      setToast({
        message: `Error: ${error.message}`,
        type: 'error',
      });
    }
  };

  const handleRejectSuggestion = async (suggestionId) => {
    if (!rejectNotes.trim()) {
      setToast({
        message: 'Please provide a reason for rejection',
        type: 'error',
      });
      return;
    }

    try {
      const response = await fetch(`/api/suggestions/${suggestionId}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          adminNotes: rejectNotes,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to reject suggestion');
      }

      setToast({
        message: 'Suggestion rejected.',
        type: 'success',
      });

      // Reset form and refresh
      setRejectNotes('');
      setShowRejectForm(false);
      setSelectedSuggestion(null);
      fetchSuggestions();
    } catch (error) {
      console.error('Error rejecting suggestion:', error);
      setToast({
        message: `Error: ${error.message}`,
        type: 'error',
      });
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getSuggestionTypeLabel = (type) => {
    const labels = {
      company: 'New Company',
      depot: 'New Depot',
      tyre: 'New Tyre',
      vehicleConfig: 'New Vehicle Config',
    };
    return labels[type] || type;
  };

  const getStatusBadgeColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">User Suggestions</h2>
          <p className="text-gray-600 text-sm mt-1">Review and approve user-suggested data entries</p>
        </div>
        <button
          onClick={fetchSuggestions}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
          disabled={loading}
        >
          {loading ? 'Loading...' : 'Refresh'}
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 border-b">
        {['pending', 'approved', 'rejected', 'all'].map((filterOption) => (
          <button
            key={filterOption}
            onClick={() => {
              setFilter(filterOption);
              setSelectedSuggestion(null);
            }}
            className={`px-4 py-2 font-medium transition capitalize ${
              filter === filterOption
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {filterOption}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading && !selectedSuggestion ? (
        <div className="text-center py-12">
          <p className="text-gray-500">Loading suggestions...</p>
        </div>
      ) : suggestions.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">No {filter} suggestions found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {selectedSuggestion ? (
            /* Detail View */
            <div className="space-y-4">
              <button
                onClick={() => {
                  setSelectedSuggestion(null);
                  setShowRejectForm(false);
                  setRejectNotes('');
                }}
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                ← Back to List
              </button>

              <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
                {/* Header */}
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">
                      {getSuggestionTypeLabel(selectedSuggestion.suggestion_type)}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Suggested by: <span className="font-medium">{selectedSuggestion.username}</span> ({selectedSuggestion.user_id})
                    </p>
                    <p className="text-sm text-gray-500">
                      {formatDate(selectedSuggestion.created_at)}
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusBadgeColor(selectedSuggestion.status)}`}>
                    {selectedSuggestion.status.toUpperCase()}
                  </span>
                </div>

                {/* Suggestion Data */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-900 mb-3">Suggested Data:</h4>
                  <div className="space-y-2">
                    {Object.entries(selectedSuggestion.suggestion_data).map(([key, value]) => (
                      <div key={key} className="flex justify-between">
                        <span className="text-gray-700 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}:</span>
                        <span className="font-medium text-gray-900 text-right">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Admin Review Info */}
                {selectedSuggestion.admin_reviewed_by && (
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-gray-900 mb-2">Admin Review:</h4>
                    <p className="text-sm text-gray-700">
                      Reviewed by: <span className="font-medium">{selectedSuggestion.admin_reviewed_by}</span>
                    </p>
                    <p className="text-sm text-gray-700">
                      Date: <span className="font-medium">{formatDate(selectedSuggestion.admin_reviewed_at)}</span>
                    </p>
                    {selectedSuggestion.admin_notes && (
                      <p className="text-sm text-gray-700 mt-2">
                        Notes: <span className="font-medium">{selectedSuggestion.admin_notes}</span>
                      </p>
                    )}
                  </div>
                )}

                {/* Action Buttons */}
                {selectedSuggestion.status === 'pending' && (
                  <div className="flex gap-3">
                    <button
                      onClick={() => handleApproveSuggestion(selectedSuggestion.id)}
                      className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition"
                    >
                      ✓ Approve & Add to Database
                    </button>
                    <button
                      onClick={() => setShowRejectForm(!showRejectForm)}
                      className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition"
                    >
                      ✕ Reject
                    </button>
                  </div>
                )}

                {/* Reject Form */}
                {showRejectForm && selectedSuggestion.status === 'pending' && (
                  <div className="space-y-3">
                    <label className="block text-sm font-medium text-gray-700">
                      Reason for Rejection (required):
                    </label>
                    <textarea
                      value={rejectNotes}
                      onChange={(e) => setRejectNotes(e.target.value)}
                      placeholder="e.g., Duplicate entry, Invalid data, Not relevant, etc."
                      rows="3"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                    <div className="flex gap-3">
                      <button
                        onClick={() => handleRejectSuggestion(selectedSuggestion.id)}
                        className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition"
                      >
                        Confirm Rejection
                      </button>
                      <button
                        onClick={() => {
                          setShowRejectForm(false);
                          setRejectNotes('');
                        }}
                        className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* List View */
            suggestions.map((suggestion) => (
              <div
                key={suggestion.id}
                onClick={() => setSelectedSuggestion(suggestion)}
                className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md cursor-pointer transition"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-900">
                      {getSuggestionTypeLabel(suggestion.suggestion_type)}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {suggestion.username} • {formatDate(suggestion.created_at)}
                    </p>
                    <div className="mt-2 text-sm text-gray-600">
                      {Object.entries(suggestion.suggestion_data)
                        .slice(0, 2)
                        .map(([key, value]) => (
                          <p key={key}>
                            <span className="font-medium capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}:</span> {value}
                          </p>
                        ))}
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusBadgeColor(suggestion.status)}`}>
                    {suggestion.status.toUpperCase()}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Toast */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
};

export default SuggestionsPanel;
