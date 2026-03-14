import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  buildPrompt,
  freeButtons,
  paidButtons,
  getLabel,
  TemplateKey,
  getModalConfig,
  buildModalInput
} from "./templates";
import { getActiveInput, readValue, writeValue } from "./adapters";

const DARK_HINT = /(dark|theme-dark|dark-mode|night)/i;

type DragState = {
  offsetX: number;
  offsetY: number;
  startX: number;
  startY: number;
  moved: boolean;
};

const howToUseSteps = [
  "Open PromptFix and choose a tool button.",
  "Fill in the short modal prompts so the generated prompt has enough context.",
  "Click Apply Prompt to replace the current composer text.",
  "Review the prompt, tweak it if needed, then send it yourself."
];

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function getClosedWidth() {
  return clamp(window.innerWidth * 0.052, 38, 46);
}

function getOpenWidth() {
  if (window.innerWidth <= 980) {
    return clamp(window.innerWidth * 0.7, 240, 320);
  }
  return clamp(window.innerWidth * 0.26, 260, 380);
}

function detectHostDarkMode() {
  const html = document.documentElement;
  const body = document.body;
  const htmlClass = html.className || "";
  const bodyClass = body?.className || "";
  const htmlTheme = html.getAttribute("data-theme") || "";
  const bodyTheme = body?.getAttribute("data-theme") || "";
  const htmlMode = html.getAttribute("data-mode") || "";
  const bodyMode = body?.getAttribute("data-mode") || "";
  if (
    DARK_HINT.test(htmlClass) ||
    DARK_HINT.test(bodyClass) ||
    DARK_HINT.test(htmlTheme) ||
    DARK_HINT.test(bodyTheme) ||
    DARK_HINT.test(htmlMode) ||
    DARK_HINT.test(bodyMode)
  ) {
    return true;
  }
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches ?? false;
}

