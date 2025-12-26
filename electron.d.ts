// Type definitions for Electron IPC exposed in preload
export {};

declare global {
  interface Window {
    electron?: {
      isElectron: boolean;
      showOpenDialog: (options: any) => Promise<{ canceled: boolean; filePaths: string[] }>;
      showSaveDialog: (options: any) => Promise<{ canceled: boolean; filePath?: string }>;
      showMessageBox: (options: any) => Promise<{ response: number }>;
      readDirectory: (dirPath: string) => Promise<Array<{ name: string; isFile: boolean; isDirectory: boolean; path: string }>>;
      readFile: (filePath: string) => Promise<{ buffer: number[]; size: number; modified: number }>;
      writeFile: (filePath: string, data: number[]) => Promise<{ success: boolean }>;
      deleteFile: (filePath: string) => Promise<{ success: boolean }>;
      createDirectory: (dirPath: string) => Promise<{ success: boolean }>;
      deleteDirectory: (dirPath: string) => Promise<{ success: boolean }>;
      getAppPath: () => Promise<string>;
      onMenuOpenFolder: (callback: () => void) => void;
    };
  }
}
