'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

interface VenueFormProps {
  venue?: any; // If passed, we are editing
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
}

export default function VenueForm({ venue, onClose, onSave }: VenueFormProps) {
  const [name, setName] = useState('');
  const [type, setType] = useState('Marquee');
  const [capacity, setCapacity] = useState(350);
  const [description, setDescription] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (venue) {
      setName(venue.name || '');
      setType(venue.type || 'Marquee');
      setCapacity(venue.capacity || 350);
      setDescription(venue.description || '');
      setIsActive(venue.is_active !== undefined ? venue.is_active : true);
    }
  }, [venue]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please provide a name for the venue.');
      return;
    }
    if (capacity <= 0) {
      setError('Guest capacity must be greater than zero.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await onSave({
        name: name.trim(),
        type,
        capacity: Number(capacity),
        description: description.trim(),
        is_active: isActive,
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save venue profile.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-gray-100 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="px-6 py-4 bg-[#1F3864] text-white flex justify-between items-center">
          <h3 className="font-serif text-lg font-bold">
            {venue ? 'Modify Venue Settings' : 'Register New Venue'}
          </h3>
          <button onClick={onClose} className="text-gray-300 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3.5 bg-red-50 border border-red-100 rounded-xl text-xs font-medium text-red-600">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">
              Venue Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#1F3864] focus:border-transparent transition-all text-sm"
              placeholder="e.g., RSM Hall, JTS Hall"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">
              Venue Classification Type
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full px-4 py-2 rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#1F3864] focus:border-transparent transition-all text-sm"
            >
              <option value="Marquee">Marquee</option>
              <option value="Hall">Hall</option>
              <option value="Lawn">Lawn</option>
              <option value="Banquet">Banquet</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">
              Maximum Guest Capacity
            </label>
            <input
              type="number"
              value={capacity}
              onChange={(e) => setCapacity(Number(e.target.value))}
              className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#1F3864] focus:border-transparent transition-all text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">
              Additional Details / Notes (Optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#1F3864] focus:border-transparent transition-all text-sm resize-none"
              placeholder="Operational remarks, features..."
            />
          </div>

          <div className="flex items-center justify-between py-2 border-t border-gray-50 mt-4">
            <div>
              <span className="text-sm font-semibold text-gray-700 block">Operational Status</span>
              <span className="text-xs text-gray-400">Controls booking availability</span>
            </div>
            <button
              type="button"
              onClick={() => setIsActive(!isActive)}
              className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors duration-200 focus:outline-none ${
                isActive ? 'bg-emerald-500' : 'bg-gray-200'
              }`}
            >
              <div
                className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ${
                  isActive ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Form Actions */}
          <div className="flex items-center gap-3 justify-end pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-xl transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 text-sm font-medium text-white bg-[#1F3864] hover:bg-[#152644] rounded-xl transition-all shadow-md disabled:bg-gray-400"
            >
              {loading ? 'Processing...' : 'Save Venue'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}