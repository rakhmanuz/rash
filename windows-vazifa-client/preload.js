const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('rashVazifa', {
  enterExamLockdown: () => ipcRenderer.invoke('exam-lockdown:enter'),
  exitExamLockdown: () => ipcRenderer.invoke('exam-lockdown:exit'),
})
