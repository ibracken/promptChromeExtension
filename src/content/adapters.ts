export type EditableEl = HTMLTextAreaElement | HTMLInputElement | HTMLElement;

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

export function getActiveInput(): EditableEl | null {
  const active = document.activeElement;
  if (isEditable(active)) return active;
  const selection = window.getSelection();
  const anchor = selection?.anchorNode as HTMLElement | null;
  if (anchor) {
    const parentEl =
      anchor.nodeType === Node.ELEMENT_NODE ? anchor : anchor.parentElement;
    const editable = parentEl?.closest?.("[contenteditable='true']");
    if (editable && isEditable(editable)) return editable;
  }
  const gpt = findChatGPTInput();
  if (gpt && isEditable(gpt)) return gpt;
  const claude = findClaudeInput();
  if (claude && isEditable(claude)) return claude;
  const candidates = Array.from(
    document.querySelectorAll("textarea, input[type='text'], div[contenteditable='true']")
  ).filter((el) => isEditable(el) && isVisible(el));
  if (candidates.length === 0) return null;
  const scored = candidates
    .map((el) => {
      const value = readValue(el as EditableEl);
      return { el: el as EditableEl, score: value.trim().length };
    })
    .sort((a, b) => b.score - a.score);
  return scored[0]?.el ?? null;
  return null;
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

function selectAll(el: HTMLElement) {
  const range = document.createRange();
  range.selectNodeContents(el);
  const selection = window.getSelection();
  if (!selection) return;
  selection.removeAllRanges();
  selection.addRange(range);
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
  const p = el.querySelector("p");
  if (p) {
    p.textContent = value;
    return;
  }
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
  const p = el.querySelector("p");
  if (p && p.firstChild) {
    range.selectNodeContents(p);
  } else {
    range.selectNodeContents(el);
  }
  selection.addRange(range);
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
    if (
      el.classList.contains("ProseMirror") ||
      el.classList.contains("tiptap") ||
      el.id === "prompt-textarea" ||
      el.getAttribute("data-testid") === "chat-input"
    ) {
      selectEditorContents(el);
      el.dispatchEvent(
        new InputEvent("beforeinput", {
          bubbles: true,
          cancelable: true,
          inputType: "deleteContent"
        })
      );
      try {
        document.execCommand("delete");
      } catch {
        // ignore
      }
      el.dispatchEvent(
        new InputEvent("beforeinput", {
          bubbles: true,
          cancelable: true,
          data: value,
          inputType: "insertText"
        })
      );
      const inserted = execInsertText(value);
      if (!inserted) setProseMirrorValue(el, value);
      requestAnimationFrame(() => ensureValue(el, value));
      setTimeout(() => ensureValue(el, value), 50);
    } else {
      el.textContent = value;
    }
    el.dispatchEvent(
      new InputEvent("input", { bubbles: true, data: value, inputType: "insertText" })
    );
    el.dispatchEvent(new Event("change", { bubbles: true }));
    el.dispatchEvent(new KeyboardEvent("keyup", { bubbles: true }));
    el.dispatchEvent(new Event("input", { bubbles: true }));
  }
}
