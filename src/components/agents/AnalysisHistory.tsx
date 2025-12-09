'use client';

import { useState, useEffect } from 'react';
import {
  getAnalysisHistory,
  deleteAnalysis,
  clearAnalysisHistory,
  getHistoryStats,
  exportHistoryAsJSON,
} from '@/lib/analysisHistory';
import type { AnalysisRecord } from '@/lib/analysisHistory';
import { FiClock, FiTrash2, FiDownload, FiSearch, FiX, FiDollarSign, FiZap } from 'react-icons/fi';

export default function AnalysisHistory() {
  const [history, setHistory] = useState<AnalysisRecord[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAnalysis, setSelectedAnalysis] = useState<AnalysisRecord | null>(null);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = () => {
    setHistory(getAnalysisHistory());
    setStats(getHistoryStats());
  };

  const handleDelete = (id: string) => {
    deleteAnalysis(id);
    loadHistory();
    if (selectedAnalysis?.id === id) {
      setSelectedAnalysis(null);
    }
  };

  const handleClearAll = () => {
    if (window.confirm('Are you sure you want to delete all analysis history? This cannot be undone.')) {
      clearAnalysisHistory();
      loadHistory();
      setSelectedAnalysis(null);
    }
  };

  const handleExportHistory = () => {
    const json = exportHistoryAsJSON();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analysis-history-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const filteredHistory = history.filter(record =>
    record.query.toLowerCase().includes(searchQuery.toLowerCase()) ||
    record.agents.some(agent => agent.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  const formatTimeAgo = (timestamp: number) => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Analysis History</h1>
          <p className="text-gray-600">View and manage your past multi-agent analyses</p>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
              <p className="text-sm text-gray-600 mb-1">Total Analyses</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalAnalyses}</p>
            </div>
            <div className="p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
              <p className="text-sm text-gray-600 mb-1">Total Cost</p>
              <p className="text-2xl font-bold text-gray-900">${stats.totalCost.toFixed(2)}</p>
            </div>
            <div className="p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
              <p className="text-sm text-gray-600 mb-1">Demo / Live</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.demoCount} / {stats.liveCount}
              </p>
            </div>
            <div className="p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
              <p className="text-sm text-gray-600 mb-1">Fast / Thorough</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.fastModeCount} / {stats.thoroughModeCount}
              </p>
            </div>
          </div>
        )}

        {/* Actions Bar */}
        <div className="mb-6 flex items-center gap-4 flex-wrap">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search analyses..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <button
            onClick={handleExportHistory}
            disabled={history.length === 0}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FiDownload className="w-4 h-4" />
            Export All
          </button>
          <button
            onClick={handleClearAll}
            disabled={history.length === 0}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FiTrash2 className="w-4 h-4" />
            Clear All
          </button>
        </div>

        {/* History List */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* List */}
          <div className="space-y-3">
            {filteredHistory.length === 0 ? (
              <div className="p-8 bg-white rounded-lg border border-gray-200 text-center">
                <p className="text-gray-600">
                  {searchQuery ? 'No analyses match your search' : 'No analyses saved yet'}
                </p>
              </div>
            ) : (
              filteredHistory.map(record => (
                <button
                  key={record.id}
                  onClick={() => setSelectedAnalysis(record)}
                  className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                    selectedAnalysis?.id === record.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {record.query.substring(0, 80)}
                        {record.query.length > 80 ? '...' : ''}
                      </p>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className="text-xs text-gray-500 flex items-center gap-1">
                          <FiClock className="w-3 h-3" />
                          {formatTimeAgo(record.timestamp)}
                        </span>
                        {record.cost > 0 && (
                          <span className="text-xs text-gray-500 flex items-center gap-1">
                            <FiDollarSign className="w-3 h-3" />
                            ${record.cost.toFixed(2)}
                          </span>
                        )}
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full ${
                            record.mode === 'fast'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-purple-100 text-purple-700'
                          }`}
                        >
                          {record.mode === 'fast' ? (
                            <FiZap className="w-3 h-3 inline" />
                          ) : (
                            <FiClock className="w-3 h-3 inline" />
                          )}{' '}
                          {record.mode}
                        </span>
                        {record.isDemo && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">
                            Demo
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(record.id);
                      }}
                      className="ml-2 p-1 text-red-600 hover:bg-red-50 rounded"
                    >
                      <FiTrash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="text-xs text-gray-600">
                    Agents: {record.agents.join(', ')}
                  </div>
                </button>
              ))
            )}
          </div>

          {/* Detail View */}
          <div className="lg:sticky lg:top-4 lg:self-start">
            {selectedAnalysis ? (
              <div className="p-6 bg-white rounded-lg border border-gray-200 shadow-sm">
                <div className="flex items-start justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Analysis Details</h3>
                  <button
                    onClick={() => setSelectedAnalysis(null)}
                    className="p-1 hover:bg-gray-100 rounded"
                  >
                    <FiX className="w-5 h-5" />
                  </button>
                </div>

                <div className="mb-4">
                  <p className="text-sm font-medium text-gray-700 mb-1">Query:</p>
                  <p className="text-sm text-gray-600">{selectedAnalysis.query}</p>
                </div>

                <div className="mb-4 grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Date</p>
                    <p className="text-sm text-gray-900">{formatDate(selectedAnalysis.timestamp)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Mode</p>
                    <p className="text-sm text-gray-900 capitalize">{selectedAnalysis.mode}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Cost</p>
                    <p className="text-sm text-gray-900">
                      ${selectedAnalysis.cost > 0 ? selectedAnalysis.cost.toFixed(2) : '0.00'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Type</p>
                    <p className="text-sm text-gray-900">{selectedAnalysis.isDemo ? 'Demo' : 'Live'}</p>
                  </div>
                </div>

                <div className="mb-4">
                  <p className="text-sm font-medium text-gray-700 mb-2">Agents Used:</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedAnalysis.agents.map((agent, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-md"
                      >
                        {agent}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="border-t pt-4">
                  <p className="text-sm font-medium text-gray-700 mb-2">Synthesis:</p>
                  <div className="max-h-96 overflow-y-auto">
                    <div className="text-sm text-gray-800 whitespace-pre-wrap">
                      {selectedAnalysis.synthesis}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-8 bg-white rounded-lg border border-gray-200 text-center">
                <p className="text-gray-600">Select an analysis to view details</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
