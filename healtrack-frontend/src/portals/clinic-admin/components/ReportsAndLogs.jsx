import React, { useState, useEffect } from 'react';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { FileText, Download, Loader2 } from 'lucide-react';
import axiosClient from '../../../api/axiosClient';

export function ReportsAndLogs() {
  const [logs, setLogs] = useState([]);
  const [loadingLogs, setLoadingLogs] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const clinicId = 1;

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const res = await axiosClient.get(`/clinic-admin/${clinicId}/logs`);
        setLogs(res.data);
      } catch (err) {
        console.error("Failed to fetch logs", err);
      } finally {
        setLoadingLogs(false);
      }
    };
    fetchLogs();
  }, [clinicId]);

  const handleCsvDownload = async () => {
    setDownloading(true);
    try {
      const res = await axiosClient.get(`/clinic-admin/${clinicId}/reports/financial`);
      const ledger = res.data;
      
      if (ledger.length === 0) {
        alert("No financial data available to download.");
        setDownloading(false);
        return;
      }

      // Convert JSON to CSV
      const headers = Object.keys(ledger[0]);
      const csvContent = [
        headers.join(','),
        ...ledger.map(row => headers.map(header => `"${row[header] || ''}"`).join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const element = document.createElement("a");
      element.href = URL.createObjectURL(blob);
      element.download = `HealTrack_Financial_Ledger_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
    } catch (err) {
      console.error("Failed to download report", err);
      alert("Failed to generate report.");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-blue-900">Reports & System Logs</h2>
      
      <div className="grid grid-cols-1 gap-6 mb-6">
        <Card className="p-6 flex items-center justify-between bg-blue-50 border-blue-200">
          <div className="flex items-center space-x-4">
            <FileText className="w-8 h-8 text-blue-600" />
            <div>
              <h4 className="font-semibold text-gray-900">Financial Ledger Export</h4>
              <p className="text-sm text-gray-500">Includes all completed consultation fees</p>
            </div>
          </div>
          <Button variant="outline" className="gap-2 bg-white" onClick={handleCsvDownload} disabled={downloading}>
            {downloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />} 
            Export CSV
          </Button>
        </Card>
      </div>

      <Card>
        <div className="px-4 py-3 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
          <h3 className="font-semibold text-gray-900">Live Activity Feed</h3>
          {loadingLogs && <Loader2 className="w-4 h-4 animate-spin text-gray-400" />}
        </div>
        <ul className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
          {logs.length === 0 && !loadingLogs && (
            <li className="p-4 text-gray-500 text-center">No recent activity found.</li>
          )}
          {logs.map((log) => (
            <li key={`${log.type}-${log.id}-${log.date}`} className="p-4 hover:bg-gray-50">
              <div className="flex justify-between items-start">
                <div>
                  <span className="inline-block px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800 mb-2">
                    {log.type}
                  </span>
                  <p className="text-sm font-medium text-gray-900">{log.desc}</p>
                </div>
                <span className="text-xs text-gray-500">{new Date(log.date).toLocaleString()}</span>
              </div>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
