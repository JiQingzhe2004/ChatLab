import { dialog, app } from 'electron'
import { autoUpdater } from 'electron-updater'
import { platform } from '@electron-toolkit/utils'

let isFirstShow = true
const checkUpdate = (win) => {
  autoUpdater.autoDownload = false // 自动下载
  autoUpdater.autoInstallOnAppQuit = true // 应用退出后自动安装

  // 绕过开发模式更新检测，模拟线上更新（Skip checkForUpdates because application is not packed and dev update config is not forced）
  // Object.defineProperty(app, 'isPackaged', {
  //   get() {
  //     return true
  //   },
  // })

  let showUpdateMessageBox = false
  autoUpdater.on('update-available', (info) => {
    // win.webContents.send('show-message', 'electron:发现新版本')
    if (showUpdateMessageBox) return
    showUpdateMessageBox = true
    dialog
      .showMessageBox({
        title: '发现新版本 v' + info.version,
        message: '发现新版本 v' + info.version,
        detail: '是否立即下载并安装新版本？',
        buttons: ['立即下载', '取消'],
        defaultId: 1,
        cancelId: 2,
        type: 'question',
        noLink: true,
      })
      .then((result) => {
        showUpdateMessageBox = false
        if (result.response === 0) {
          autoUpdater
            .downloadUpdate()
            .then(() => {
              console.log('wait for post download operation')
            })
            .catch((downloadError) => {
              dialog.showErrorBox('客户端下载失败', `err:${downloadError}`)
            })
        }
      })
  })

  // 监听下载进度事件
  autoUpdater.on('download-progress', (progressObj) => {
    console.log(`更新下载进度: ${progressObj.percent}%`)
    win.webContents.send('update-download-progress', progressObj.percent)
  })

  // 下载完成
  autoUpdater.on('update-downloaded', () => {
    dialog
      .showMessageBox({
        title: '下载完成',
        message: '新版本已准备就绪，是否现在安装？',
        buttons: ['安装', platform.isMacOS ? '之后提醒' : '稍后（应用退出后自动安装）'],
        defaultId: 1,
        cancelId: 2,
        type: 'question',
      })
      .then((result) => {
        if (result.response === 0) {
          win.webContents.send('begin-install')
          // @ts-ignore
          app.isQuiting = true
          setTimeout(() => {
            setImmediate(() => {
              autoUpdater.quitAndInstall()
            })
          }, 100)
        }
      })
  })

  // 不需要更新
  autoUpdater.on('update-not-available', (info) => {
    // 客户端打开会默认弹一次，用isFirstShow来控制不弹
    if (isFirstShow) {
      isFirstShow = false
    } else {
      win.webContents.send('show-message', {
        type: 'success',
        message: '已是最新版本',
      })
    }
  })

  // 错误处理
  autoUpdater.on('error', (err, ev) => {
    // 更新出错，其中一步错误都会emit
    console.log('error事件：', err, ev)
    dialog.showErrorBox('遇到错误', `err:${err}, ev:${ev}`)
  })

  // 等待 3 秒再检查更新，确保窗口准备完成，用户进入系统
  setTimeout(() => {
    autoUpdater.checkForUpdatesAndNotify().catch()
  }, 3000)
}

export { checkUpdate }
