import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";

function Options() {
  const [premium, setPremium] = useState(false);
  const [status, setStatus] = useState("Checking license...");

  function checkLicense() {
    chrome.runtime.sendMessage({ type: "GET_PREMIUM" }, (res) => {
      if (chrome.runtime.lastError) {
        setStatus("Unable to verify license right now.");
        return;
      }
      const next = Boolean(res?.premium);
      setPremium(next);
      setStatus(res?.error || (next ? "Pro unlocked" : "Free tier"));
    });
  }

  function openPayment() {
    chrome.runtime.sendMessage({ type: "OPEN_PAYMENT" }, (res) => {
      if (chrome.runtime.lastError) {
        setStatus("Unable to open support page right now.");
        return;
      }
      if (res?.ok === false) {
        setStatus(res.error || "Unable to open support page right now.");
        return;
      }
      setStatus("Support page opened.");
    });
  }

  useEffect(() => {
    checkLicense();
  }, []);

  return (
    <div className="wrap">
      <h1>PromptFix Settings</h1>
      <div className="card">
        <div className="row">
          <strong>Current plan:</strong> {premium ? "Pro" : "Free"}
        </div>
        <div className="hint">{status}</div>
      </div>
      <div className="card">
        <button className="btn primary" onClick={openPayment}>
          Support PromptFix
        </button>
        <button className="btn" onClick={checkLicense}>
          Check License
        </button>
        <div className="hint">Use support to help fund development. Check License refreshes your current plan.</div>
      </div>
    </div>
  );
}

const root = createRoot(document.getElementById("root")!);
root.render(<Options />);

