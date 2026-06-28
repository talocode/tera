const TERA_SEARCH_URL = 'https://teraai.chat/?q=';
const TERA_URL = 'https://teraai.chat';

function buildTeraSearchUrl(query) {
  return `${TERA_SEARCH_URL}${encodeURIComponent(query)}`;
}

document.getElementById('searchForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const query = document.getElementById('searchInput').value.trim();
  if (query) {
    window.location.href = buildTeraSearchUrl(query);
  }
});

document.getElementById('openTera').addEventListener('click', () => {
  window.location.href = TERA_URL;
});

document.getElementById('captureViewport').addEventListener('click', () => {
  document.getElementById('visualContextPanel').classList.remove('vc-hidden');
  document.getElementById('vcLoading').classList.remove('vc-hidden');
  document.getElementById('vcPreview').classList.add('vc-hidden');
  document.getElementById('vcPrivateWarning').classList.add('vc-hidden');
  document.getElementById('vcError').classList.add('vc-hidden');

  window.teraBrowser.captureViewport().then((result) => {
    document.getElementById('vcLoading').classList.add('vc-hidden');

    if (!result.ok) {
      if (result.error === 'private_url') {
        document.getElementById('vcPrivateWarning').classList.remove('vc-hidden');
        return;
      }
      const errEl = document.getElementById('vcError');
      errEl.querySelector('.vc-error-text').textContent =
        result.message || 'Capture failed. Please try again.';
      errEl.classList.remove('vc-hidden');
      return;
    }

    const { screenshot, url: pageUrl, title, capturedAt } = result;

    document.getElementById('vcThumbnail').src =
      `data:${screenshot.mimeType};base64,${screenshot.data}`;
    document.getElementById('vcTitle').textContent = title || 'Unknown Page';
    document.getElementById('vcUrl').textContent = pageUrl;

    const d = new Date(capturedAt);
    document.getElementById('vcTimestamp').textContent = d.toLocaleString(undefined, {
      hour: '2-digit', minute: '2-digit', second: '2-digit', month: 'short', day: 'numeric',
    });
    document.getElementById('vcDimensions').textContent =
      `${screenshot.width} × ${screenshot.height}px`;

    document.getElementById('vcProviderWarning').classList.remove('vc-hidden');
    document.getElementById('vcPreview').classList.remove('vc-hidden');
  });
});

document.getElementById('vcClose').addEventListener('click', () => {
  document.getElementById('visualContextPanel').classList.add('vc-hidden');
});

document.getElementById('vcDiscard').addEventListener('click', () => {
  document.getElementById('visualContextPanel').classList.add('vc-hidden');
});

document.getElementById('vcUse').addEventListener('click', () => {
  const title = document.getElementById('vcTitle').textContent;
  const pageUrl = document.getElementById('vcUrl').textContent;
  window.location.href =
    buildTeraSearchUrl(`Visual explain this page: ${title} ${pageUrl}`);
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    document.getElementById('visualContextPanel').classList.add('vc-hidden');
  }
});

