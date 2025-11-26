import { ipcMain, app, dialog, clipboard, shell } from 'electron'
import { autoUpdater } from 'electron-updater'
import * as fs from 'fs/promises'

const mainIpcMain = (win) => {
  // ==================== 窗口操作 ====================
  ipcMain.on('window-min', (ev) => {
    ev.preventDefault()
    win.minimize()
  })

  ipcMain.on('window-maxOrRestore', (ev) => {
    const winSizeState = win.isMaximized()
    winSizeState ? win.restore() : win.maximize()
    ev.reply('windowState', win.isMaximized())
  })

  ipcMain.on('window-restore', () => {
    win.restore()
  })

  ipcMain.on('window-hide', () => {
    win.hide()
  })

  ipcMain.on('window-close', () => {
    win.close()
    // @ts-ignore
    app.isQuitting = true
    app.quit()
  })

  ipcMain.on('window-resize', (_, data) => {
    if (data.resize) {
      win.setResizable(true)
    } else {
      win.setSize(1180, 720)
      win.setResizable(false)
    }
  })

  ipcMain.on('open-devtools', () => {
    win.webContents.openDevTools()
  })

  // ==================== 更新检查 ====================
  ipcMain.on('check-update', () => {
    autoUpdater.checkForUpdates()
  })

  // ==================== 通用工具 ====================
  ipcMain.handle('show-message', (event, args) => {
    event.sender.send('show-message', args)
  })

  // 复制到剪贴板
  ipcMain.handle('copyData', async (_, data) => {
    try {
      clipboard.writeText(data)
      return true
    } catch (error) {
      console.error('复制操作出错：', error)
      return false
    }
  })

  // ==================== 文件系统操作 ====================
  // 选择文件夹
  ipcMain.handle('selectDir', async (_, defaultPath = '') => {
    try {
      const { canceled, filePaths } = await dialog.showOpenDialog({
        title: '选择目录',
        defaultPath: defaultPath || app.getPath('documents'),
        properties: ['openDirectory', 'createDirectory'],
        buttonLabel: '选择文件夹',
      })
      if (!canceled) {
        return filePaths[0]
      }
      return null
    } catch (err) {
      console.error('选择文件夹时发生错误：', err)
      throw err
    }
  })

  // 检查文件是否存在
  ipcMain.handle('checkFileExist', async (_, filePath) => {
    try {
      await fs.access(filePath)
      return true
    } catch {
      return false
    }
  })

  // 在文件管理器中打开
  ipcMain.handle('openInFolder', async (_, path) => {
    try {
      await fs.access(path)
      await shell.showItemInFolder(path)
      return true
    } catch (error) {
      console.error('打开目录时出错：', error)
      return false
    }
  })
}

export default mainIpcMain
