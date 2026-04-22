import React from "react";
import { createRoot, Root } from "react-dom/client";
import App from "./App";
import styles from "./styles.css?inline";
import { resolveSiteAdapter } from "./siteAdapters";

const rootId = "prompt-sidebar-root";

let appRoot: Root | null = null;
let hostEl: HTMLDivElement | null = null;
let containerEl: HTMLDivElement | null = null;
let mountScheduled = false;

function ensureHost() {
  if (hostEl?.isConnected && containerEl?.isConnected) {
    return { host: hostEl, container: containerEl };
  }

  let host = document.getElementById(rootId) as HTMLDivElement | null;
  if (!host) {
    host = document.createElement("div");
    host.id = rootId;
    host.dataset.absurdlyRoot = "true";
  }

  host.dataset.host = window.location.host;

  let styleEl = host.querySelector("style[data-absurdly-style='true']") as HTMLStyleElement | null;
  if (!styleEl) {
    styleEl = document.createElement("style");
    styleEl.dataset.absurdlyStyle = "true";
    styleEl.textContent = styles;
    host.appendChild(styleEl);
  }

  let container = host.querySelector("div[data-absurdly-container='true']") as HTMLDivElement | null;
  if (!container) {
    container = document.createElement("div");
    container.dataset.absurdlyContainer = "true";
    host.appendChild(container);
  }

  hostEl = host;
  containerEl = container;
  return { host, container };
}

function mountExtension() {
  mountScheduled = false;

  if (!document.body) {
    scheduleMount();
    return;
  }

  const target = resolveSiteAdapter().findMountTarget();
  if (!target) {
    scheduleMount();
    return;
  }

  const previousContainer = containerEl;
  const { host, container } = ensureHost();
  const firstChild = target.firstChild;
  if (!host.isConnected || host.parentElement !== target || host !== firstChild) {
    target.insertBefore(host, firstChild);
  }

  if (appRoot && previousContainer && previousContainer !== container) {
    appRoot.unmount();
    appRoot = null;
  }

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
  scheduleMount();
});

observer.observe(document.documentElement, {
  childList: true,
  subtree: true
});

window.addEventListener("pageshow", scheduleMount);
window.addEventListener("focus", scheduleMount, true);
