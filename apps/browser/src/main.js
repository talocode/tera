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

const CAPTURES_DIR = path.join(app.getPath('userData'), 'captures');
const CAPTURES_FILE = path.join(CAPTURES_DIR, 'captures.json');
const HISTORIES_FILE = path.join(CAPTURES_DIR, 'histories.json');

function ensureCapturesDir() {
  if (!require('fs').existsSync(CAPTURES_DIR)) {
    require('fs').mkdirSync(CAPTURES_DIR, { recursive: true });
  }
}

function readCapturesJson(filePath) {
  try {
    ensureCapturesDir();
    if (!require('fs').existsSync(filePath)) return [];
    const raw = require('fs').readFileSync(filePath, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function writeCapturesJson(filePath, data) {
  try {
    ensureCapturesDir();
    require('fs').writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  } catch {
    return false;
  }
}

const MAX_CAPTURES = 50;
const MAX_HISTORY = 100;

ipcMain.handle('capture:save', (event, capture) => {
  const captures = readCapturesJson(CAPTURES_FILE);
  captures.unshift(capture);
  writeCapturesJson(CAPTURES_FILE, captures.slice(0, MAX_CAPTURES));

  const histories = readCapturesJson(HISTORIES_FILE);
  histories.unshift({
    id: capture.id,
    url: capture.url,
    title: capture.title,
    capturedAt: capture.capturedAt,
    source: capture.source,
    warnings: capture.warnings,
  });
  writeCapturesJson(HISTORIES_FILE, histories.slice(0, MAX_HISTORY));

  return true;
});

ipcMain.handle('capture:get', (event, id) => {
  const captures = readCapturesJson(CAPTURES_FILE);
  return captures.find((c) => c.id === id) || null;
});

ipcMain.handle('capture:history', () => {
  return readCapturesJson(HISTORIES_FILE);
});

ipcMain.handle('capture:remove', (event, id) => {
  let captures = readCapturesJson(CAPTURES_FILE);
  captures = captures.filter((c) => c.id !== id);
  writeCapturesJson(CAPTURES_FILE, captures);

  let histories = readCapturesJson(HISTORIES_FILE);
  histories = histories.filter((h) => h.id !== id);
  writeCapturesJson(HISTORIES_FILE, histories);

  return true;
});

ipcMain.handle('capture:clear', () => {
  writeCapturesJson(CAPTURES_FILE, []);
  writeCapturesJson(HISTORIES_FILE, []);
  return true;
});

ipcMain.handle('capture:getRecent', (event, limit = 10) => {
  const captures = readCapturesJson(CAPTURES_FILE);
  return captures.slice(0, limit);
});

ipcMain.handle('research:capturePageText', async (event) => {
  const webContents = event.sender;
  try {
    const result = await webContents.executeJavaScript(`
      (function() {
        const selectors = ['article', '[role="main"]', 'main', '.content', '#content', 'body'];
        for (const sel of selectors) {
          const el = document.querySelector(sel);
          if (el) {
            const clone = el.cloneNode(true);
            const removals = clone.querySelectorAll('script, style, nav, header, footer, iframe, .ad, .ads, .advertisement, .sidebar, .comment, .comments, .nav, .footer, .header, noscript');
            for (const r of removals) r.remove();
            const text = (clone.textContent || '').trim();
            if (text.length > 200) return text.substring(0, 50000);
          }
        }
        return (document.body ? document.body.textContent : '').trim().substring(0, 50000);
      })()
    `);
    return { ok: true, text: result || '' };
  } catch (err) {
    return { ok: false, error: err.message };
  }
});

ipcMain.handle('research:getPageTitle', async (event) => {
  const webContents = event.sender;
  try {
    const title = await webContents.executeJavaScript('document.title');
    return { ok: true, title: title || '' };
  } catch (err) {
    return { ok: false, error: err.message };
  }
});

ipcMain.handle('research:getPageMeta', async (event) => {
  const webContents = event.sender;
  try {
    const meta = await webContents.executeJavaScript(`
      (function() {
        return {
          title: document.title || '',
          url: window.location.href || '',
          description: (document.querySelector('meta[name="description"]') || {}).content || '',
          headings: Array.from(document.querySelectorAll('h1, h2, h3')).map(function(h) { return h.textContent.trim(); }).filter(Boolean),
          links: Array.from(document.querySelectorAll('a[href]')).map(function(a) { return { text: (a.textContent || '').trim().substring(0, 200), href: a.href }; }).filter(function(l) { return l.text && l.href && !l.href.startsWith('javascript:') && !l.href.startsWith('file:'); }).slice(0, 200)
        };
      })()
    `);
    return { ok: true, ...meta };
  } catch (err) {
    return { ok: false, error: err.message };
  }
});

ipcMain.handle('research:sendToTera', async (event, { url, title, text, mode, selectedText }) => {
  try {
    const response = await fetch('https://teraai.chat/api/browser/context', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        source: 'tera-browser',
        url: url || '',
        title: title || '',
        text: text || '',
        selectedText: selectedText || '',
        mode: mode || 'research',
      }),
    });
    const data = await response.json();
    return { ok: true, response: data };
  } catch (err) {
    return { ok: false, error: err.message };
  }
});

ipcMain.handle('research:summarizeWithTera', async (event, { url, title, text, level }) => {
  const query = level === 'brief'
    ? `Brief summary: ${title || url}`
    : level === 'detailed'
      ? `Detailed summary: ${title || url}`
      : `Key points: ${title || url}`;
  shell.openExternal(buildTeraSearchUrl(`${query}\n\n${(text || '').substring(0, 3000)}`));
  return { ok: true };
});

ipcMain.handle('research:openTeraSearch', (event, query) => {
  shell.openExternal(buildTeraSearchUrl(query));
  return { ok: true };
});
