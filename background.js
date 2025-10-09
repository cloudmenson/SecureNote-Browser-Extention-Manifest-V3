chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg?.type === "OPEN_POPUP") {
    chrome.action.openPopup().catch((err) => {
      console.err("Error:", err);
    });

    sendResponse({ ok: true });
  }

  if (msg?.type === "TOGGLE_FAB") {
    // надсилаємо всім вкладам повідомлення про те що стан кнопки "+" змінено
    chrome.tabs.query({}, (tabs) => {
      for (const tab of tabs) {
        if (tab.id && /^https?:/.test(tab.url)) {
          chrome.tabs
            .sendMessage(tab.id, {
              type: "TOGGLE_FAB",
              show: msg.show,
            })
            // ігноруємо вкладки без скрипта
            .catch(() => {});
        }
      }
    });
  }
});
