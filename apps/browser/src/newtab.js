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
