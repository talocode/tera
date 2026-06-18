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
