const STORAGE_KEY = "arc_contribution_journal_v4";
const LEGACY_KEYS = [
  "arc_contribution_journal_v3",
  "arc_contribution_journal_v2",
  "arc_contribution_journal_v1"
];
const TX_HASH_RE = /^0x[a-fA-F0-9]{64}$/;

const form = document.getElementById("entryForm");
const addressForm = document.getElementById("addressForm");
const workspaceForm = document.getElementById("workspaceForm");

const entriesEl = document.getElementById("entries");
const addressListEl = document.getElementById("addressList");

const exportBtn = document.getElementById("exportBtn");
const exportCsvBtn = document.getElementById("exportCsvBtn");
const exportReportBtn = document.getElementById("exportReportBtn");
const importBtn = document.getElementById("importBtn");
const importInput = document.getElementById("importInput");

const workspaceSelect = document.getElementById("workspaceSelect");
const newWorkspaceName = document.getElementById("newWorkspaceName");
const deleteWorkspaceBtn = document.getElementById("deleteWorkspaceBtn");

const filterCategory = document.getElementById("filterCategory");
const filterStatus = document.getElementById("filterStatus");
const filterNetwork = document.getElementById("filterNetwork");

const totalCount = document.getElementById("totalCount");
const weekCount = document.getElementById("weekCount");
const topCategory = document.getElementById("topCategory");
const selectedCount = document.getElementById("selectedCount");

const submitBtn = document.getElementById("submitBtn");
const cancelEditBtn = document.getElementById("cancelEditBtn");
const saveAddressBtn = document.getElementById("saveAddressBtn");
const cancelAddressEditBtn = document.getElementById("cancelAddressEditBtn");

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
  proof: document.getElementById("proof"),
  savedWallet: document.getElementById("savedWallet")
};

const addressFields = {
  editId: document.getElementById("addressEditId"),
  label: document.getElementById("addressLabel"),
  address: document.getElementById("addressValue"),
  network: document.getElementById("addressNetwork"),
  notes: document.getElementById("addressNotes")
};

const selectedEntryIds = new Set();
let state = loadState();

setDefaultEntryValues();
resetAddressForm();
render();

workspaceForm.addEventListener("submit", (e) => {
  e.preventDefault();

  const name = newWorkspaceName.value.trim();
  if (!name) {
    alert("Enter a workspace name.");
    newWorkspaceName.focus();
    return;
  }

  const workspace = {
    id: crypto.randomUUID(),
    name,
    createdAt: Date.now()
  };

  state.workspaces.unshift(workspace);
  state.currentWorkspaceId = workspace.id;
  newWorkspaceName.value = "";
  selectedEntryIds.clear();
  saveState();
  resetEntryForm();
  resetAddressForm();
  render();
});

workspaceSelect.addEventListener("change", () => {
  state.currentWorkspaceId = workspaceSelect.value;
  selectedEntryIds.clear();
  saveState();
  resetEntryForm();
  resetAddressForm();
  render();
});

deleteWorkspaceBtn.addEventListener("click", () => {
  if (state.workspaces.length === 1) {
    alert("At least one workspace must remain.");
    return;
  }

  const workspace = getCurrentWorkspace();
  if (!workspace) return;

  if (!window.confirm(`Delete workspace "${workspace.name}" and all its data?`)) {
    return;
  }

  state.workspaces = state.workspaces.filter((item) => item.id !== workspace.id);
  state.entries = state.entries.filter((item) => item.workspaceId !== workspace.id);
  state.addressBook = state.addressBook.filter((item) => item.workspaceId !== workspace.id);
  state.currentWorkspaceId = state.workspaces[0].id;
  selectedEntryIds.clear();
  saveState();
  resetEntryForm();
  resetAddressForm();
  render();
});

