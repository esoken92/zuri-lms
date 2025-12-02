import React, { useState } from 'react';
import Toast from './Toast';

/**
 * DataSuggestionModal - Modal for users to suggest new companies, depots, tyres, or vehicle configs
 * Only available to non-admin users
 */
const DataSuggestionModal = ({ isOpen, onClose, suggestionType, user, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [formData, setFormData] = useState({});

  if (!isOpen) return null;

  const titles = {
    company: 'Suggest New Company',
    depot: 'Suggest New Depot',
    tyre: 'Suggest New Tyre',
    vehicleConfig: 'Suggest New Vehicle Configuration',
  };

  const descriptions = {
    company: 'Suggest a new company that should be added to the system',
    depot: 'Suggest a new depot that should be added to the system',
    tyre: 'Suggest a new tyre/brand that should be added to the system',
    vehicleConfig: 'Suggest a new vehicle configuration that should be added to the system',
  };

  const getFormFields = () => {
    switch (suggestionType) {
      case 'company':
        return [
          { name: 'companyName', label: 'Company Name', type: 'text', required: true },
          { name: 'contactPerson', label: 'Contact Person', type: 'text', required: false },
          { name: 'email', label: 'Email', type: 'email', required: false },
          { name: 'phone', label: 'Phone', type: 'tel', required: false },
          { name: 'address', label: 'Address', type: 'text', required: false },
        ];
      case 'depot':
        return [
          { name: 'depotName', label: 'Depot Name', type: 'text', required: true },
          { name: 'location', label: 'Location', type: 'text', required: true },
          { name: 'manager', label: 'Manager Name', type: 'text', required: false },
          { name: 'phone', label: 'Phone', type: 'tel', required: false },
        ];
      case 'tyre':
        return [
          { name: 'brand', label: 'Tyre Brand', type: 'text', required: true },
          { name: 'size', label: 'Tyre Size', type: 'text', required: true, placeholder: 'e.g., 205/65R16' },
          { name: 'type', label: 'Tyre Type', type: 'text', required: false, placeholder: 'e.g., Summer, Winter, All-Season' },
          { name: 'notes', label: 'Additional Notes', type: 'textarea', required: false },
        ];
      case 'vehicleConfig':
        return [
          { name: 'vehicleType', label: 'Vehicle Type', type: 'text', required: true, placeholder: 'e.g., Truck, Van, Car' },
          { name: 'axles', label: 'Number of Axles', type: 'number', required: true },
          { name: 'totalWheels', label: 'Total Wheels', type: 'number', required: true },
          { name: 'tyresPerAxle', label: 'Tyres Per Axle', type: 'number', required: false },
          { name: 'notes', label: 'Additional Notes', type: 'textarea', required: false },
        ];
      default:
        return [];
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate required fields
    const fields = getFormFields();
    const requiredFields = fields.filter(f => f.required);
    const missingFields = requiredFields.filter(f => !formData[f.name]?.trim());
    
    if (missingFields.length > 0) {
      setToast({
        message: `Please fill in all required fields: ${missingFields.map(f => f.label).join(', ')}`,
        type: 'error',
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/suggestions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          suggestionType,
          suggestionData: formData,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || `Failed to submit suggestion`);
      }

      setToast({
        message: `Thank you! Your ${suggestionType} suggestion has been submitted for admin review.`,
        type: 'success',
      });

      // Reset form and close
      setFormData({});
      setTimeout(() => {
        onClose();
        if (onSuccess) onSuccess();
      }, 2000);
    } catch (error) {
      console.error('Error submitting suggestion:', error);
      setToast({
        message: `Error: ${error.message}`,
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const fields = getFormFields();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold">{titles[suggestionType]}</h2>
            <p className="text-blue-100 text-sm mt-1">{descriptions[suggestionType]}</p>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-blue-800 rounded-full p-2 transition"
          >
            ✕
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {fields.map((field) => (
            <div key={field.name}>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {field.label}
                {field.required && <span className="text-red-500">*</span>}
              </label>
              {field.type === 'textarea' ? (
                <textarea
                  name={field.name}
                  value={formData[field.name] || ''}
                  onChange={handleInputChange}
                  placeholder={field.placeholder}
                  rows="3"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              ) : (
                <input
                  type={field.type}
                  name={field.name}
                  value={formData[field.name] || ''}
                  onChange={handleInputChange}
                  placeholder={field.placeholder}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              )}
            </div>
          ))}

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition disabled:bg-gray-400"
              disabled={loading}
            >
              {loading ? 'Submitting...' : 'Submit Suggestion'}
            </button>
          </div>
        </form>
      </div>

      {/* Toast Notification */}
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

export default DataSuggestionModal;
