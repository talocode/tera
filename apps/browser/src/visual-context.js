const PRIVATE_URL_PATTERNS = [
  /^https?:\/\/localhost/,
  /^https?:\/\/127\./,
  /^https?:\/\/10\./,
  /^https?:\/\/172\.(1[6-9]|2[0-9]|3[01])\./,
  /^https?:\/\/192\.168\./,
  /^https?:\/\/0\./,
  /^file:\/\//,
];

const VLM_CONFIGURED = false;

function isPrivateUrl(pageUrl) {
  return PRIVATE_URL_PATTERNS.some((p) => p.test(pageUrl));
}

function formatTimestamp(isoString) {
  const d = new Date(isoString);
  return d.toLocaleString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    month: 'short',
    day: 'numeric',
  });
}

function show(el) {
  el.classList.remove('vc-hidden');
}

function hide(el) {
  el.classList.add('vc-hidden');
}

function hideAll() {
  const panel = document.getElementById('visualContextPanel');
  hide(document.getElementById('vcLoading'));
  hide(document.getElementById('vcPreview'));
  hide(document.getElementById('vcPrivateWarning'));
  hide(document.getElementById('vcError'));
}

function closePanel() {
  hide(document.getElementById('visualContextPanel'));
  hideAll();
}

function showError(message) {
  hideAll();
  const errEl = document.getElementById('vcError');
  errEl.querySelector('.vc-error-text').textContent = message;
  show(errEl);
}

async function handleCapture() {
  const panel = document.getElementById('visualContextPanel');
  show(panel);
  hideAll();
  show(document.getElementById('vcLoading'));

  const result = await window.teraBrowser.captureViewport();

  hide(document.getElementById('vcLoading'));

  if (!result.ok) {
    if (result.error === 'private_url') {
      show(document.getElementById('vcPrivateWarning'));
      return;
    }
    if (result.error === 'capture_too_large') {
      showError('Screenshot too large. Try scrolling to a smaller area or reducing window size.');
      return;
    }
    if (result.error === 'empty_capture') {
      showError('Capture was empty. The page may not be fully loaded.');
      return;
    }
    showError(result.message || 'Capture failed. Please try again.');
    return;
  }

  const { screenshot, url: pageUrl, title, capturedAt } = result;

  document.getElementById('vcThumbnail').src = `data:${screenshot.mimeType};base64,${screenshot.data}`;
  document.getElementById('vcTitle').textContent = title || 'Unknown Page';
  document.getElementById('vcUrl').textContent = pageUrl;
  document.getElementById('vcTimestamp').textContent = formatTimestamp(capturedAt);
  document.getElementById('vcDimensions').textContent = `${screenshot.width} × ${screenshot.height}px`;

  if (!VLM_CONFIGURED) {
    show(document.getElementById('vcProviderWarning'));
  }

  show(document.getElementById('vcPreview'));
}

function handleDiscard() {
  closePanel();
}

function handleUse() {
  const title = document.getElementById('vcTitle').textContent;
  const pageUrl = document.getElementById('vcUrl').textContent;
  const query = `Visual explain this page: ${title} ${pageUrl}`;
  window.location.href = `https://teraai.chat/?q=${encodeURIComponent(query)}`;
}

document.getElementById('vcClose').addEventListener('click', closePanel);
document.getElementById('vcDiscard').addEventListener('click', handleDiscard);
document.getElementById('vcUse').addEventListener('click', handleUse);

window.teraBrowser.onShowVisualContext(() => {
  handleCapture();
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    closePanel();
  }
});