addressForm.addEventListener("submit", (e) => {
  e.preventDefault();

  const item = {
    id: addressFields.editId.value || crypto.randomUUID(),
    workspaceId: state.currentWorkspaceId,
    label: addressFields.label.value.trim(),
    address: addressFields.address.value.trim(),
    network: addressFields.network.value.trim(),
    notes: addressFields.notes.value.trim(),
    createdAt: addressFields.editId.value ? getAddressCreatedAt(addressFields.editId.value) : Date.now()
  };

  if (addressFields.editId.value) {
    state.addressBook = state.addressBook.map((entry) => (entry.id === item.id ? item : entry));
  } else {
    state.addressBook.unshift(item);
  }

  saveState();
  resetAddressForm();
  render();
});

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
    workspaceId: state.currentWorkspaceId,
    date: fields.date.value,
    category: fields.category.value,
    action: fields.action.value,
    status: fields.status.value,
    network: fields.network.value.trim(),
    txHash,
    wallet: fields.wallet.value.trim(),
    details: fields.details.value.trim(),
    proof: fields.proof.value.trim(),
    createdAt: fields.editId.value ? getEntryCreatedAt(fields.editId.value) : Date.now()
  };

  if (fields.editId.value) {
    state.entries = state.entries.map((item) => (item.id === entry.id ? entry : item));
  } else {
    state.entries.unshift(entry);
  }

  saveState();
  resetEntryForm();
  render();
});

fields.savedWallet.addEventListener("change", () => {
  const item = getCurrentAddresses().find((entry) => entry.id === fields.savedWallet.value);
  if (!item) return;
  fields.wallet.value = item.address;
  fields.network.value = item.network;
});

filterCategory.addEventListener("change", render);
filterStatus.addEventListener("change", render);
filterNetwork.addEventListener("change", render);

cancelEditBtn.addEventListener("click", resetEntryForm);
cancelAddressEditBtn.addEventListener("click", resetAddressForm);

exportBtn.addEventListener("click", () => {
  downloadFile(
    "arc-contribution-journal.json",
    JSON.stringify(state, null, 2),
    "application/json"
  );
});

exportCsvBtn.addEventListener("click", () => {
  downloadFile(
    `${slugify(getCurrentWorkspace().name)}-entries.csv`,
    toCsv(getCurrentEntries()),
    "text/csv;charset=utf-8;"
  );
});

exportReportBtn.addEventListener("click", () => {
  const selected = getCurrentEntries().filter((entry) => selectedEntryIds.has(entry.id));

  if (!selected.length) {
    alert("Select at least one entry for the report.");
    return;
  }

  downloadFile(
    `${slugify(getCurrentWorkspace().name)}-report.md`,
    buildMarkdownReport(selected),
    "text/markdown;charset=utf-8;"
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
    const normalized = normalizeState(parsed);

    if (!window.confirm("Replace current local data with imported data?")) {
      importInput.value = "";
      return;
    }

    state = normalized;
    selectedEntryIds.clear();
    saveState();
    resetEntryForm();
    resetAddressForm();
    render();
    alert("Import completed.");
  } catch {
    alert("Import failed. Use a valid JSON export file.");
  } finally {
    importInput.value = "";
  }
});

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return normalizeState(JSON.parse(raw));
  } catch {}

  for (const key of LEGACY_KEYS) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      return normalizeState(JSON.parse(raw));
    } catch {}
  }

  return normalizeState(null);
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function normalizeState(raw) {
  const fallbackWorkspace = {
    id: "main",
    name: "Main",
    createdAt: Date.now()
  };

  const workspaces = Array.isArray(raw?.workspaces) && raw.workspaces.length
    ? raw.workspaces.map(normalizeWorkspace).filter(Boolean)
    : [fallbackWorkspace];

  const workspaceIds = new Set(workspaces.map((item) => item.id));
  const currentWorkspaceId = workspaceIds.has(raw?.currentWorkspaceId)
    ? raw.currentWorkspaceId
    : workspaces[0].id;

  const entriesSource = Array.isArray(raw)
    ? raw
    : Array.isArray(raw?.entries)
      ? raw.entries
      : [];

  const addressSource = Array.isArray(raw?.addressBook) ? raw.addressBook : [];

  const entries = entriesSource
    .map((item) => normalizeEntry(item, currentWorkspaceId))
    .filter(Boolean)
    .map((item) => ({
      ...item,
      workspaceId: workspaceIds.has(item.workspaceId) ? item.workspaceId : currentWorkspaceId
    }));

  const addressBook = addressSource
    .map((item) => normalizeAddress(item, currentWorkspaceId))
    .filter(Boolean)
    .map((item) => ({
      ...item,
      workspaceId: workspaceIds.has(item.workspaceId) ? item.workspaceId : currentWorkspaceId
    }));

  return {
    version: 4,
    currentWorkspaceId,
    workspaces,
    addressBook,
    entries
  };
}

