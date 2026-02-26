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

const DEFAULT_POS = { x: 16, y: 16 };

type DragState = {
  offsetX: number;
  offsetY: number;
  startX: number;
  startY: number;
  moved: boolean;
};

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

export default function App() {
  const [isOpen, setIsOpen] = useState(true);
  const [status, setStatus] = useState("Free tier");
  const [pos, setPos] = useState(DEFAULT_POS);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalStep, setModalStep] = useState(0);
  const [modalKey, setModalKey] = useState<TemplateKey | null>(null);
  const [modalPrompt, setModalPrompt] = useState("");
  const [modalContext, setModalContext] = useState("");
  const panelRef = useRef<HTMLDivElement | null>(null);
  const dragRef = useRef<DragState | null>(null);
  const dragMovedRef = useRef(false);
  const rafRef = useRef<number | null>(null);

  const allButtons = useMemo(() => {
    return [
      ...freeButtons.map((key) => ({ key, locked: false })),
      ...paidButtons.map((key) => ({ key, locked: false }))
    ];
  }, []);

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
        setStatus("Unable to open payment page right now.");
        return;
      }
      if (res?.ok === false) {
        setStatus(res.error || "Unable to open payment page right now.");
        return;
      }
      setStatus("Payment page opened.");
    });
  }

  function handleCheck() {
    chrome.runtime.sendMessage({ type: "GET_PREMIUM" }, (res) => {
      if (chrome.runtime.lastError) {
        setStatus("Unable to verify license right now.");
        return;
      }
      const next = Boolean(res?.premium);
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
      const height = panelRef.current?.offsetHeight ?? (isOpen ? 520 : 140);
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

  function toggleOpen() {
    if (dragMovedRef.current) {
      dragMovedRef.current = false;
      return;
    }
    setIsOpen((v) => !v);
  }

  function openModal(key: TemplateKey) {
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

  return (
    <div
      ref={panelRef}
      className={`psx-panel ${theme} ${isOpen ? "psx-open" : "psx-closed"}`}
      style={{ left: pos.x, top: pos.y }}
    >
      <div
        className="psx-tab"
        onClick={toggleOpen}
        onPointerDown={startDrag}
      >
        Sidebar
      </div>
      <div className="psx-shell">
        <div
          className="psx-header"
          onPointerDown={startDrag}
        >
          <div className="psx-title">PromptFix</div>
          <button
            className="psx-close"
            onClick={() => {
              closeModal();
              setIsOpen(false);
            }}
          >
            Minimize
          </button>
        </div>

        <div className="psx-body">
          <div className="psx-section">
            <div className="psx-section-title">Buttons</div>
            <div className="psx-buttons">
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

          <div className="psx-section">
            <div className="psx-section-title">Upgrade</div>
            <div className="psx-actions">
              <button className="psx-btn psx-upgrade" onClick={handleUpgrade}>
                Upgrade to Pro
              </button>
              <button className="psx-btn" onClick={handleCheck}>
                Check License
              </button>
            </div>
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
      </div>
    </div>
  );
}
