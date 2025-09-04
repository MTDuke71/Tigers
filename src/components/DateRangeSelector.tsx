'use client';

import { useState } from 'react';

interface DateRangeSelectorProps {
  startDate: string;
  endDate: string;
  onStartDateChange: (date: string) => void;
  onEndDateChange: (date: string) => void;
  onAnalyze: () => void;
  loading?: boolean;
}

export default function DateRangeSelector({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  onAnalyze,
  loading = false
}: DateRangeSelectorProps) {
  const [error, setError] = useState<string>('');

  const handleStartDateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newStartDate = event.target.value;
    setError('');
    
    if (newStartDate > endDate) {
      setError('Start date cannot be after end date');
      return;
    }
    
    onStartDateChange(newStartDate);
  };

  const handleEndDateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newEndDate = event.target.value;
    setError('');
    
    if (startDate > newEndDate) {
      setError('End date cannot be before start date');
      return;
    }
    
    onEndDateChange(newEndDate);
  };

  const handleAnalyze = () => {
    if (!startDate || !endDate) {
      setError('Please select both start and end dates');
      return;
    }
    
    if (startDate > endDate) {
      setError('Start date cannot be after end date');
      return;
    }

    setError('');
    onAnalyze();
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">
        Analyze Roster Changes
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Start Date
          </label>
          <input
            type="date"
            value={startDate}
            onChange={handleStartDateChange}
            min="2025-03-18"
            max="2025-09-28"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            End Date
          </label>
          <input
            type="date"
            value={endDate}
            onChange={handleEndDateChange}
            min="2025-03-18"
            max="2025-09-28"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <div className="text-red-600 text-sm">{error}</div>
        </div>
      )}

      <div className="mb-4">
        <button
          onClick={handleAnalyze}
          disabled={loading || !startDate || !endDate}
          className="w-full md:w-auto px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
        >
          {loading && (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          )}
          {loading ? 'Analyzing Changes...' : 'Analyze Roster Changes'}
        </button>
      </div>

      <div className="text-sm text-gray-500">
        <p className="mb-1">• Select a date range during the 2025 MLB season</p>
        <p className="mb-1">• Analysis will show players added, removed, and position changes</p>
        <p>• Larger date ranges may take longer to process</p>
      </div>
    </div>
  );
}
