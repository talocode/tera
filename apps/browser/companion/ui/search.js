const $ = (s) => document.querySelector(s);
const form = $('#search-form');
const input = $('#q');
const submitBtn = form?.querySelector('button[type="submit"]');
const hero = $('#hero');
const modesEl = $('#search-modes');

const TERA_SEARCH_URL = 'https://teraai.chat/?q=';
const TERA_URL = 'https://teraai.chat';

let mode = 'web';

const MODE_LABELS = { web: 'Web', learn: 'Learn' };

function buildTeraSearchUrl(query) {
  return `${TERA_SEARCH_URL}${encodeURIComponent(query)}`;
}

function syncUrl() {
  const q = input.value.trim();
  const params = new URLSearchParams();
  if (mode !== 'web') params.set('mode', mode);
  if (q) params.set('q', q);
  const qs = params.toString();
  const next = `${location.pathname}${qs ? `?${qs}` : ''}`;
  if (location.pathname + location.search !== next) {
    history.replaceState(null, '', next);
  }
}

function setMode(next) {
  if (!['web', 'learn'].includes(next)) next = 'web';
  mode = next;
  modesEl?.querySelectorAll('[data-mode]').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.mode === mode);
  });
  input.placeholder = mode === 'learn'
    ? 'What do you want to learn about?'
    : 'Ask Tera or search the web...';
  syncUrl();
  persistSearchMode(mode);
}

async function openTeraQuery(query) {
  if (submitBtn) submitBtn.disabled = true;
  try {
    let dest;
    if (mode === 'learn') {
      dest = buildTeraSearchUrl(`Teach me about: ${query}`);
    } else {
      dest = buildTeraSearchUrl(query);
    }
    window.location.href = dest;
  } catch (err) {
    alert(`Tera search failed: ${err.message}`);
  } finally {
    if (submitBtn) submitBtn.disabled = false;
  }
}

modesEl?.querySelectorAll('[data-mode]').forEach((btn) => {
  btn.addEventListener('click', () => setMode(btn.dataset.mode));
});

form?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const q = input.value.trim();
  if (!q) return;
  persistSearchQuery(q);
  syncUrl();
  await openTeraQuery(q);
});

input?.addEventListener('input', () => {
  persistSearchQuery(input.value.trim());
  syncUrl();
});

// TODO: Implement Tera toolbar mount if needed
// mountTeraToolbar({
//   pageHome: SEARCH_HOME_WEB,
//   onSwitch: async (saved, updated) => {
//     // Handle toolbar switches
//   },
// });

startThemeWatcher();

const urlParams = new URLSearchParams(location.search);
const modeParam = urlParams.get('mode');
if (modeParam && ['web', 'learn'].includes(modeParam)) {
  setMode(modeParam);
} else {
  setMode(getStoredSearchMode() === 'learn' ? 'learn' : 'web');
}
const urlQuery = urlParams.get('q');
const initialQuery = urlQuery || getStoredSearchQuery();
if (initialQuery) {
  input.value = initialQuery;
  syncUrl();
}
if (urlQuery) {
  openTeraQuery(urlQuery);
}