export default function App() {
  const [isOpen, setIsOpen] = useState(true);
  const [isDark, setIsDark] = useState(() => detectHostDarkMode());
  const [isPremium, setIsPremium] = useState(false);
  const [status, setStatus] = useState("Free tier");
  const [pos, setPos] = useState(() => {
    const width = Math.min(Math.max(window.innerWidth * 0.26, 260), 380);
    const margin = 16;
    return {
      x: Math.max(0, window.innerWidth - width - margin),
      y: margin
    };
  });
  const [modalOpen, setModalOpen] = useState(false);
  const [modalStep, setModalStep] = useState(0);
  const [modalKey, setModalKey] = useState<TemplateKey | null>(null);
  const [modalPrompt, setModalPrompt] = useState("");
  const [modalContext, setModalContext] = useState("");
  const [helpOpen, setHelpOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const dragRef = useRef<DragState | null>(null);
  const dragMovedRef = useRef(false);
  const rafRef = useRef<number | null>(null);

  const allButtons = useMemo(() => {
    return [
      ...freeButtons.map((key) => ({ key, locked: false })),
      ...paidButtons.map((key) => ({ key, locked: !isPremium }))
    ];
  }, [isPremium]);

  function readPrompt() {
    const el = getActiveInput();
    return readValue(el);
  }

  function handleApply(key: TemplateKey, overrideInput?: string) {
    const el = getActiveInput();
    if (el) {
      el.focus();
    }
    const input = overrideInput ?? readPrompt();
    if (!input.trim()) {
      setStatus("Type a prompt first.");
      return;
    }
    const upgraded = buildPrompt(key, input);
    if (!el) {
      setStatus("Click inside the chat box, then try again.");
      return;
    }
    writeValue(el, upgraded);
    setStatus("Prompt replaced.");
  }

  function handleUpgrade() {
    chrome.runtime.sendMessage({ type: "OPEN_PAYMENT" }, (res) => {
      if (chrome.runtime.lastError) {
        setStatus("Unable to open unlock page right now.");
        return;
      }
      if (res?.ok === false) {
        setStatus(res.error || "Unable to open unlock page right now.");
        return;
      }
      setStatus("Unlock page opened.");
    });
  }

  function handleCheck() {
    chrome.runtime.sendMessage({ type: "GET_PREMIUM" }, (res) => {
      if (chrome.runtime.lastError) {
        setIsPremium(false);
        setStatus("Unable to verify license right now.");
        return;
      }
      const next = Boolean(res?.premium);
      setIsPremium(next);
      setStatus(res?.error || (next ? "Pro unlocked" : "Free tier"));
    });
  }

  function startDrag(e: React.PointerEvent) {
    dragMovedRef.current = false;
    dragRef.current = {
      offsetX: e.clientX - pos.x,
      offsetY: e.clientY - pos.y,
      startX: e.clientX,
      startY: e.clientY,
      moved: false
    };
  }

  function onDrag(e: PointerEvent) {
    if (!dragRef.current) return;
    const { offsetX, offsetY, startX, startY } = dragRef.current;
    const dx = Math.abs(e.clientX - startX);
    const dy = Math.abs(e.clientY - startY);
    if (dx > 3 || dy > 3) {
      dragRef.current.moved = true;
      dragMovedRef.current = true;
    }
    if (rafRef.current) return;
    rafRef.current = window.requestAnimationFrame(() => {
      const width = panelRef.current?.offsetWidth ?? 300;
      const height = panelRef.current?.offsetHeight ?? (isOpen ? 520 : 110);
      const nextX = clamp(e.clientX - offsetX, 0, window.innerWidth - width);
      const nextY = clamp(e.clientY - offsetY, 0, window.innerHeight - height);
      setPos({ x: nextX, y: nextY });
      rafRef.current = null;
    });
  }

  function endDrag() {
    dragRef.current = null;
  }

  useEffect(() => {
    function handleMove(e: PointerEvent) {
      onDrag(e);
    }
    function handleUp() {
      endDrag();
    }
    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleUp);
    return () => {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleUp);
    };
  }, []);

  useEffect(() => {
    handleCheck();
  }, []);

  useEffect(() => {
    const refreshTheme = () => {
      const next = detectHostDarkMode();
      setIsDark((prev) => (prev === next ? prev : next));
    };
    const observer = new MutationObserver(refreshTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class", "data-theme", "data-mode"]
    });
    if (document.body) {
      observer.observe(document.body, {
        attributes: true,
        attributeFilter: ["class", "data-theme", "data-mode"]
      });
    }
    const media = window.matchMedia?.("(prefers-color-scheme: dark)");
    media?.addEventListener("change", refreshTheme);
    refreshTheme();
    return () => {
      observer.disconnect();
      media?.removeEventListener("change", refreshTheme);
    };
  }, []);

  function toggleOpen() {
    if (dragMovedRef.current) {
      dragMovedRef.current = false;
      return;
    }
    const nextOpen = !isOpen;
    const delta = Math.max(0, getOpenWidth() - getClosedWidth());
    setPos((prev) => {
      const nextWidth = nextOpen ? getOpenWidth() : getClosedWidth();
      const nextHeight = panelRef.current?.offsetHeight ?? (nextOpen ? 520 : 46);
      const nextX = clamp(
        nextOpen ? prev.x - delta : prev.x + delta,
        0,
        window.innerWidth - nextWidth
      );
      const nextY = clamp(prev.y, 0, window.innerHeight - nextHeight);
      return { x: nextX, y: nextY };
    });
    setIsOpen(nextOpen);
  }

  function openModal(key: TemplateKey) {
    setHelpOpen(false);
    setModalKey(key);
    setModalPrompt("");
    setModalContext("");
    setModalStep(0);
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setModalKey(null);
    setModalStep(0);
  }

  function openHelp() {
    closeModal();
    setHelpOpen(true);
  }

  function closeHelp() {
    setHelpOpen(false);
  }

  useEffect(() => {
    const clampToViewport = () => {
      const width = panelRef.current?.offsetWidth ?? (isOpen ? getOpenWidth() : getClosedWidth());
      const height = panelRef.current?.offsetHeight ?? (isOpen ? 520 : 46);
      setPos((prev) => {
        const nextX = clamp(prev.x, 0, window.innerWidth - width);
        const nextY = clamp(prev.y, 0, window.innerHeight - height);
        if (nextX === prev.x && nextY === prev.y) {
          return prev;
        }
        return { x: nextX, y: nextY };
      });
    };
    const raf = window.requestAnimationFrame(clampToViewport);
    window.addEventListener("resize", clampToViewport);
    return () => {
      window.cancelAnimationFrame(raf);
      window.removeEventListener("resize", clampToViewport);
    };
  }, [isOpen]);

  function handleModalNext() {
    if (modalStep === 0 && !modalPrompt.trim()) {
      return;
    }
    setModalStep((step) => Math.min(maxModalStep, step + 1));
  }

  function handleModalApply() {
    if (!modalKey) return;
    const combined = buildModalInput(modalKey, {
      prompt: modalPrompt,
      context: modalContext
    });
    handleApply(modalKey, combined);
    closeModal();
  }

  const host = window.location.host;
  const modalConfig = modalKey ? getModalConfig(modalKey) : null;
  const hasFinalNote = Boolean(modalConfig?.finalNote.trim());
  const maxModalStep = hasFinalNote ? 2 : 1;
  const theme =
    host.includes("claude.ai") ? "psx-theme-claude" : "psx-theme-chatgpt";
  const tone = isDark ? "psx-dark" : "psx-light";

  return (
    <div
      ref={panelRef}
      className={`psx-panel ${theme} ${tone} ${isOpen ? "psx-open" : "psx-closed"}`}
      style={{ left: pos.x, top: pos.y }}
    >
      <div
        className="psx-tab"
        onClick={toggleOpen}
        onPointerDown={startDrag}
        aria-label="Open PromptFix sidebar"
        title="PromptFix"
      >
        <span className="psx-tab-logo" aria-hidden="true">PF</span>
      </div>
      <div className="psx-shell">
        <div
          className="psx-header"
          onPointerDown={startDrag}
        >
          <div className="psx-title">PromptFix</div>
          <div className="psx-header-actions">
            <button className="psx-header-btn" onClick={handleUpgrade}>
              Unlock Pro
            </button>
            <button
              className="psx-close"
              onClick={() => {
                closeModal();
                if (isOpen) {
                  toggleOpen();
                }
                closeHelp();
              }}
            >
              Minimize
            </button>
          </div>
        </div>

        <div className="psx-body">
          <div className="psx-section">
            <div className="psx-section-title">Buttons</div>
            <div className="psx-buttons">
              <button className="psx-btn psx-secondary" onClick={openHelp}>
                How to Use
              </button>
              {allButtons.map(({ key, locked }) => (
                <button
                  key={key}
                  className={`psx-btn ${locked ? "psx-locked" : ""}`}
                  onClick={() =>
                    locked ? setStatus("Upgrade to unlock.") : openModal(key)
                  }
                >
                  {getLabel(key)}
                </button>
              ))}
            </div>
            <div className="psx-status">{status}</div>
          </div>
        </div>
        {modalOpen && modalKey && (
          <div className="psx-modal-backdrop">
            <div className="psx-modal">
              <div className="psx-modal-header">
                <div className="psx-modal-title">{getLabel(modalKey)}</div>
                <button className="psx-modal-close" onClick={closeModal}>
                  Cancel
                </button>
              </div>
              <div className="psx-modal-body">
                {modalStep === 0 && (
                  <>
                    <div className="psx-modal-question">
                      {modalConfig?.step1}
                    </div>
                    <textarea
                      className="psx-modal-input"
                      placeholder="Type here..."
                      value={modalPrompt}
                      onChange={(e) => setModalPrompt(e.target.value)}
                    />
                  </>
                )}
                {modalStep === 1 && (
                  <>
                    <div className="psx-modal-question">
                      {modalConfig?.step2}
                    </div>
                    <textarea
                      className="psx-modal-input"
                      placeholder="Optional but helpful..."
                      value={modalContext}
                      onChange={(e) => setModalContext(e.target.value)}
                    />
                  </>
                )}
                {modalStep === 2 && hasFinalNote && (
                  <div className="psx-modal-reminder">
                    {modalConfig?.finalNote}
                  </div>
                )}
              </div>
              <div className="psx-modal-actions">
                {modalStep < maxModalStep ? (
                  <button
                    className="psx-btn psx-primary"
                    onClick={handleModalNext}
                    disabled={modalStep === 0 && !modalPrompt.trim()}
                  >
                    Next
                  </button>
                ) : (
                  <button className="psx-btn psx-primary" onClick={handleModalApply}>
                    Apply Prompt
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
        {helpOpen && (
          <div className="psx-modal-backdrop">
            <div className="psx-modal">
              <div className="psx-modal-header">
                <div className="psx-modal-title">How to Use</div>
                <button className="psx-modal-close" onClick={closeHelp}>
                  Close
                </button>
              </div>
              <div className="psx-modal-body">
                <div className="psx-modal-question">
                  PromptFix does not send messages for you. It only rewrites the text in the chat box.
                </div>
                <div className="psx-help-list">
                  {howToUseSteps.map((step, index) => (
                    <div key={step} className="psx-help-item">
                      <span className="psx-help-index">{index + 1}</span>
                      <span>{step}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
