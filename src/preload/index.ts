import { contextBridge, ipcRenderer } from 'electron';

export interface ElectronAPI {
  windowControls: {
    minimize: () => Promise<void>;
    close: () => Promise<void>;
    toggleAlwaysOnTop: () => Promise<boolean>;
  };
  window: {
    setPosition: (x: number, y: number) => Promise<void>;
    getPosition: () => Promise<[number, number]>;
  };
}

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  windowControls: {
    minimize: () => ipcRenderer.invoke('window-minimize'),
    close: () => ipcRenderer.invoke('window-close'),
    toggleAlwaysOnTop: () => ipcRenderer.invoke('toggle-always-on-top'),
  },
  window: {
    setPosition: (x: number, y: number) => ipcRenderer.invoke('set-window-position', x, y),
    getPosition: () => ipcRenderer.invoke('get-window-position'),
  },
});

// Type declaration for global window object
declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}