(function InjectTab() {
  if (window.__secureNoteFabInjected) return;
  window.__secureNoteFabInjected = true;

  const host = document.createElement("div");
  host.style.all = "initial"; // ізоляція від css сторінки

  document.documentElement.appendChild(host);

  const shadow = host.attachShadow({ mode: "open" });

  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = chrome.runtime.getURL("content.css");

  const btn = document.createElement("button");

  btn.className = "secure-note-fab";
  btn.setAttribute("title", "Додати нотатку");
  btn.textContent = "+";
  btn.style.display = "none";

  shadow.append(link, btn);

  // поточний стан FAB при завантаженні
  chrome.storage.local.get(["showFab"], (res) => {
    const show = res.showFab ?? true;
    btn.style.display = show ? "flex" : "none";
  });

  btn.addEventListener("click", () => {
    chrome.runtime.sendMessage({ type: "OPEN_POPUP" }, () => {});
  });

  chrome.runtime.onMessage.addListener((msg) => {
    if (msg.type === "TOGGLE_FAB") {
      btn.style.display = msg.show ? "flex" : "none";
    }
  });
})();
