export type EditableEl = HTMLTextAreaElement | HTMLInputElement | HTMLElement;
const EXTENSION_ROOT_ID = "prompt-sidebar-root";

function isInsideExtensionUI(el: Element | null) {
  if (!el) return false;
  return Boolean(el.closest?.(`#${EXTENSION_ROOT_ID}`));
}

function isEditable(el: Element | null): el is EditableEl {
  if (!el) return false;
  if (el instanceof HTMLTextAreaElement) return true;
  if (el instanceof HTMLInputElement) return true;
  return (el as HTMLElement).isContentEditable;
}

function isVisible(el: Element) {
  const rect = el.getBoundingClientRect();
  if (rect.width < 4 || rect.height < 4) return false;
  const style = window.getComputedStyle(el);
  if (style.visibility === "hidden" || style.display === "none") return false;
  return true;
}

function findChatGPTInput() {
  const gptEditors = Array.from(
    document.querySelectorAll("div#prompt-textarea.ProseMirror[contenteditable='true']")
  );
  const visibleGpt = gptEditors.find((el) => isVisible(el));
  return (
    visibleGpt ||
    document.querySelector("textarea#prompt-textarea") ||
    document.querySelector("textarea[placeholder*='Message']") ||
    document.querySelector("textarea[aria-label*='Message']") ||
    document.querySelector("textarea")
  );
}

function findClaudeInput() {
  const claudeEditors = Array.from(
    document.querySelectorAll("div[contenteditable='true'][data-testid='chat-input']")
  );
  const visibleClaude = claudeEditors.find((el) => isVisible(el));
  return (
    visibleClaude ||
    document.querySelector("div[contenteditable='true'][data-testid='composer-input']") ||
    document.querySelector("div[contenteditable='true'][role='textbox']") ||
    document.querySelector("div[contenteditable='true']")
  );
}

function findGrokInput() {
  const grokEditors = Array.from(
    document.querySelectorAll("div.tiptap.ProseMirror[contenteditable='true']")
  );
  const visibleGrok = grokEditors.find((el) => isVisible(el));
  return (
    visibleGrok ||
    document.querySelector("form div.tiptap.ProseMirror[contenteditable='true']") ||
    document.querySelector("div.tiptap.ProseMirror[contenteditable='true']")
  );
}

export function getActiveInput(): EditableEl | null {
  const active = document.activeElement;
  if (isEditable(active) && !isInsideExtensionUI(active)) return active;
  const selection = window.getSelection();
  const anchor = selection?.anchorNode as HTMLElement | null;
  if (anchor) {
    const parentEl =
      anchor.nodeType === Node.ELEMENT_NODE ? anchor : anchor.parentElement;
    const editable = parentEl?.closest?.("[contenteditable='true']");
    if (editable && isEditable(editable) && !isInsideExtensionUI(editable)) return editable;
  }
  const isGrokHost = window.location.host.includes("grok.com");
  const isClaudeHost = window.location.host.includes("claude.ai");
  if (isGrokHost) {
    const grok = findGrokInput();
    if (grok && isEditable(grok) && !isInsideExtensionUI(grok)) return grok;
    const gpt = findChatGPTInput();
    if (gpt && isEditable(gpt) && !isInsideExtensionUI(gpt)) return gpt;
    const claude = findClaudeInput();
    if (claude && isEditable(claude) && !isInsideExtensionUI(claude)) return claude;
  } else if (isClaudeHost) {
    const claude = findClaudeInput();
    if (claude && isEditable(claude) && !isInsideExtensionUI(claude)) return claude;
    const gpt = findChatGPTInput();
    if (gpt && isEditable(gpt) && !isInsideExtensionUI(gpt)) return gpt;
    const grok = findGrokInput();
    if (grok && isEditable(grok) && !isInsideExtensionUI(grok)) return grok;
  } else {
    const gpt = findChatGPTInput();
    if (gpt && isEditable(gpt) && !isInsideExtensionUI(gpt)) return gpt;
    const claude = findClaudeInput();
    if (claude && isEditable(claude) && !isInsideExtensionUI(claude)) return claude;
    const grok = findGrokInput();
    if (grok && isEditable(grok) && !isInsideExtensionUI(grok)) return grok;
  }
  const candidates = Array.from(
    document.querySelectorAll("textarea, input[type='text'], div[contenteditable='true']")
  ).filter((el) => isEditable(el) && isVisible(el) && !isInsideExtensionUI(el));
  if (candidates.length === 0) return null;
  const scored = candidates
    .map((el) => {
      const value = readValue(el as EditableEl);
      return { el: el as EditableEl, score: value.trim().length };
    })
    .sort((a, b) => b.score - a.score);
  return scored[0]?.el ?? null;
}

export function readValue(el: EditableEl | null) {
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

function setProseMirrorValue(el: HTMLElement, value: string) {
  // Replace the entire editor DOM to avoid leaving stale trailing blocks.
  el.innerHTML = `<p>${escapeHtml(value)}</p>`;
}

function ensureValue(el: HTMLElement, value: string) {
  const current = el.textContent || "";
  if (current.trim() !== value.trim()) {
    setProseMirrorValue(el, value);
  }
}

function selectEditorContents(el: HTMLElement) {
  const selection = window.getSelection();
  if (!selection) return;
  selection.removeAllRanges();
  const range = document.createRange();
  range.selectNodeContents(el);
  selection.addRange(range);
}

function isProseMirrorEditor(el: HTMLElement) {
  if (isClaudeEditor(el)) return false;
  return (
    el.classList.contains("ProseMirror") ||
    el.classList.contains("tiptap") ||
    el.id === "prompt-textarea"
  );
}

function isClaudeEditor(el: HTMLElement) {
  return (
    el.getAttribute("data-testid") === "chat-input" ||
    el.getAttribute("data-testid") === "composer-input"
  );
}

function replaceViaSelection(el: HTMLElement, value: string) {
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

export function writeValue(el: EditableEl | null, value: string) {
  if (!el) return;
  if (el instanceof HTMLTextAreaElement || el instanceof HTMLInputElement) {
    el.value = value;
    el.dispatchEvent(new Event("input", { bubbles: true }));
    return;
  }
  if (el.isContentEditable) {
    el.focus();
    if (isClaudeEditor(el)) {
      // Avoid hard DOM rewrites in Claude; they can break the live editor state.
      replaceViaSelection(el, value);
    } else if (isProseMirrorEditor(el)) {
      replaceViaSelection(el, value);
      // Keep ProseMirror stable across host variants.
      setProseMirrorValue(el, value);
      requestAnimationFrame(() => ensureValue(el, value));
      setTimeout(() => ensureValue(el, value), 50);
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
}