function normalizeWorkspace(item) {
  if (!item || typeof item !== "object") return null;

  return {
    id: String(item.id || crypto.randomUUID()),
    name: String(item.name || "Workspace"),
    createdAt: Number(item.createdAt || Date.now())
  };
}

function normalizeAddress(item, fallbackWorkspaceId) {
  if (!item || typeof item !== "object") return null;

  return {
    id: String(item.id || crypto.randomUUID()),
    workspaceId: String(item.workspaceId || fallbackWorkspaceId),
    label: String(item.label || "Wallet"),
    address: String(item.address || ""),
    network: String(item.network || "Arc Testnet"),
    notes: String(item.notes || ""),
    createdAt: Number(item.createdAt || Date.now())
  };
}

function normalizeEntry(item, fallbackWorkspaceId) {
  if (!item || typeof item !== "object") return null;

  return {
    id: String(item.id || crypto.randomUUID()),
    workspaceId: String(item.workspaceId || fallbackWorkspaceId),
    date: String(item.date || new Date().toISOString().slice(0, 10)),
    category: String(item.category || "other"),
    action: String(item.action || item.category || "other"),
    status: String(item.status || "completed"),
    network: String(item.network || "Arc Testnet"),
    txHash: String(item.txHash || ""),
    wallet: String(item.wallet || ""),
    details: String(item.details || ""),
    proof: String(item.proof || ""),
    createdAt: Number(item.createdAt || Date.now())
  };
}

function getCurrentWorkspace() {
  return state.workspaces.find((item) => item.id === state.currentWorkspaceId) || state.workspaces[0];
}

function getCurrentEntries() {
  return state.entries.filter((item) => item.workspaceId === state.currentWorkspaceId);
}

function getCurrentAddresses() {
  return state.addressBook.filter((item) => item.workspaceId === state.currentWorkspaceId);
}

function getEntryCreatedAt(id) {
  const item = state.entries.find((entry) => entry.id === id);
  return item ? item.createdAt : Date.now();
}

function getAddressCreatedAt(id) {
  const item = state.addressBook.find((entry) => entry.id === id);
  return item ? item.createdAt : Date.now();
}

function setDefaultEntryValues() {
  fields.date.value = new Date().toISOString().slice(0, 10);
  fields.network.value = "Arc Testnet";
  fields.status.value = "completed";
}

function resetEntryForm() {
  form.reset();
  fields.editId.value = "";
  setDefaultEntryValues();
  fields.savedWallet.value = "";
  submitBtn.textContent = "Add Entry";
  cancelEditBtn.hidden = true;
}

function resetAddressForm() {
  addressForm.reset();
  addressFields.editId.value = "";
  addressFields.network.value = "Arc Testnet";
  saveAddressBtn.textContent = "Add Address";
  cancelAddressEditBtn.hidden = true;
}

