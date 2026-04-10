import React, { useState, useEffect } from 'react';
import { Download, FileSpreadsheet, FileText, Filter } from 'lucide-react';
import { applicationService } from '../../services/firebaseService';
import { Application } from '../../types';

export default function Reports() {
  const [apps, setApps] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    applicationService.getApplications().then(data => {
      setApps(data);
      setLoading(false);
    });
  }, []);

  const exportToCSV = () => {
    const headers = ['Application ID', 'Name', 'Mobile', 'Position', 'Experience', 'Status', 'Applied Date'];
    const rows = apps.map(app => [
      app.applicationId,
      app.name,
      app.mobile,
      app.positionName,
      app.experience || '0',
      app.status,
      new Date(app.createdAt).toLocaleDateString()
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `Recruitment_Report_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) return <div>Loading reports...</div>;

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports & Export</h1>
          <p className="text-gray-500">Generate and download recruitment data</p>
        </div>
        <button 
          onClick={exportToCSV}
          className="bg-green-600 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-green-700 transition-all shadow-lg shadow-green-200"
        >
          <FileSpreadsheet className="w-5 h-5" />
          Export to CSV
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
          <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center mb-6">
            <FileText className="w-6 h-6 text-blue-600" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">Monthly Summary</h3>
          <p className="text-sm text-gray-500 mb-6">Detailed breakdown of applications received this month.</p>
          <button className="text-blue-600 font-bold text-sm hover:underline flex items-center gap-1">
            Download PDF <Download className="w-4 h-4" />
          </button>
        </div>

        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 opacity-50 cursor-not-allowed">
          <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center mb-6">
            <Filter className="w-6 h-6 text-purple-600" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">Position Wise Report</h3>
          <p className="text-sm text-gray-500 mb-6">Performance metrics for each active job position.</p>
          <span className="text-xs font-bold text-gray-400 uppercase">Coming Soon</span>
        </div>
      </div>
    </div>
  );
}
