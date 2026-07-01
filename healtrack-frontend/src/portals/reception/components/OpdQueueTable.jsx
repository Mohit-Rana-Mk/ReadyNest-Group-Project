import React from 'react';
import { Card } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';

export function OpdQueueTable({ queue, onStatusChange }) {
  const statusOptions = ['Scheduled', 'Checked-In', 'In Consultation', 'Completed', 'Cancelled'];

  return (
    <Card>
      <div className="px-4 py-3 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-900">Today's OPD Queue</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Patient Name</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Doctor Assigned</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {queue.map((appointment) => (
              <tr key={appointment.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{appointment.patientName}</div>
                  {appointment.patientMrn && (
                    <div className="text-xs text-gray-500 mt-0.5">{appointment.patientMrn}</div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{appointment.doctorName}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{appointment.time}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <Badge status={appointment.status} />
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <select
                    value={appointment.status}
                    onChange={(e) => onStatusChange(appointment.id, e.target.value)}
                    className="block w-full rounded-md border-gray-300 py-1.5 pl-3 pr-8 text-xs focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm bg-white border"
                  >
                    {statusOptions.map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
            {queue.length === 0 && (
              <tr>
                <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                  No appointments currently in the queue.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
