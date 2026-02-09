chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (!message || !message.type) return;

  if (message.type === "GET_PREMIUM") {
    chrome.storage.local.get(["premium"], (res) => {
      sendResponse({ premium: Boolean(res.premium) });
    });
    return true;
  }

  if (message.type === "SET_PREMIUM") {
    chrome.storage.local.set({ premium: Boolean(message.value) }, () => {
      sendResponse({ ok: true });
    });
    return true;
  }
});
