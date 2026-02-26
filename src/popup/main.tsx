import React from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";

function Popup() {
  function openPayment() {
    chrome.runtime.sendMessage({ type: "OPEN_PAYMENT" });
  }

  return (
    <div className="popup">
      <div className="title">PromptFix</div>
      <div className="subtitle">Upgrade prompts inside ChatGPT and Claude.</div>
      <button className="btn" onClick={() => chrome.runtime.openOptionsPage()}>
        Settings
      </button>
      <button className="btn primary" onClick={openPayment}>
        Upgrade to Pro
      </button>
    </div>
  );
}

const root = createRoot(document.getElementById("root")!);
root.render(<Popup />);