const research = {
  currentCapture: null,
  enabled: false,

  getElements() {
    return {
      panel: document.getElementById('researchPanel'),
      toggle: document.getElementById('researchModeToggle'),
      capturePage: document.getElementById('researchCapturePage'),
      captureSelection: document.getElementById('researchCaptureSelection'),
      summarize: document.getElementById('researchSummarize'),
      sendToTera: document.getElementById('researchSendToTera'),
      saveSource: document.getElementById('researchSaveSource'),
      clearHistory: document.getElementById('researchClearHistory'),
      status: document.getElementById('researchStatus'),
      historyList: document.getElementById('researchHistoryList'),
    };
  },

  showStatus(message, type) {
    const { status } = this.getElements();
    status.textContent = message;
    status.className = 'research-status visible ' + (type || 'info');
  },

  hideStatus() {
    const { status } = this.getElements();
    status.className = 'research-status';
    status.textContent = '';
  },

  setButtonsEnabled(enabled) {
    const els = this.getElements();
    ['capturePage', 'captureSelection', 'summarize', 'sendToTera', 'saveSource'].forEach(function(key) {
      els[key].disabled = !enabled;
    });
  },

  async refreshHistory() {
    const { historyList } = this.getElements();
    try {
      let entries;
      if (window.teraBrowser && window.teraBrowser.getCaptureHistory) {
        entries = await window.teraBrowser.getCaptureHistory();
      } else {
        entries = [];
      }

      if (!entries || entries.length === 0) {
        historyList.innerHTML = '<li class="research-history-empty">No captures yet. Browse a page and use Research Mode.</li>';
        return;
      }

      historyList.innerHTML = '';
      entries.slice(0, 10).forEach(function(entry) {
        var li = document.createElement('li');
        li.className = 'research-history-item';

        var info = document.createElement('div');
        info.className = 'research-history-info';

        var title = document.createElement('div');
        title.className = 'research-history-title';
        title.textContent = entry.title || entry.url || 'Unknown';
        title.title = entry.url || '';

        var meta = document.createElement('div');
        meta.className = 'research-history-meta';
        var d = new Date(entry.capturedAt);
        meta.textContent = d.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) + ' - ' + entry.url;

        info.appendChild(title);
        info.appendChild(meta);

        var actions = document.createElement('div');
        actions.className = 'research-history-actions';

        var viewBtn = document.createElement('button');
        viewBtn.className = 'research-history-btn';
        viewBtn.textContent = 'View';
        viewBtn.addEventListener('click', function() {
          if (window.teraBrowser && window.teraBrowser.getFullCapture) {
            window.teraBrowser.getFullCapture(entry.id).then(function(capture) {
              if (capture) {
                research.currentCapture = capture;
                research.setButtonsEnabled(true);
                research.showStatus('Loaded capture from history', 'success');
              }
            });
          }
        });

        var removeBtn = document.createElement('button');
        removeBtn.className = 'research-history-btn';
        removeBtn.textContent = 'Remove';
        removeBtn.addEventListener('click', function() {
          if (window.teraBrowser && window.teraBrowser.removeFromCaptureHistory) {
            window.teraBrowser.removeFromCaptureHistory(entry.id).then(function() {
              research.refreshHistory();
            });
          }
        });

        actions.appendChild(viewBtn);
        actions.appendChild(removeBtn);
        li.appendChild(info);
        li.appendChild(actions);
        historyList.appendChild(li);
      });
    } catch (err) {
      historyList.innerHTML = '<li class="research-history-empty">Could not load history</li>';
    }
  },

  async handleCapturePage() {
    this.hideStatus();
    this.showStatus('Capturing page content...', 'info');

    if (window.teraBrowser && window.teraBrowser.researchCapturePageText && window.teraBrowser.researchGetPageMeta) {
      try {
        const [textResult, metaResult] = await Promise.all([
          window.teraBrowser.researchCapturePageText(),
          window.teraBrowser.researchGetPageMeta(),
        ]);

        if (!textResult.ok) {
          this.showStatus('Failed to capture page: ' + (textResult.error || 'unknown error'), 'error');
          return;
        }

        if (!textResult.text || textResult.text.trim().length < 20) {
          this.showStatus('No readable text found on this page.', 'warning');
          return;
        }

        this.currentCapture = {
          id: 'cc_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 8),
          url: metaResult.url || window.location.href || '',
          title: metaResult.title || document.title || '',
          description: metaResult.description || '',
          text: textResult.text,
          headings: metaResult.headings || [],
          links: metaResult.links || [],
          capturedAt: new Date().toISOString(),
          source: 'browser',
          warnings: [],
        };

        this.setButtonsEnabled(true);
        this.showStatus('Page captured: ' + (this.currentCapture.title || this.currentCapture.url), 'success');

        if (window.teraBrowser && window.teraBrowser.addToCaptureHistory) {
          await window.teraBrowser.addToCaptureHistory(this.currentCapture);
          this.refreshHistory();
        }
      } catch (err) {
        this.showStatus('Capture error: ' + err.message, 'error');
      }
    } else {
      this.showStatus('Capture not available outside Tera Browser.', 'warning');
    }
  },

  async handleCaptureSelection() {
    this.hideStatus();

    if (window.teraBrowser && window.teraBrowser.researchCapturePageText && window.teraBrowser.researchGetPageMeta) {
      this.showStatus('Select text on the page, then click Capture Selection again.', 'info');
      try {
        const metaResult = await window.teraBrowser.researchGetPageMeta();
        if (!metaResult.ok) {
          this.showStatus('Could not get page info.', 'error');
          return;
        }

        if (window.teraBrowser && window.teraBrowser.researchCapturePageText) {
          const textResult = await window.teraBrowser.researchCapturePageText();
          const selectedText = ''; // Selection capture requires direct DOM access

          this.currentCapture = {
            id: 'cc_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 8),
            url: metaResult.url || window.location.href || '',
            title: metaResult.title || document.title || '',
            description: metaResult.description || '',
            text: textResult.text || '',
            headings: metaResult.headings || [],
            links: metaResult.links || [],
            selectedText: selectedText,
            capturedAt: new Date().toISOString(),
            source: 'browser',
            warnings: ['Selection capture requires direct DOM access; captured full page text instead.'],
          };

          this.setButtonsEnabled(true);
          this.showStatus(this.currentCapture.warnings[0], 'warning');
        }
      } catch (err) {
        this.showStatus('Selection capture error: ' + err.message, 'error');
      }
    } else {
      this.showStatus('Capture not available outside Tera Browser.', 'warning');
    }
  },

  async handleSummarize() {
    this.hideStatus();
    if (!this.currentCapture) {
      this.showStatus('No capture to summarize. Capture a page first.', 'warning');
      return;
    }

    if (window.teraBrowser && window.teraBrowser.researchSummarizeWithTera) {
      this.showStatus('Opening Tera for summarization...', 'info');
      await window.teraBrowser.researchSummarizeWithTera({
        url: this.currentCapture.url,
        title: this.currentCapture.title,
        text: this.currentCapture.text.substring(0, 3000),
        level: 'brief',
      });
      this.showStatus('Summarization opened in Tera.', 'success');
    } else {
      const query = 'Summarize this page: ' + (this.currentCapture.title || this.currentCapture.url);
      window.location.href = 'https://teraai.chat/?q=' + encodeURIComponent(query);
    }
  },

  async handleSendToTera() {
    this.hideStatus();
    if (!this.currentCapture) {
      this.showStatus('No capture to send. Capture a page first.', 'warning');
      return;
    }

    this.showStatus('Sending to Tera...', 'info');

    if (window.teraBrowser && window.teraBrowser.researchSendToTera) {
      try {
        const result = await window.teraBrowser.researchSendToTera({
          url: this.currentCapture.url,
          title: this.currentCapture.title,
          text: this.currentCapture.text,
          mode: 'research',
          selectedText: this.currentCapture.selectedText || '',
        });

        if (result.ok && result.response) {
          const r = result.response;
          if (r.ok) {
            this.showStatus(
              r.result && r.result.storedServerSide
                ? 'Sent to Tera successfully.'
                : (r.result && r.result.message) || 'Sent to Tera (local only).',
              r.result && r.result.storedServerSide ? 'success' : 'warning'
            );
          } else {
            this.showStatus('Tera returned: ' + (r.error || 'unknown error'), 'error');
          }
        } else {
          this.showStatus('Could not reach Tera. Content kept locally.', 'warning');
        }
      } catch (err) {
        this.showStatus('Send error: ' + err.message + '. Content kept locally.', 'warning');
      }
    } else {
      this.showStatus('Send to Tera requires Tera Browser with Electron IPC.', 'warning');
    }
  },

  async handleSaveSource() {
    this.hideStatus();
    if (!this.currentCapture) {
      this.showStatus('No capture to save. Capture a page first.', 'warning');
      return;
    }

    if (window.teraBrowser && window.teraBrowser.addToCaptureHistory) {
      try {
        await window.teraBrowser.addToCaptureHistory(this.currentCapture);
        this.refreshHistory();
        this.showStatus('Source saved to local history.', 'success');
      } catch (err) {
        this.showStatus('Save error: ' + err.message, 'error');
      }
    } else {
      this.showStatus('Save requires Tera Browser.', 'warning');
    }
  },

  async handleClearHistory() {
    if (window.teraBrowser && window.teraBrowser.clearCaptureHistory) {
      await window.teraBrowser.clearCaptureHistory();
      this.currentCapture = null;
      this.setButtonsEnabled(false);
      this.refreshHistory();
      this.showStatus('Capture history cleared.', 'info');
    } else {
      this.showStatus('Clear requires Tera Browser.', 'warning');
    }
  },

  toggle() {
    const { panel, toggle } = this.getElements();
    this.enabled = !this.enabled;
    panel.style.display = this.enabled ? 'block' : 'none';
    toggle.textContent = this.enabled ? 'Exit Research Mode' : 'Research Mode';

    if (this.enabled) {
      this.refreshHistory();
      if (!window.teraBrowser) {
        this.showStatus('Research Mode is available in the Tera Browser app. Some features may be limited.', 'warning');
      } else {
        this.setButtonsEnabled(false);
        this.showStatus('Research Mode enabled. Browse to a page and capture it.', 'info');
      }
    } else {
      this.hideStatus();
    }
  },
};

document.getElementById('researchModeToggle').addEventListener('click', function() {
  research.toggle();
});

document.getElementById('researchCapturePage').addEventListener('click', function() {
  research.handleCapturePage();
});

document.getElementById('researchCaptureSelection').addEventListener('click', function() {
  research.handleCaptureSelection();
});

document.getElementById('researchSummarize').addEventListener('click', function() {
  research.handleSummarize();
});

document.getElementById('researchSendToTera').addEventListener('click', function() {
  research.handleSendToTera();
});

document.getElementById('researchSaveSource').addEventListener('click', function() {
  research.handleSaveSource();
});

document.getElementById('researchClearHistory').addEventListener('click', function() {
  research.handleClearHistory();
});
