
import React, { useState, useEffect } from 'react';
import { Zap, Shield, Brain, Tag, Edit2, FileType, Check, X, AlertTriangle, Users, HardDrive, Key, Wrench, FolderMinus, Image as ImageIcon, FileText, Trash2, Copy, Layers } from 'lucide-react';
import { AppSettings, Plugin, LearnedRule } from '../types';

interface InspectorProps {
  selectedPlugins: Plugin[];
  settings: AppSettings;
  updateSetting: (key: keyof AppSettings, value: boolean) => void;
  onUpdatePlugin: (id: string, updates: Partial<Plugin>) => void;
  onBulkUpdate: (ids: Set<string>, updates: Partial<Plugin>) => void;
  categories: string[];
  apiKey: string;
  setApiKey: (key: string) => void;
  onFlatten: () => void;
  manualOverrides: Record<string, LearnedRule>;
  onClearRule: (name: string) => void;
}

const Toggle: React.FC<{
  label: string;
  checked: boolean;
  onChange: (val: boolean) => void;
  description?: string;
  disabled?: boolean;
}> = ({ label, checked, onChange, description, disabled }) => (
  <div className={`flex items-start justify-between py-3 group ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
    <div className="flex flex-col pr-4">
      <span className="text-xs font-medium text-slate-300 group-hover:text-slate-200 transition-colors">{label}</span>
      {description && <span className="text-[10px] text-slate-500 leading-tight mt-0.5">{description}</span>}
    </div>
    <button
      disabled={disabled}
      onClick={() => !disabled && onChange(!checked)}
      className={`relative inline-flex h-4 w-8 items-center rounded-full transition-colors focus:outline-none shrink-0 ${
        checked ? 'bg-orange-600' : 'bg-slate-700'
      }`}
    >
      <span
        className={`${
          checked ? 'translate-x-4' : 'translate-x-0.5'
        } inline-block h-3 w-3 transform rounded-full bg-white transition-transform shadow-sm`}
      />
    </button>
  </div>
);

const SectionHeader: React.FC<{ icon: React.ReactNode; title: string; colorClass?: string }> = ({ icon, title, colorClass = "text-slate-400" }) => (
  <div className={`flex items-center gap-2 mb-3 text-[10px] font-bold uppercase tracking-widest ${colorClass}`}>
    {icon} {title}
  </div>
);

const Inspector: React.FC<InspectorProps> = ({ selectedPlugins, settings, updateSetting, onUpdatePlugin, onBulkUpdate, categories, apiKey, setApiKey, onFlatten, manualOverrides, onClearRule }) => {
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState('');
  const [keyInput, setKeyInput] = useState(apiKey);
  
  // Media Preview State
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [nfoContent, setNfoContent] = useState<string | null>(null);

  React.useEffect(() => {
    if (selectedPlugins.length === 1) {
        setRenameValue(selectedPlugins[0].name);
        loadMedia(selectedPlugins[0]);
    } else {
        setIsRenaming(false);
        setPreviewImage(null);
        setNfoContent(null);
    }
  }, [selectedPlugins]);

  const loadMedia = async (plugin: Plugin) => {
      setPreviewImage(null);
      setNfoContent(null);
      
      // Load Image
      const png = plugin.assets.find(a => a.type === 'png');
      if (png && png.handle) {
          try {
              const file = await png.handle.getFile();
              setPreviewImage(URL.createObjectURL(file));
          } catch(e) {}
      }

      // Load NFO
      const nfo = plugin.assets.find(a => a.type === 'nfo');
      if (nfo && nfo.handle) {
          try {
              const file = await nfo.handle.getFile();
              const text = await file.text();
              setNfoContent(text.slice(0, 300)); // First 300 chars
          } catch(e) {}
      }
  };

  // Cleanup blob urls
  useEffect(() => {
      return () => {
          if (previewImage) URL.revokeObjectURL(previewImage);
      }
  }, [previewImage]);

  // Sync internal key input if prop changes
  useEffect(() => {
      setKeyInput(apiKey);
  }, [apiKey]);

  const handleKeyBlur = () => {
      if (keyInput !== apiKey) {
          setApiKey(keyInput);
      }
  }

  const handleRenameSubmit = () => {
    if (selectedPlugins.length === 1 && renameValue.trim()) {
        // Sanitize plugin name: remove characters that are invalid in filenames
        const cleanName = renameValue.trim().replace(/[<>:"\/\\|?*\x00-\x1F]/g, '');
        
        if (cleanName === '') {
            alert('Invalid plugin name: contains only special characters');
            return;
        }
        
        onUpdatePlugin(selectedPlugins[0].id, { name: cleanName });
        setIsRenaming(false);
    }
  };

  const handleTagToggle = (cat: string) => {
    if (selectedPlugins.length === 0) return;
    
    const allHaveIt = selectedPlugins.every(p => p.tags.includes(cat));
    
    if (allHaveIt) {
        selectedPlugins.forEach(p => {
             const newTags = p.tags.filter(t => t !== cat);
             onUpdatePlugin(p.id, { tags: newTags, category: newTags.length > 0 ? newTags[0] : null });
        });
    } else {
        selectedPlugins.forEach(p => {
             if (!p.tags.includes(cat)) {
                 const newTags = [cat, ...p.tags]; // Prepend
                 onUpdatePlugin(p.id, { tags: newTags, category: cat }); // Set newest as main category
             }
        });
    }
  };

  // --- MULTI SELECTION MODE ---
  if (selectedPlugins.length > 1) {
      return (
        <aside className="w-72 bg-slate-950 border-l border-slate-800 flex flex-col h-full shrink-0 overflow-y-auto custom-scrollbar">
            <div className="p-6 border-b border-slate-800 bg-slate-900/50">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold text-orange-500 uppercase tracking-widest">BULK EDITOR</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                        {selectedPlugins.length} ITEMS
                    </span>
                </div>
                <h2 className="text-xl font-bold text-white leading-tight flex items-center gap-2">
                    <Users className="w-5 h-5 text-slate-500" />
                    Multiple Selection
                </h2>
                <p className="text-xs text-slate-500 mt-2">Changes apply to all selected items.</p>
            </div>
            
            <div className="p-6">
                <SectionHeader icon={<Tag className="w-3 h-3" />} title="Apply Categories" />
                <div className="h-[400px] overflow-y-auto custom-scrollbar border border-slate-800 rounded-lg bg-slate-900 p-1 space-y-0.5">
                    {categories.map(cat => {
                        const count = selectedPlugins.filter(p => p.tags.includes(cat)).length;
                        const state = count === selectedPlugins.length ? 'checked' : count > 0 ? 'indeterminate' : 'unchecked';
                        
                        return (
                            <button 
                                key={cat}
                                onClick={() => handleTagToggle(cat)}
                                className={`w-full text-left text-xs px-3 py-2 rounded-md flex justify-between transition-colors
                                    ${state === 'checked' ? 'bg-slate-800 text-orange-400 font-bold' : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'}
                                `}
                            >
                                {cat}
                                {state === 'checked' && <Check className="w-3 h-3 text-orange-500" />}
                                {state === 'indeterminate' && <div className="w-2 h-2 rounded-full bg-slate-600 my-auto" />}
                            </button>
                        );
                    })}
                </div>
            </div>
        </aside>
      );
  }

  // --- SINGLE SELECTION MODE ---
  if (selectedPlugins.length === 1) {
    const selectedPlugin = selectedPlugins[0];
    return (
        <aside className="w-72 bg-slate-950 border-l border-slate-800 flex flex-col h-full shrink-0 overflow-y-auto custom-scrollbar">
            <div className="p-6 border-b border-slate-800 bg-slate-900/50">
                <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] font-bold text-blue-500 uppercase tracking-widest">INSPECTOR</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full border ${selectedPlugin.isDuplicate ? 'bg-red-950 text-red-400 border-red-900' : 'bg-green-950/30 text-green-400 border-green-900/30'}`}>
                        {selectedPlugin.isDuplicate ? 'DUPLICATE' : 'UNIQUE FILE'}
                    </span>
                </div>
                
                {isRenaming ? (
                    <div className="flex gap-2 mb-1">
                        <input 
                            value={renameValue}
                            onChange={(e) => setRenameValue(e.target.value)}
                            className="bg-slate-800 text-white text-sm px-2 py-1 rounded w-full border border-orange-500 focus:outline-none"
                            autoFocus
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') handleRenameSubmit();
                                if (e.key === 'Escape') setIsRenaming(false);
                            }}
                        />
                        <button onClick={handleRenameSubmit} className="text-green-500 hover:text-green-400"><Check className="w-4 h-4" /></button>
                        <button onClick={() => setIsRenaming(false)} className="text-red-500 hover:text-red-400"><X className="w-4 h-4" /></button>
                    </div>
                ) : (
                    <div className="group relative">
                        <h2 
                            className="text-lg font-bold text-white leading-tight break-words cursor-text hover:text-orange-400 transition-colors pr-6" 
                            onClick={() => setIsRenaming(true)}
                            title="Click to rename"
                        >
                            {selectedPlugin.name}
                        </h2>
                        <Edit2 className="w-3 h-3 text-slate-700 absolute top-1 right-0 opacity-0 group-hover:opacity-100" />
                    </div>
                )}
                
                <p className="text-[10px] text-slate-500 mt-2 font-mono break-all leading-relaxed bg-slate-900 p-2 rounded border border-slate-800/50">
                    {selectedPlugin.filename}
                </p>
            </div>

            {/* PREVIEW IMAGE */}
            {previewImage && (
                <div className="w-full aspect-video bg-slate-900 border-b border-slate-800 relative group">
                    <img src={previewImage} className="w-full h-full object-contain" alt="Plugin Preview" />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 to-transparent opacity-50" />
                    <span className="absolute bottom-2 left-3 text-[10px] font-bold text-white bg-slate-900/80 px-2 py-0.5 rounded flex items-center gap-1">
                        <ImageIcon className="w-3 h-3" /> Preview
                    </span>
                </div>
            )}

            <div className="p-6 space-y-8">
                
                {/* Categories */}
                <div>
                    <SectionHeader icon={<Tag className="w-3 h-3" />} title="Categories" />
                    <div className="flex flex-wrap gap-2 mb-4">
                        {selectedPlugin.tags.map(t => (
                            <button 
                                key={t} 
                                onClick={() => handleTagToggle(t)}
                                className="bg-orange-600 hover:bg-red-600 text-white text-xs pl-2 pr-1 py-1 rounded shadow-sm flex items-center gap-1 transition-colors group"
                            >
                                {t}
                                <X className="w-3 h-3 text-orange-200 group-hover:text-white"/>
                            </button>
                        ))}
                        {selectedPlugin.tags.length === 0 && (
                            <span className="text-xs text-slate-500 italic border border-dashed border-slate-700 px-3 py-1 rounded">Uncategorized</span>
                        )}
                    </div>

                    <div className="border-t border-slate-800 pt-4">
                        <p className="text-[10px] text-slate-500 mb-2 uppercase font-bold tracking-wider">Quick Add</p>
                        <div className="h-48 overflow-y-auto custom-scrollbar border border-slate-800 rounded bg-slate-900 p-1 space-y-0.5">
                            {categories.map(cat => (
                                <button 
                                    key={cat}
                                    onClick={() => handleTagToggle(cat)}
                                    className={`w-full text-left text-xs px-2 py-1.5 rounded flex justify-between transition-colors
                                        ${selectedPlugin.tags.includes(cat) 
                                            ? 'bg-slate-800 text-orange-400' 
                                            : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                                        }`}
                                >
                                    {cat}
                                    {selectedPlugin.tags.includes(cat) && <Check className="w-3 h-3" />}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Metadata */}
                <div>
                   <SectionHeader icon={<FileType className="w-3 h-3" />} title="Metadata" />
                   {nfoContent ? (
                       <div className="bg-slate-900 p-2 rounded border border-slate-800">
                           <div className="flex items-center gap-2 mb-2 text-[10px] text-slate-500 font-bold uppercase">
                               <FileText className="w-3 h-3" /> Info File
                           </div>
                           <pre className="text-[10px] text-slate-400 font-mono whitespace-pre-wrap overflow-hidden leading-relaxed">
                               {nfoContent}
                           </pre>
                       </div>
                   ) : (
                       <div className="text-xs text-slate-500 italic">No .nfo metadata found.</div>
                   )}
                </div>
            </div>
        </aside>
    );
  }

  // --- GLOBAL SETTINGS MODE (DEFAULT) ---
  return (
    <aside className="w-72 bg-slate-950 border-l border-slate-800 flex flex-col h-full shrink-0 overflow-y-auto custom-scrollbar">
      <div className="p-6 h-16 border-b border-slate-800 flex items-center bg-slate-900/50">
         <h2 className="text-xs font-bold tracking-widest text-slate-400 uppercase flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4" /> Global Settings
         </h2>
      </div>

      <div className="p-6 space-y-8">
        
        <div>
           <SectionHeader icon={<Key className="w-3 h-3" />} title="API Configuration" colorClass="text-slate-300" />
           <div className="bg-slate-900 rounded-lg p-3 border border-slate-800">
               <label className="text-[10px] text-slate-500 uppercase font-bold mb-1 block">Gemini API Key</label>
               <input 
                  type="password" 
                  value={keyInput} 
                  onChange={(e) => setKeyInput(e.target.value)}
                  onBlur={handleKeyBlur}
                  placeholder="Paste Key Here..."
                  className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-orange-500"
               />
               <p className="text-[10px] text-slate-600 mt-2">Updates immediately. Key is not saved to disk.</p>
           </div>
        </div>

        <div>
          <SectionHeader icon={<Zap className="w-3 h-3" />} title="Workflow" colorClass="text-orange-500" />
          <div className="bg-slate-900 rounded-lg p-2 border border-slate-800 space-y-1">
             <Toggle 
              label="Auto-Execute" 
              description="Analyze & Organize in one click"
              checked={settings.autoExecute} 
              onChange={(v) => updateSetting('autoExecute', v)} 
            />
            <div className="border-t border-slate-800 my-1"></div>
            <Toggle 
              label="Multi-Tag Mode" 
              description={settings.multiTag ? "Copy plugins to multiple category folders" : "Move to single best category only"}
              checked={settings.multiTag} 
              onChange={(v) => updateSetting('multiTag', v)} 
            />
          </div>
        </div>

        <div>
          <SectionHeader icon={<Brain className="w-3 h-3" />} title="AI Memory" colorClass="text-blue-500" />
          <div className="bg-slate-900 rounded-lg p-3 border border-slate-800 space-y-3">
             <p className="text-[10px] text-slate-400">
                 The app remembers your manual overrides to speed up future scans.
             </p>
             <div className="max-h-32 overflow-y-auto custom-scrollbar border border-slate-800/50 rounded bg-slate-950/50 p-1 space-y-1">
                 {Object.entries(manualOverrides).length === 0 && (
                     <div className="text-[10px] text-slate-600 text-center py-4 italic">No rules learned yet.</div>
                 )}
                 {Object.entries(manualOverrides).map(([name, val]) => {
                     const rule = val as LearnedRule;
                     return (
                     <div key={name} className="flex items-center justify-between p-1.5 bg-slate-900 rounded border border-slate-800/50 group">
                         <div className="flex flex-col overflow-hidden">
                             <span className="text-[10px] font-bold text-slate-300 truncate w-24" title={name}>{name}</span>
                             <span className="text-[9px] text-blue-400 truncate">{rule.tags.join(', ')}</span>
                         </div>
                         <div className="flex items-center gap-2">
                             <span className="text-[9px] text-slate-600 bg-slate-950 px-1 rounded" title="Confidence Score">{rule.count}</span>
                             <button 
                                onClick={() => onClearRule(name)}
                                className="text-slate-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                title="Forget Rule"
                             >
                                 <Trash2 className="w-3 h-3" />
                             </button>
                         </div>
                     </div>
                 )})}
             </div>
          </div>
        </div>

        <div className="bg-slate-900/50 p-4 rounded-lg space-y-2 border border-slate-800">
           <p className="text-[10px] text-slate-500 uppercase font-bold">Hardcoded Safety</p>
           <ul className="text-xs text-slate-400 space-y-1 list-disc pl-4">
              <li>Folders are always flattened.</li>
              <li>Assets (.nfo/.png) always bundle.</li>
              <li>Empty folders are cleaned up.</li>
           </ul>
        </div>
        
        <div>
          <SectionHeader icon={<Wrench className="w-3 h-3" />} title="Tools" colorClass="text-slate-400" />
          <div className="bg-slate-900 rounded-lg p-2 border border-slate-800 space-y-2">
              <button 
                  onClick={onFlatten}
                  className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded border border-slate-700 transition-all flex items-center justify-center gap-2"
              >
                  <FolderMinus className="w-3 h-3" /> Flatten Library to Root
              </button>
          </div>
        </div>

      </div>
    </aside>
  );
};

// Helper icon
const SlidersHorizontal: React.FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><line x1="21" x2="14" y1="4" y2="4"/><line x1="10" x2="3" y1="4" y2="4"/><line x1="21" x2="12" y1="12" y2="12"/><line x1="8" x2="3" y1="12" y2="12"/><line x1="21" x2="16" y1="20" y2="20"/><line x1="12" x2="3" y1="20" y2="20"/><line x1="14" x2="14" y1="2" y2="6"/><line x1="8" x2="8" y1="10" y2="14"/><line x1="16" x2="16" y1="18" y2="22"/></svg>
)

export default Inspector;
