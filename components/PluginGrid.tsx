
import React, { memo, useEffect, useRef, useState } from 'react';
import { Plugin, ViewMode } from '../types';
import { Sliders, CheckCircle2, AlertCircle, RefreshCw, FileBox, Trash2, GripVertical, Image as ImageIcon } from 'lucide-react';

interface PluginGridProps {
  plugins: Plugin[];
  viewMode: ViewMode;
  selectedPluginIds: Set<string>;
  onSelectPlugin: (id: string | null, modifier: 'shift' | 'ctrl' | 'none') => void;
  onToggleDuplicate: (id: string) => void;
  onContextMenu: (e: React.MouseEvent, plugin: Plugin) => void;
  zoomLevel: number;
}

const getStatusColor = (status: Plugin['status']) => {
  switch (status) {
    case 'categorized': return 'border-t-green-500';
    case 'moved': return 'border-t-blue-500';
    case 'analyzing': return 'border-t-orange-500';
    case 'error': return 'border-t-red-500';
    default: return 'border-t-slate-700';
  }
};

const getStatusIcon = (status: Plugin['status']) => {
  switch (status) {
    case 'categorized': return <CheckCircle2 className="w-3 h-3 text-green-500" />;
    case 'moved': return <CheckCircle2 className="w-3 h-3 text-blue-500" />;
    case 'analyzing': return <RefreshCw className="w-3 h-3 text-orange-500 animate-spin" />;
    case 'error': return <AlertCircle className="w-3 h-3 text-red-500" />;
    default: return null;
  }
};

// --- MEMOIZED CARD COMPONENT ---
const PluginCard = memo(({ plugin, isSelected, onClick, onDragStart, onToggleDuplicate, onContextMenu }: { 
    plugin: Plugin, 
    isSelected: boolean, 
    onClick: (e: React.MouseEvent) => void,
    onDragStart: (e: React.DragEvent) => void,
    onToggleDuplicate: (id: string) => void,
    onContextMenu: (e: React.MouseEvent) => void
}) => {
    const [imageUrl, setImageUrl] = useState<string | null>(null);

    // Lazy load image if available
    useEffect(() => {
        let objectUrl: string | null = null;
        let mounted = true;

        const loadAsset = async () => {
            const pngAsset = plugin.assets.find(a => a.type === 'png');
            if (pngAsset && pngAsset.handle) {
                try {
                    const file = await pngAsset.handle.getFile();
                    if (mounted) {
                        objectUrl = URL.createObjectURL(file);
                        setImageUrl(objectUrl);
                    }
                } catch (e) {
                    // Fail silently
                }
            }
        };

        // Simple IntersectionObserver alternative: Just load. 
        // For 500+ items we might want true virtualization, but browser cache helps here.
        loadAsset();

        return () => {
            mounted = false;
            if (objectUrl) URL.revokeObjectURL(objectUrl);
        };
    }, [plugin.assets]);

    return (
        <div 
            onClick={onClick}
            onContextMenu={onContextMenu}
            draggable
            onDragStart={onDragStart}
            className={`
                relative bg-slate-800/80 rounded-md p-3 border-t-2 shadow-sm transition-all group cursor-grab active:cursor-grabbing select-none flex flex-col h-full
                ${getStatusColor(plugin.status)}
                ${isSelected ? 'ring-2 ring-orange-500 bg-slate-800 z-10 scale-105 shadow-xl shadow-black/50' : 'ring-1 ring-white/5 hover:bg-slate-700/50 hover:shadow-md'}
                ${plugin.isDuplicate ? 'opacity-60 grayscale' : ''}
            `}
        >
            {/* Header Icon */}
            <div className="flex items-start justify-between mb-2">
                <div className={`p-1.5 rounded transition-colors ${isSelected ? 'bg-orange-500 text-white' : 'bg-slate-700/50 text-slate-500'}`}>
                    {plugin.isDuplicate ? <Trash2 className="w-3 h-3"/> : <Sliders className="w-3 h-3" />}
                </div>
                {getStatusIcon(plugin.status)}
            </div>
            
            {/* Thumbnail Preview */}
            {imageUrl ? (
                <div className="w-full h-16 mb-2 rounded bg-slate-900 overflow-hidden relative border border-slate-700/50">
                    <img src={imageUrl} alt="Plugin" className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                </div>
            ) : (
                <div className="w-full h-16 mb-2 rounded bg-slate-900/50 border border-slate-800 border-dashed flex items-center justify-center">
                    <ImageIcon className="w-4 h-4 text-slate-700" />
                </div>
            )}

            {/* Content */}
            <div className="space-y-1 mb-2 flex-1">
                <h3 className="font-bold text-slate-200 truncate text-xs leading-tight" title={plugin.name}>
                    {plugin.name}
                </h3>
                {plugin.category && (
                    <p className="text-[10px] text-orange-400 font-mono truncate font-bold">
                        {plugin.category}
                    </p>
                )}
                {(!plugin.category) && (
                    <p className="text-[10px] text-slate-600 font-mono truncate italic">
                        Uncategorized
                    </p>
                )}
            </div>

            {/* Mini Tags - Secondary */}
            <div className="flex gap-1 flex-wrap h-4 overflow-hidden mb-2">
                {plugin.tags.filter(t => t !== plugin.category).slice(0, 2).map(t => (
                    <span key={t} className="text-[9px] bg-slate-950/50 text-slate-500 px-1 py-0.5 rounded border border-white/5">{t}</span>
                ))}
            </div>

            {/* Quick Actions (Hover) */}
            <button 
                onClick={(e) => { e.stopPropagation(); onToggleDuplicate(plugin.id); }}
                className={`
                    w-full py-1 text-[9px] font-bold uppercase tracking-wider rounded transition-colors
                    ${plugin.isDuplicate 
                        ? 'bg-red-900/50 text-red-200 hover:bg-red-900 border border-red-800' 
                        : 'bg-slate-700 text-slate-400 hover:bg-slate-600 hover:text-white opacity-0 group-hover:opacity-100'}
                `}
            >
                {plugin.isDuplicate ? 'Restore' : 'Mark Duplicate'}
            </button>

            {plugin.isDuplicate && (
                <div className="absolute top-2 right-2">
                    <Trash2 className="w-4 h-4 text-red-500" />
                </div>
            )}
        </div>
    );
}, (prev, next) => {
    return prev.plugin === next.plugin && prev.isSelected === next.isSelected;
});

