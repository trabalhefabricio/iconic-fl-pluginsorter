
import React, { useState } from 'react';
import { Search, Tag, Folder, HelpCircle, Layers, Edit3, ChevronRight, Edit2, X } from 'lucide-react';

interface SidebarProps {
  categories: string[];
  onEditCategories: () => void;
  onSearch: (query: string) => void;
  searchQuery: string;
  selectedCategory: string | null;
  onSelectCategory: (cat: string | null) => void;
  counts: Record<string, number>;
  primaryCounts: Record<string, number>;
  totalCount: number;
  uncategorizedCount: number;
  onOpenWiki: () => void;
  onDropPlugin: (pluginId: string, category: string) => void;
  onRenameCategory?: (oldName: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  categories, onEditCategories, onSearch, searchQuery, selectedCategory, onSelectCategory, counts, primaryCounts, totalCount, uncategorizedCount, onOpenWiki, onDropPlugin, onRenameCategory
}) => {
  const [dragOverCategory, setDragOverCategory] = useState<string | null>(null);

  const handleDragOver = (e: React.DragEvent, cat: string) => {
    e.preventDefault();
    setDragOverCategory(cat);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOverCategory(null);
  };

  const handleDrop = (e: React.DragEvent, cat: string) => {
    e.preventDefault();
    setDragOverCategory(null);
    const pluginId = e.dataTransfer.getData('pluginId');
    if (pluginId) {
        onDropPlugin(pluginId, cat);
    }
  };

  return (
    <aside className="w-64 bg-slate-950 border-r border-slate-800 flex flex-col h-full shrink-0 z-20">
      {/* Brand */}
      <div className="h-16 flex items-center px-6 border-b border-slate-800 bg-slate-950/50 backdrop-blur-sm">
        <div className="font-black tracking-tighter text-slate-100 flex items-center gap-2 text-xl select-none">
           <span className="text-orange-600">///</span> ICONIC
        </div>
      </div>

      {/* Search */}
      <div className="p-4 border-b border-slate-900">
        <div className="relative group">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-600 group-focus-within:text-orange-500 transition-colors" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearch(e.target.value)}
            placeholder="Search library..."
            className="w-full bg-slate-900 text-sm text-slate-200 pl-9 pr-8 py-2 rounded-md border border-slate-800 focus:outline-none focus:border-orange-500/50 focus:bg-slate-800 transition-all placeholder:text-slate-700"
          />
          {searchQuery && (
              <button 
                onClick={() => onSearch('')}
                className="absolute right-2 top-2.5 text-slate-500 hover:text-white transition-colors"
              >
                  <X className="w-4 h-4" />
              </button>
          )}
        </div>
      </div>

      {/* Categories Header */}
      <div className="px-6 pt-6 pb-2 flex items-center justify-between text-[10px] font-bold text-slate-500 uppercase tracking-widest">
        <div className="flex items-center gap-2">
          <Tag className="w-3 h-3" /> Categories
        </div>
        <button onClick={onEditCategories} className="hover:text-white transition-colors flex items-center gap-1 opacity-50 hover:opacity-100">
            <Edit3 className="w-3 h-3"/> EDIT LIST
        </button>
      </div>

      {/* Categories List */}
      <div className="flex-1 overflow-y-auto px-3 pb-4 space-y-0.5 custom-scrollbar">
        {categories.map((cat, idx) => {
            const isTarget = dragOverCategory === cat;
            const primary = primaryCounts[cat] || 0;
            const total = counts[cat] || 0;
            
            return (
              <div
                key={idx}
                onDragOver={(e) => handleDragOver(e, cat)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, cat)}
                onClick={() => onSelectCategory(cat)}
                className={`
                    group w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded-md cursor-pointer transition-all border border-transparent
                    ${selectedCategory === cat 
                        ? 'bg-slate-800 text-white shadow-md' 
                        : isTarget 
                            ? 'bg-orange-500/20 border-orange-500/50 text-orange-200 scale-[1.02]' 
                            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
                    }
                `}
              >
                <div className="flex items-center gap-2 overflow-hidden">
                    <ChevronRight className={`w-3 h-3 transition-transform ${selectedCategory === cat ? 'rotate-90 text-orange-500' : 'text-slate-700'}`} />
                    <span className="truncate">{cat}</span>
                </div>
                
                <div className="flex items-center gap-2">
                    {onRenameCategory && (
                        <button 
                            onClick={(e) => { e.stopPropagation(); onRenameCategory(cat); }} 
                            className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-white transition-opacity"
                        >
                            <Edit2 className="w-3 h-3" />
                        </button>
                    )}
                    {(total > 0) && (
                        <div className="flex items-center gap-1.5 font-mono">
                            {/* Primary (Single) Count */}
                             <span className={`text-[10px] ${primary > 0 ? (selectedCategory === cat ? 'text-white' : 'text-slate-400') : 'text-slate-700'}`}>
                                {primary}
                             </span>
                             <span className="text-[8px] text-slate-700">/</span>
                             {/* Total (Multi) Count */}
                             <span className={`text-[10px] ${selectedCategory === cat ? 'text-slate-500' : 'text-slate-600'}`}>
                                {total}
                             </span>
                        </div>
                    )}
                </div>
              </div>
            );
        })}
      </div>

      {/* Bottom */}
      <div className="p-4 border-t border-slate-900 bg-slate-950">
        <button 
            onClick={onOpenWiki}
            className="flex items-center gap-3 text-xs font-medium text-slate-500 hover:text-orange-400 transition-colors w-full px-2 py-2 rounded-md hover:bg-slate-900"
        >
             <HelpCircle className="w-4 h-4" />
             <span>Help & Documentation</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
