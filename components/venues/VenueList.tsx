'use client';

import { Edit2, ToggleLeft, ToggleRight, Plus, MapPin } from 'lucide-react';

interface VenueListProps {
  venues: any[];
  onAddClick: () => void;
  onEditClick: (venue: any) => void;
  onToggleActive: (id: string, currentStatus: boolean) => void;
}

export default function VenueList({ venues, onAddClick, onEditClick, onToggleActive }: VenueListProps) {
  return (
    <div className="space-y-6">
      {/* Table Action Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-[#1F3864]/5 rounded-xl text-[#1F3864]">
            <MapPin className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-[#1F3864] font-serif">Halls & Marquees Directory</h2>
            <p className="text-sm text-gray-500 mt-0.5">Manage spaces and booking capacities for independent properties.</p>
          </div>
        </div>
        <button
          onClick={onAddClick}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-white bg-[#1F3864] hover:bg-[#152644] transition-all shadow-md text-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Venue</span>
        </button>
      </div>

      {/* Main Grid/Table Shell */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {venues.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            No venues found. Use the button above to add one.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-xs font-semibold uppercase tracking-wider text-gray-500">
                  <th className="px-6 py-4">Venue Details</th>
                  <th className="px-6 py-4">Classification</th>
                  <th className="px-6 py-4">Maximum Capacity</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Operations Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 text-sm">
                {venues.map((venue) => (
                  <tr key={venue.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-bold text-gray-900">{venue.name}</p>
                      {venue.description && (
                        <p className="text-xs text-gray-500 mt-0.5 max-w-xs truncate">{venue.description}</p>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-3 py-1 bg-gray-100 text-gray-700 text-xs font-semibold rounded-lg">
                        {venue.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-800">
                      {venue.capacity} guests
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                          venue.is_active
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-gray-50 text-gray-500 border border-gray-200'
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${venue.is_active ? 'bg-emerald-500' : 'bg-gray-400'}`} />
                        {venue.is_active ? 'Active' : 'Deactivated'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => onEditClick(venue)}
                          className="p-2 text-gray-500 hover:text-[#1F3864] hover:bg-gray-100 rounded-xl transition-all"
                          title="Edit Configuration"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onToggleActive(venue.id, venue.is_active)}
                          className={`p-2 transition-all rounded-xl ${
                            venue.is_active
                              ? 'text-gray-400 hover:text-red-500 hover:bg-red-50'
                              : 'text-emerald-500 hover:bg-emerald-50'
                          }`}
                          title={venue.is_active ? 'Deactivate Venue' : 'Activate Venue'}
                        >
                          {venue.is_active ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}