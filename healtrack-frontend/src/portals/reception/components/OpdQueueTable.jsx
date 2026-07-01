import React, { useState } from 'react';
import { Card } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { Search } from 'lucide-react';

export function OpdQueueTable({ queue, onStatusChange }) {
  const [searchTerm, setSearchTerm] = useState('');
  const statusOptions = ['Scheduled', 'Checked-In', 'In Consultation', 'Completed', 'Cancelled'];

  // Filter by search term
  const filteredQueue = queue.filter(appointment => 
    appointment.patientName.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (appointment.patientMrn && appointment.patientMrn.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Split into active and completed
  const activeQueue = filteredQueue.filter(app => app.status !== 'Completed');
  const completedQueue = filteredQueue.filter(app => app.status === 'Completed');

  const renderTable = (appointments, isCompletedTable = false) => (
    <div className="overflow-x-auto border-t border-gray-200">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className={isCompletedTable ? "bg-green-50" : "bg-gray-50"}>
          <tr>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Patient Name</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Doctor Assigned</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
            {!isCompletedTable && <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {appointments.map((appointment) => (
            <tr key={appointment.id} className="hover:bg-gray-50 transition-colors">
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm font-medium text-gray-900">{appointment.patientName}</div>
                {appointment.patientMrn && (
                  <div className="text-xs text-gray-500 mt-0.5">{appointment.patientMrn}</div>
                )}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {isCompletedTable ? (
                  <span className="font-semibold text-green-700">{appointment.doctorName} (Completed)</span>
                ) : (
                  appointment.doctorName
                )}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{appointment.time}</td>
              <td className="px-6 py-4 whitespace-nowrap">
                <Badge status={appointment.status} />
              </td>
              {!isCompletedTable && (
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium flex justify-end gap-2 items-center">
                  {(appointment.status === 'Scheduled' || appointment.status === 'Checked-In') && (
                    <button
                      onClick={() => onStatusChange(appointment.id, 'In Consultation')}
                      className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-1.5 px-3 rounded shadow-sm transition"
                    >
                      Send In
                    </button>
                  )}
                  <select
                    value={appointment.status}
                    onChange={(e) => onStatusChange(appointment.id, e.target.value)}
                    className="block rounded-md border-gray-300 py-1 pl-2 pr-6 text-xs focus:border-blue-500 focus:outline-none focus:ring-blue-500 bg-white border"
                  >
                    {statusOptions.map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </td>
              )}
            </tr>
          ))}
          {appointments.length === 0 && (
            <tr>
              <td colSpan={isCompletedTable ? "4" : "5"} className="px-6 py-8 text-center text-gray-500">
                {isCompletedTable ? "No completed appointments." : "No appointments currently in the active queue."}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Active Queue Card */}
      <Card>
        <div className="px-4 py-3 border-b border-gray-200 bg-gray-50 flex flex-col sm:flex-row justify-between sm:items-center gap-3">
          <h2 className="text-lg font-semibold text-gray-900">Today's OPD Queue</h2>
          
          {/* Search Bar */}
          <div className="relative w-full sm:w-64">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
              <Search className="w-4 h-4" />
            </span>
            <input 
              type="text" 
              placeholder="Search patients..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white border border-gray-300 rounded-lg pl-9 pr-3 py-1.5 text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500 transition"
            />
          </div>
        </div>
        
        {renderTable(activeQueue, false)}
      </Card>

      {/* Completed Appointments Card */}
      <Card>
        <div className="px-4 py-3 border-b border-gray-200 bg-green-50 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-green-900">Completed Appointments</h2>
          <span className="px-2.5 py-0.5 bg-green-200 text-green-800 text-xs font-bold rounded-full">
            {completedQueue.length}
          </span>
        </div>
        
        {renderTable(completedQueue, true)}
      </Card>
    </div>
  );
}