function startEditEntry(id) {
  const entry = state.entries.find((item) => item.id === id);
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
  fields.savedWallet.value = "";

  submitBtn.textContent = "Update Entry";
  cancelEditBtn.hidden = false;
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function startEditAddress(id) {
  const item = state.addressBook.find((entry) => entry.id === id);
  if (!item) return;

  addressFields.editId.value = item.id;
  addressFields.label.value = item.label;
  addressFields.address.value = item.address;
  addressFields.network.value = item.network;
  addressFields.notes.value = item.notes;

  saveAddressBtn.textContent = "Update Address";
  cancelAddressEditBtn.hidden = false;
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function deleteEntry(id) {
  if (!window.confirm("Delete this entry?")) return;
  state.entries = state.entries.filter((item) => item.id !== id);
  selectedEntryIds.delete(id);
  saveState();
  render();
}

function deleteAddress(id) {
  if (!window.confirm("Delete this address?")) return;
  state.addressBook = state.addressBook.filter((item) => item.id !== id);
  saveState();
  render();
}

function toggleSelected(id, checked) {
  if (checked) {
    selectedEntryIds.add(id);
  } else {
    selectedEntryIds.delete(id);
  }
  renderSelectedCount();
}

function getFilteredEntries() {
  return getCurrentEntries().filter((entry) => {
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
  renderWorkspaces();
  renderSavedWallets();
  renderNetworkOptions();
  renderAddressBook();
  renderStats();
  renderEntries();
  renderSelectedCount();
}

function renderWorkspaces() {
  const current = getCurrentWorkspace();

  workspaceSelect.innerHTML = state.workspaces
    .map(
      (item) =>
        `<option value="${escapeAttr(item.id)}">${escapeHtml(item.name)}</option>`
    )
    .join("");

  workspaceSelect.value = current.id;
  deleteWorkspaceBtn.disabled = state.workspaces.length === 1;
}

function renderSavedWallets() {
  const options = getCurrentAddresses()
    .map(
      (item) =>
        `<option value="${escapeAttr(item.id)}">${escapeHtml(item.label)} (${escapeHtml(shortWallet(item.address))})</option>`
    )
    .join("");

  fields.savedWallet.innerHTML =
    '<option value="">Select saved wallet</option>' + options;
}

function renderNetworkOptions() {
  const current = filterNetwork.value || "all";
  const networks = [...new Set(getCurrentEntries().map((item) => item.network).filter(Boolean))].sort();

  filterNetwork.innerHTML = [
    '<option value="all">All networks</option>',
    ...networks.map(
      (network) =>
        `<option value="${escapeAttr(network)}">${escapeHtml(network)}</option>`
    )
  ].join("");

  filterNetwork.value = networks.includes(current) ? current : "all";
}

function renderAddressBook() {
  const items = getCurrentAddresses();

  if (!items.length) {
    addressListEl.innerHTML = '<div class="empty">No saved addresses.</div>';
    return;
  }

  addressListEl.innerHTML = items
    .map(
      (item) => `
        <article class="entry">
          <div class="entry-head">
            <span class="badge">${escapeHtml(item.label)}</span>
            <div class="hero-actions">
              <button class="edit-address-btn" type="button" data-id="${item.id}">Edit</button>
              <button class="delete-address-btn" type="button" data-id="${item.id}">Delete</button>
            </div>
          </div>
          <p class="entry-text">${escapeHtml(item.address)}</p>
          <div class="entry-meta">
            <span>${escapeHtml(item.network)}</span>
            <span>${escapeHtml(item.notes || "No notes")}</span>
          </div>
        </article>
      `
    )
    .join("");

  document.querySelectorAll(".edit-address-btn").forEach((button) => {
    button.addEventListener("click", () => startEditAddress(button.dataset.id));
  });

  document.querySelectorAll(".delete-address-btn").forEach((button) => {
    button.addEventListener("click", () => deleteAddress(button.dataset.id));
  });
}

function renderStats() {
  const entries = getCurrentEntries();
  totalCount.textContent = String(entries.length);
  weekCount.textContent = String(getWeekCount(entries));
  topCategory.textContent = getTopCategory(entries);
}

function renderEntries() {
  const filtered = getFilteredEntries();

  if (!filtered.length) {
    entriesEl.innerHTML = '<div class="empty">No entries yet.</div>';
    return;
  }

  entriesEl.innerHTML = filtered
    .map((entry) => {
      const proofLine = entry.proof
        ? `<a href="${escapeAttr(entry.proof)}" target="_blank" rel="noreferrer">Proof link</a>`
        : "";
      const txLine = entry.txHash
        ? `<span>TX: ${shortHash(entry.txHash)}</span>`
        : "";
      const statusClass = `status-${escapeAttr(entry.status)}`;
      const label = getAddressLabel(entry.wallet);

      return `
        <article class="entry">
          <div class="entry-head">
            <label class="check-row">
              <input
                type="checkbox"
                class="select-entry"
                data-id="${entry.id}"
                ${selectedEntryIds.has(entry.id) ? "checked" : ""}
              />
              <span class="badge">${escapeHtml(entry.action)}</span>
            </label>
            <div class="hero-actions">
              <button class="edit-entry-btn" type="button" data-id="${entry.id}">Edit</button>
              <button class="delete-entry-btn" type="button" data-id="${entry.id}">Delete</button>
            </div>
          </div>

          <p class="entry-text">${escapeHtml(entry.details)}</p>

          <div class="entry-meta">
            <span>${escapeHtml(entry.date)}</span>
            <span>${escapeHtml(entry.network)}</span>
            <span class="status-pill ${statusClass}">${escapeHtml(entry.status)}</span>
            <span>${escapeHtml(label ? `${label}: ${shortWallet(entry.wallet)}` : shortWallet(entry.wallet))}</span>
            ${txLine}
            ${proofLine}
          </div>
        </article>
      `;
    })
    .join("");

  document.querySelectorAll(".delete-entry-btn").forEach((button) => {
    button.addEventListener("click", () => deleteEntry(button.dataset.id));
  });

  document.querySelectorAll(".edit-entry-btn").forEach((button) => {
    button.addEventListener("click", () => startEditEntry(button.dataset.id));
  });

  document.querySelectorAll(".select-entry").forEach((checkbox) => {
    checkbox.addEventListener("change", () => {
      toggleSelected(checkbox.dataset.id, checkbox.checked);
    });
  });
}

function renderSelectedCount() {
  const visibleIds = new Set(getCurrentEntries().map((item) => item.id));
  for (const id of [...selectedEntryIds]) {
    if (!visibleIds.has(id)) selectedEntryIds.delete(id);
  }
  selectedCount.textContent = String(selectedEntryIds.size);
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

function getAddressLabel(wallet) {
  if (!wallet) return "";
  const item = getCurrentAddresses().find(
    (entry) => entry.address.toLowerCase() === wallet.toLowerCase()
  );
  return item ? item.label : "";
}

function buildMarkdownReport(list) {
  const workspace = getCurrentWorkspace();
  const sorted = [...list].sort((a, b) => new Date(a.date) - new Date(b.date));

  const lines = [
    `# ${workspace.name} Activity Report`,
    "",
    `Generated: ${new Date().toISOString()}`,
    `Entries: ${sorted.length}`,
    "",
    "## Entries",
    ""
  ];

  for (const entry of sorted) {
    lines.push(`### ${entry.date} - ${entry.action}`);
    lines.push(`- Category: ${entry.category}`);
    lines.push(`- Status: ${entry.status}`);
    lines.push(`- Network: ${entry.network}`);
    lines.push(`- Wallet: ${entry.wallet}`);
    if (entry.txHash) lines.push(`- Tx Hash: ${entry.txHash}`);
    if (entry.proof) lines.push(`- Proof: ${entry.proof}`);
    lines.push(`- Notes: ${entry.details}`);
    lines.push("");
  }

  return lines.join("\n");
}

function toCsv(list) {
  const rows = [
    ["workspace", "date", "category", "action", "status", "network", "txHash", "wallet", "details", "proof", "createdAt"],
    ...list.map((entry) => [
      getCurrentWorkspace().name,
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

  return rows.map((row) => row.map(csvCell).join(",")).join("\n");
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

function slugify(value) {
  return String(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "") || "workspace";
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

function csvCell(value) {
  return `"${String(value ?? "").replace(/"/g, '""')}"`;
}

function escapeHtml(value) {
  const div = document.createElement("div");
  div.textContent = String(value ?? "");
  return div.innerHTML;
}

function escapeAttr(value) {
  return String(value ?? "").replace(/"/g, "&quot;");
}