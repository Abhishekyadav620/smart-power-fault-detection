import React from 'react';
import { FileText, Download } from 'lucide-react';

const Reports = () => {
  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center space-x-3 text-primary mb-2">
        <FileText size={28} />
        <h2 className="text-2xl font-bold tracking-tight">System Reports</h2>
      </div>

      <div className="bg-card border border-border rounded-xl shadow-soft p-8 text-center text-secondary">
        <FileText size={48} className="mx-auto mb-4 opacity-50" />
        <h3 className="text-lg font-bold text-textmain mb-2">Reports Module</h3>
        <p className="mb-6">Generate and download compliance and operational reports.</p>
        <button className="flex items-center justify-center space-x-2 mx-auto bg-primary hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-semibold shadow-sm transition-colors">
          <Download size={18} />
          <span>Export Monthly Summary</span>
        </button>
      </div>
    </div>
  );
};

export default Reports;
