import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electron', {
  // Template operations
  getTemplates: () => ipcRenderer.invoke('get-templates'),
  getTemplate: (id: string) => ipcRenderer.invoke('get-template', id),
  saveTemplate: (id: string, content: string) => ipcRenderer.invoke('save-template', id, content),
  deleteTemplate: (id: string) => ipcRenderer.invoke('delete-template', id),

  // FSRS data operations
  getFsrsData: () => ipcRenderer.invoke('get-fsrs-data'),
  getFsrsCard: (id: string) => ipcRenderer.invoke('get-fsrs-card', id),
  saveFsrsCard: (id: string, card: any) => ipcRenderer.invoke('save-fsrs-card', id, card),

  // Practice history operations
  getPracticeHistory: (id: string) => ipcRenderer.invoke('get-practice-history', id),
  savePracticeAttempt: (id: string, attempt: any) => ipcRenderer.invoke('save-practice-attempt', id, attempt),
  getAllPracticeHistory: () => ipcRenderer.invoke('get-all-practice-history'),

  // Menu action listener
  onMenuAction: (callback: (payload: any) => void) => {
    ipcRenderer.on('menu-action', (_event, payload) => callback(payload))
  },

  // Window title
  setWindowTitle: (title: string) => ipcRenderer.invoke('set-window-title', title),
})
