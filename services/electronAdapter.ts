// Electron-compatible file system adapter
// This bridges the gap between File System Access API (web) and Electron's native fs

import { Plugin, LeftoverFile } from '../types';

// Check if we're running in Electron
const isElectron = typeof window !== 'undefined' && window.electron?.isElectron;

export interface ElectronFileHandle {
  type: 'electron';
  path: string;
  name: string;
  isDirectory: boolean;
}

export interface WebFileHandle {
  type: 'web';
  handle: any; // FileSystemFileHandle or FileSystemDirectoryHandle
}

export type UnifiedFileHandle = ElectronFileHandle | WebFileHandle;

/**
 * Unified API for file system operations that works in both Electron and browser
 */
export const unifiedFileSystem = {
  /**
   * Show directory picker dialog
   */
  async showDirectoryPicker(): Promise<UnifiedFileHandle> {
    if (isElectron && window.electron) {
      const result = await window.electron.showOpenDialog({
        properties: ['openDirectory']
      });
      
      if (result.canceled || !result.filePaths.length) {
        throw new Error('Directory selection cancelled');
      }
      
      return {
        type: 'electron',
        path: result.filePaths[0],
        name: result.filePaths[0].split(/[\\/]/).pop() || 'Unknown',
        isDirectory: true
      };
    } else {
      // Use File System Access API
      const handle = await (window as any).showDirectoryPicker({
        mode: 'readwrite'
      });
      
      return {
        type: 'web',
        handle
      };
    }
  },

  /**
   * Read directory contents recursively
   */
  async scanDirectory(dirHandle: UnifiedFileHandle, relativePath: string = ''): Promise<any[]> {
    const files: any[] = [];
    
    if (dirHandle.type === 'electron' && window.electron) {
      const entries = await window.electron.readDirectory(dirHandle.path);
      
      for (const entry of entries) {
        const entryPath = relativePath ? `${relativePath}/${entry.name}` : entry.name;
        
        if (entry.isFile) {
          files.push({
            path: entryPath,
            handle: { type: 'electron', path: entry.path, name: entry.name, isDirectory: false },
            kind: 'file',
            name: entry.name,
            parent: dirHandle
          });
        } else if (entry.isDirectory) {
          const subHandle: ElectronFileHandle = {
            type: 'electron',
            path: entry.path,
            name: entry.name,
            isDirectory: true
          };
          const subFiles = await this.scanDirectory(subHandle, entryPath);
          files.push(...subFiles);
        }
      }
    } else if (dirHandle.type === 'web') {
      // Use File System Access API
      const handle = dirHandle.handle;
      for await (const entry of handle.values()) {
        const entryPath = relativePath ? `${relativePath}/${entry.name}` : entry.name;
        
        if (entry.kind === 'file') {
          files.push({
            path: entryPath,
            handle: entry,
            kind: 'file',
            name: entry.name,
            parent: handle
          });
        } else if (entry.kind === 'directory') {
          const subFiles = await this.scanDirectory({ type: 'web', handle: entry }, entryPath);
          files.push(...subFiles);
        }
      }
    }
    
    return files;
  },

  /**
   * Read file contents
   */
  async readFile(fileHandle: UnifiedFileHandle): Promise<{ buffer: ArrayBuffer; size: number; modified: number }> {
    if (fileHandle.type === 'electron' && window.electron) {
      const result = await window.electron.readFile(fileHandle.path);
      return {
        buffer: new Uint8Array(result.buffer).buffer,
        size: result.size,
        modified: result.modified
      };
    } else if (fileHandle.type === 'web') {
      const file = await fileHandle.handle.getFile();
      return {
        buffer: await file.arrayBuffer(),
        size: file.size,
        modified: file.lastModified
      };
    }
    
    throw new Error('Invalid file handle type');
  },

  /**
   * Write file contents
   */
  async writeFile(dirHandle: UnifiedFileHandle, filename: string, data: ArrayBuffer): Promise<UnifiedFileHandle> {
    if (dirHandle.type === 'electron' && window.electron) {
      const filePath = `${dirHandle.path}/${filename}`;
      await window.electron.writeFile(filePath, Array.from(new Uint8Array(data)));
      return {
        type: 'electron',
        path: filePath,
        name: filename,
        isDirectory: false
      };
    } else if (dirHandle.type === 'web') {
      const fileHandle = await dirHandle.handle.getFileHandle(filename, { create: true });
      const writable = await fileHandle.createWritable();
      await writable.write(data);
      await writable.close();
      return {
        type: 'web',
        handle: fileHandle
      };
    }
    
    throw new Error('Invalid directory handle type');
  },

  /**
   * Delete file
   */
  async deleteFile(dirHandle: UnifiedFileHandle, filename: string): Promise<void> {
    if (dirHandle.type === 'electron' && window.electron) {
      const filePath = `${dirHandle.path}/${filename}`;
      await window.electron.deleteFile(filePath);
    } else if (dirHandle.type === 'web') {
      await dirHandle.handle.removeEntry(filename);
    }
  },

  /**
   * Create directory
   */
  async createDirectory(parentHandle: UnifiedFileHandle, dirName: string): Promise<UnifiedFileHandle> {
    if (parentHandle.type === 'electron' && window.electron) {
      const dirPath = `${parentHandle.path}/${dirName}`;
      await window.electron.createDirectory(dirPath);
      return {
        type: 'electron',
        path: dirPath,
        name: dirName,
        isDirectory: true
      };
    } else if (parentHandle.type === 'web') {
      const dirHandle = await parentHandle.handle.getDirectoryHandle(dirName, { create: true });
      return {
        type: 'web',
        handle: dirHandle
      };
    }
    
    throw new Error('Invalid parent handle type');
  },

  /**
   * Get or create directory by path
   */
  async ensureDirectory(rootHandle: UnifiedFileHandle, path: string): Promise<UnifiedFileHandle> {
    const parts = path.split('/').filter(p => p);
    let currentHandle = rootHandle;
    
    for (const part of parts) {
      currentHandle = await this.createDirectory(currentHandle, part);
    }
    
    return currentHandle;
  },

  /**
   * Check if file exists in directory
   */
  async fileExists(dirHandle: UnifiedFileHandle, filename: string): Promise<boolean> {
    if (dirHandle.type === 'electron' && window.electron) {
      const filePath = `${dirHandle.path}/${filename}`;
      try {
        await window.electron.readFile(filePath);
        return true;
      } catch {
        return false;
      }
    } else if (dirHandle.type === 'web') {
      try {
        await dirHandle.handle.getFileHandle(filename);
        return true;
      } catch {
        return false;
      }
    }
    
    return false;
  }
};
