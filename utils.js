// Санітизація
function escapeHTML(str = "") {
  return str.replace(
    /[&<>"']/g,
    (s) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[
        s
      ])
  );
}

function encodeBase64(str) {
  const encoder = new TextEncoder();
  const bytes = encoder.encode(str);

  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);

  return btoa(binary);
}

function decodeBase64(b64) {
  try {
    const binary = atob(b64);
    const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
    const decoder = new TextDecoder();

    return decoder.decode(bytes);
  } catch {
    return ""; // пошкоджені дані
  }
}

// хелпери для storage
async function getNotesForDomain(domain) {
  const key = `notes:${domain}`;
  const data = await chrome.storage.local.get(key);

  return Array.isArray(data[key]) ? data[key] : [];
}

async function setNotesForDomain(domain, notes) {
  const key = `notes:${domain}`;

  await chrome.storage.local.set({ [key]: notes });
}

function nowIso() {
  return new Date().toISOString();
}

function formatLocal(tsIso) {
  try {
    const date = new Date(tsIso);

    return date.toLocaleString([], {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return tsIso;
  }
}
