const { app, BrowserWindow } = require('electron');
const path = require('node:path');

// In development we load the Vite dev server; in the packaged app we load the
// built static files from the dist/ directory bundled inside the binary.
const devServerUrl = process.env.VITE_DEV_SERVER_URL;

const createWindow = () => {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    resizable: true,
    backgroundColor: '#1a2218',
    title: 'yk-minecraft',
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  win.setMenuBarVisibility(false);

  if (devServerUrl) {
    win.loadURL(devServerUrl);
  } else {
    win.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
  }
};

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
