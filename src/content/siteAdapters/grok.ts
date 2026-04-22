import type { SiteAdapter } from "./types";
import {
  closestMatching,
  firstVisibleAncestor,
  isVisible,
  nearestMountContainer,
  readTextValue,
  triggerFormSend,
  writeTextValue
} from "./shared";

function findInput() {
  const editors = Array.from(
    document.querySelectorAll("div.tiptap.ProseMirror[contenteditable='true']")
  );
  const visible = editors.find((el) => isVisible(el));

  return (
    visible ||
    document.querySelector("form div.tiptap.ProseMirror[contenteditable='true']") ||
    document.querySelector("div.tiptap.ProseMirror[contenteditable='true']") ||
    document.querySelector("textarea[aria-label*='Grok']") ||
    document.querySelector("textarea")
  );
}

function findMountTarget() {
  const input = findInput();
  if (!input) return null;

  return (
    nearestMountContainer(input, 2) ||
    firstVisibleAncestor(input, ["[role='form']", "form"]) ||
    input.parentElement ||
    closestMatching(
      input,
      (el) =>
        typeof el.className === "string" &&
        el.className.includes("relative z-10")
    ) ||
    closestMatching(
      input,
      (el) =>
        el.tagName === "DIV" &&
        typeof el.className === "string" &&
        el.className.includes("w-full mb-3")
    ) ||
    nearestMountContainer(input, 3)
  );
}

function isSendButton(el: Element | null) {
  if (!(el instanceof HTMLElement)) return false;
  if (el.getAttribute("type") === "submit") return true;
  if (el.getAttribute("aria-label")?.match(/send/i)) return true;
  if (el.getAttribute("data-testid")?.match(/send/i)) return true;
  if (el.getAttribute("title")?.match(/send/i)) return true;
  return false;
}

export const grokAdapter: SiteAdapter = {
  id: "grok",
  matchesHost: (host) => host.includes("grok.com"),
  findInput,
  findMountTarget,
  readValue: readTextValue,
  writeValue: writeTextValue,
  isSendButton,
  triggerSend: (input, sourceTarget) => {
    triggerFormSend(input, sourceTarget, isSendButton);
  }
};
