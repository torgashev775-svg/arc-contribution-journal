const STORAGE_KEY = "arc_contribution_journal_v3";
const LEGACY_KEYS = ["arc_contribution_journal_v2", "arc_contribution_journal_v1"];
const TX_HASH_RE = /^0x[a-fA-F0-9]{64}$/;

const form = document.getElementById("entryForm");
const entriesEl = document.getElementById("entries");
const exportBtn = document.getElementById("exportBtn");
const exportCsvBtn = document.getElementById("exportCsvBtn");
const importBtn = document.getElementById("importBtn");
const importInput = document.getElementById("importInput");
const filterCategory = document.getElementById("filterCategory");
const filterStatus = document.getElementById("filterStatus");
const filterNetwork = document.getElementById("filterNetwork");
const totalCount = document.getElementById("totalCount");
const weekCount = document.getElementById("weekCount");
const topCategory = document.getElementById("topCategory");
const submitBtn = document.getElementById("submitBtn");
const cancelEditBtn = document.getElementById("cancelEditBtn");

const fields = {
  editId: document.getElementById("editId"),
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

setDefaultFormValues();
render();

form.addEventListener("submit", (e) => {
  e.preventDefault();

  const txHash = fields.txHash.value.trim();
  if (txHash && !TX_HASH_RE.test(txHash)) {
    alert("Invalid Tx Hash. Use 0x followed by 64 hex characters.");
    fields.txHash.focus();
    return;
  }

  const entry = {
    id: fields.editId.value || crypto.randomUUID(),
    date: fields.date.value,
    category: fields.category.value,
    action: fields.action.value,
    status: fields.status.value,
    network: fields.network.value.trim(),
    txHash,
    wallet: fields.wallet.value.trim(),
    details: fields.details.value.trim(),
    proof: fields.proof.value.trim(),
    createdAt: fields.editId.value ? getCreatedAt(fields.editId.value) : Date.now()
  };

  if (fields.editId.value) {
    entries = entries.map((item) => (item.id === entry.id ? entry : item));
  } else {
    entries.unshift(entry);
  }

  saveEntries();
  resetForm();
  render();
});

filterCategory.addEventListener("change", render);
filterStatus.addEventListener("change", render);
filterNetwork.addEventListener("change", render);

cancelEditBtn.addEventListener("click", () => {
  resetForm();
});

exportBtn.addEventListener("click", () => {
  downloadFile(
    "arc-contributions.json",
    JSON.stringify(entries, null, 2),
    "application/json"
  );
});

exportCsvBtn.addEventListener("click", () => {
  downloadFile(
    "arc-contributions.csv",
    toCsv(entries),
    "text/csv;charset=utf-8;"
  );
});

importBtn.addEventListener("click", () => {
  importInput.click();
});

importInput.addEventListener("change", async (e) => {
  const file = e.target.files?.[0];
  if (!file) return;

  try {
    const text = await file.text();
    const parsed = JSON.parse(text);
    if (!Array.isArray(parsed)) throw new Error("Invalid JSON format");

    entries = parsed
      .map(normalizeEntry)
      .filter(Boolean)
      .sort((a, b) => b.createdAt - a.createdAt);

    saveEntries();
    resetForm();
    render();
    alert("Import completed.");
  } catch {
    alert("Import failed. Please use a valid JSON export file.");
  } finally {
    importInput.value = "";
  }
});

function loadEntries() {
  for (const key of [STORAGE_KEY, ...LEGACY_KEYS]) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) continue;
      const normalized = parsed.map(normalizeEntry).filter(Boolean);
      if (normalized.length || key === STORAGE_KEY) return normalized;
    } catch {}
  }
  return [];
}

function saveEntries() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

function normalizeEntry(entry) {
  if (!entry || typeof entry !== "object") return null;

  return {
    id: String(entry.id || crypto.randomUUID()),
    date: String(entry.date || new Date().toISOString().slice(0, 10)),
    category: String(entry.category || "other"),
    action: String(entry.action || entry.category || "other"),
    status: String(entry.status || "completed"),
    network: String(entry.network || "Arc Testnet"),
    txHash: String(entry.txHash || ""),
    wallet: String(entry.wallet || ""),
    details: String(entry.details || ""),
    proof: String(entry.proof || ""),
    createdAt: Number(entry.createdAt || Date.now())
  };
}

