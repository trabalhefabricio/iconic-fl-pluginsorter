
import { Plugin, AppSettings, LeftoverFile, UndoManifest } from '../types';

// Helper to get a file handle from a directory handle by path
async function ensureDirectory(root: any, path: string) {
    const parts = path.split('/');
    let dir = root;
    for (const part of parts) {
        if (!part) continue;
        dir = await dir.getDirectoryHandle(part, { create: true });
    }
    return dir;
}

// Quick Hash: Size + First 4KB CRC/String
// We don't need cryptographic security, just collision resistance for dedupe.
async function calculateQuickHash(fileHandle: any, size: number): Promise<string> {
    try {
        const file = await fileHandle.getFile();
        if (size === 0) return 'empty';
        
        // Read first 4KB
        const chunk = file.slice(0, 4096);
        const buffer = await chunk.arrayBuffer();
        const view = new Uint8Array(buffer);
        
        // Simple DJB2 hash for the chunk
        let hash = 5381;
        for (let i = 0; i < view.length; i++) {
            hash = ((hash << 5) + hash) + view[i]; /* hash * 33 + c */
        }
        
        // Combine with size to be safe
        return `${size}-${hash}`;
    } catch (e) {
        // Return deterministic error so UI doesn't thrash with random keys
        return 'read-error-0';
    }
}

// Find a unique name: "Serum.fst" -> "Serum_2.fst" (FL Studio Style)
async function getUniqueFilename(dirHandle: any, filename: string): Promise<string> {
    try {
        await dirHandle.getFileHandle(filename);
        // If we are here, file exists. Logic to increment.
        const parts = filename.split('.');
        const ext = parts.pop();
        const base = parts.join('.');
        
        let counter = 2;
        const MAX_ITERATIONS = 1000; // Loop Guard

        while (counter < MAX_ITERATIONS) {
            // FL uses _2, _3 style
            const newName = `${base}_${counter}.${ext}`;
            try {
                await dirHandle.getFileHandle(newName);
                counter++;
            } catch (e) {
                return newName; // Found one that doesn't exist
            }
        }
        // Fallback if folder is absurdly full
        return `${base}_${Date.now()}.${ext}`;

    } catch (e) {
        return filename; // Doesn't exist, safe to use
    }
}

