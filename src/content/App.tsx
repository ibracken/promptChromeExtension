import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  buildPrompt,
  freeButtons,
  paidButtons,
  getLabel,
  TemplateKey
} from "./templates";
import { getActiveInput, readValue, writeValue } from "./adapters";

const DEFAULT_POS = { x: 80, y: 120 };

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
  const [isPremium, setIsPremium] = useState(false);
  const [status, setStatus] = useState("Free tier");
  const [pos, setPos] = useState(DEFAULT_POS);
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

  function handleApply(key: TemplateKey) {
    const el = getActiveInput();
    if (el) {
      el.focus();
    }
    const input = readPrompt();
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
    window.open("https://extensionpay.com/");
  }

  function handleCheck() {
    chrome.storage.local.get(["premium"], (res) => {
      const next = Boolean(res.premium);
      setIsPremium(next);
      setStatus(next ? "Pro unlocked" : "Free tier");
    });
  }

  useEffect(() => {
    const width = panelRef.current?.offsetWidth ?? 300;
    const height = panelRef.current?.offsetHeight ?? 520;
    const nextX = Math.max(0, Math.round((window.innerWidth - width) / 2));
    const nextY = Math.max(0, Math.round((window.innerHeight - height) / 2));
    setPos({ x: nextX, y: nextY });
  }, []);

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

  function toggleOpen() {
    if (dragMovedRef.current) {
      dragMovedRef.current = false;
      return;
    }
    setIsOpen((v) => !v);
  }

  const host = window.location.host;
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
          <div className="psx-title">Prompt Sidebar</div>
          <button className="psx-close" onClick={() => setIsOpen(false)}>
            Minimize Sidebar
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
                  onClick={() => (locked ? setStatus("Upgrade to unlock.") : handleApply(key))}
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
      </div>
    </div>
  );
}
