import ExtPay from "extpay";

const EXTENSIONPAY_EXTENSION_ID = "promptfix";
const isExtPayConfigured =
  EXTENSIONPAY_EXTENSION_ID !== "REPLACE_WITH_YOUR_EXTENSIONPAY_ID";

function getExtPay() {
  return ExtPay(EXTENSIONPAY_EXTENSION_ID);
}

if (isExtPayConfigured) {
  getExtPay().startBackground();
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (sender.id !== chrome.runtime.id) {
    return;
  }

  if (!message || typeof message.type !== "string") return;

  if (message.type === "GET_PREMIUM") {
    (async () => {
      try {
        if (!isExtPayConfigured) {
          sendResponse({
            premium: false,
            error: "ExtensionPay is not configured yet."
          });
          return;
        }
        const user = await getExtPay().getUser();
        sendResponse({ premium: Boolean(user.paid) });
      } catch (_err) {
        sendResponse({
          premium: false,
          error: "Unable to verify premium status. Check your network and try again."
        });
      }
    })();
    return true;
  }

  if (message.type === "OPEN_PAYMENT") {
    (async () => {
      try {
        if (!isExtPayConfigured) {
          sendResponse({
            ok: false,
            error: "ExtensionPay is not configured yet."
          });
          return;
        }
        await getExtPay().openPaymentPage();
        sendResponse({ ok: true });
      } catch (_err) {
        sendResponse({
          ok: false,
          error: "Unable to open payment page right now. Please try again."
        });
      }
    })();
    return true;
  }
});
