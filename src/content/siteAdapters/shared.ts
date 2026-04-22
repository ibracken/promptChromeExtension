import type { EditableEl } from "./types";

const EXTENSION_ROOT_ID = "prompt-sidebar-root";

export function isInsideExtensionUI(el: Element | null) {
  if (!el) return false;
  return Boolean(el.closest?.(`#${EXTENSION_ROOT_ID}`));
}

export function isEditable(el: Element | null): el is EditableEl {
  if (!el) return false;
  if (el instanceof HTMLTextAreaElement) return true;
  if (el instanceof HTMLInputElement) return true;
  return (el as HTMLElement).isContentEditable;
}

export function isVisible(el: Element) {
  const rect = el.getBoundingClientRect();
  if (rect.width < 4 || rect.height < 4) return false;
  const style = window.getComputedStyle(el);
  if (style.visibility === "hidden" || style.display === "none") return false;
  return true;
}

export function canMountInto(el: Element | null) {
  if (!el || !(el instanceof HTMLElement)) return false;
  if (isInsideExtensionUI(el)) return false;
  if (!isVisible(el)) return false;
  if (isEditable(el)) return false;
  return true;
}

export function closestMatching(
  base: Element | null,
  predicate: (el: HTMLElement) => boolean,
  maxLevels = 6
) {
  let current = base instanceof HTMLElement ? base : base?.parentElement ?? null;
  let level = 0;

  while (current && level < maxLevels) {
    if (predicate(current) && canMountInto(current)) {
      return current;
    }

    current = current.parentElement;
    level += 1;
  }

  return null;
}

export function nearestMountContainer(base: Element | null, maxLevels = 4) {
  let current = base?.parentElement ?? null;
  let level = 0;

  while (current && level < maxLevels) {
    if (canMountInto(current)) {
      return current;
    }

    current = current.parentElement;
    level += 1;
  }

  return null;
}

export function firstVisibleAncestor(base: Element | null, selectors: string[]) {
  if (!base) return null;

  for (const selector of selectors) {
    const candidate = base.closest(selector);
    if (candidate && canMountInto(candidate)) {
      return candidate;
    }
  }

  return null;
}

export function readTextValue(el: EditableEl | null) {
  if (!el) return "";
  if (el instanceof HTMLTextAreaElement || el instanceof HTMLInputElement) {
    return el.value || "";
  }
  return el.textContent || "";
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll("\"", "&quot;")
    .replaceAll("'", "&#39;");
}

export function escapeHtmlAttribute(value: string) {
  return escapeHtml(value);
}

function execInsertText(value: string) {
  try {
    const canInsert = document.queryCommandSupported?.("insertText");
    if (canInsert || "execCommand" in document) {
      document.execCommand("insertText", false, value);
      return true;
    }
  } catch {
    return false;
  }
  return false;
}

export function selectEditorContents(el: HTMLElement) {
  const selection = window.getSelection();
  if (!selection) return;
  selection.removeAllRanges();
  const range = document.createRange();
  range.selectNodeContents(el);
  selection.addRange(range);
}

export function replaceViaSelection(el: HTMLElement, value: string) {
  selectEditorContents(el);
  el.dispatchEvent(
    new InputEvent("beforeinput", {
      bubbles: true,
      cancelable: true,
      inputType: "insertText",
      data: value
    })
  );

  const inserted = execInsertText(value);
  if (!inserted) {
    el.textContent = value;
  }
}

export function isClaudeEditor(el: HTMLElement) {
  return (
    el.getAttribute("data-testid") === "chat-input" ||
    el.getAttribute("data-testid") === "composer-input"
  );
}

export function isProseMirrorEditor(el: HTMLElement) {
  if (isClaudeEditor(el)) return false;
  return (
    el.classList.contains("ProseMirror") ||
    el.classList.contains("tiptap") ||
    el.id === "prompt-textarea"
  );
}

function setProseMirrorValue(el: HTMLElement, value: string) {
  el.innerHTML = `<p>${escapeHtml(value)}</p>`;
}

const proseMirrorRepairTimers = new WeakMap<HTMLElement, number>();

function ensureValue(el: HTMLElement, value: string) {
  const current = el.textContent || "";
  const normalizedCurrent = current.trim();
  const normalizedValue = value.trim();

  if (!normalizedCurrent || normalizedCurrent === normalizedValue) {
    return;
  }

  if (document.activeElement !== el && !el.contains(document.activeElement)) {
    return;
  }

  if (normalizedCurrent !== normalizedValue) {
    setProseMirrorValue(el, value);
  }
}

function scheduleProseMirrorRepair(el: HTMLElement, value: string) {
  const existingTimer = proseMirrorRepairTimers.get(el);
  if (typeof existingTimer === "number") {
    window.clearTimeout(existingTimer);
  }

  requestAnimationFrame(() => ensureValue(el, value));

  const timerId = window.setTimeout(() => {
    ensureValue(el, value);
    proseMirrorRepairTimers.delete(el);
  }, 50);

  proseMirrorRepairTimers.set(el, timerId);
}

export function writeTextValue(el: EditableEl | null, value: string) {
  if (!el) return;

  if (el instanceof HTMLTextAreaElement || el instanceof HTMLInputElement) {
    el.value = value;
    el.dispatchEvent(new Event("input", { bubbles: true }));
    return;
  }

  if (!el.isContentEditable) return;

  el.focus();
  if (isClaudeEditor(el)) {
    replaceViaSelection(el, value);
  } else if (isProseMirrorEditor(el)) {
    replaceViaSelection(el, value);
    setProseMirrorValue(el, value);
    scheduleProseMirrorRepair(el, value);
  } else {
    replaceViaSelection(el, value);
  }

  el.dispatchEvent(
    new InputEvent("input", { bubbles: true, data: value, inputType: "insertText" })
  );
  el.dispatchEvent(new Event("change", { bubbles: true }));
  el.dispatchEvent(new KeyboardEvent("keyup", { bubbles: true }));
  el.dispatchEvent(new Event("input", { bubbles: true }));
}

export function triggerFormSend(
  input: EditableEl | null,
  sourceTarget: HTMLElement | null | undefined,
  isSendButton: (el: Element | null) => boolean
) {
  const sourceButton =
    sourceTarget instanceof HTMLButtonElement && isSendButton(sourceTarget)
      ? sourceTarget
      : null;

  const form =
    sourceButton?.form ||
    (input instanceof HTMLElement ? input.closest("form") : null) ||
    (sourceTarget?.closest?.("form") ?? null);

  const sendButton =
    sourceButton ||
    (form?.querySelector?.(
      "button[type='submit'], button[aria-label*='Send' i], button[data-testid*='send' i], button[title*='Send' i]"
    ) as HTMLButtonElement | null);

  if (sendButton) {
    sendButton.click();
    return;
  }

  if (form instanceof HTMLFormElement) {
    form.requestSubmit();
    return;
  }

  if (input instanceof HTMLElement) {
    input.dispatchEvent(
      new KeyboardEvent("keydown", {
        key: "Enter",
        bubbles: true
      })
    );
  }
}
