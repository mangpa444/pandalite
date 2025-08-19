/** 
 * =============================
 * 🔧 CONFIGURE YOUR SHEET HERE
 * =============================
 * 1) Open your Google Sheet → File → Share → Anyone with the link: Viewer.
 * 2) Copy the Sheet ID from its URL: https://docs.google.com/spreadsheets/d/👉 SHEET_ID 👈/edit
 * 3) Optional: use the GID of the tab (at the end of the URL). Default is first tab (gid=0).
 * 4) Columns must be: [0]=Name, [1]=Image URL, [2]=Price, [3]=Shop, [4]=Category
 */
const SHEET_ID = "1EkRtmpV6sDOH8XYje1Uft6jc0ukp8LoRgf5VWPDP5kY";   // ← put your Sheet ID here
const SHEET_GID = "0";                   // ← usually 0 for the first tab

// If you prefer to paste the full URL, set SHEET_URL and we'll parse the ID & gid for you.
const SHEET_URL = ""; // e.g. "https://docs.google.com/spreadsheets/d/1AbC.../edit#gid=0"

/* === APP STATE === */
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

// Add the remaining JavaScript logic here
