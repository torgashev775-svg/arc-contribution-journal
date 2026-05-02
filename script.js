const STORAGE_KEY = "arc_contribution_journal_v2";

const form = document.getElementById("entryForm");
const entriesEl = document.getElementById("entries");
const exportBtn = document.getElementById("exportBtn");
const filterCategory = document.getElementById("filterCategory");
const totalCount = document.getElementById("totalCount");
const weekCount = document.getElementById("weekCount");
const topCategory = document.getElementById("topCategory");

const fields = {
  date: document.getElementById("date"),
  category: document.getElementById("category"),
  action: document.getElementById("action"),
  status: document.getElementById("status"),
  network: document.getElementById("network"),
  txHash: document.getElementById("txHash"),
  wallet: document.getElementById("wallet"),
  details: document.getElementById("details"),
  proof: document.getElementById("proof")
};

let entries = loadEntries();
fields.date.value = new Date().toISOString().slice(0, 10);

form.addEventListener("submit", (e) => {
  e.preventDefault();

  const entry = {
    id: crypto.randomUUID(),
    date: fields.date.value,
    category: fields.category.value,
    action: fields.action.value,
    status: fields.status.value,
    network: fields.network.value.trim(),
    txHash: fields.txHash.value.trim(),
    wallet: fields.wallet.value.trim(),
    details: fields.details.value.trim(),
    proof: fields.proof.value.trim(),
    createdAt: Date.now()
  };

  entries.unshift(entry);
  saveEntries();
  form.reset();
  fields.date.value = new Date().toISOString().slice(0, 10);
  fields.network.value = "Arc Testnet";
  fields.status.value = "completed";
  render();
});

filterCategory.addEventListener("change", render);

exportBtn.addEventListener("click", () => {
  const blob = new Blob([JSON.stringify(entries, null, 2)], {
    type: "application/json"
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "arc-contributions.json";
  a.click();
  URL.revokeObjectURL(url);
});

function loadEntries() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch {
    return [];
  }
}

function saveEntries() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

function deleteEntry(id) {
  entries = entries.filter((entry) => entry.id !== id);
  saveEntries();
  render();
}

function getWeekCount(list) {
  const now = new Date();
  const start = new Date(now);
  start.setDate(now.getDate() - 7);
  start.setHours(0, 0, 0, 0);
  return list.filter((entry) => new Date(entry.date) >= start).length;
}

function getTopCategory(list) {
  if (!list.length) return "-";
  const counts = list.reduce((acc, entry) => {
    acc[entry.category] = (acc[entry.category] || 0) + 1;
    return acc;
  }, {});
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
}

function renderStats() {
  totalCount.textContent = String(entries.length);
  weekCount.textContent = String(getWeekCount(entries));
  topCategory.textContent = getTopCategory(entries);
}

function render() {
  renderStats();

  const category = filterCategory.value;
  const filtered =
    category === "all"
      ? entries
      : entries.filter((entry) => entry.category === category);

  if (!filtered.length) {
    entriesEl.innerHTML = '<div class="empty">No entries yet.</div>';
    return;
  }

  entriesEl.innerHTML = filtered
    .map((entry) => {
      const txLine = entry.txHash
        ? `<span>TX: ${shortHash(entry.txHash)}</span>`
        : "";
      const proofLine = entry.proof
        ? `<a href="${escapeAttr(entry.proof)}" target="_blank" rel="noreferrer">Proof link</a>`
        : "";

      return `
        <article class="entry">
          <div class="entry-head">
            <span class="badge">${escapeHtml(entry.action || entry.category)}</span>
            <button class="delete-btn" data-id="${entry.id}">Delete</button>
          </div>
          <p class="entry-text">${escapeHtml(entry.details || "")}</p>
          <div class="entry-meta">
            <span>${escapeHtml(entry.date || "")}</span>
            <span>${escapeHtml(entry.network || "Arc Testnet")}</span>
            <span>${escapeHtml(entry.status || "completed")}</span>
            <span>${shortWallet(entry.wallet || "")}</span>
            ${txLine}
            ${proofLine}
          </div>
        </article>
      `;
    })
    .join("");

  document.querySelectorAll(".delete-btn").forEach((button) => {
    button.addEventListener("click", () => deleteEntry(button.dataset.id));
  });
}

function shortWallet(wallet) {
  if (!wallet) return "";
  if (wallet.length < 12) return wallet;
  return `${wallet.slice(0, 6)}...${wallet.slice(-4)}`;
}

function shortHash(hash) {
  if (!hash) return "";
  if (hash.length < 14) return hash;
  return `${hash.slice(0, 8)}...${hash.slice(-6)}`;
}

function escapeHtml(value) {
  const div = document.createElement("div");
  div.textContent = value;
  return div.innerHTML;
}

function escapeAttr(value) {
  return value.replace(/"/g, "&quot;");
}

render();
