import React, { useState } from 'react';
import { Search, Activity, Shield, Calendar, Terminal } from 'lucide-react';

export function AuditLogs({ logs }) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredLogs = logs.filter(l => 
    l.user_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (l.details && JSON.stringify(l.details).toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header and Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.01)]">
        <div>
          <h3 className="text-lg font-black text-slate-800 tracking-tight flex items-center gap-2">
            <Shield className="w-5 h-5 text-indigo-500" />
            Security & Audit Journals
          </h3>
          <p className="text-xs text-slate-400 font-medium">Trace administrative actions, user checkouts, payment validations, and inventory updates</p>
        </div>
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 stroke-slate-400" />
          <input
            type="text"
            placeholder="Search by User, Action, Details..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-[#f8f9fa] border-0 rounded-2xl text-xs font-semibold text-slate-700 placeholder-slate-400 outline-none focus:ring-2 focus:ring-indigo-500/20 transition"
          />
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-[0_4px_25px_rgba(0,0,0,0.01)]">
        {filteredLogs.length === 0 ? (
          <div className="py-16 text-center text-slate-400 text-xs font-semibold">
            No audit records found matching search filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100">
              <thead>
                <tr className="text-left text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">
                  <th className="pb-3 w-40">Timestamp</th>
                  <th className="pb-3">User / Account</th>
                  <th className="pb-3">Role</th>
                  <th className="pb-3">Action Event</th>
                  <th className="pb-3">Details / Context</th>
                  <th className="pb-3 text-right">Client IP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-700">
                {filteredLogs.map((log) => {
                  let formattedDetails = log.details;
                  try {
                    if (typeof log.details === 'string' && (log.details.startsWith('{') || log.details.startsWith('['))) {
                      const parsed = JSON.parse(log.details);
                      formattedDetails = Object.entries(parsed)
                        .map(([key, val]) => `${key}: ${typeof val === 'object' ? JSON.stringify(val) : val}`)
                        .join(' | ');
                    }
                  } catch (e) {
                    // Fallback to raw details string
                  }

                  return (
                    <tr key={log.id} className="hover:bg-slate-50/50 transition">
                      <td className="py-3.5 text-slate-400 font-medium">
                        {new Date(log.created_at).toLocaleDateString()}
                        <div className="text-[9px]">{new Date(log.created_at).toLocaleTimeString()}</div>
                      </td>
                      <td className="py-3.5 text-slate-800 font-bold">{log.user_name}</td>
                      <td className="py-3.5">
                        <span className={`px-2 py-0.5 rounded-lg text-[9px] font-extrabold uppercase ${
                          log.role === 'SuperAdmin' ? 'bg-purple-100 text-purple-700' :
                          log.role === 'ClinicAdmin' ? 'bg-indigo-100 text-indigo-700' :
                          'bg-emerald-100 text-emerald-700'
                        }`}>
                          {log.role}
                        </span>
                      </td>
                      <td className="py-3.5 text-indigo-650 font-mono font-bold">{log.action}</td>
                      <td className="py-3.5 text-slate-500 max-w-sm truncate" title={formattedDetails}>
                        {formattedDetails}
                      </td>
                      <td className="py-3.5 text-right font-mono text-slate-400 text-[10px]">{log.ip_address}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
