import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";

function Options() {
  const [premium, setPremium] = useState(false);

  useEffect(() => {
    chrome.storage.local.get(["premium"], (res) => {
      setPremium(Boolean(res.premium));
    });
  }, []);

  function togglePremium() {
    const next = !premium;
    setPremium(next);
    chrome.storage.local.set({ premium: next });
  }

  return (
    <div className="wrap">
      <h1>Prompt Sidebar Settings</h1>
      <div className="card">
        <div className="row">
          <label htmlFor="premium-toggle">Premium (temporary manual unlock)</label>
          <input
            id="premium-toggle"
            type="checkbox"
            checked={premium}
            onChange={togglePremium}
          />
        </div>
        <div className="hint">
          Use this until ExtensionPay is wired. Disable for normal free-tier behavior.
        </div>
      </div>
      <div className="card">
        <button className="btn primary" onClick={() => window.open("https://extensionpay.com/") }>
          Upgrade to Pro
        </button>
        <div className="hint">Opens ExtensionPay checkout.</div>
      </div>
    </div>
  );
}

const root = createRoot(document.getElementById("root")!);
root.render(<Options />);
