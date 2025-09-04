'use client';

import { useState } from 'react';
import DateRangeSelector from '@/components/DateRangeSelector';
import RosterChangesDisplay from '@/components/RosterChangesDisplay';
import PlayerTransactionTimeline from '@/components/PlayerTransactionTimeline';
import { RosterAnalysisService } from '@/services/rosterAnalysis';
import { DetailedRosterAnalysisService, DetailedRosterTimeline } from '@/services/playerTracking';
import { RosterComparison } from '@/types/changes';
import Link from 'next/link';

export default function ChangesPage() {
  const [startDate, setStartDate] = useState<string>('2025-08-01');
  const [endDate, setEndDate] = useState<string>('2025-09-01');
  const [comparisons, setComparisons] = useState<RosterComparison[]>([]);
  const [detailedTimeline, setDetailedTimeline] = useState<DetailedRosterTimeline | null>(null);
  const [analysisType, setAnalysisType] = useState<'comparison' | 'detailed'>('detailed');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const handleAnalyze = async () => {
    setLoading(true);
    setError('');
    setComparisons([]);
    setDetailedTimeline(null);

    try {
      if (analysisType === 'detailed') {
        // Get detailed player transaction history
        const timeline = await DetailedRosterAnalysisService.getPlayerTransactionHistory(startDate, endDate);
        setDetailedTimeline(timeline);
      } else {
        // For comparison analysis, we'll get a timeline of changes
        const daysDiff = Math.abs(new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24);
        
        if (daysDiff <= 7) {
          // For short ranges, do a direct comparison
          const comparison = await RosterAnalysisService.compareRosters(startDate, endDate);
          setComparisons([comparison]);
        } else {
          // For longer ranges, get timeline of changes
          const timeline = await RosterAnalysisService.getRosterChangesTimeline(startDate, endDate);
          setComparisons(timeline);
        }
      }
    } catch (err) {
      setError('Failed to analyze roster changes. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-blue-900 text-white py-8 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-orange-500 rounded-full flex items-center justify-center">
                <span className="text-2xl font-bold">D</span>
              </div>
              <div>
                <h1 className="text-3xl font-bold">Detroit Tigers Roster Changes</h1>
                <p className="text-gray-300">Track roster moves throughout the 2025 season</p>
              </div>
            </div>
            <div className="flex gap-3">
              <Link
                href="/"
                className="px-4 py-2 bg-white text-blue-900 rounded-lg hover:bg-gray-100 transition-colors font-medium"
              >
                ← Back to Roster
              </Link>
              <Link
                href="/status"
                className="px-4 py-2 bg-white text-blue-900 rounded-lg hover:bg-gray-100 transition-colors font-medium"
              >
                Player Status →
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Date Range Selector */}
        <div className="mb-8">
          <div className="bg-white rounded-lg border border-gray-200 p-6 mb-4">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Analyze Roster Changes
            </h2>
            
            {/* Analysis Type Selector */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Analysis Type
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  onClick={() => setAnalysisType('detailed')}
                  className={`p-4 border rounded-lg text-left transition-colors ${
                    analysisType === 'detailed' 
                      ? 'border-blue-500 bg-blue-50 text-blue-900' 
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <div className="font-medium mb-1">🔍 Detailed Player Tracking</div>
                  <div className="text-sm text-slate-600">
                    Track individual players added/removed with specific dates
                  </div>
                </button>
                <button
                  onClick={() => setAnalysisType('comparison')}
                  className={`p-4 border rounded-lg text-left transition-colors ${
                    analysisType === 'comparison' 
                      ? 'border-blue-500 bg-blue-50 text-blue-900' 
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <div className="font-medium mb-1">📊 Period Comparison</div>
                  <div className="text-sm text-slate-600">
                    Compare rosters between periods with grouped changes
                  </div>
                </button>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start Date
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
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
                  onChange={(e) => setEndDate(e.target.value)}
                  min="2025-03-18"
                  max="2025-09-28"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="mb-4">
              <button
                onClick={handleAnalyze}
                disabled={loading || !startDate || !endDate}
                className="w-full md:w-auto px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                {loading && (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                )}
                {loading ? 'Analyzing Changes...' : `Start ${analysisType === 'detailed' ? 'Detailed' : 'Comparison'} Analysis`}
              </button>
            </div>

            <div className="text-sm text-slate-500">
              <p className="mb-1">
                • <strong>Detailed Tracking:</strong> Shows exact dates when each player was added/removed
              </p>
              <p className="mb-1">
                • <strong>Period Comparison:</strong> Groups changes by time periods for broader analysis
              </p>
              <p>• Smaller date ranges provide more accurate results</p>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-lg text-gray-600">Analyzing roster changes...</span>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex">
              <div className="text-red-600">
                <span className="font-medium">Error:</span> {error}
              </div>
            </div>
          </div>
        )}

        {/* Results */}
        {!loading && (detailedTimeline || comparisons.length > 0) && (
          <div className="space-y-6">
            {analysisType === 'detailed' && detailedTimeline && (
              <PlayerTransactionTimeline timeline={detailedTimeline} />
            )}
            
            {analysisType === 'comparison' && comparisons.length > 0 && (
              <>
                <div className="text-center mb-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    Roster Analysis Results
                  </h2>
                  <p className="text-slate-600">
                    {comparisons.length === 1 
                      ? `Direct comparison between ${new Date(startDate).toLocaleDateString()} and ${new Date(endDate).toLocaleDateString()}`
                      : `${comparisons.length} periods with roster changes found`
                    }
                  </p>
                </div>

                {comparisons.map((comparison, index) => (
                  <RosterChangesDisplay
                    key={`${comparison.fromDate}-${comparison.toDate}`}
                    comparison={comparison}
                  />
                ))}
              </>
            )}
          </div>
        )}

        {/* Instructions */}
        {!loading && !detailedTimeline && comparisons.length === 0 && !error && (
          <div className="bg-white rounded-lg border border-gray-200 p-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              How to Use Roster Changes Analysis
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">🔍 Detailed Player Tracking</h4>
                <p className="text-sm text-slate-600 mb-3">
                  Track every single player addition and removal with exact dates.
                </p>
                <ul className="text-sm text-slate-600 space-y-1">
                  <li>• Shows when each player joined the roster</li>
                  <li>• Shows when each player left the roster</li>
                  <li>• Includes jersey numbers and positions</li>
                  <li>• Perfect for detailed transaction history</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-2">📊 Period Comparison</h4>
                <p className="text-sm text-slate-600 mb-3">
                  Compare rosters between time periods to see overall changes.
                </p>
                <ul className="text-sm text-slate-600 space-y-1">
                  <li>• Groups changes by time periods</li>
                  <li>• Shows net additions and removals</li>
                  <li>• Highlights position changes</li>
                  <li>• Great for seasonal analysis</li>
                </ul>
              </div>
            </div>
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <div className="text-sm text-blue-800">
                <strong>💡 Tip:</strong> For the most accurate tracking, use shorter date ranges (1-2 weeks) 
                with detailed tracking, or longer ranges (1-2 months) with period comparison.
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-12 pt-8 border-t border-gray-200 text-center text-sm text-gray-500">
          <p>Roster change data provided by MLB Stats API</p>
          <p className="mt-1">© 2025 Detroit Tigers Roster App</p>
        </div>
      </div>
    </div>
  );
}
