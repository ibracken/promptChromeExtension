import type { SiteAdapter } from "./types";
import {
  canMountInto,
  escapeHtmlAttribute,
  firstVisibleAncestor,
  isVisible,
  nearestMountContainer,
  readTextValue,
  selectEditorContents,
  triggerFormSend,
  writeTextValue
} from "./shared";

function findInput() {
  const editors = Array.from(
    document.querySelectorAll("div#prompt-textarea.ProseMirror[contenteditable='true']")
  );
  const visible = editors.find((el) => isVisible(el));

  return (
    visible ||
    document.querySelector("textarea#prompt-textarea") ||
    document.querySelector("textarea[placeholder*='Message']") ||
    document.querySelector("textarea[aria-label*='Message']") ||
    document.querySelector("textarea")
  );
}

function findMountTarget() {
  const input = findInput();
  if (!input) return null;

  const form = input.closest("form");
  const formChildren =
    form instanceof HTMLElement
      ? Array.from(form.children).filter((child) => canMountInto(child))
      : [];
  const visibleFormBody = formChildren.find((child) => isVisible(child));
  const gridShell =
    visibleFormBody instanceof HTMLElement
      ? Array.from(visibleFormBody.children).find(
          (child) =>
            child instanceof HTMLElement &&
            canMountInto(child) &&
            typeof child.className === "string" &&
            child.className.includes("grid-cols-[auto_1fr_auto]")
        ) ?? null
      : null;

  return (
    (gridShell as HTMLElement | null) ||
    (visibleFormBody as HTMLElement | null) ||
    (form instanceof HTMLElement && canMountInto(form) ? form : null) ||
    nearestMountContainer(input, 3) ||
    firstVisibleAncestor(input, [
      "[data-testid='composer']",
      "form",
      "main form",
      "section form"
    ]) ||
    input.parentElement
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

function clearChatGPTEditor(input: HTMLElement) {
  const placeholderNode = input.querySelector("p[data-placeholder]");
  const placeholder =
    placeholderNode?.getAttribute("data-placeholder") ||
    "Ask anything";

  input.focus();
  selectEditorContents(input);
  input.dispatchEvent(
    new InputEvent("beforeinput", {
      bubbles: true,
      cancelable: true,
      inputType: "deleteContentBackward"
    })
  );

  try {
    document.execCommand("delete", false);
  } catch {
    // Fall back to direct DOM replacement below.
  }

  input.innerHTML = `<p data-placeholder="${escapeHtmlAttribute(placeholder)}" class="placeholder"><br class="ProseMirror-trailingBreak"></p>`;
  input.dispatchEvent(
    new InputEvent("input", {
      bubbles: true,
      inputType: "deleteContentBackward"
    })
  );
  input.dispatchEvent(new Event("change", { bubbles: true }));
}

export const chatgptAdapter: SiteAdapter = {
  id: "chatgpt",
  matchesHost: (host) => host.includes("chatgpt.com") || host.includes("chat.openai.com"),
  findInput,
  findMountTarget,
  readValue: readTextValue,
  writeValue: (input, value) => {
    if (input instanceof HTMLElement && input.id === "prompt-textarea" && !value.trim()) {
      clearChatGPTEditor(input);
      return;
    }

    writeTextValue(input, value);
  },
  isSendButton,
  triggerSend: (input, sourceTarget) => {
    triggerFormSend(input, sourceTarget, isSendButton);
  }
};
