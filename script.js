/** 
 * =============================
 * 🔧 CONFIGURE YOUR CSV HERE
 * =============================
 * 1) Download the Google Sheet as CSV.
 * 2) Upload the CSV to the `data` folder on GitHub or your server.
 * 3) Use PapaParse to parse the CSV data.
 */
const CSV_URL = "https://raw.githubusercontent.com/yourusername/yourrepo/main/data/yourfile.csv";  // Update with your CSV URL

// Function to load and parse the CSV data
async function fetchCSV() {
  const response = await fetch(CSV_URL);
  const csvText = await response.text();

  // Use PapaParse to parse the CSV data
  const parsedData = Papa.parse(csvText, {
    header: true,   // This assumes the first row contains column names
    skipEmptyLines: true
  });

  // Return the parsed data in the desired format
  return parsedData.data.map(row => ({
    name: row["Name"] || '',
    image: row["Image URL"] || '',
    price: Number(row["Price"]) || 0,
    shop: row["Shop"] || '',
    category: row["Category"] || ''
  }));
}

// --- App State and DOM Elements ---
let ALL_ITEMS = [];
let ACTIVE_SHOPS = new Set();

const els = {
  grid: document.getElementById('grid'),
  category: document.getElementById('category'),
  shops: document.getElementById('shops'),
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
  const el = Object.assign(document.createElement(tag), props);
  for (const c of children) el.append(c);
  return el;
}

// Format price as BDT currency
function fmtCurrency(v) {
  const n = Number(v || 0);
  return new Intl.NumberFormat('en-BD', { style: 'currency', currency: 'BDT', maximumFractionDigits: 0 }).format(n);
}

// Get unique categories or shops
function unique(arr) {
  return [...new Set(arr.filter(Boolean))];
}

// Hydrate filters for categories and shops
function hydrateFilters(items) {
  // Category dropdown
  const cats = unique(items.map(i => i.category)).sort((a, b) => a.localeCompare(b));
  els.category.innerHTML = '<option value="">All categories</option>' + cats.map(c => `<option value="${c}">${c}</option>`).join('');

  // Shop chips
  const shops = unique(items.map(i => i.shop)).sort((a, b) => a.localeCompare(b));
  els.shops.innerHTML = '';
  shops.forEach(s => {
    const chip = $('button', { className: 'shopchip', type: 'button', onclick: () => toggleShop(s, chip) }, [document.createTextNode(s)]);
    els.shops.append(chip);
  });
}

// Toggle active shop filters
function toggleShop(shop, chip) {
  if (ACTIVE_SHOPS.has(shop)) { 
    ACTIVE_SHOPS.delete(shop); 
    chip.classList.remove('active'); 
  } else { 
    ACTIVE_SHOPS.add(shop); 
    chip.classList.add('active'); 
  }
  render();
}

// Apply filters to the items
function applyFilters() {
  const q = els.search.value.trim().toLowerCase();
  const cat = els.category.value;
  const list = ALL_ITEMS.filter(it => {
    const matchesQ = !q || [it.name, it.shop, it.category].some(v => (v || '').toLowerCase().includes(q));
    const matchesCat = !cat || it.category === cat;
    const matchesShop = ACTIVE_SHOPS.size === 0 || ACTIVE_SHOPS.has(it.shop);
    return matchesQ && matchesCat && matchesShop;
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
    const card = $('.card');
    const thumb = $('.thumb');
    const img = $('img', { alt: it.name, loading: 'lazy' });
    img.src = it.image || `https://placehold.co/600x400?text=${encodeURIComponent(it.name)}`;
    const tag = $('.tag', {}, [document.createTextNode(it.shop || '–')]);
    thumb.append(img, tag);

    const body = $('.body');
    const title = $('.title', {}, [document.createTextNode(it.name)]);
    const meta = $('.meta');
    const price = $('.price', {}, [document.createTextNode(fmtCurrency(it.price))]);
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

// Load the data (either from the CSV or fallback)
async function load() {
  renderSkeleton(8);  // Show skeleton loader
  try {
    const rows = await fetchCSV();
    ALL_ITEMS = rows.length ? rows : SAMPLE_DATA;
  } catch (err) {
    console.warn('Using sample data because fetching CSV failed:', err);
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

// Reload CSV data
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

// "How to" helper
els.how.addEventListener('click', e => {
  e.preventDefault();
  alert(`How to connect your CSV:

1) Download the Google Sheet as CSV.
2) Upload the CSV to the 'data' folder in your GitHub repo.
3) Make sure the columns in the CSV are: Name | Image URL | Price | Shop | Category.
4) Click "Reload sheet". Done!`);
});

// Initial load
load();
