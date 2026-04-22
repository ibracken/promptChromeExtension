import { chatgptAdapter } from "./chatgpt";
import { claudeAdapter } from "./claude";
import { grokAdapter } from "./grok";
import { isEditable, isInsideExtensionUI, isVisible } from "./shared";
import type { EditableEl, SiteAdapter } from "./types";

const adapters = [chatgptAdapter, claudeAdapter, grokAdapter] as const;

export function resolveSiteAdapter(host = window.location.host): SiteAdapter {
  return adapters.find((adapter) => adapter.matchesHost(host)) ?? chatgptAdapter;
}

export function getActiveInput(adapter = resolveSiteAdapter()): EditableEl | null {
  const active = document.activeElement;
  if (isEditable(active) && !isInsideExtensionUI(active)) return active;

  const selection = window.getSelection();
  const anchor = selection?.anchorNode as HTMLElement | null;
  if (anchor) {
    const parentEl =
      anchor.nodeType === Node.ELEMENT_NODE ? anchor : anchor.parentElement;
    const editable = parentEl?.closest?.("[contenteditable='true']");
    if (editable && isEditable(editable) && !isInsideExtensionUI(editable)) {
      return editable;
    }
  }

  const siteInput = adapter.findInput();
  if (siteInput && isEditable(siteInput) && !isInsideExtensionUI(siteInput)) {
    return siteInput;
  }

  for (const candidateAdapter of adapters) {
    const input = candidateAdapter.findInput();
    if (input && isEditable(input) && !isInsideExtensionUI(input)) {
      return input;
    }
  }

  const candidates = Array.from(
    document.querySelectorAll("textarea, input[type='text'], div[contenteditable='true']")
  ).filter((el) => isEditable(el) && isVisible(el) && !isInsideExtensionUI(el));

  if (candidates.length === 0) return null;

  const scored = candidates
    .map((el) => ({
      el: el as EditableEl,
      score: adapter.readValue(el as EditableEl).trim().length
    }))
    .sort((a, b) => b.score - a.score);

  return scored[0]?.el ?? null;
}
