import type { SiteAdapter } from "./types";
import {
  canMountInto,
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
    document.querySelectorAll("div[contenteditable='true'][data-testid='chat-input']")
  );
  const visible = editors.find((el) => isVisible(el));

  return (
    visible ||
    document.querySelector("div[contenteditable='true'][data-testid='composer-input']") ||
    document.querySelector("div[contenteditable='true'][role='textbox']") ||
    document.querySelector("div[contenteditable='true']")
  );
}

function findMountTarget() {
  const input = findInput();
  if (!input) return null;

  return (
    closestMatching(
      input,
      (el) =>
        el.getAttribute("data-testid") === "chat-input-container" ||
        el.getAttribute("data-testid") === "composer"
    ) ||
    nearestMountContainer(input, 4) ||
    firstVisibleAncestor(input, [
      "[data-testid='chat-input-container']",
      "[data-testid='composer']",
      "form"
    ]) ||
    input.parentElement?.parentElement ||
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

function isEnabledButton(el: Element | null): el is HTMLButtonElement {
  return el instanceof HTMLButtonElement && !el.disabled && el.getAttribute("aria-disabled") !== "true";
}

function dispatchClaudeEnter(input: HTMLElement) {
  const baseEvent = {
    key: "Enter",
    code: "Enter",
    keyCode: 13,
    which: 13,
    bubbles: true,
    cancelable: true
  };

  const keydownAccepted = input.dispatchEvent(new KeyboardEvent("keydown", baseEvent));
  input.dispatchEvent(new KeyboardEvent("keypress", baseEvent));
  input.dispatchEvent(new KeyboardEvent("keyup", baseEvent));
  return keydownAccepted;
}

function activateClaudeButton(button: HTMLButtonElement) {
  const rect = button.getBoundingClientRect();
  const pointerInit = {
    bubbles: true,
    cancelable: true,
    composed: true,
    button: 0,
    buttons: 1,
    clientX: rect.left + rect.width / 2,
    clientY: rect.top + rect.height / 2
  };

  button.dispatchEvent(new PointerEvent("pointerdown", pointerInit));
  button.dispatchEvent(new MouseEvent("mousedown", pointerInit));
  button.dispatchEvent(new PointerEvent("pointerup", pointerInit));
  button.dispatchEvent(new MouseEvent("mouseup", pointerInit));
  button.click();
}

function findClaudeSendButton(input: HTMLElement | null, sourceTarget?: HTMLElement | null) {
  if (isEnabledButton(sourceTarget) && isSendButton(sourceTarget)) {
    return sourceTarget;
  }

  const scope =
    input?.closest("[data-testid='chat-input-container']") ||
    input?.closest("[data-testid='composer']") ||
    input?.closest("form") ||
    document.body;

  const candidates = Array.from(
    scope?.querySelectorAll?.(
      "button[type='submit'], button[aria-label*='Send' i], button[data-testid*='send' i], button[title*='Send' i]"
    ) ?? []
  );

  return (
    candidates.find((candidate) => isEnabledButton(candidate) && isVisible(candidate)) as HTMLButtonElement | undefined
  ) ?? null;
}

async function waitForClaudeSendButton(input: HTMLElement | null, sourceTarget?: HTMLElement | null) {
  const startedAt = Date.now();

  return await new Promise<HTMLButtonElement | null>((resolve) => {
    const tick = () => {
      const button = findClaudeSendButton(input, sourceTarget);
      if (button) {
        resolve(button);
        return;
      }

      if (Date.now() - startedAt >= 1500) {
        resolve(null);
        return;
      }

      window.requestAnimationFrame(tick);
    };

    tick();
  });
}

export const claudeAdapter: SiteAdapter = {
  id: "claude",
  matchesHost: (host) => host.includes("claude.ai"),
  findInput,
  findMountTarget,
  readValue: readTextValue,
  writeValue: writeTextValue,
  isSendButton,
  triggerSend: async (input, sourceTarget) => {
    const elementInput = input instanceof HTMLElement ? input : null;
    if (elementInput) {
      elementInput.focus();
      const accepted = dispatchClaudeEnter(elementInput);
      if (!accepted) {
        return;
      }
    }

    const button = await waitForClaudeSendButton(elementInput, sourceTarget ?? null);
    if (button) {
      activateClaudeButton(button);
      return;
    }

    triggerFormSend(input, sourceTarget, isSendButton);
  }
};
