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
      setStatus(res?.error || (next ? "All voices unlocked" : "Flagship free"));
    });
  }

  function openPayment() {
    chrome.runtime.sendMessage({ type: "OPEN_PAYMENT" }, (res) => {
      if (chrome.runtime.lastError) {
        setStatus("Unable to open unlock page right now.");
        return;
      }
      if (res?.ok === false) {
        setStatus(res.error || "Unable to open unlock page right now.");
        return;
      }
      setStatus("Unlock page opened.");
    });
  }

  useEffect(() => {
    checkLicense();
  }, []);

  return (
    <div className="wrap">
      <h1>Absurdly Voice Settings</h1>
      <div className="card">
        <div className="row">
          <strong>Current plan:</strong> {premium ? "All Voices" : "Flagship Free"}
        </div>
        <div className="hint">{status}</div>
      </div>
      <div className="card">
        <button className="btn primary" onClick={openPayment}>
          Unlock More Voices
        </button>
        <button className="btn" onClick={checkLicense}>
          Refresh Access
        </button>
        <div className="hint">The free plan includes the flagship deadpan voice. Unlock adds the full comedy lineup.</div>
      </div>
    </div>
  );
}

const root = createRoot(document.getElementById("root")!);
root.render(<Options />);

