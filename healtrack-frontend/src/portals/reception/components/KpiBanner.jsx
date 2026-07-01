import React from 'react';
import { Card } from '../../../components/ui/Card';
import { Users, Clock, Stethoscope } from 'lucide-react';

export function KpiBanner({ totalWalkIns, avgWaitTime, activeDoctors }) {
  const kpis = [
    { label: 'Total Patients (Today)', value: totalWalkIns, icon: Users, color: 'text-indigo-600', bg: 'bg-indigo-100' },
    { label: 'Avg. Wait Time', value: avgWaitTime, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-100' },
    { label: 'Active Doctors', value: activeDoctors, icon: Stethoscope, color: 'text-green-600', bg: 'bg-green-100' },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      {kpis.map((kpi, idx) => (
        <Card key={idx} className="p-4 flex items-center space-x-4">
          <div className={`p-3 rounded-full ${kpi.bg}`}>
            <kpi.icon className={`w-6 h-6 ${kpi.color}`} />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">{kpi.label}</p>
            <p className="text-2xl font-bold text-gray-900">{kpi.value}</p>
          </div>
        </Card>
      ))}
    </div>
  );
}
