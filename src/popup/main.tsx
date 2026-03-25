import React from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";

function Popup() {
  function openSupport() {
    chrome.runtime.sendMessage({ type: "OPEN_PAYMENT" });
  }

  return (
    <div className="popup">
      <div className="title">Absurdly</div>
      <div className="subtitle">Turn ridiculous scenarios into deadpan comedy prompts.</div>
      <button className="btn" onClick={() => chrome.runtime.openOptionsPage()}>
        Voice Settings
      </button>
      <button className="btn primary" onClick={openSupport}>
        Unlock More Voices
      </button>
    </div>
  );
}

const root = createRoot(document.getElementById("root")!);
root.render(<Popup />);

