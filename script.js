const JSON_URL = "https://raw.githubusercontent.com/mangpa444/pandalite/main/c.json";  // Update with your JSON file URL

// Function to fetch and load the JSON data
async function fetchJSON() {
  const response = await fetch(JSON_URL);
  const data = await response.json();
  return data.map(item => ({
    number: item.sl || '',  // Using "sl" as the number
    name: item.name || '',
    image: item.image || '',
    price: Number(item.price) || 0,
    shop: item.shop || '',
    category: item.category || ''
  }));
}

// --- App State and DOM Elements ---
let ALL_ITEMS = [];

const els = {
  grid: document.getElementById('grid'),
  category: document.getElementById('category'),
  search: document.getElementById('search'),
  sort: document.getElementById('sort'),
  count: document.getElementById('resultCount'),
  empty: document.getElementById('empty'),
  zip: document.getElementById('zip'),
  reload: document.getElementById('reload'),
  how: document.getElementById('how'),
};

// Utility function for creating DOM elements
function $(tag, props = {}, children = []) {
  const el = Object.assign(document.createElement(tag), props);  // Create a valid HTML tag
  for (const c of children) el.append(c);
  return el;
}

// Format price as BDT currency
function fmtCurrency(v) {
  const n = Number(v || 0);
  return new Intl.NumberFormat('en-BD', { style: 'currency', currency: 'BDT', maximumFractionDigits: 0 }).format(n);
}

// Get unique categories
function unique(arr) {
  return [...new Set(arr.filter(Boolean))];
}

// Hydrate filters for categories
function hydrateFilters(items) {
  // Category dropdown
  const cats = unique(items.map(i => i.category)).sort((a, b) => a.localeCompare(b));
  els.category.innerHTML = '<option value="">All categories</option>' + cats.map(c => `<option value="${c}">${c}</option>`).join('');
}

// Apply filters to the items
function applyFilters() {
  const q = els.search.value.trim().toLowerCase();
  const cat = els.category.value;
  const list = ALL_ITEMS.filter(it => {
    const matchesQ = !q || [it.name, it.shop, it.category].some(v => (v || '').toLowerCase().includes(q));
    const matchesCat = !cat || it.category === cat;
    return matchesQ && matchesCat;
  });

  switch (els.sort.value) {
    case 'price-asc': list.sort((a, b) => a.price - b.price); break;
    case 'price-desc': list.sort((a, b) => b.price - a.price); break;
    case 'name-asc': list.sort((a, b) => a.name.localeCompare(b.name)); break;
    default: /* relevance-ish: keep original order */ break;
  }
  return list;
}

// Render the grid of items
function render() {
  const items = applyFilters();
  els.count.textContent = `${items.length} item${items.length !== 1 ? 's' : ''}`;
  els.grid.setAttribute('aria-busy', 'true');
  els.grid.innerHTML = '';

  if (!items.length) {
    els.empty.hidden = false;
    els.grid.removeAttribute('aria-busy');
    return;
  }
  els.empty.hidden = true;

  // Create and append each item to the grid
  for (const it of items) {
    const card = $('div', { className: 'card' });  // Create a div with the class "card"
    const thumb = $('div', { className: 'thumb' });
    const img = $('img', { alt: it.name, loading: 'lazy' });
    img.src = it.image || `https://placehold.co/600x400?text=${encodeURIComponent(it.name)}`;
    const tag = $('span', { className: 'tag' }, [document.createTextNode(it.shop || '–')]);  // Shop name displayed here
    thumb.append(img, tag);

    const body = $('div', { className: 'body' });
    const title = $('div', { className: 'title' }, [document.createTextNode(it.name)]);
    const meta = $('div', { className: 'meta' });
    const price = $('span', { className: 'price' }, [document.createTextNode(fmtCurrency(it.price))]);
    const cat = $('span', { textContent: it.category || 'Uncategorized', title: 'Category' });
    meta.append(cat, price);

    body.append(title, meta);
    card.append(thumb, body);
    els.grid.append(card);
  }
  els.grid.removeAttribute('aria-busy');
}

// Render skeleton cards while loading data
function renderSkeleton(count = 8) {
  els.grid.innerHTML = '';
  for (let i = 0; i < count; i++) {
    const sk = document.createElement('div');
    sk.className = 'sk-card skeleton';
    els.grid.append(sk);
  }
}

// Load the data (either from the JSON or fallback)
async function load() {
  renderSkeleton(8);  // Show skeleton loader
  try {
    const rows = await fetchJSON();
    ALL_ITEMS = rows.length ? rows : SAMPLE_DATA;
  } catch (err) {
    console.warn('Using sample data because fetching JSON failed:', err);
    ALL_ITEMS = SAMPLE_DATA;
  }
  hydrateFilters(ALL_ITEMS);
  render();
}

// Events for search, category, sorting
['input', 'change'].forEach(ev => {
  els.search.addEventListener(ev, render);
  els.category.addEventListener(ev, render);
  els.sort.addEventListener(ev, render);
});

// Reload JSON data
els.reload.addEventListener('click', load);

// Zip code handling (BD uses 4-digit postal codes)
els.zip.value = localStorage.getItem('bd_zip') || '';
els.zip.addEventListener('input', e => {
  e.target.value = clampZip(e.target.value);
});
els.zip.addEventListener('change', e => {
  const val = clampZip(e.target.value);
  e.target.value = val;
  if (val && val.length === 4) localStorage.setItem('bd_zip', val);
});

// Initial load
load();
