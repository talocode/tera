const { app, BrowserWindow, Menu, shell, ipcMain, nativeImage } = require('electron');
const path = require('path');
const url = require('url');

const TERA_URL = 'https://teraai.chat';
const TERA_SEARCH_URL = 'https://teraai.chat/?q=';

const MAX_CAPTURE_SIZE_BYTES = 10 * 1024 * 1024;
const PRIVATE_IP_PATTERNS = [
  /^https?:\/\/localhost/,
  /^https?:\/\/127\./,
  /^https?:\/\/10\./,
  /^https?:\/\/172\.(1[6-9]|2[0-9]|3[01])\./,
  /^https?:\/\/192\.168\./,
  /^https?:\/\/0\./,
  /^file:\/\//,
];

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
          label: 'Visual Explain (Capture Viewport)',
          accelerator: 'CmdOrCtrl+Shift+V',
          click: () => {
            if (mainWindow && !mainWindow.isDestroyed()) {
              mainWindow.webContents.send('show-visual-context');
            }
          }
        },
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

function isPrivateUrl(pageUrl) {
  return PRIVATE_IP_PATTERNS.some((pattern) => pattern.test(pageUrl));
}

ipcMain.handle('capture-viewport', async (event) => {
  const webContents = event.sender;
  const browserWindow = BrowserWindow.fromWebContents(webContents);
  if (!browserWindow || browserWindow.isDestroyed()) {
    return { ok: false, error: 'no_active_window' };
  }

  const pageUrl = webContents.getURL();
  const pageTitle = webContents.getTitle() || 'Unknown Page';

  if (isPrivateUrl(pageUrl)) {
    return { ok: false, error: 'private_url', url: pageUrl, title: pageTitle };
  }

  try {
    const bounds = webContents.getOwnerBrowserWindow().getBounds();
    const imageSize = { width: bounds.width, height: bounds.height };
    const image = await webContents.capturePage(imageSize);

    if (image.isEmpty()) {
      return { ok: false, error: 'empty_capture', url: pageUrl, title: pageTitle };
    }

    const pngBuffer = image.toPNG();
    if (pngBuffer.length > MAX_CAPTURE_SIZE_BYTES) {
      return {
        ok: false,
        error: 'capture_too_large',
        sizeBytes: pngBuffer.length,
        url: pageUrl,
        title: pageTitle,
      };
    }

    const base64Data = pngBuffer.toString('base64');

    return {
      ok: true,
      screenshot: {
        mimeType: 'image/png',
        data: base64Data,
        width: imageSize.width,
        height: imageSize.height,
        viewportOnly: true,
      },
      url: pageUrl,
      title: pageTitle,
      capturedAt: new Date().toISOString(),
    };
  } catch (err) {
    return { ok: false, error: 'capture_failed', message: err.message, url: pageUrl, title: pageTitle };
  }
});

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
