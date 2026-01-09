import React from 'react';
import { AlertCircle, Check, X } from 'lucide-react';
import { ConflictSuggestion } from '../types';

interface ConflictSuggestionModalProps {
  suggestion: ConflictSuggestion;
  onAccept: () => void;
  onReject: () => void;
  onClose: () => void;
}

const ConflictSuggestionModal: React.FC<ConflictSuggestionModalProps> = ({
  suggestion,
  onAccept,
  onReject,
  onClose
}) => {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-xl shadow-2xl border border-slate-700 max-w-md w-full">
        <div className="p-6">
          <div className="flex items-start gap-4 mb-4">
            <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center flex-shrink-0">
              <AlertCircle className="w-5 h-5 text-orange-500" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-white mb-1">
                AI Learning Suggestion
              </h3>
              <p className="text-sm text-slate-400">
                I've noticed a pattern in your categorization
              </p>
            </div>
          </div>

          <div className="bg-slate-900/50 rounded-lg p-4 mb-4 border border-slate-700/50">
            <div className="mb-3">
              <div className="text-xs text-slate-500 uppercase font-semibold mb-1">Plugin</div>
              <div className="text-white font-medium">{suggestion.pluginName}</div>
            </div>

            <div className="mb-3">
              <div className="text-xs text-slate-500 uppercase font-semibold mb-1">Pattern Detected</div>
              <div className="text-sm text-slate-300">
                You've moved this plugin to{' '}
                <span className="font-semibold text-orange-400">
                  {suggestion.suggestedTags.join(', ')}
                </span>{' '}
                <span className="text-slate-400">{suggestion.conflictCount} times</span>
              </div>
            </div>

            {suggestion.currentTags.length > 0 && (
              <div>
                <div className="text-xs text-slate-500 uppercase font-semibold mb-1">Currently Learning</div>
                <div className="text-sm text-slate-400">
                  {suggestion.currentTags.join(', ')}
                </div>
              </div>
            )}
          </div>

          <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 mb-4">
            <p className="text-sm text-blue-200">
              <span className="font-semibold">Suggestion:</span> Should I always categorize "{suggestion.pluginName}" 
              as <span className="font-semibold">{suggestion.suggestedTags[0]}</span>?
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={onAccept}
              className="flex-1 bg-green-600 hover:bg-green-500 text-white font-medium py-2.5 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <Check className="w-4 h-4" />
              Yes, Always Use This
            </button>
            <button
              onClick={onReject}
              className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-medium py-2.5 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <X className="w-4 h-4" />
              No, Keep Learning
            </button>
          </div>

          <button
            onClick={onClose}
            className="w-full mt-2 text-slate-400 hover:text-white text-sm py-2 transition-colors"
          >
            Ask Me Later
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConflictSuggestionModal;
