const els = {
  domain: document.getElementById("domain"),
  list: document.getElementById("list"),
  addBtn: document.getElementById("addBtn"),
  cancelBtn: document.getElementById("cancelBtn"),
  dlg: document.getElementById("dlg"),
  form: document.getElementById("form"),
  noteText: document.getElementById("noteText"),
  itemTpl: document.getElementById("itemTpl"),
  search: document.getElementById("search"),
  exportBtn: document.getElementById("exportBtn"),
  settingsDlg: document.getElementById("settingsDlg"),
  settingsBtn: document.getElementById("settingsBtn"),
  toggleFab: document.getElementById("toggleFab"),
  closeSettings: document.getElementById("closeSettings"),
};

let CURRENT_DOMAIN = "";
let NOTES = []; // [{id, contentEnc, createdAt}]

init().catch(console.error);

async function init() {
  const tab = (
    await chrome.tabs.query({ active: true, currentWindow: true })
  )[0];

  const url = new URL(tab.url || "https://example.com");

  CURRENT_DOMAIN = url.hostname;
  els.domain.textContent = CURRENT_DOMAIN;

  NOTES = await getNotesForDomain(CURRENT_DOMAIN);
  render();

  // ui handlers
  els.addBtn.addEventListener("click", () => els.dlg.showModal());
  els.cancelBtn.addEventListener("click", () => {
    els.noteText.value = "";
    els.dlg.close();
  });
  els.form.addEventListener("submit", onSave);
  els.search.addEventListener("input", render);
  els.exportBtn.addEventListener("click", onExport);

  // закриття діалогу з backdrop click
  els.dlg.addEventListener("click", (e) => {
    const rect = els.dlg.getBoundingClientRect();

    if (
      e.clientX < rect.left ||
      e.clientX > rect.right ||
      e.clientY < rect.top ||
      e.clientY > rect.bottom
    ) {
      els.dlg.close();
    }
  });
}

async function onSave(e) {
  e.preventDefault();

  const raw = els.noteText.value.trim();
  if (!raw) return;

  const enc = encodeBase64(raw);

  const note = {
    id: crypto.randomUUID(),
    contentEnc: enc,
    createdAt: nowIso(),
  };

  NOTES.unshift(note);

  await setNotesForDomain(CURRENT_DOMAIN, NOTES);

  els.noteText.value = "";
  els.dlg.close();
  render();
}

function render() {
  const q = (els.search.value || "").toLowerCase().trim();
  els.list.innerHTML = "";

  const data = q
    ? NOTES.filter((n) => decodeBase64(n.contentEnc).toLowerCase().includes(q))
    : NOTES;

  if (!data.length) {
    const empty = document.createElement("div");

    empty.style.opacity = "0.8";
    empty.style.padding = "8px";
    empty.textContent = q
      ? "Нічого не знайдено"
      : 'Натисніть "+ Додати" щоб створити нотатку.';

    els.list.appendChild(empty);

    return;
  }

  for (const n of data) {
    const node = els.itemTpl.content.cloneNode(true);

    const timeEl = node.querySelector(".time");
    const delBtn = node.querySelector(".del");
    const contentEl = node.querySelector(".content");

    timeEl.textContent = formatLocal(n.createdAt);
    contentEl.textContent = decodeBase64(n.contentEnc);

    delBtn.addEventListener("click", async () => {
      if (!confirm("Видалити нотатку?")) return;

      NOTES = NOTES.filter((x) => x.id !== n.id);

      await setNotesForDomain(CURRENT_DOMAIN, NOTES);

      render();
    });

    els.list.appendChild(node);
  }
}

function onExport() {
  const decoded = NOTES.map((n) => ({
    id: n.id,
    content: decodeBase64(n.contentEnc),
    createdAt: n.createdAt,
    domain: CURRENT_DOMAIN,
  }));

  const blob = new Blob([JSON.stringify(decoded, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");

  a.href = url;
  a.download = `secure-notes-${CURRENT_DOMAIN}.json`;
  a.click();

  URL.revokeObjectURL(url);
}

// !!settings handlers

settingsBtn.addEventListener("click", () => {
  settingsDlg.showModal();
});

closeSettings.addEventListener("click", () => {
  settingsDlg.close();
});

// стан перемикача
chrome.storage.local.get(["showFab"], (res) => {
  toggleFab.checked = res.showFab ?? true;
});

toggleFab.addEventListener("change", () => {
  const show = toggleFab.checked;

  chrome.storage.local.set({ showFab: show });

  chrome.runtime.sendMessage({ type: "TOGGLE_FAB", show });
});
