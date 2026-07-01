import React from 'react';
import { Card } from '../../../components/ui/Card';
import { Activity } from 'lucide-react';

export function OperationsOverview({ operations }) {
  const scheduled = operations.filter(op => op.status === 'Scheduled').length;
  const waiting = operations.filter(op => op.status === 'Checked-In').length;
  const inConsultation = operations.filter(op => op.status === 'In Consultation').length;
  const completed = operations.filter(op => op.status === 'Completed').length;
  const cancelled = operations.filter(op => op.status === 'Cancelled').length;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-indigo-900">Operations Overview</h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <div className="flex items-center space-x-3 mb-6">
            <Activity className="text-indigo-600 w-6 h-6" />
            <h3 className="text-lg font-semibold text-gray-900">Live OP Queue Pulse (Today)</h3>
          </div>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-md">
              <span className="text-gray-600">Booked (Not Arrived)</span>
              <span className="font-bold text-xl text-indigo-600">{scheduled}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-md">
              <span className="text-gray-600">Currently Waiting</span>
              <span className="font-bold text-xl text-indigo-600">{waiting}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-md">
              <span className="text-gray-600">In Consultation</span>
              <span className="font-bold text-xl text-amber-600">{inConsultation}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-md">
              <span className="text-gray-600">Completed Today</span>
              <span className="font-bold text-xl text-green-600">{completed}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-md border-t border-gray-200 mt-2">
              <span className="text-gray-600">Cancelled / No-Show</span>
              <span className="font-bold text-xl text-red-600">{cancelled}</span>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Today's Appointments</h3>
          <ul className="divide-y divide-gray-200">
            {operations.map((op, i) => (
              <li key={i} className="py-3 flex justify-between">
                <span className="text-sm font-medium text-gray-900">{op.patient_name}</span>
                <span className="text-sm text-gray-500">{op.doctor_name}</span>
                <span className="text-sm font-medium px-2 py-1 bg-gray-100 rounded text-gray-700">{op.status}</span>
              </li>
            ))}
            {operations.length === 0 && (
              <li className="py-3 text-sm text-gray-500">No appointments today.</li>
            )}
          </ul>
        </Card>
      </div>
    </div>
  );
}
