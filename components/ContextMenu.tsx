
import React, { useEffect, useRef } from 'react';
import { Trash2, Edit2, Tag, Copy, XCircle } from 'lucide-react';

interface ContextMenuProps {
  x: number;
  y: number;
  pluginId: string;
  pluginName: string;
  isDuplicate: boolean;
  categories: string[];
  onClose: () => void;
  onAction: (action: 'duplicate' | 'rename' | 'tag', value?: string) => void;
}

const ContextMenu: React.FC<ContextMenuProps> = ({ x, y, pluginId, pluginName, isDuplicate, categories, onClose, onAction }) => {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    // Close on escape
    const handleEsc = (e: KeyboardEvent) => {
        if (e.key === 'Escape') onClose();
    }

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEsc);
    return () => {
        document.removeEventListener('mousedown', handleClickOutside);
        document.removeEventListener('keydown', handleEsc);
    };
  }, [onClose]);

  // Adjust position to keep in viewport
  const style: React.CSSProperties = {
    top: Math.min(y, window.innerHeight - 300),
    left: Math.min(x, window.innerWidth - 200),
  };

  return (
    <div 
      ref={menuRef}
      style={style}
      className="fixed z-[100] w-56 bg-slate-800 border border-slate-700 rounded-lg shadow-2xl py-1 overflow-hidden animate-in fade-in zoom-in-95 duration-100"
      onContextMenu={(e) => e.preventDefault()}
    >
      <div className="px-3 py-2 border-b border-slate-700/50 bg-slate-800/50">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider truncate">
              {pluginName}
          </p>
      </div>

      <div className="p-1 space-y-0.5">
          <button 
            onClick={() => onAction('rename')}
            className="w-full text-left px-2 py-1.5 text-xs text-slate-200 hover:bg-blue-600 rounded flex items-center gap-2"
          >
              <Edit2 className="w-3 h-3" /> Rename
          </button>
          
          <button 
            onClick={() => onAction('duplicate')}
            className={`w-full text-left px-2 py-1.5 text-xs rounded flex items-center gap-2 ${isDuplicate ? 'text-red-300 hover:bg-red-900/50' : 'text-slate-200 hover:bg-red-600'}`}
          >
              {isDuplicate ? <XCircle className="w-3 h-3"/> : <Trash2 className="w-3 h-3" />}
              {isDuplicate ? 'Restore from Trash' : 'Mark as Duplicate'}
          </button>
      </div>

      <div className="border-t border-slate-700/50 my-1"></div>
      
      <div className="px-3 py-1 text-[9px] text-slate-500 font-bold uppercase">Quick Categorize</div>
      <div className="p-1 max-h-48 overflow-y-auto custom-scrollbar">
          {categories.slice(0, 8).map(cat => (
              <button
                key={cat}
                onClick={() => onAction('tag', cat)}
                className="w-full text-left px-2 py-1.5 text-xs text-slate-300 hover:bg-slate-700 hover:text-orange-400 rounded flex items-center gap-2"
              >
                  <Tag className="w-3 h-3 opacity-50" /> {cat}
              </button>
          ))}
      </div>
    </div>
  );
};

export default ContextMenu;
