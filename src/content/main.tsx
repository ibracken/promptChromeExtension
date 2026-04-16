import React from "react";
import { createRoot, Root } from "react-dom/client";
import App from "./App";
import styles from "./styles.css?inline";

const rootId = "prompt-sidebar-root";

let appRoot: Root | null = null;
let mountScheduled = false;

function ensureHost() {
  if (!document.documentElement || !document.body) {
    return null;
  }

  let host = document.getElementById(rootId) as HTMLDivElement | null;
  if (!host) {
    host = document.createElement("div");
    host.id = rootId;
    host.dataset.absurdlyRoot = "true";
    host.style.position = "fixed";
    host.style.left = "0";
    host.style.top = "0";
    host.style.width = "0";
    host.style.height = "0";
    host.style.pointerEvents = "auto";
    host.style.zIndex = "2147483647";
    document.documentElement.appendChild(host);
  }

  return host;
}

function ensureStyle(host: HTMLDivElement) {
  let styleEl = host.querySelector("style[data-absurdly-style='true']") as HTMLStyleElement | null;
  if (!styleEl) {
    styleEl = document.createElement("style");
    styleEl.dataset.absurdlyStyle = "true";
    styleEl.textContent = styles;
    host.appendChild(styleEl);
  }
}

function ensureContainer(host: HTMLDivElement) {
  let container = host.querySelector("div[data-absurdly-container='true']") as HTMLDivElement | null;
  if (!container) {
    container = document.createElement("div");
    container.dataset.absurdlyContainer = "true";
    container.style.position = "fixed";
    container.style.left = "0";
    container.style.top = "0";
    container.style.width = "0";
    container.style.height = "0";
    container.style.pointerEvents = "auto";
    host.appendChild(container);
  }
  return container;
}

function mountExtension() {
  mountScheduled = false;

  const host = ensureHost();
  if (!host) {
    return;
  }

  ensureStyle(host);
  const container = ensureContainer(host);

  if (!appRoot) {
    appRoot = createRoot(container);
    appRoot.render(<App />);
  }
}

function scheduleMount() {
  if (mountScheduled) return;
  mountScheduled = true;
  window.requestAnimationFrame(mountExtension);
}

scheduleMount();

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", scheduleMount, { once: true });
}

const observer = new MutationObserver(() => {
  const host = document.getElementById(rootId);
  if (!host || !document.body) {
    scheduleMount();
  }
});

observer.observe(document.documentElement, {
  childList: true,
  subtree: true
});

window.addEventListener("pageshow", scheduleMount);
