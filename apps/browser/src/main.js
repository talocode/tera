const { app, BrowserWindow, Menu, shell, ipcMain } = require('electron');
const path = require('path');

const TERA_URL = 'https://teraai.chat';
const TERA_SEARCH_URL = 'https://teraai.chat/?q=';

let mainWindow;

function buildTeraSearchUrl(query) {
  return `${TERA_SEARCH_URL}${encodeURIComponent(query)}`;
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    title: 'Tera Browser',
    icon: path.join(__dirname, '..', 'public', 'icon.png'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  mainWindow.loadFile(path.join(__dirname, 'newtab.html'));

  const template = [
    {
      label: 'File',
      submenu: [
        {
          label: 'New Tab',
          accelerator: 'CmdOrCtrl+T',
          click: () => {
            mainWindow.webContents.executeJavaScript(`
              window.location.href = 'newtab.html';
            `);
          }
        },
        { type: 'separator' },
        { role: 'quit' }
      ]
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'selectAll' }
      ]
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    },
    {
      label: 'Tera',
      submenu: [
        {
          label: 'Open Tera',
          click: () => {
            shell.openExternal(TERA_URL);
          }
        },
        {
          label: 'Ask Tera about this page',
          click: () => {
            mainWindow.webContents.executeJavaScript(`
              const title = document.title || 'Unknown Page';
              const url = window.location.href;
              window.location.href = '${TERA_SEARCH_URL}' + encodeURIComponent('Explain this page: ' + title + ' ' + url);
            `);
          }
        },
        {
          label: 'Summarize with Tera',
          click: () => {
            mainWindow.webContents.executeJavaScript(`
              const title = document.title || 'Unknown Page';
              const url = window.location.href;
              window.location.href = '${TERA_SEARCH_URL}' + encodeURIComponent('Summarize this page: ' + title + ' ' + url);
            `);
          }
        },
        {
          label: 'Learn with Tera',
          click: () => {
            mainWindow.webContents.executeJavaScript(`
              const title = document.title || 'Unknown Page';
              const url = window.location.href;
              window.location.href = '${TERA_SEARCH_URL}' + encodeURIComponent('Teach me the key ideas from this page: ' + title + ' ' + url);
            `);
          }
        },
        { type: 'separator' },
        {
          label: 'Tera Search',
          click: () => {
            mainWindow.loadFile(path.join(__dirname, 'newtab.html'));
          }
        }
      ]
    },
    {
      label: 'Window',
      submenu: [
        { role: 'minimize' },
        { role: 'zoom' },
        { type: 'separator' },
        { role: 'front' }
      ]
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'About Tera Browser',
          click: () => {
            shell.openExternal(TERA_URL);
          }
        }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

ipcMain.handle('buildTeraSearchUrl', (event, query) => {
  return buildTeraSearchUrl(query);
});

ipcMain.handle('openTera', () => {
  shell.openExternal(TERA_URL);
});

ipcMain.handle('askTeraAboutPage', (event, title, url) => {
  const query = `Explain this page: ${title} ${url}`;
  shell.openExternal(buildTeraSearchUrl(query));
});

ipcMain.handle('summarizeWithTera', (event, title, url) => {
  const query = `Summarize this page: ${title} ${url}`;
  shell.openExternal(buildTeraSearchUrl(query));
});

ipcMain.handle('learnWithTera', (event, title, url) => {
  const query = `Teach me the key ideas from this page: ${title} ${url}`;
  shell.openExternal(buildTeraSearchUrl(query));
});
