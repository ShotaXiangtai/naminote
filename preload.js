const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('api', {
  saveNote:   (data) => ipcRenderer.invoke('save-note',   data),
  loadLast:   ()     => ipcRenderer.invoke('load-last'),
  listNotes:  ()     => ipcRenderer.invoke('list-notes'),
  loadNote:   (fp)   => ipcRenderer.invoke('load-note',   fp),
  deleteNote: (fp)   => ipcRenderer.invoke('delete-note', fp),
})
