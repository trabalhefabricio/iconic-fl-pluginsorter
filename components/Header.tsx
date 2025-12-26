
import React from 'react';
import { Play, LayoutGrid, List as ListIcon, FolderSync, FolderEdit, Square, ArrowDownAZ, ArrowUpAZ, Calendar, CalendarClock, Filter, ZoomIn } from 'lucide-react';
import { ViewMode, SortOption, StatusFilter } from '../types';

interface HeaderProps {
  pluginCount: number;
  viewMode: ViewMode;
  setViewMode: (m: ViewMode) => void;
  onAnalyze: () => void;
  onMove: () => void;
  isAnalyzing: boolean;
  statusText?: string;
  isMoving: boolean;
  selectedFolder: string;
  onChangeFolder: () => void;
  progress?: { current: number; total: number; label: string };
  sortOption: SortOption;
  setSortOption: (o: SortOption) => void;
  statusFilter: StatusFilter;
  setStatusFilter: (f: StatusFilter) => void;
  zoomLevel: number;
  setZoomLevel: (z: number) => void;
}

const Header: React.FC<HeaderProps> = ({ 
  pluginCount, viewMode, setViewMode, onAnalyze, onMove, isAnalyzing, statusText, isMoving, selectedFolder, onChangeFolder, progress, sortOption, setSortOption, statusFilter, setStatusFilter, zoomLevel, setZoomLevel
}) => {
  return (
    <header className="relative h-16 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-6 shrink-0 z-10 shadow-sm">
      
      {/* Progress Bar Overlay */}
      {progress && progress.total > 0 && (
          <div className="absolute bottom-0 left-0 h-1 bg-slate-800 w-full overflow-hidden">
              <div 
                className="h-full bg-orange-500 transition-all duration-300 ease-out"
                style={{ width: `${(progress.current / progress.total) * 100}%` }}
              />
          </div>
      )}

      {/* Left Controls */}
      <div className="flex items-center gap-4">
        {/* View Toggle */}
        <div className="flex bg-slate-800 rounded p-1 border border-slate-700">
          <button 
            onClick={() => setViewMode(ViewMode.GRID)}
            className={`p-1.5 rounded transition-colors ${viewMode === ViewMode.GRID ? 'bg-slate-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
            title="Grid View"
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
          <button 
            onClick={() => setViewMode(ViewMode.LIST)}
            className={`p-1.5 rounded transition-colors ${viewMode === ViewMode.LIST ? 'bg-slate-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
            title="List View"
          >
            <ListIcon className="w-4 h-4" />
          </button>
        </div>

        {/* Zoom Slider (Only in Grid) */}
        {viewMode === ViewMode.GRID && (
             <div className="flex items-center gap-2 bg-slate-800 rounded p-1 px-3 border border-slate-700 h-[34px]">
                <ZoomIn className="w-3 h-3 text-slate-500" />
                <input 
                    type="range" 
                    min="3" 
                    max="10" 
                    step="1"
                    value={zoomLevel}
                    onChange={(e) => setZoomLevel(parseInt(e.target.value))}
                    className="w-16 h-1 bg-slate-600 rounded-lg appearance-none cursor-pointer accent-orange-500"
                    title="Grid Size"
                />
             </div>
        )}

        <div className="h-6 w-px bg-slate-800 mx-1"></div>

        {/* Sort Toggle */}
        <div className="flex bg-slate-800 rounded p-1 border border-slate-700">
          <button 
            onClick={() => setSortOption('name_asc')}
            className={`p-1.5 rounded transition-colors ${sortOption === 'name_asc' ? 'bg-slate-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
            title="Sort Name A-Z"
          >
            <ArrowDownAZ className="w-4 h-4" />
          </button>
           <button 
            onClick={() => setSortOption('name_desc')}
            className={`p-1.5 rounded transition-colors ${sortOption === 'name_desc' ? 'bg-slate-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
            title="Sort Name Z-A"
          >
            <ArrowUpAZ className="w-4 h-4" />
          </button>
          <button 
            onClick={() => setSortOption('date_new')}
            className={`p-1.5 rounded transition-colors ${sortOption === 'date_new' ? 'bg-slate-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
            title="Sort Newest First"
          >
            <Calendar className="w-4 h-4" />
          </button>
          <button 
            onClick={() => setSortOption('date_old')}
            className={`p-1.5 rounded transition-colors ${sortOption === 'date_old' ? 'bg-slate-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
            title="Sort Oldest First"
          >
            <CalendarClock className="w-4 h-4" />
          </button>
        </div>

        {/* Filter Toggle */}
        <div className="relative group">
            <div className="flex items-center gap-2 bg-slate-800 rounded p-1 border border-slate-700 px-2 h-[34px]">
                <Filter className="w-3 h-3 text-slate-500" />
                <select 
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
                    className="bg-transparent text-xs text-slate-300 focus:outline-none font-medium cursor-pointer"
                >
                    <option value="all">Show All</option>
                    <option value="uncategorized">Uncategorized</option>
                    <option value="duplicates">Duplicates</option>
                    <option value="analyzed">Analyzed</option>
                    <option value="error">Errors</option>
                </select>
            </div>
        </div>
      </div>

      {/* Center Status (Only when active) */}
      {progress && (
          <div className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 flex items-center gap-2 bg-slate-800/90 px-3 py-1 rounded-full border border-slate-700 shadow-xl backdrop-blur-sm z-50">
              <span className="text-[10px] font-bold text-orange-400 uppercase tracking-widest animate-pulse">
                  {progress.label}
              </span>
              <span className="text-[10px] font-mono text-white">
                  {progress.current} / {progress.total}
              </span>
          </div>
      )}

      {/* Right Actions */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 text-xs text-slate-500 font-mono mr-2 hidden xl:flex">
             <span className="truncate max-w-[150px]" title={selectedFolder}>{selectedFolder}</span>
             <button onClick={onChangeFolder} className="p-1 hover:bg-slate-800 rounded text-slate-400">
                  <FolderEdit className="w-3 h-3" />
             </button>
        </div>

        <button
          onClick={onAnalyze}
          disabled={isMoving || !!progress}
          className={`
            flex items-center gap-2 px-6 py-2 rounded font-bold text-white text-xs tracking-wider uppercase transition-all shadow-lg border border-white/5 min-w-[140px] justify-center
            ${isAnalyzing 
                ? 'bg-red-900/80 hover:bg-red-800 text-red-100 border-red-500/50' 
                : 'bg-blue-600 hover:bg-blue-500 hover:shadow-blue-500/20 active:translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed'
            }
          `}
        >
           {isAnalyzing ? <Square className="w-3 h-3 fill-current" /> : <Play className="w-3 h-3 fill-current" />}
           {isAnalyzing ? (statusText || 'Stop') : 'Analyze'}
        </button>

        <button
          onClick={onMove}
          disabled={isAnalyzing || isMoving || !!progress}
          className={`
            flex items-center gap-2 px-6 py-2 rounded font-bold text-white text-xs tracking-wider uppercase transition-all shadow-lg border border-white/5
            ${isMoving
                ? 'bg-orange-900/50 cursor-not-allowed text-orange-200' 
                : 'bg-orange-600 hover:bg-orange-500 hover:shadow-orange-500/20 active:translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed'
            }
          `}
        >
           <FolderSync className="w-3 h-3" />
           {isMoving ? 'Organizing...' : 'Organize Files'}
        </button>
      </div>

    </header>
  );
};

export default Header;
