'use client';

import { useState, useEffect } from 'react';
import { PlayerTransaction, DetailedRosterAnalysisService } from '@/services/playerTracking';
import { TransactionApiService, TransactionDetail } from '@/services/transactionApi';

interface PlayerHistoryModalProps {
  playerId: number;
  playerName: string;
  isOpen: boolean;
  onClose: () => void;
  dateRange: {
    start: string;
    end: string;
  };
}

export default function PlayerHistoryModal({
  playerId,
  playerName,
  isOpen,
  onClose,
  dateRange
}: PlayerHistoryModalProps) {
  const [transactions, setTransactions] = useState<PlayerTransaction[]>([]);
  const [detailedTransactions, setDetailedTransactions] = useState<TransactionDetail[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (isOpen && playerId) {
      fetchPlayerHistory();
    }
  }, [isOpen, playerId]);

  const fetchPlayerHistory = async () => {
    setLoading(true);
    setError('');
    setTransactions([]);
    setDetailedTransactions([]);

    try {
      // Get basic transaction history from roster tracking
      const history = await DetailedRosterAnalysisService.getPlayerSpecificHistory(
        playerId,
        dateRange.start,
        dateRange.end
      );
      setTransactions(history);

      // Get detailed transaction reasons from API
      const detailedData = await TransactionApiService.getPlayerTransactions(
        playerId,
        dateRange.start,
        dateRange.end
      );
      setDetailedTransactions(detailedData);
    } catch (err) {
      setError('Failed to load player transaction history.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const TransactionItem = ({ transaction, detailedTransaction }: { 
    transaction?: PlayerTransaction;
    detailedTransaction?: TransactionDetail;
  }) => {
    // Prioritize detailed transaction data if available
    const primaryTransaction = detailedTransaction || transaction;
    if (!primaryTransaction) return null;

    const isDetailedTransaction = !!detailedTransaction;
    const isAddition = isDetailedTransaction ? 
      ['CU', 'SFA', 'CLW', 'ASG'].includes(detailedTransaction!.typeCode) :
      transaction!.transactionType === 'added';

    // Get transaction category information
    const transactionInfo = isDetailedTransaction ? 
      TransactionApiService.categorizeTransactionType(detailedTransaction!.typeCode) : 
      null;

    const bgColor = isAddition ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200';
    const textColor = isAddition ? 'text-green-800' : 'text-red-800';
    const icon = transactionInfo?.icon || (isAddition ? '✓' : '✗');

    // Determine the date to display
    const displayDate = isDetailedTransaction ? detailedTransaction!.date : transaction!.date;
    
    return (
      <div className={`p-4 rounded-lg border ${bgColor}`}>
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-lg ${textColor}`}>
              {icon}
            </div>
            <div className="flex-1">
              {/* Transaction Type and Title */}
              <div className={`font-medium ${textColor} mb-1`}>
                {isDetailedTransaction ? 
                  detailedTransaction!.typeDesc : 
                  (isAddition ? 'Added to Roster' : 'Removed from Roster')
                }
              </div>
              
              {/* Detailed description from API - Most Important Info */}
              {detailedTransaction?.description && (
                <div className="text-sm text-slate-700 mb-3 p-3 bg-white rounded border-l-4 border-blue-400">
                  <div className="font-medium text-slate-800 mb-1">Transaction Details:</div>
                  <div>{detailedTransaction.description}</div>
                </div>
              )}

              {/* Transaction category with enhanced styling */}
              {transactionInfo && (
                <div className="mb-3">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                    transactionInfo.severity === 'high' ? 'bg-red-100 text-red-800 border border-red-200' :
                    transactionInfo.severity === 'medium' ? 'bg-yellow-100 text-yellow-800 border border-yellow-200' :
                    'bg-green-100 text-green-800 border border-green-200'
                  }`}>
                    <span className="mr-2">{transactionInfo.icon}</span>
                    {transactionInfo.category.charAt(0).toUpperCase() + transactionInfo.category.slice(1)} Transaction
                  </span>
                </div>
              )}

              {/* Player Position and Jersey Info */}
              {transaction && (
                <div className="text-sm text-slate-600 mb-2">
                  <strong>Position:</strong> {transaction.position}
                  {transaction.jerseyNumber && <span> • <strong>Jersey:</strong> #{transaction.jerseyNumber}</span>}
                </div>
              )}

              {/* Status Information */}
              {transaction?.newStatus && (
                <div className="text-sm text-slate-600 mb-1">
                  <strong>New Status:</strong> {transaction.newStatus}
                </div>
              )}
              
              {transaction?.previousStatus && (
                <div className="text-sm text-slate-600 mb-1">
                  <strong>Previous Status:</strong> {transaction.previousStatus}
                </div>
              )}

              {/* Team movement information with enhanced styling */}
              {detailedTransaction && (
                <div className="text-sm text-slate-600 mt-3 p-2 bg-slate-50 rounded">
                  {detailedTransaction.fromTeam && detailedTransaction.toTeam && (
                    <div className="flex items-center">
                      <strong>Team Movement:</strong>
                      <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                        {detailedTransaction.fromTeam.name}
                      </span>
                      <span className="mx-2">→</span>
                      <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded text-xs">
                        {detailedTransaction.toTeam.name}
                      </span>
                    </div>
                  )}
                  {detailedTransaction.fromTeam && !detailedTransaction.toTeam && (
                    <div>
                      <strong>From Team:</strong> {detailedTransaction.fromTeam.name}
                    </div>
                  )}
                  {!detailedTransaction.fromTeam && detailedTransaction.toTeam && (
                    <div>
                      <strong>To Team:</strong> {detailedTransaction.toTeam.name}
                    </div>
                  )}
                </div>
              )}

              {/* Additional transaction dates if different */}
              {detailedTransaction?.effectiveDate && detailedTransaction.effectiveDate !== detailedTransaction.date && (
                <div className="text-xs text-slate-500 mt-2">
                  <strong>Effective Date:</strong> {formatDate(detailedTransaction.effectiveDate)}
                </div>
              )}
            </div>
          </div>
          <div className="text-sm text-slate-500 text-right">
            <div className="font-medium">{formatDate(displayDate)}</div>
            {isDetailedTransaction && (
              <div className="text-xs text-green-600 mt-1">✓ Detailed</div>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">{playerName}</h2>
              <p className="text-sm text-slate-600 mt-1">
                Transaction History ({formatDate(dateRange.start)} - {formatDate(dateRange.end)})
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
            >
              <span className="text-xl text-gray-500">×</span>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {loading && (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600">Loading transaction history...</span>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="text-red-600">{error}</div>
            </div>
          )}

          {!loading && !error && transactions.length === 0 && (
            <div className="text-center py-8">
              <div className="text-gray-500 text-lg mb-2">No transactions found</div>
              <p className="text-sm text-gray-400">
                {playerName} had no roster changes during the selected period.
              </p>
            </div>
          )}

          {!loading && !error && (transactions.length > 0 || detailedTransactions.length > 0) && (
            <div className="space-y-4">
              <div className="bg-blue-50 rounded-lg p-4 mb-4">
                <div className="text-sm text-blue-800">
                  <strong>Summary:</strong> 
                  {transactions.length > 0 && (
                    <span>
                      {transactions.length} roster change{transactions.length !== 1 ? 's' : ''} found
                      <span className="ml-4">
                        Added: {transactions.filter(t => t.transactionType === 'added').length} times
                      </span>
                      <span className="ml-4">
                        Removed: {transactions.filter(t => t.transactionType === 'removed').length} times
                      </span>
                    </span>
                  )}
                  {detailedTransactions.length > 0 && (
                    <div className="mt-2">
                      <strong>Detailed MLB transactions:</strong> {detailedTransactions.length} transaction{detailedTransactions.length !== 1 ? 's' : ''}
                      <span className="ml-4 text-green-700">✓ Includes official reasons and details</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                {(() => {
                  // Create a comprehensive list prioritizing detailed transactions
                  const allTransactionItems: Array<{
                    key: string;
                    date: string;
                    component: React.ReactElement;
                  }> = [];
                  
                  // First, add all detailed transactions
                  detailedTransactions.forEach((detailedTransaction, index) => {
                    // Try to find matching basic transaction for additional roster info
                    const matchingBasicTransaction = transactions.find(t => {
                      const basicDate = new Date(t.date).toDateString();
                      const detailedDate = new Date(detailedTransaction.date).toDateString();
                      return basicDate === detailedDate;
                    });

                    allTransactionItems.push({
                      key: `detailed-${detailedTransaction.id}`,
                      date: detailedTransaction.date,
                      component: (
                        <TransactionItem
                          key={`detailed-${detailedTransaction.id}`}
                          transaction={matchingBasicTransaction}
                          detailedTransaction={detailedTransaction}
                        />
                      )
                    });
                  });

                  // Then add basic transactions that don't have detailed counterparts
                  transactions.forEach((transaction, index) => {
                    const hasDetailedCounterpart = detailedTransactions.some(dt => {
                      const basicDate = new Date(transaction.date).toDateString();
                      const detailedDate = new Date(dt.date).toDateString();
                      return basicDate === detailedDate;
                    });

                    if (!hasDetailedCounterpart) {
                      allTransactionItems.push({
                        key: `basic-${transaction.date}-${transaction.transactionType}-${index}`,
                        date: transaction.date,
                        component: (
                          <TransactionItem
                            key={`basic-${transaction.date}-${transaction.transactionType}-${index}`}
                            transaction={transaction}
                          />
                        )
                      });
                    }
                  });

                  // Sort all items by date (most recent first)
                  return allTransactionItems
                    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                    .map(item => item.component);
                })()}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
