import React, { useState, useEffect } from 'react';
import { X, Wand2, Save, RotateCcw } from 'lucide-react';
import { suggestCategories } from '../services/geminiService';
import { Plugin } from '../types';

interface CategoryEditorProps {
  isOpen: boolean;
  onClose: () => void;
  categories: string[];
  onSave: (newCategories: string[]) => void;
  samplePlugins: Plugin[];
  hasApiKey: boolean;
}

const CategoryEditor: React.FC<CategoryEditorProps> = ({ 
  isOpen, onClose, categories, onSave, samplePlugins, hasApiKey 
}) => {
  const [text, setText] = useState('');
  const [isSuggesting, setIsSuggesting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setText(categories.join('\n'));
    }
  }, [isOpen, categories]);

  const handleAutoSuggest = async () => {
    if (!hasApiKey) return;
    setIsSuggesting(true);
    const names = samplePlugins.map(p => p.name);
    const suggestions = await suggestCategories(names, text.split('\n').filter(s => s.trim()));
    setText(suggestions.join('\n'));
    setIsSuggesting(false);
  };

  const handleSave = () => {
    const lines = text.split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);
    // Remove duplicates
    const unique = Array.from(new Set(lines));
    onSave(unique);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-2xl bg-slate-900 rounded-xl border border-slate-700 shadow-2xl flex flex-col max-h-[85vh]">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900 rounded-t-xl">
          <div>
            <h2 className="text-xl font-bold text-white">Edit Categories</h2>
            <p className="text-xs text-slate-400 mt-1">One category per line. Changes reflect immediately.</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 p-6 flex gap-6 overflow-hidden">
          <div className="flex-1 flex flex-col">
            <textarea
              className="flex-1 w-full bg-slate-950 border border-slate-800 rounded-lg p-4 text-slate-200 font-mono text-sm leading-relaxed focus:border-orange-500 focus:outline-none resize-none custom-scrollbar"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Synth&#10;Bass&#10;Drums..."
              spellCheck={false}
            />
          </div>
          
          <div className="w-48 space-y-4">
             <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700/50">
                <h3 className="text-xs font-bold text-slate-500 uppercase mb-3">Assist</h3>
                <button
                  onClick={handleAutoSuggest}
                  disabled={!hasApiKey || isSuggesting}
                  className={`w-full py-2 px-3 rounded text-xs font-medium flex items-center justify-center gap-2 mb-2 transition-colors ${!hasApiKey ? 'opacity-50 cursor-not-allowed bg-slate-700 text-slate-400' : 'bg-blue-600/20 text-blue-400 hover:bg-blue-600/30'}`}
                >
                  <Wand2 className={`w-3 h-3 ${isSuggesting ? 'animate-spin' : ''}`} />
                  {isSuggesting ? 'Thinking...' : 'Auto-Suggest'}
                </button>
                <p className="text-[10px] text-slate-500 leading-tight">
                  AI will analyze your {samplePlugins.length} plugins and suggest category structures.
                </p>
             </div>

             <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700/50">
                <h3 className="text-xs font-bold text-slate-500 uppercase mb-3">Actions</h3>
                <button 
                  onClick={() => setText(categories.join('\n'))}
                  className="w-full py-2 px-3 rounded text-xs font-medium bg-slate-700 text-slate-300 hover:bg-slate-600 mb-2 flex items-center justify-center gap-2"
                >
                  <RotateCcw className="w-3 h-3" /> Reset
                </button>
             </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900 rounded-b-xl flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-sm text-slate-400 hover:text-white font-medium">
            Cancel
          </button>
          <button 
            onClick={handleSave}
            className="px-6 py-2 bg-orange-600 hover:bg-orange-500 text-white text-sm font-bold rounded flex items-center gap-2 shadow-lg shadow-orange-900/20"
          >
            <Save className="w-4 h-4" /> Save Changes
          </button>
        </div>

      </div>
    </div>
  );
};

export default CategoryEditor;