'use client';

import { useState } from 'react';
import { CacheService } from '@/services/cacheService';

export default function CacheManager() {
  const [isClearing, setIsClearing] = useState(false);
  const [message, setMessage] = useState('');

  const clearExpiredCache = async () => {
    setIsClearing(true);
    setMessage('');
    try {
      await CacheService.clearExpired();
      setMessage('✅ Expired cache entries cleared successfully');
    } catch (error) {
      setMessage('❌ Failed to clear expired cache');
      console.error(error);
    } finally {
      setIsClearing(false);
    }
  };

  const clearAllCache = async () => {
    if (!confirm('Are you sure you want to clear all cached data? This will require fresh API calls for all data.')) {
      return;
    }
    
    setIsClearing(true);
    setMessage('');
    try {
      await CacheService.clearAll();
      setMessage('✅ All cache data cleared successfully');
    } catch (error) {
      setMessage('❌ Failed to clear cache');
      console.error(error);
    } finally {
      setIsClearing(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Cache Management</h3>
      <p className="text-sm text-gray-600 mb-4">
        The app caches API responses to improve performance and reduce server load. 
        Roster data is cached for 30 minutes, transactions for 1 hour.
      </p>
      
      <div className="flex gap-4 mb-4">
        <button
          onClick={clearExpiredCache}
          disabled={isClearing}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isClearing ? 'Clearing...' : 'Clear Expired Cache'}
        </button>
        
        <button
          onClick={clearAllCache}
          disabled={isClearing}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isClearing ? 'Clearing...' : 'Clear All Cache'}
        </button>
      </div>
      
      {message && (
        <div className={`text-sm p-3 rounded ${
          message.includes('✅') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
        }`}>
          {message}
        </div>
      )}
      
      <div className="text-xs text-gray-500 mt-4">
        <p><strong>Cache Durations:</strong></p>
        <ul className="list-disc list-inside ml-2">
          <li>Roster data: 30 minutes</li>
          <li>Transaction data: 1 hour</li>
          <li>Player history: 15 minutes</li>
        </ul>
      </div>
    </div>
  );
}