function getCreatedAt(id) {
  const current = entries.find((entry) => entry.id === id);
  return current ? current.createdAt : Date.now();
}

function setDefaultFormValues() {
  fields.date.value = new Date().toISOString().slice(0, 10);
  fields.network.value = "Arc Testnet";
  fields.status.value = "completed";
}

function resetForm() {
  form.reset();
  fields.editId.value = "";
  setDefaultFormValues();
  submitBtn.textContent = "Add Entry";
  cancelEditBtn.hidden = true;
}

function startEdit(id) {
  const entry = entries.find((item) => item.id === id);
  if (!entry) return;

  fields.editId.value = entry.id;
  fields.date.value = entry.date;
  fields.category.value = entry.category;
  fields.action.value = entry.action;
  fields.status.value = entry.status;
  fields.network.value = entry.network;
  fields.txHash.value = entry.txHash;
  fields.wallet.value = entry.wallet;
  fields.details.value = entry.details;
  fields.proof.value = entry.proof;

  submitBtn.textContent = "Update Entry";
  cancelEditBtn.hidden = false;
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function deleteEntry(id) {
  const ok = window.confirm("Delete this entry?");
  if (!ok) return;
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

function renderNetworkOptions() {
  const current = filterNetwork.value || "all";
  const networks = [...new Set(entries.map((entry) => entry.network).filter(Boolean))].sort();

  filterNetwork.innerHTML = [
    '<option value="all">All networks</option>',
    ...networks.map(
      (network) =>
        `<option value="${escapeAttr(network)}">${escapeHtml(network)}</option>`
    )
  ].join("");

  filterNetwork.value = networks.includes(current) ? current : "all";
}

function getFilteredEntries() {
  return entries.filter((entry) => {
    const categoryOk =
      filterCategory.value === "all" || entry.category === filterCategory.value;
    const statusOk =
      filterStatus.value === "all" || entry.status === filterStatus.value;
    const networkOk =
      filterNetwork.value === "all" || entry.network === filterNetwork.value;

    return categoryOk && statusOk && networkOk;
  });
}

function render() {
  renderStats();
  renderNetworkOptions();

  const filtered = getFilteredEntries();

  if (!filtered.length) {
    entriesEl.innerHTML = '<div class="empty">No entries yet.</div>';
    bindEntryButtons();
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
            <div class="hero-actions">
              <button class="edit-btn" type="button" data-id="${entry.id}">Edit</button>
              <button class="delete-btn" type="button" data-id="${entry.id}">Delete</button>
            </div>
          </div>
          <p class="entry-text">${escapeHtml(entry.details)}</p>
          <div class="entry-meta">
            <span>${escapeHtml(entry.date)}</span>
            <span>${escapeHtml(entry.network)}</span>
            <span>${escapeHtml(entry.status)}</span>
            <span>${shortWallet(entry.wallet)}</span>
            ${txLine}
            ${proofLine}
          </div>
        </article>
      `;
    })
    .join("");

  bindEntryButtons();
}

function bindEntryButtons() {
  document.querySelectorAll(".delete-btn").forEach((button) => {
    button.addEventListener("click", () => deleteEntry(button.dataset.id));
  });

  document.querySelectorAll(".edit-btn").forEach((button) => {
    button.addEventListener("click", () => startEdit(button.dataset.id));
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
  return String(value).replace(/"/g, "&quot;");
}

function downloadFile(name, content, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

function toCsv(list) {
  const rows = [
    [
      "date",
      "category",
      "action",
      "status",
      "network",
      "txHash",
      "wallet",
      "details",
      "proof",
      "createdAt"
    ],
    ...list.map((entry) => [
      entry.date,
      entry.category,
      entry.action,
      entry.status,
      entry.network,
      entry.txHash,
      entry.wallet,
      entry.details,
      entry.proof,
      String(entry.createdAt)
    ])
  ];

  return rows
    .map((row) => row.map(csvCell).join(","))
    .join("\n");
}

function csvCell(value) {
  const text = String(value ?? "");
  return `"${text.replace(/"/g, '""')}"`;
}