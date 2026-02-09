import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import styles from "./styles.css?inline";

const rootId = "prompt-sidebar-root";

function ensureRoot() {
  let host = document.getElementById(rootId);
  if (host) return host;
  host = document.createElement("div");
  host.id = rootId;
  const bodyStyle = window.getComputedStyle(document.body);
  const inputEl =
    (document.querySelector("div[contenteditable='true'][data-testid='chat-input']") ||
      document.querySelector("div#prompt-textarea.ProseMirror[contenteditable='true']") ||
      document.querySelector("textarea#prompt-textarea")) as HTMLElement | null;
  const inputStyle = inputEl ? window.getComputedStyle(inputEl) : null;
  const fontFamily = inputStyle?.fontFamily || bodyStyle.fontFamily;
  const fontSize = inputStyle?.fontSize || bodyStyle.fontSize;
  host.style.position = "fixed";
  host.style.left = "0";
  host.style.top = "0";
  host.style.width = "0";
  host.style.height = "0";
  host.style.pointerEvents = "auto";
  host.style.fontFamily = fontFamily;
  host.style.color = bodyStyle.color;
  host.style.fontSize = fontSize;
  host.style.zIndex = "2147483647";
  document.documentElement.appendChild(host);
  return host;
}

const host = ensureRoot();
const shadow = host.attachShadow({ mode: "open" });
const styleEl = document.createElement("style");
styleEl.textContent = styles;
shadow.appendChild(styleEl);

const container = document.createElement("div");
container.style.position = "fixed";
container.style.left = "0";
container.style.top = "0";
container.style.width = "0";
container.style.height = "0";
container.style.pointerEvents = "auto";
shadow.appendChild(container);

const root = createRoot(container);
root.render(<App />);