const PluginGrid: React.FC<PluginGridProps> = ({ plugins, viewMode, selectedPluginIds, onSelectPlugin, onToggleDuplicate, onContextMenu, zoomLevel }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Keyboard Navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (selectedPluginIds.size === 0) return;
      
      const lastSelectedId = Array.from(selectedPluginIds).pop();
      const currentIndex = plugins.findIndex(p => p.id === lastSelectedId);
      if (currentIndex === -1) return;

      let nextIndex = currentIndex;
      
      switch (e.key) {
          case 'ArrowRight': nextIndex = Math.min(plugins.length - 1, currentIndex + 1); break;
          case 'ArrowLeft': nextIndex = Math.max(0, currentIndex - 1); break;
          case 'ArrowDown': nextIndex = Math.min(plugins.length - 1, currentIndex + zoomLevel); break; // Approx row
          case 'ArrowUp': nextIndex = Math.max(0, currentIndex - zoomLevel); break;
          case 'Home': nextIndex = 0; break;
          case 'End': nextIndex = plugins.length - 1; break;
          default: return;
      }
      
      if (nextIndex !== currentIndex) {
          e.preventDefault();
          onSelectPlugin(plugins[nextIndex].id, e.shiftKey ? 'shift' : 'none');
          
          const el = document.getElementById(`plugin-${plugins[nextIndex].id}`);
          if (el) el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedPluginIds, plugins, onSelectPlugin, zoomLevel]);

  const handleBgClick = (e: React.MouseEvent) => {
     if (e.target === e.currentTarget) {
         onSelectPlugin(null, 'none');
     }
  };

  const handleClick = (e: React.MouseEvent, id: string) => {
      e.stopPropagation();
      let modifier: 'shift' | 'ctrl' | 'none' = 'none';
      if (e.shiftKey) modifier = 'shift';
      if (e.ctrlKey || e.metaKey) modifier = 'ctrl';
      onSelectPlugin(id, modifier);
  };

  const handleDragStart = (e: React.DragEvent, id: string) => {
      e.dataTransfer.setData('pluginId', id);
      e.dataTransfer.effectAllowed = 'copyMove';
      if (!selectedPluginIds.has(id)) {
           onSelectPlugin(id, 'none');
      }
  };

  if (plugins.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-slate-600 flex-col gap-4 bg-slate-900/50 select-none" onClick={handleBgClick}>
        <FileBox className="w-16 h-16 opacity-20" />
        <p className="text-sm">No plugins found matching criteria.</p>
      </div>
    );
  }

  // LIST VIEW
  if (viewMode === ViewMode.LIST) {
      return (
        <div className="flex-1 overflow-y-auto bg-slate-900 p-2 custom-scrollbar" onClick={handleBgClick}>
            <table className="w-full text-left border-collapse">
                <thead className="bg-slate-950 text-slate-500 text-xs uppercase sticky top-0 z-10 shadow-sm font-bold tracking-wider">
                    <tr>
                        <th className="p-3 w-10"></th>
                        <th className="p-3">Name</th>
                        <th className="p-3">Category</th>
                        <th className="p-3">Tags</th>
                        <th className="p-3">Path</th>
                    </tr>
                </thead>
                <tbody className="text-sm text-slate-300 divide-y divide-slate-800">
                    {plugins.map(p => {
                        const isSelected = selectedPluginIds.has(p.id);
                        return (
                            <tr 
                                key={p.id} 
                                onClick={(e) => handleClick(e, p.id)}
                                onContextMenu={(e) => onContextMenu(e, p)}
                                draggable
                                onDragStart={(e) => handleDragStart(e, p.id)}
                                className={`
                                    cursor-pointer transition-colors 
                                    ${isSelected ? 'bg-slate-800 border-l-2 border-orange-500' : 'hover:bg-slate-800/50 border-l-2 border-transparent'} 
                                    ${p.isDuplicate ? 'opacity-50 line-through decoration-red-500' : ''}
                                `}
                            >
                                <td className="p-3">{getStatusIcon(p.status)}</td>
                                <td className="p-3 font-bold flex items-center gap-2 text-xs">
                                    <GripVertical className="w-3 h-3 text-slate-700 opacity-0 group-hover:opacity-100" />
                                    {p.name}
                                    {p.isDuplicate && <span className="text-[9px] bg-red-900 text-red-200 px-1 rounded border border-red-800 no-underline">DUPLICATE</span>}
                                </td>
                                <td className="p-3 text-slate-400 text-xs">{p.category || '-'}</td>
                                <td className="p-3">
                                    <div className="flex gap-1">
                                        {p.tags.filter(t => t !== p.category).slice(0, 2).map(t => <span key={t} className="text-[10px] bg-slate-700 px-1.5 py-0.5 rounded text-slate-300">{t}</span>)}
                                    </div>
                                </td>
                                <td className="p-3 text-slate-600 text-[10px] font-mono truncate max-w-[200px]">{p.path}</td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
      );
  }

  // GRID VIEW
  return (
    <div className="flex-1 overflow-y-auto p-6 bg-slate-900 custom-scrollbar" onClick={handleBgClick} ref={containerRef}>
      <div 
        className="grid gap-4 transition-all duration-300"
        style={{
            gridTemplateColumns: `repeat(auto-fill, minmax(${Math.max(140, 240 - (zoomLevel * 10))}px, 1fr))`
        }}
      >
        {plugins.map((plugin) => (
            <div id={`plugin-${plugin.id}`} key={plugin.id} className="h-full">
                <PluginCard 
                    plugin={plugin} 
                    isSelected={selectedPluginIds.has(plugin.id)} 
                    onClick={(e) => handleClick(e, plugin.id)}
                    onDragStart={(e) => handleDragStart(e, plugin.id)}
                    onToggleDuplicate={onToggleDuplicate}
                    onContextMenu={(e) => onContextMenu(e, plugin)}
                />
            </div>
        ))}
      </div>
    </div>
  );
};

export default PluginGrid;
