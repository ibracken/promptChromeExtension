import React from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";

function Popup() {
  function openSupport() {
    chrome.runtime.sendMessage({ type: "OPEN_PAYMENT" });
  }

  return (
    <div className="popup">
      <div className="title">PromptFix</div>
      <div className="subtitle">Upgrade prompts inside ChatGPT and Claude.</div>
      <button className="btn" onClick={() => chrome.runtime.openOptionsPage()}>
        Settings
      </button>
      <button className="btn primary" onClick={openSupport}>
        Support PromptFix
      </button>
    </div>
  );
}

const root = createRoot(document.getElementById("root")!);
root.render(<Popup />);

