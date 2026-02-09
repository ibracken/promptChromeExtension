import React from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";

function Popup() {
  return (
    <div className="popup">
      <div className="title">Prompt Sidebar</div>
      <div className="subtitle">Upgrade prompts inside ChatGPT and Claude.</div>
      <button className="btn" onClick={() => chrome.runtime.openOptionsPage()}>
        Settings
      </button>
      <button className="btn primary" onClick={() => window.open("https://extensionpay.com/") }>
        Upgrade to Pro
      </button>
    </div>
  );
}

const root = createRoot(document.getElementById("root")!);
root.render(<Popup />);