export const fileSystemService = {
    // A recursive scanner that returns a flat list of ALL files first
    async scanAllFiles(dirHandle: any, path = '', parentHandle: any = null): Promise<{ path: string, handle: any, kind: 'file' | 'directory', parent: any, name: string }[]> {
        const files: any[] = [];
        // Guard against too much recursion or massive folders
        try {
            for await (const entry of dirHandle.values()) {
                const entryPath = path ? `${path}/${entry.name}` : entry.name;
                if (entry.kind === 'file') {
                    files.push({ path: entryPath, handle: entry, kind: 'file', parent: dirHandle, name: entry.name });
                } else if (entry.kind === 'directory') {
                    const subFiles = await this.scanAllFiles(entry, entryPath, entry);
                    files.push(...subFiles);
                }
            }
        } catch (e) {
            console.warn(`Skipping unreadable directory: ${path}`, e);
        }
        return files;
    },

    async generateHashes(plugins: Plugin[], onProgress: (current: number, total: number) => void): Promise<Plugin[]> {
        const processed: Plugin[] = [];
        let count = 0;
        
        // Process in chunks to avoid UI lock
        const chunkSize = 20;
        for (let i = 0; i < plugins.length; i += chunkSize) {
            const chunk = plugins.slice(i, i + chunkSize);
            const promises = chunk.map(async (p) => {
                const hash = await calculateQuickHash(p.handle, p.fileSize);
                return { ...p, contentHash: hash };
            });
            
            const results = await Promise.all(promises);
            processed.push(...results);
            count += results.length;
            onProgress(count, plugins.length);
            
            // Brief yield
            await new Promise(r => setTimeout(r, 0));
        }
        
        return processed;
    },

    async loadState(rootHandle: any): Promise<any | null> {
        try {
            const fileHandle = await rootHandle.getFileHandle('.iconic-state.json');
            const file = await fileHandle.getFile();
            const text = await file.text();
            return JSON.parse(text);
        } catch (e) {
            return null;
        }
    },

    async saveState(rootHandle: any, plugins: Plugin[], categories: string[], manualOverrides: Record<string, any>) {
        if (!rootHandle) return; // Guard
        try {
            const state = {
                timestamp: Date.now(),
                categories,
                plugins: plugins.map(p => ({
                    id: p.id,
                    name: p.name,
                    tags: p.tags,
                    category: p.category,
                    isDuplicate: p.isDuplicate
                })),
                manualOverrides
            };
            
            const fileHandle = await rootHandle.getFileHandle('.iconic-state.json', { create: true });
            const writable = await fileHandle.createWritable();
            await writable.write(JSON.stringify(state, null, 2));
            await writable.close();
        } catch (e) {
            console.error("Failed to save state", e);
        }
    },

    async saveUndoManifest(rootHandle: any, manifest: UndoManifest) {
        try {
            const fileHandle = await rootHandle.getFileHandle('.iconic-undo.json', { create: true });
            const writable = await fileHandle.createWritable();
            await writable.write(JSON.stringify(manifest, null, 2));
            await writable.close();
        } catch (e) {
            console.error("Failed to save undo manifest", e);
        }
    },

    async loadUndoManifest(rootHandle: any): Promise<UndoManifest | null> {
        try {
            const fileHandle = await rootHandle.getFileHandle('.iconic-undo.json');
            const file = await fileHandle.getFile();
            const text = await file.text();
            return JSON.parse(text);
        } catch (e) {
            return null;
        }
    },

    async revertOperations(rootHandle: any, log: (msg: string) => void) {
        const manifest = await this.loadUndoManifest(rootHandle);
        if (!manifest) throw new Error("No undo record found.");

        log(`Restoring ${manifest.moves.length} files to original locations...`);

        // Reverse operations
        for (const move of manifest.moves) {
            try {
                // 1. Locate current file (where it was moved TO)
                const pathParts = move.newPath.split('/');
                const filename = pathParts.pop();
                const dirPath = pathParts.join('/');
                
                let currentDir = rootHandle;
                if (dirPath) {
                    try {
                        currentDir = await ensureDirectory(rootHandle, dirPath); 
                    } catch { continue; } 
                }

                let fileHandle;
                try {
                    fileHandle = await currentDir.getFileHandle(filename);
                } catch {
                    continue; 
                }

                // 2. Locate Original Folder (Restore destination)
                const origParts = move.originalPath.split('/');
                const origFilename = origParts.pop();
                const origDirPath = origParts.join('/');
                
                const restoreDir = await ensureDirectory(rootHandle, origDirPath);
                
                // 3. Move/Copy back
                const file = await fileHandle.getFile();
                const restoreHandle = await restoreDir.getFileHandle(origFilename, { create: true });
                const writable = await restoreHandle.createWritable();
                await writable.write(file);
                await writable.close();

                // 4. Delete from "Organized" location
                await currentDir.removeEntry(filename);

            } catch (e) {
                console.error("Failed to revert file", move.filename, e);
            }
        }

        await this.cleanEmptyDirectories(rootHandle);
        
        // Remove manifest
        try {
            await rootHandle.removeEntry('.iconic-undo.json');
        } catch {}
    },

    async cleanEmptyDirectories(dirHandle: any): Promise<boolean> {
        let hasContent = false;
        
        // Buffer entries to avoid iterator issues during deletion
        const entries: any[] = [];
        try {
            for await (const entry of dirHandle.values()) {
                entries.push(entry);
            }
        } catch (e) {
            // If we can't read it, assume it has content or is restricted
            return false;
        }

        for (const entry of entries) {
            if (entry.kind === 'file') {
                const name = entry.name.toLowerCase();
                // Files that don't count as "content" for empty check
                // Expanded list to prevent deleting system folders that appear empty
                const ignored = ['.iconic-state.json', '.iconic-undo.json', '.ds_store', 'desktop.ini', 'thumbs.db', '.gitignore'];
                if (!ignored.includes(name)) {
                    hasContent = true;
                }
            } else if (entry.kind === 'directory') {
                const subIsEmpty = await this.cleanEmptyDirectories(entry);
                if (subIsEmpty) {
                    try {
                        // Use recursive: true to nuke .DS_Store etc inside
                        await dirHandle.removeEntry(entry.name, { recursive: true });
                    } catch (e) {
                        hasContent = true; 
                    }
                } else {
                    hasContent = true;
                }
            }
        }
        return !hasContent;
    },

    async flattenLibrary(rootHandle: any, plugins: Plugin[], leftovers: LeftoverFile[], log: (msg: string) => void) {
        log("Flattening library to root...");
        const undoManifest: UndoManifest = {
            timestamp: Date.now(),
            moves: []
        };
        
        // 1. Move Plugins to Root
        for (const p of plugins) {
             try {
                 // Destination is root
                 const sourceFile = await p.handle.getFile();
                 
                 // IMPORTANT: Use the cleaned name (p.name) + extension for target
                 // This ensures "Serum (2).fst" is renamed to "Serum.fst" if p.name was cleaned
                 const ext = p.filename.split('.').pop() || 'fst';
                 const targetNameCandidate = `${p.name}.${ext}`;
                 
                 // Determine unique name in root (in case "Serum.fst" is already there)
                 const targetFilename = await getUniqueFilename(rootHandle, targetNameCandidate);
                 
                 const newFileHandle = await rootHandle.getFileHandle(targetFilename, { create: true });
                 const writable = await newFileHandle.createWritable();
                 await writable.write(sourceFile);
                 await writable.close();
                 
                 undoManifest.moves.push({
                     filename: p.filename,
                     originalPath: p.path,
                     newPath: targetFilename // in root
                 });

                 // Assets
                 for (const asset of p.assets) {
                     try {
                         if (p.parentHandle) {
                             const assetHandle = await p.parentHandle.getFileHandle(asset.filename);
                             const assetFile = await assetHandle.getFile();
                             
                             const assetExt = asset.filename.split('.').pop() || 'png';
                             const dotIndex = targetFilename.lastIndexOf('.');
                             const baseTarget = dotIndex > 0 ? targetFilename.substring(0, dotIndex) : targetFilename;
                             const targetAssetName = `${baseTarget}.${assetExt}`;

                             const newAssetHandle = await rootHandle.getFileHandle(targetAssetName, { create: true });
                             const aw = await newAssetHandle.createWritable();
                             await aw.write(assetFile);
                             await aw.close();
                         }
                     } catch (e) { /* asset missing */ }
                 }

                 // Remove original if valid
                 if (p.parentHandle) {
                     const isRoot = !p.path.includes('/');
                     if (!isRoot) {
                         await p.parentHandle.removeEntry(p.filename).catch(() => {});
                         for (const asset of p.assets) {
                             await p.parentHandle.removeEntry(asset.filename).catch(() => {});
                         }
                     }
                 }

             } catch (e) {
                 log(`Failed to flatten ${p.name}: ${e}`);
             }
        }

        // 2. Move Leftovers to _Unused_Assets (to ensure folders can be cleaned)
        if (leftovers.length > 0) {
            log(`Moving ${leftovers.length} non-plugin files to _Unused_Assets...`);
            const unusedDir = await ensureDirectory(rootHandle, '_Unused_Assets');
            for (const file of leftovers) {
                 // Skip if already in root
                 if (!file.path.includes('/')) continue;

                 try {
                     const f = await file.handle.getFile();
                     const targetName = await getUniqueFilename(unusedDir, f.name);
                     
                     const newHandle = await unusedDir.getFileHandle(targetName, { create: true });
                     const w = await newHandle.createWritable();
                     await w.write(f);
                     await w.close();
                     
                     undoManifest.moves.push({
                         filename: f.name,
                         originalPath: file.path,
                         newPath: `_Unused_Assets/${targetName}`
                     });

                     if (file.parentHandle) {
                         await file.parentHandle.removeEntry(f.name).catch(() => {});
                     }
                 } catch (e) {
                     // console.warn("Could not move leftover", file.path);
                 }
            }
        }

        await this.saveUndoManifest(rootHandle, undoManifest);
        log("Cleaning up empty directories...");
        await this.cleanEmptyDirectories(rootHandle);
    },

    async executeFileOperations(
        rootHandle: any,
        plugins: Plugin[],
        leftovers: LeftoverFile[],
        settings: AppSettings,
        log: (msg: string) => void
    ) {
        log("Starting Disk Operations...");
        const undoManifest: UndoManifest = {
            timestamp: Date.now(),
            moves: []
        };

        // 1. Process Plugins
        for (const p of plugins) {
            const categories = (p.tags && p.tags.length > 0) ? p.tags : ['Uncategorized'];
            const targets = settings.multiTag ? categories : [categories[0]];

            // Handle Duplicates
            if (settings.deduplicate && p.isDuplicate) {
                log(`Deleting duplicate: ${p.filename}`);
                try {
                    if (p.parentHandle) {
                        await p.parentHandle.removeEntry(p.filename);
                        for (const asset of p.assets) {
                            await p.parentHandle.removeEntry(asset.filename).catch(() => {});
                        }
                    }
                } catch (e) {
                    log(`Failed to delete ${p.name}: ${e}`);
                }
                continue;
            }

            let mainFileMoved = false;

            for (let i = 0; i < targets.length; i++) {
                const targetCat = targets[i];
                const destDir = await ensureDirectory(rootHandle, targetCat);
                
                try {
                     const sourceFile = await p.handle.getFile();
                     
                     // IMPORTANT: Use p.name for cleaner filenames (Removing suffixes, etc)
                     const ext = p.filename.split('.').pop() || 'fst';
                     const targetNameCandidate = `${p.name}.${ext}`;
                     
                     const targetFilename = await getUniqueFilename(destDir, targetNameCandidate);
                     
                     const newFileHandle = await destDir.getFileHandle(targetFilename, { create: true });
                     const writable = await newFileHandle.createWritable();
                     await writable.write(sourceFile);
                     await writable.close();
                     
                     undoManifest.moves.push({
                         filename: p.filename,
                         originalPath: p.path,
                         newPath: `${targetCat}/${targetFilename}`
                     });

                     for (const asset of p.assets) {
                         try {
                             if (p.parentHandle) {
                                 const assetHandle = await p.parentHandle.getFileHandle(asset.filename);
                                 const assetFile = await assetHandle.getFile();
                                 
                                 const assetExt = asset.filename.split('.').pop() || 'png';
                                 const dotIndex = targetFilename.lastIndexOf('.');
                                 const baseTarget = dotIndex > 0 ? targetFilename.substring(0, dotIndex) : targetFilename;
                                 const targetAssetName = `${baseTarget}.${assetExt}`;

                                 const newAssetHandle = await destDir.getFileHandle(targetAssetName, { create: true });
                                 const aw = await newAssetHandle.createWritable();
                                 await aw.write(assetFile);
                                 await aw.close();
                             }
                         } catch (e) { /* asset missing */ }
                     }

                     mainFileMoved = true;

                } catch (e) {
                    log(`Error processing ${p.name} -> ${targetCat}: ${e}`);
                }
            }
            
            if (mainFileMoved) {
                try {
                     if (p.parentHandle) {
                         await p.parentHandle.removeEntry(p.filename);
                         for (const asset of p.assets) {
                             await p.parentHandle.removeEntry(asset.filename).catch(() => {});
                         }
                     }
                } catch (e) {
                     // Ignore
                }
            }
        }

        // 2. Handle Leftovers
        if (leftovers.length > 0) {
            log(`Moving ${leftovers.length} leftover files to _Unused_Assets...`);
            const unusedDir = await ensureDirectory(rootHandle, '_Unused_Assets');
            for (const file of leftovers) {
                 try {
                     const f = await file.handle.getFile();
                     const targetName = await getUniqueFilename(unusedDir, f.name);
                     
                     const newHandle = await unusedDir.getFileHandle(targetName, { create: true });
                     const w = await newHandle.createWritable();
                     await w.write(f);
                     await w.close();
                     
                     undoManifest.moves.push({
                         filename: f.name,
                         originalPath: file.path,
                         newPath: `_Unused_Assets/${targetName}`
                     });

                     if (file.parentHandle) {
                         await file.parentHandle.removeEntry(f.name);
                     }
                 } catch (e) {
                     console.warn("Could not move leftover", file.path);
                 }
            }
        }

        await this.saveUndoManifest(rootHandle, undoManifest);
        log("Cleaning up empty directories...");
        await this.cleanEmptyDirectories(rootHandle);
    }
};
