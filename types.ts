
export interface PluginAsset {
  filename: string;
  type: 'nfo' | 'png' | 'other';
  handle?: any; // FileSystemFileHandle
  parentHandle?: any; // DirectoryHandle
  path?: string;
}

export interface Plugin {
  id: string; // Relative path acts as unique ID
  name: string; // The "Bundle" name (e.g. "Serum")
  normalizedName: string; // Lowercase, stripped of version/arch tags for fuzzy matching
  filename: string; // The main .fst file name
  path: string; // Relative path from root including filename
  category: string | null; // Primary category
  tags: string[]; // All assigned tags
  assets: PluginAsset[]; // Associated files (.nfo, .png)
  status: 'pending' | 'analyzing' | 'categorized' | 'queued_move' | 'moved' | 'error';
  isDuplicate?: boolean;
  contentHash: string; // For strict deduplication (Header + Size)
  fileSize: number;
  dateModified: number;
  handle?: any; // FileSystemFileHandle
  parentHandle?: any; // DirectoryHandle containing this file
}

export interface AppSettings {
  autoExecute: boolean; // If true, skip review
  deduplicate: boolean; // Content-based deduplication
  multiTag: boolean; // If true, copy to multiple folders.
  dryRun: boolean; // Visual simulation only
  downloadImages: boolean; // Auto-download missing plugin screenshots
}

export interface LogEntry {
  id: string;
  timestamp: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'action';
}

export enum ViewMode {
  GRID = 'GRID',
  LIST = 'LIST',
}

export type SortOption = 'name_asc' | 'name_desc' | 'date_new' | 'date_old';

export type StatusFilter = 'all' | 'uncategorized' | 'duplicates' | 'analyzed' | 'error';

export interface LeftoverFile {
    path: string;
    handle: any; // FileSystemFileHandle
    parentHandle?: any; // DirectoryHandle
}

export interface CategoryProfile {
  id: string;
  name: string;
  categories: string[];
}

export interface UndoManifest {
    timestamp: number;
    moves: {
        filename: string;
        originalPath: string; // relative
        newPath: string; // relative
    }[];
}

export interface LearnedRule {
    tags: string[];
    count: number; // Confidence score
}

export interface ConflictSuggestion {
    id: string;
    pluginName: string;
    normalizedName: string;
    currentTags: string[];
    suggestedTags: string[];
    conflictCount: number;
    timestamp: number;
}

export interface PersistedState {
    timestamp: number;
    categories: string[];
    plugins: Partial<Plugin>[];
    manualOverrides: Record<string, LearnedRule>; // normalizedName -> rule
}
