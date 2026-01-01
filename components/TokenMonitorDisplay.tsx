import React, { useState, useEffect } from 'react';
import { Activity, DollarSign, Hash, RefreshCw, TrendingUp } from 'lucide-react';
import { tokenMonitor, TokenUsageStats } from '../services/tokenMonitor';

interface TokenMonitorDisplayProps {
  className?: string;
  compact?: boolean;
}

const TokenMonitorDisplay: React.FC<TokenMonitorDisplayProps> = ({ className = '', compact = false }) => {
  const [stats, setStats] = useState<TokenUsageStats>(tokenMonitor.getStats());

  useEffect(() => {
    // Subscribe to token usage updates
    const unsubscribe = tokenMonitor.subscribe(setStats);
    return unsubscribe;
  }, []);

  const handleReset = () => {
    if (window.confirm('Reset token usage statistics? This will clear all counters.')) {
      tokenMonitor.reset();
    }
  };

  if (compact) {
    return (
      <div className={`flex items-center gap-3 text-xs ${className}`}>
        <div className="flex items-center gap-1.5 text-slate-400">
          <Activity className="w-3.5 h-3.5" />
          <span className="font-medium">{tokenMonitor.formatTokenCount(stats.totalTokens)}</span>
        </div>
        <div className="flex items-center gap-1.5 text-green-400">
          <DollarSign className="w-3.5 h-3.5" />
          <span className="font-medium">{tokenMonitor.formatCost(stats.estimatedCost)}</span>
        </div>
        <div className="flex items-center gap-1.5 text-blue-400">
          <Hash className="w-3.5 h-3.5" />
          <span className="font-medium">{stats.requestCount}</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-slate-800 border border-slate-700 rounded-lg p-4 ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-orange-500" />
          <h3 className="text-sm font-semibold text-slate-200">Token Usage</h3>
        </div>
        <button
          onClick={handleReset}
          className="p-1.5 hover:bg-slate-700 rounded text-slate-400 hover:text-slate-200 transition-colors"
          title="Reset statistics"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="space-y-3">
        {/* Total Tokens */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Total Tokens</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-white">
              {tokenMonitor.formatTokenCount(stats.totalTokens)}
            </span>
            <span className="text-[10px] text-slate-500">
              ({stats.promptTokens.toLocaleString()} + {stats.completionTokens.toLocaleString()})
            </span>
          </div>
        </div>

        {/* Request Count */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Hash className="w-3.5 h-3.5" />
            <span>API Requests</span>
          </div>
          <span className="text-sm font-bold text-blue-400">{stats.requestCount}</span>
        </div>

        {/* Estimated Cost */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <DollarSign className="w-3.5 h-3.5" />
            <span>Estimated Cost</span>
          </div>
          <span className="text-sm font-bold text-green-400">
            {tokenMonitor.formatCost(stats.estimatedCost)}
          </span>
        </div>

        {/* Average tokens per request */}
        {stats.requestCount > 0 && (
          <div className="pt-2 border-t border-slate-700">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500">Avg. tokens/request</span>
              <span className="text-slate-300 font-medium">
                {stats.requestCount > 0 ? Math.round(stats.totalTokens / stats.requestCount).toLocaleString() : '0'}
              </span>
            </div>
          </div>
        )}

        {/* Info text */}
        <p className="text-[10px] text-slate-500 leading-tight pt-2 border-t border-slate-700">
          Token usage is estimated and may not match actual API consumption. Cost calculated using Gemini 2.5 Flash pricing.
        </p>
      </div>
    </div>
  );
};

export default TokenMonitorDisplay;
