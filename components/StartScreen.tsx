
import React, { useState } from 'react';
import { FolderOpen, Key, AlertTriangle, ShieldCheck, Loader2 } from 'lucide-react';
import { Plugin } from '../types';

interface StartScreenProps {
  onStart: (handle: any, apiKey: string) => void;
}

const StartScreen: React.FC<StartScreenProps> = ({ onStart }) => {
  const [apiKey, setApiKey] = useState(process.env.API_KEY || '');
  const [isManual, setIsManual] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSelectFolder = async () => {
    try {
        setIsLoading(true);
        const dirHandle = await (window as any).showDirectoryPicker({
            mode: 'readwrite'
        });
        // Validate API key format if provided
        const trimmedKey = apiKey.trim();
        if (trimmedKey && !isManual) {
          // Basic validation: Gemini API keys start with "AIzaSy" and are typically 39 chars
          if (!trimmedKey.startsWith('AIzaSy')) {
            alert('Warning: API key should start with "AIzaSy". Please check your key.');
          }
        }
        await onStart(dirHandle, trimmedKey);
    } catch (err) {
        console.error("Folder selection cancelled or failed", err);
        if (err instanceof Error && !err.message.includes('aborted')) {
          alert(`Error: ${err.message}`);
        }
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <div className="h-screen w-screen bg-slate-950 flex items-center justify-center p-4 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-800 via-slate-950 to-slate-950">
      <div className="max-w-lg w-full bg-slate-900/80 backdrop-blur-md rounded-2xl shadow-2xl border border-slate-800 p-8">
        
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-500 tracking-tight mb-2">
            ICONIC
          </h1>
          <p className="text-slate-400 text-sm tracking-widest uppercase font-semibold">FL Plugin Sorter AI</p>
        </div>

        <div className="space-y-6">
          <div className="space-y-2">
            <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700/50 text-center space-y-4">
                 <div className="mx-auto w-12 h-12 bg-slate-800 rounded-full flex items-center justify-center">
                     <FolderOpen className="w-6 h-6 text-orange-500" />
                 </div>
                 <div>
                     <h3 className="text-slate-200 font-bold">Select Plugin Database</h3>
                     <p className="text-slate-500 text-xs mt-1">Usually: Image-Line/FL Studio/Presets/Plugin database</p>
                 </div>
                 <button 
                    onClick={handleSelectFolder}
                    disabled={isLoading}
                    className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded font-bold transition-all shadow-lg shadow-blue-900/20 flex items-center justify-center gap-2"
                 >
                    {isLoading ? <Loader2 className="animate-spin w-4 h-4" /> : 'Open Folder & Initialize'}
                 </button>
            </div>
          </div>

          <div className="space-y-2 pt-4 border-t border-slate-800/50">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold text-slate-500 uppercase">Gemini API Key</label>
              <button 
                onClick={() => setIsManual(!isManual)}
                className="text-[10px] underline text-slate-500 hover:text-slate-300"
              >
                {isManual ? "Switch to AI Mode" : "No Key? Use Manual Mode"}
              </button>
            </div>
            
            {!isManual ? (
              <div className="relative">
                <Key className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                <input 
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="AIzaSy..."
                  className="w-full bg-slate-800 rounded pl-9 pr-3 py-2.5 text-sm text-white border border-slate-700 focus:border-orange-500 focus:outline-none transition-colors"
                />
              </div>
            ) : (
               <div className="bg-orange-900/20 border border-orange-500/30 rounded p-3 flex gap-3">
                  <AlertTriangle className="w-5 h-5 text-orange-500 shrink-0" />
                  <p className="text-xs text-orange-200">
                    Manual Mode: Auto-categorization disabled. You can still use dragging, flattening, and deduplication.
                  </p>
               </div>
            )}
          </div>
          
          <div className="flex items-center justify-center gap-2 text-[10px] text-slate-600">
            <ShieldCheck className="w-3 h-3" />
            <span>Files handled locally. Direct disk write access required.</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StartScreen;
