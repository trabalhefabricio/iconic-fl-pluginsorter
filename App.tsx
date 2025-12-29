
import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import PluginGrid from './components/PluginGrid';
import Inspector from './components/Inspector';
import Console from './components/Console';
import StartScreen from './components/StartScreen';
import CategoryEditor from './components/CategoryEditor';
import WikiModal from './components/WikiModal';
import ContextMenu from './components/ContextMenu';

import { 
  Plugin, 
  AppSettings, 
  LogEntry, 
  ViewMode,
  LeftoverFile,
  PersistedState,
  SortOption,
  LearnedRule,
  StatusFilter
} from './types';
import { DEFAULT_CATEGORIES } from './constants';
import { categorizeBatch, initializeGemini } from './services/geminiService';
import { fileSystemService } from './services/fileSystem';

const App: React.FC = () => {
  // --- Global State ---
  const [currentFolderHandle, setCurrentFolderHandle] = useState<any>(null);
  const [apiKey, setApiKey] = useState<string>('');
  
  // --- Data State ---
  const [plugins, setPlugins] = useState<Plugin[]>([]);
  const [leftovers, setLeftovers] = useState<LeftoverFile[]>([]);
  const [categories, setCategories] = useState<string[]>(DEFAULT_CATEGORIES);
  const [manualOverrides, setManualOverrides] = useState<Record<string, LearnedRule>>({});
  
  // --- UI State ---
  const [viewMode, setViewMode] = useState<ViewMode>(ViewMode.GRID);
  const [sortOption, setSortOption] = useState<SortOption>('name_asc');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [selectedPluginIds, setSelectedPluginIds] = useState<Set<string>>(new Set());
  const [zoomLevel, setZoomLevel] = useState(6);
  
  const [isCategoryEditorOpen, setIsCategoryEditorOpen] = useState(false);
  const [isWikiOpen, setIsWikiOpen] = useState(false);
  
  // Context Menu State
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; plugin: Plugin } | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string | null>(null);

  // --- Process State ---
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisStatusText, setAnalysisStatusText] = useState<string | undefined>(undefined);
  const [isMoving, setIsMoving] = useState(false);
  const [progress, setProgress] = useState<{ current: number, total: number, label: string } | undefined>(undefined);

  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isConsoleOpen, setIsConsoleOpen] = useState(false);
  const [canUndo, setCanUndo] = useState(false);
  
  const stopAnalysisRef = useRef(false);

  const [settings, setSettings] = useState<AppSettings>({
    autoExecute: false,
    deduplicate: true,
    multiTag: true,
    dryRun: false,
    downloadImages: false
  });

  // --- Initialization ---

  useEffect(() => {
      if (apiKey) initializeGemini(apiKey);
  }, [apiKey]);

  // Load Undo Manifest only when folder handle changes
  useEffect(() => {
      if (currentFolderHandle) {
          fileSystemService.loadUndoManifest(currentFolderHandle).then(manifest => {
              if (manifest) setCanUndo(true);
          });
      }
  }, [currentFolderHandle]);

  useEffect(() => {
      if (currentFolderHandle && plugins.length > 0) {
          const timeout = setTimeout(() => {
              const save = async () => {
                  try {
                      if(currentFolderHandle) {
                          await fileSystemService.saveState(currentFolderHandle, plugins, categories, manualOverrides);
                      }
                  } catch(e) { console.error("Auto-save failed", e); }
              };
              save();

          }, 2000);
          return () => clearTimeout(timeout);
      }
  }, [plugins, categories, currentFolderHandle, manualOverrides]);

  const addLog = useCallback((message: string, type: LogEntry['type'] = 'info') => {
    const entry: LogEntry = {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toLocaleTimeString([], { hour12: false }),
      message,
      type
    };
    setLogs(prev => [...prev, entry]);
    if (type === 'error' || type === 'action') setIsConsoleOpen(true);
  }, []);

  const handleStart = async (dirHandle: any, key: string) => {
    setCurrentFolderHandle(dirHandle);
    setApiKey(key);
    initializeGemini(key);
    
    addLog(`Accessing folder: ${dirHandle.name}`, 'info');
    
    try {
        const allFiles = await fileSystemService.scanAllFiles(dirHandle);
        const { plugins: parsedPlugins, leftovers: parsedLeftovers } = processScanResults(allFiles);
        // Initial set
        let currentPlugins = parsedPlugins;
        setLeftovers(parsedLeftovers);
        addLog(`Found ${parsedPlugins.length} plugins and ${parsedLeftovers.length} other files.`, 'success');
        
        setProgress({ current: 0, total: parsedPlugins.length, label: 'Hashing Content' });
        const hashedPlugins = await fileSystemService.generateHashes(parsedPlugins, (curr, total) => {
            setProgress({ current: curr, total, label: 'Hashing Content' });
        });
        currentPlugins = hashedPlugins;
        setProgress(undefined);

        // Load persisted state (Restoration) - MOVED HERE to ensure plugins exist
        const savedState = await fileSystemService.loadState(dirHandle);
        if (savedState) {
            addLog("Restored previous categorization state.", 'success');
            if (savedState.categories) setCategories(savedState.categories);
            
            if (savedState.manualOverrides) {
                const migrated: Record<string, LearnedRule> = {};
                const loaded = savedState.manualOverrides as any;
                for (const key in loaded) {
                    if (Array.isArray(loaded[key])) {
                        migrated[key] = { tags: loaded[key], count: 1 };
                    } else {
                        migrated[key] = loaded[key];
                    }
                }
                setManualOverrides(migrated);
            }

            if (savedState.plugins) {
                currentPlugins = currentPlugins.map(p => {
                    const saved = savedState.plugins.find((sp: any) => sp.name === p.name); 
                    if (saved) {
                        return { 
                            ...p, 
                            tags: saved.tags || [], 
                            category: saved.category || null,
                            status: (saved.tags && saved.tags.length > 0) ? 'categorized' : 'pending' 
                        };
                    }
                    return p;
                });
            }
        }

        setPlugins(currentPlugins);
        resolveDuplicates(currentPlugins);

        if (!key) addLog('Running in Manual Mode (AI features disabled)', 'warning');
    } catch (err) {
        addLog(`Scan failed: ${err}`, 'error');
        setProgress(undefined);
    }
  };

  const normalizeName = (name: string) => {
      return name
        .replace(/(\s*\(\d+\)$)|(_\d+$)|(\s+copy$)/gi, '') 
        .replace(/([_-\s]?(x64|x86|vst[23]?|\d{1,2}bit))/gi, '') 
        .replace(/[^a-zA-Z0-9]/g, '') 
        .toLowerCase();
  };

  const resolveDuplicates = async (currentPlugins: Plugin[]) => {
      addLog('Resolving duplicates (Best Content + Best Name)...', 'info');
      
      const updates: { id: string, isDuplicate: boolean, newName?: string }[] = [];
      const handledIds = new Set<string>();

      const groupAndProcess = (map: Map<string, Plugin[]>, type: 'Hash' | 'Identity') => {
        for (const [key, list] of map) {
            if (list.length > 1) {
                const sortedByDate = [...list].sort((a, b) => b.dateModified - a.dateModified);
                const bestContentPlugin = sortedByDate[0];

                const sortedByName = [...list].sort((a, b) => {
                    const aClean = a.name.replace(/[(_]\d+[)]?$/g, '').length;
                    const bClean = b.name.replace(/[(_]\d+[)]?$/g, '').length;
                    if (aClean !== bClean) return aClean - bClean;
                    return a.name.length - b.name.length;
                });
                const bestName = sortedByName[0].name;

                handledIds.add(bestContentPlugin.id);
                
                const needsRename = bestContentPlugin.name !== bestName;
                updates.push({ 
                    id: bestContentPlugin.id, 
                    isDuplicate: false,
                    newName: needsRename ? bestName : undefined
                });
                
                for (const p of list) {
                    if (p.id !== bestContentPlugin.id) {
                        handledIds.add(p.id);
                        updates.push({ id: p.id, isDuplicate: true });
                    }
                }
            }
        }
      };

      const byHash = new Map<string, Plugin[]>();
      currentPlugins.forEach(p => {
          if (!p.contentHash || p.contentHash === 'empty' || p.contentHash === 'read-error-0') return;
          const list = byHash.get(p.contentHash) || [];
          list.push(p);
          byHash.set(p.contentHash, list);
      });
      groupAndProcess(byHash, 'Hash');

      const byIdentity = new Map<string, Plugin[]>();
      currentPlugins.forEach(p => {
          if (handledIds.has(p.id)) return;
          const norm = normalizeName(p.name);
          if (!norm) return;
          const list = byIdentity.get(norm) || [];
          list.push(p);
          byIdentity.set(norm, list);
      });
      groupAndProcess(byIdentity, 'Identity');

      setPlugins(prev => prev.map(p => {
          const update = updates.find(u => u.id === p.id);
          if (update) {
              return { 
                  ...p, 
                  isDuplicate: update.isDuplicate,
                  name: update.newName || p.name 
              };
          }
          return p;
      }));
  };

  const processScanResults = (files: any[]) => {
      const pluginsMap = new Map<string, Plugin>();
      const assetsMap = new Map<string, any[]>();
      let leftoverList: LeftoverFile[] = [];

      files.forEach(file => {
          if (file.kind !== 'file') return;
          const name = file.name;
          const ext = name.split('.').pop()?.toLowerCase();
          const baseName = name.substring(0, name.lastIndexOf('.'));
          const relativeDir = file.path.substring(0, file.path.lastIndexOf('/'));
          const key = `${relativeDir}/${baseName}`;

          if (ext === 'fst') {
              pluginsMap.set(key, {
                  id: file.path,
                  name: baseName,
                  normalizedName: normalizeName(baseName),
                  filename: name,
                  path: file.path,
                  category: null,
                  tags: [],
                  assets: [],
                  status: 'pending',
                  fileSize: 0, 
                  contentHash: '',
                  dateModified: 0,
                  handle: file.handle,
                  parentHandle: file.parent 
              });
          } else if (ext === 'png' || ext === 'nfo') {
              const current = assetsMap.get(key) || [];
              current.push({ filename: name, type: ext, handle: file.handle, parentHandle: file.parent, path: file.path });
              assetsMap.set(key, current);
          } else {
              leftoverList.push({ path: file.path, handle: file.handle, parentHandle: file.parent });
          }
      });

      const plugins: Plugin[] = [];
      pluginsMap.forEach((plugin, key) => {
          if (assetsMap.has(key)) {
              plugin.assets = assetsMap.get(key)!;
              assetsMap.delete(key);
          }
          plugins.push(plugin);
      });

      assetsMap.forEach((assets) => {
          assets.forEach(asset => {
              leftoverList.push({ path: asset.path, handle: asset.handle, parentHandle: asset.parentHandle });
          });
      });
      
      return { plugins, leftovers: leftoverList };
  };

  const updateSetting = (key: keyof AppSettings, value: boolean) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const learnOverride = (pluginName: string, tags: string[]) => {
      const norm = normalizeName(pluginName);
      if (!norm) return;

      setManualOverrides(prev => {
          const existing = prev[norm];
          const tagsMatch = existing && existing.tags.slice().sort().join(',') === tags.slice().sort().join(',');
          
          if (tagsMatch) {
              return { ...prev, [norm]: { tags, count: existing.count + 1 } };
          } else {
              return { ...prev, [norm]: { tags, count: 1 } };
          }
      });
  };

  const handleClearRule = (normalizedName: string) => {
      setManualOverrides(prev => {
          const next = { ...prev };
          delete next[normalizedName];
          return next;
      });
      addLog(`Forgot rule for "${normalizedName}"`, 'info');
  };

  const handleUpdatePlugin = (id: string, updates: Partial<Plugin>) => {
    setPlugins(prev => prev.map(p => {
        if (p.id === id) {
            if (updates.tags) learnOverride(p.name, updates.tags);
            return { ...p, ...updates };
        }
        return p;
    }));
  };

  const handleToggleDuplicate = (id: string) => {
    setPlugins(prev => prev.map(p => {
        if (p.id === id) {
            const newIsDuplicate = !p.isDuplicate;
            return { ...p, isDuplicate: newIsDuplicate };
        }
        return p;
    }));
  };

  const handleBulkUpdatePlugins = (ids: Set<string>, updates: Partial<Plugin>) => {
      setPlugins(prev => prev.map(p => {
          if (ids.has(p.id)) {
              if (updates.tags) learnOverride(p.name, updates.tags);
              return { ...p, ...updates };
          }
          return p;
      }));
  };

  const handleRenameCategory = (oldName: string) => {
     const newName = prompt(`Rename category "${oldName}" to:`, oldName);
     if (newName && newName !== oldName && newName.trim() !== '') {
         // Sanitize category name: remove special characters that could cause issues
         const cleanName = newName.trim().replace(/[<>:"\/\\|?*\x00-\x1F]/g, '');
         
         if (cleanName === '') {
            addLog('Invalid category name: contains only special characters', 'error');
            return;
         }
         
         // Check for duplicate category names
         if (categories.some(c => c.toLowerCase() === cleanName.toLowerCase() && c !== oldName)) {
            addLog('Category name already exists', 'error');
            return;
         }
         
         setCategories(prev => prev.map(c => c === oldName ? cleanName : c));
         setPlugins(prev => prev.map(p => {
             if (p.tags.includes(oldName)) {
                 const newTags = p.tags.map(t => t === oldName ? cleanName : t);
                 const newCategory = p.category === oldName ? cleanName : p.category;
                 learnOverride(p.name, newTags);
                 return { ...p, tags: newTags, category: newCategory };
             }
             return p;
         }));
         addLog(`Renamed category "${oldName}" to "${cleanName}"`, 'action');
     }
  };

  const handleDropPlugin = (pluginId: string, category: string) => {
      const updatePluginTags = (p: Plugin, newCat: string) => {
          if (!p.tags.includes(newCat)) {
             const newTags = [newCat, ...p.tags];
             learnOverride(p.name, newTags);
             return { ...p, tags: newTags, category: newCat };
          }
          return p;
      };

      if (selectedPluginIds.has(pluginId)) {
          setPlugins(prev => prev.map(p => {
              if (selectedPluginIds.has(p.id)) return updatePluginTags(p, category);
              return p;
          }));
          addLog(`Moved ${selectedPluginIds.size} plugins to ${category}`, 'action');
      } else {
          setPlugins(prev => prev.map(p => {
              if (p.id === pluginId) return updatePluginTags(p, category);
              return p;
          }));
          addLog(`Moved plugin to ${category}`, 'action');
      }
  };

  const handleSaveCategories = (newCats: string[]) => {
    setCategories(newCats);
    addLog(`Updated categories list. Total: ${newCats.length}`, 'success');
  };

  const handleAnalyze = async () => {
    // If we are currently analyzing, clicking the button again means STOP
    if (isAnalyzing) {
        stopAnalysisRef.current = true;
        // Don't wait for loop to break, immediately update state
        setIsAnalyzing(false);
        setAnalysisStatusText(undefined);
        setProgress(undefined);
        addLog("Analysis stopped by user.", 'warning');
        return;
    }

    if (!apiKey) {
         addLog("Cannot analyze without API Key.", 'error');
         return;
    }
    
    // START ANALYSIS
    setIsAnalyzing(true);
    stopAnalysisRef.current = false;
    addLog('Starting Analysis...', 'info');

    let targetIds = new Set<string>();
    if (selectedPluginIds.size > 0) {
        targetIds = selectedPluginIds;
    } else {
        plugins.forEach(p => targetIds.add(p.id));
    }
    
    // 1. Apply Learned Rules
    const MEMORY_THRESHOLD = 2;
    let memoryHitCount = 0;
    
    setPlugins(prev => prev.map(p => {
        if (targetIds.has(p.id) && !p.isDuplicate) {
            const norm = normalizeName(p.name);
            const rule = manualOverrides[norm];
            if (rule && rule.count >= MEMORY_THRESHOLD) {
                memoryHitCount++;
                const tags = rule.tags;
                return { ...p, tags: tags, category: tags[0], status: 'categorized' };
            }
        }
        return p;
    }));

    if (memoryHitCount > 0) addLog(`Applied ${memoryHitCount} learned preferences (Confidence >= ${MEMORY_THRESHOLD}).`, 'success');

    // 2. Identify plugins needing AI
    const pluginsForAI = plugins.filter(p => {
        const isTarget = targetIds.has(p.id);
        const norm = normalizeName(p.name);
        const rule = manualOverrides[norm];
        const hasStrongMemory = rule && rule.count >= MEMORY_THRESHOLD;
        const alreadyCategorized = p.tags.length > 0; 
        return isTarget && !p.isDuplicate && !hasStrongMemory && !alreadyCategorized;
    });

    if (pluginsForAI.length > 0) {
         // Mark status
         setPlugins(prev => prev.map(p => pluginsForAI.find(ai => ai.id === p.id) ? { ...p, status: 'analyzing' } : p));
         
         const chunkSize = 15;
         const retryQueue: Plugin[] = [];
     
         for (let i = 0; i < pluginsForAI.length; i += chunkSize) {
             if (stopAnalysisRef.current) break;
     
             const chunk = pluginsForAI.slice(i, i + chunkSize);
             const names = chunk.map(p => p.name);
             
             try {
                 // Cooldown logic
                 if (i > 0) {
                     for (let s = 40; s > 0; s--) {
                         if (stopAnalysisRef.current) break;
                         if (s % 10 === 0) setAnalysisStatusText(`Cooldown (${s/10}s)`);
                         await new Promise(r => setTimeout(r, 100));
                     }
                 }
                 if (stopAnalysisRef.current) break;

                 const currentCount = i + chunk.length;
                 setAnalysisStatusText(`Processing ${currentCount} of ${pluginsForAI.length}`);
                 setProgress({ current: currentCount, total: pluginsForAI.length, label: 'AI Analysis' });
                 
                 const batchResults = await categorizeBatch(names, categories, settings.multiTag, false);
                 
                 if (stopAnalysisRef.current) break;

                 setPlugins(prev => prev.map(p => {
                     const tags = batchResults[p.name];
                     if (chunk.find(c => c.id === p.id)) {
                         if (tags && tags.length > 0) {
                             return { ...p, status: 'categorized', tags: tags, category: tags[0] };
                         }
                     }
                     return p;
                 }));
     
                 chunk.forEach(p => {
                     if (!batchResults[p.name]) retryQueue.push(p);
                 });
     
             } catch (e) {
                 console.error("Batch error", e);
                 setPlugins(prev => prev.map(p => chunk.find(c => c.id === p.id) ? { ...p, status: 'error' } : p));
             }
         }
     
         // Retry Logic
         if (retryQueue.length > 0 && !stopAnalysisRef.current) {
             addLog(`Retrying ${retryQueue.length} items with relaxed rules...`, 'warning');
             
             for (let i = 0; i < retryQueue.length; i += chunkSize) {
                 if (stopAnalysisRef.current) break;
                 
                 const chunk = retryQueue.slice(i, i + chunkSize);
                 const names = chunk.map(p => p.name);
     
                 try {
                     for (let s = 40; s > 0; s--) {
                         if (stopAnalysisRef.current) break;
                         if (s % 10 === 0) setAnalysisStatusText(`Retry Cooldown (${s/10}s)`);
                         await new Promise(r => setTimeout(r, 100));
                     }
                     if (stopAnalysisRef.current) break;

                     setAnalysisStatusText('Retrying...');
                     
                     const batchResults = await categorizeBatch(names, categories, settings.multiTag, true);
                     
                     if (stopAnalysisRef.current) break;

                     setPlugins(prev => prev.map(p => {
                         if (chunk.find(c => c.id === p.id)) {
                             const tags = batchResults[p.name];
                             if (tags && tags.length > 0) {
                                 return { ...p, status: 'categorized', tags: tags, category: tags[0] };
                             } else {
                                 return { ...p, status: 'pending', category: null, tags: [] };
                             }
                         }
                         return p;
                     }));
     
                 } catch (e) {
                      setPlugins(prev => prev.map(p => chunk.find(c => c.id === p.id) ? { ...p, status: 'error' } : p));
                 }
             }
         }
    } else if (pluginsForAI.length === 0 && memoryHitCount === 0) {
        addLog("No unique, unclassified plugins found to analyze.", 'warning');
    }

    // Cleanup
    if (!stopAnalysisRef.current) {
        setIsAnalyzing(false);
        setProgress(undefined);
        setAnalysisStatusText(undefined);
        addLog("Analysis process complete.", 'success');
        
        if (settings.autoExecute) {
            handleExecute();
        }
    }
  };

  const handleExecute = async () => {
    if (isMoving || !currentFolderHandle) return;
    setIsMoving(true);
    addLog('Initializing File Operations...', 'action');
    
    try {
        await fileSystemService.executeFileOperations(
            currentFolderHandle,
            plugins,
            leftovers,
            settings,
            (msg) => addLog(msg, 'info')
        );
        addLog('Organization Complete! Database is clean.', 'success');
        setCanUndo(true);
        
        addLog('Refreshing view...', 'info');
        const allFiles = await fileSystemService.scanAllFiles(currentFolderHandle);
        const { plugins: parsedPlugins, leftovers: parsedLeftovers } = processScanResults(allFiles);
        setPlugins(parsedPlugins);
        setLeftovers(parsedLeftovers);
        
        setProgress({ current: 0, total: parsedPlugins.length, label: 'Re-hashing' });
        const hashedPlugins = await fileSystemService.generateHashes(parsedPlugins, (curr, total) => {
            setProgress({ current: curr, total, label: 'Re-hashing' });
        });
        setPlugins(hashedPlugins);
        setProgress(undefined);
        
        resolveDuplicates(hashedPlugins);

    } catch (e) {
        addLog(`Critical Error: ${e}`, 'error');
        setProgress(undefined);
    }

    setIsMoving(false);
  };

  const handleUndo = async () => {
      if (!currentFolderHandle || isMoving) return;
      if (!confirm("Confirm Revert: This will move files back to their original locations based on the last run. Proceed?")) return;

      setIsMoving(true);
      addLog("Starting Reversal Process...", 'action');
      try {
          await fileSystemService.revertOperations(currentFolderHandle, (msg) => addLog(msg, 'info'));
          addLog("Revert Complete.", 'success');
          setCanUndo(false);
          
          const allFiles = await fileSystemService.scanAllFiles(currentFolderHandle);
          const { plugins: parsedPlugins, leftovers: parsedLeftovers } = processScanResults(allFiles);
          setPlugins(parsedPlugins);
          setLeftovers(parsedLeftovers);
          
          const hashedPlugins = await fileSystemService.generateHashes(parsedPlugins, () => {});
          setPlugins(hashedPlugins);
          resolveDuplicates(hashedPlugins);
      } catch (e) {
          addLog(`Revert Failed: ${e}`, 'error');
      }
      setIsMoving(false);
  };

  const handleFlatten = async () => {
      if (!currentFolderHandle || isMoving) return;
      if (!confirm("This will move ALL plugins to the root folder. This destroys your current folder structure. Continue?")) return;
      
      setIsMoving(true);
      addLog("Flattening library...", "action");
      try {
          await fileSystemService.flattenLibrary(
              currentFolderHandle, 
              plugins, 
              leftovers, 
              (msg) => addLog(msg, 'info')
          );
          
          addLog("Library Flattened.", "success");
          setCanUndo(true);
          
          const allFiles = await fileSystemService.scanAllFiles(currentFolderHandle);
          const { plugins: parsedPlugins, leftovers: parsedLeftovers } = processScanResults(allFiles);
          setPlugins(parsedPlugins);
          setLeftovers(parsedLeftovers);
          
          const hashedPlugins = await fileSystemService.generateHashes(parsedPlugins, () => {});
          setPlugins(hashedPlugins);
          resolveDuplicates(hashedPlugins);

      } catch(e) {
          addLog(`Flatten failed: ${e}`, 'error');
      }
      setIsMoving(false);
  };

  const handleMultiSelect = useCallback((id: string | null, modifier: 'shift' | 'ctrl' | 'none') => {
      if (id === null) {
          setSelectedPluginIds(new Set());
          return;
      }

      setSelectedPluginIds(prev => {
          const newSet = new Set(prev);
          if (modifier === 'ctrl') {
              if (newSet.has(id)) newSet.delete(id);
              else newSet.add(id);
          } else if (modifier === 'shift') {
              newSet.add(id);
          } else {
              if (newSet.has(id) && newSet.size === 1) {
                  newSet.clear();
              } else {
                  newSet.clear();
                  newSet.add(id);
              }
          }
          return newSet;
      });
  }, []);

  const handleContextMenu = useCallback((e: React.MouseEvent, plugin: Plugin) => {
      e.preventDefault();
      // If right-clicked item is not in selection, select only it
      if (!selectedPluginIds.has(plugin.id)) {
          setSelectedPluginIds(new Set([plugin.id]));
      }
      setContextMenu({ x: e.clientX, y: e.clientY, plugin });
  }, [selectedPluginIds]);

  const handleContextAction = (action: 'duplicate' | 'rename' | 'tag', value?: string) => {
      if (!contextMenu) return;
      const { plugin } = contextMenu;

      // Ensure operation applies to all selected if the context item is part of selection
      const targetIds = selectedPluginIds.has(plugin.id) ? selectedPluginIds : new Set([plugin.id]);

      if (action === 'duplicate') {
          // Toggle relative to the specific item clicked, but apply to all selected
          const newStatus = !plugin.isDuplicate;
          handleBulkUpdatePlugins(targetIds, { isDuplicate: newStatus });
          addLog(`${newStatus ? 'Marked' : 'Restored'} ${targetIds.size} plugins as duplicate/trash.`, 'action');
      }
      else if (action === 'rename') {
          setSelectedPluginIds(new Set([plugin.id]));
          addLog(`Selected ${plugin.name} for renaming. Use Inspector panel.`, 'info');
      }
      else if (action === 'tag' && value) {
           setPlugins(prev => prev.map(p => {
               if (targetIds.has(p.id)) {
                   if (!p.tags.includes(value)) {
                       const newTags = [value, ...p.tags];
                       learnOverride(p.name, newTags);
                       return { ...p, tags: newTags, category: value, status: 'categorized' };
                   }
               }
               return p;
           }));
           addLog(`Categorized ${targetIds.size} plugins as "${value}".`, 'action');
      }

      setContextMenu(null);
  };

  const filteredPlugins = useMemo(() => {
    let list = plugins;

    if (statusFilter !== 'all') {
        list = list.filter(p => {
            if (statusFilter === 'uncategorized') return (!p.category || p.category === 'Uncategorized');
            if (statusFilter === 'duplicates') return p.isDuplicate;
            if (statusFilter === 'analyzed') return p.status === 'categorized';
            if (statusFilter === 'error') return p.status === 'error';
            return true;
        });
    }

    list = list.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
      let matchesCategory = true;
      
      // Sidebar "Uncategorized" selection now maps to this filter logic, but we handle explicit Sidebar clicks here
      if (selectedCategoryFilter === 'Uncategorized') {
          matchesCategory = (!p.category || p.category === 'Uncategorized');
      } else if (selectedCategoryFilter) {
          matchesCategory = p.tags.includes(selectedCategoryFilter);
      }
      return matchesSearch && matchesCategory;
    });

    return list.sort((a, b) => {
        switch (sortOption) {
            case 'name_asc': return a.name.localeCompare(b.name);
            case 'name_desc': return b.name.localeCompare(a.name);
            case 'date_new': return b.dateModified - a.dateModified;
            case 'date_old': return a.dateModified - b.dateModified;
            default: return 0;
        }
    });

  }, [plugins, searchQuery, selectedCategoryFilter, sortOption, statusFilter]);

  // Handle Sidebar selection syncing with Header Status Filter where appropriate
  const handleSelectCategory = (cat: string | null) => {
      setSelectedCategoryFilter(cat);
      // If user clicks a specific category, reset general status filter to show valid results
      if (cat) {
          setStatusFilter('all');
      }
  };

  // Sync Header Status Filter changes to clear Sidebar selection if conflicting
  const handleSetStatusFilter = (f: StatusFilter) => {
      setStatusFilter(f);
      if (f !== 'all') {
          setSelectedCategoryFilter(null);
      }
  };

  useEffect(() => {
      const handleGlobalKey = (e: KeyboardEvent) => {
          if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) return;

          if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
              e.preventDefault();
              setSelectedPluginIds(new Set(filteredPlugins.map(p => p.id)));
              addLog(`Selected all ${filteredPlugins.length} visible items.`, 'info');
          }

          if (e.key === 'Escape') {
              e.preventDefault();
              setSelectedPluginIds(new Set());
              setContextMenu(null);
          }

          if (e.key === 'Delete' || e.key === 'Backspace') {
              if (selectedPluginIds.size > 0) {
                  e.preventDefault();
                  handleBulkUpdatePlugins(selectedPluginIds, { isDuplicate: true }); 
                  addLog(`Marked ${selectedPluginIds.size} items as duplicates/trash.`, 'action');
              }
          }
      };

      window.addEventListener('keydown', handleGlobalKey);
      return () => window.removeEventListener('keydown', handleGlobalKey);
  }, [filteredPlugins, selectedPluginIds]);

  const counts = useMemo(() => {
      const c: Record<string, number> = {};
      plugins.forEach(p => {
          p.tags.forEach(t => {
              c[t] = (c[t] || 0) + 1;
          });
      });
      return c;
  }, [plugins]);

  const primaryCounts = useMemo(() => {
      const c: Record<string, number> = {};
      plugins.forEach(p => {
          if (p.category) {
              c[p.category] = (c[p.category] || 0) + 1;
          }
      });
      return c;
  }, [plugins]);

  const uncategorizedCount = useMemo(() => {
      return plugins.filter(p => !p.category || p.category === 'Uncategorized').length;
  }, [plugins]);

  if (!currentFolderHandle) {
    return <StartScreen onStart={handleStart} />;
  }

  return (
    <div className="h-screen w-screen flex flex-col bg-slate-950 overflow-hidden text-slate-200 font-sans selection:bg-orange-500/30 text-sm">
      
      <CategoryEditor 
        isOpen={isCategoryEditorOpen}
        onClose={() => setIsCategoryEditorOpen(false)}
        categories={categories}
        onSave={handleSaveCategories}
        samplePlugins={plugins}
        hasApiKey={!!apiKey}
      />
      
      <WikiModal 
        isOpen={isWikiOpen}
        onClose={() => setIsWikiOpen(false)}
      />

      {contextMenu && (
          <ContextMenu 
            {...contextMenu}
            pluginId={contextMenu.plugin.id}
            pluginName={contextMenu.plugin.name}
            isDuplicate={!!contextMenu.plugin.isDuplicate}
            categories={categories}
            onClose={() => setContextMenu(null)}
            onAction={handleContextAction}
          />
      )}

      <div className="flex-1 flex overflow-hidden">
        
        <Sidebar 
            categories={categories}
            onEditCategories={() => setIsCategoryEditorOpen(true)}
            onSearch={setSearchQuery}
            searchQuery={searchQuery}
            selectedCategory={selectedCategoryFilter}
            onSelectCategory={handleSelectCategory}
            counts={counts}
            primaryCounts={primaryCounts}
            totalCount={plugins.length}
            uncategorizedCount={uncategorizedCount}
            onOpenWiki={() => setIsWikiOpen(true)}
            onDropPlugin={handleDropPlugin}
            onRenameCategory={handleRenameCategory}
        />

        <div className="flex-1 flex flex-col min-w-0 bg-slate-900 relative border-r border-slate-800">
          <Header 
            pluginCount={filteredPlugins.length}
            viewMode={viewMode}
            setViewMode={setViewMode}
            onAnalyze={handleAnalyze}
            onMove={handleExecute}
            isAnalyzing={isAnalyzing}
            statusText={analysisStatusText}
            isMoving={isMoving}
            selectedFolder={currentFolderHandle.name}
            onChangeFolder={() => setCurrentFolderHandle(null)}
            progress={progress}
            sortOption={sortOption}
            setSortOption={setSortOption}
            statusFilter={statusFilter}
            setStatusFilter={handleSetStatusFilter}
            zoomLevel={zoomLevel}
            setZoomLevel={setZoomLevel}
          />
          {canUndo && (
              <div className="bg-slate-800 border-b border-slate-700 px-4 py-2 flex items-center justify-between">
                  <span className="text-xs text-slate-400">Organization complete. You can revert changes if the result is unexpected.</span>
                  <button 
                    onClick={handleUndo}
                    disabled={isMoving}
                    className="text-xs bg-slate-700 hover:bg-slate-600 text-white px-3 py-1 rounded border border-slate-600 flex items-center gap-2"
                  >
                      Revert Changes
                  </button>
              </div>
          )}
          <PluginGrid 
            plugins={filteredPlugins} 
            viewMode={viewMode} 
            selectedPluginIds={selectedPluginIds}
            onSelectPlugin={handleMultiSelect}
            onToggleDuplicate={handleToggleDuplicate}
            onContextMenu={handleContextMenu}
            zoomLevel={zoomLevel}
          />
          <Console logs={logs} isOpen={isConsoleOpen} setIsOpen={setIsConsoleOpen} />
        </div>

        <Inspector 
            selectedPlugins={plugins.filter(p => selectedPluginIds.has(p.id))}
            settings={settings} 
            updateSetting={updateSetting}
            categories={categories}
            onUpdatePlugin={handleUpdatePlugin}
            onBulkUpdate={handleBulkUpdatePlugins}
            apiKey={apiKey}
            setApiKey={setApiKey}
            onFlatten={handleFlatten}
            manualOverrides={manualOverrides}
            onClearRule={handleClearRule}
        />
      </div>
    </div>
  );
};

export default App;
