import React, { useEffect, useMemo, useRef, useState } from "react";
import scenariosMarkdown from "../../scenarios.md?raw";
import {
  buildPrompt,
  freeVoiceIds,
  paidVoiceIds,
  getVoice,
  VoiceId,
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
  "Pick a voice.",
  "Paste a ridiculous scenario or use the Scenarios button.",
  "Click Apply Prompt.",
  "Send it."
];

// Temporary local testing switch. Set back to false before release packaging.
const FORCE_UNLOCK_ALL_VOICES = true;

function parseScenarioList(markdown: string) {
  return markdown
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => !line.startsWith("#"))
    .map((line) => line.replace(/^[-*]\s+/, "").trim())
    .filter(Boolean);
}

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
  const [status, setStatus] = useState("Free voice ready");
  const [pos, setPos] = useState(() => {
    const width = Math.min(Math.max(window.innerWidth * 0.26, 260), 380);
    const margin = 16;
    return {
      x: Math.max(0, window.innerWidth - width - margin),
      y: margin
    };
  });
  const [modalOpen, setModalOpen] = useState(false);
  const [modalVoiceId, setModalVoiceId] = useState<VoiceId | null>(null);
  const [modalScenario, setModalScenario] = useState("");
  const [scenarioPickerOpen, setScenarioPickerOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [resumeModalAfterHelp, setResumeModalAfterHelp] = useState(false);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const dragRef = useRef<DragState | null>(null);
  const dragMovedRef = useRef(false);
  const rafRef = useRef<number | null>(null);

  const allVoices = useMemo(() => {
    return [
      ...freeVoiceIds.map((id) => ({ voice: getVoice(id), locked: false })),
      ...paidVoiceIds.map((id) => ({
        voice: getVoice(id),
        locked: FORCE_UNLOCK_ALL_VOICES ? false : !isPremium
      }))
    ];
  }, [isPremium]);

  const scenarioPresets = useMemo(() => parseScenarioList(scenariosMarkdown), []);

  function readPrompt() {
    const el = getActiveInput();
    return readValue(el);
  }

  function handleApply(id: VoiceId, overrideInput?: string) {
    const el = getActiveInput();
    if (el) {
      el.focus();
    }
    const input = overrideInput ?? readPrompt();
    if (!input.trim()) {
      setStatus("Add a scenario first.");
      return;
    }
    const upgraded = buildPrompt(id, input);
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
      setStatus("Voice unlock page opened.");
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
      setStatus(res?.error || (next ? "All voices unlocked" : "Free voice ready"));
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

  function openModal(id: VoiceId) {
    setHelpOpen(false);
    setModalVoiceId(id);
    setModalScenario("");
    setScenarioPickerOpen(false);
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setModalVoiceId(null);
    setScenarioPickerOpen(false);
  }

  function openHelp() {
    const shouldResume = modalOpen;
    setResumeModalAfterHelp(shouldResume);
    setModalOpen(false);
    setHelpOpen(true);
  }

  function closeHelp() {
    setHelpOpen(false);
    if (resumeModalAfterHelp && modalVoiceId) {
      setModalOpen(true);
    }
    setResumeModalAfterHelp(false);
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

  function handleModalApply() {
    if (!modalVoiceId) return;
    const combined = buildModalInput(modalVoiceId, {
      scenario: modalScenario
    });
    handleApply(modalVoiceId, combined);
    closeModal();
  }

  function handleScenarioPresetClick(scenario: string) {
    if (modalOpen) {
      setModalScenario(scenario);
      setScenarioPickerOpen(false);
      setStatus("Scenario loaded.");
      return;
    }
    const el = getActiveInput();
    if (!el) {
      setStatus("Open a voice or click inside the chat box first.");
      return;
    }
    writeValue(el, scenario);
    setStatus("Scenario pasted.");
  }

  const host = window.location.host;
  const modalConfig = modalVoiceId ? getModalConfig(modalVoiceId) : null;
  const modalVoice = modalVoiceId ? getVoice(modalVoiceId) : null;
  const theme = host.includes("claude.ai")
    ? "psx-theme-claude"
    : host.includes("grok.com")
      ? "psx-theme-grok"
      : "psx-theme-chatgpt";
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
        aria-label="Open Absurdly sidebar"
        title="Absurdly"
      >
        <span className="psx-tab-logo" aria-hidden="true">AB</span>
      </div>
      <div className="psx-shell">
        <div
          className="psx-header"
          onPointerDown={startDrag}
        >
          <div className="psx-title">Absurdly</div>
          <div className="psx-header-actions">
            <button className="psx-header-btn" onClick={openHelp}>
              How It Works
            </button>
            <button className="psx-header-btn" onClick={handleUpgrade}>
              Unlock Voices
            </button>
            <button
              className="psx-close psx-close-icon"
              onClick={() => {
                closeModal();
                if (isOpen) {
                  toggleOpen();
                }
                closeHelp();
              }}
              aria-label="Minimize"
              title="Minimize"
            >
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                className="psx-close-svg"
              >
                <path
                  d="M6.4 6.4L17.6 17.6M17.6 6.4L6.4 17.6"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.9"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          </div>
        </div>

        <div className="psx-body">
          {helpOpen ? (
            <div className="psx-section psx-help-section">
              <div className="psx-help-header">
                <div className="psx-section-title">How It Works</div>
                <button className="psx-modal-close" onClick={closeHelp}>
                  Close
                </button>
              </div>
              <div className="psx-modal-question">
                Absurdly rewrites your prompt. It does not send messages for you.
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
          ) : (
            <div className="psx-section">
              <div className="psx-section-title">Voices</div>
              <div className="psx-buttons">
                {allVoices.map(({ voice, locked }) => (
                  <button
                    key={voice.id}
                    className={`psx-btn ${locked ? "psx-locked" : ""}`}
                    onClick={() =>
                      locked ? setStatus("Unlock paid voices to use this one.") : openModal(voice.id)
                    }
                  >
                    <span className="psx-btn-label">{voice.label}</span>
                    <span className="psx-btn-subtitle">{voice.inspiredBy}</span>
                  </button>
                ))}
              </div>
              <div className="psx-status">{status}</div>
            </div>
          )}
        </div>
        {modalOpen && modalVoiceId && modalVoice && (
          <div className="psx-modal-backdrop">
            <div className="psx-modal">
              <div className="psx-modal-header">
                <div>
                  <div className="psx-modal-title">{modalVoice.label}</div>
                  <div className="psx-modal-subtitle">{modalVoice.inspiredBy}</div>
                </div>
                <button className="psx-modal-close" onClick={closeModal}>
                  Cancel
                </button>
              </div>
              <div className="psx-modal-body">
                <div className="psx-modal-question">
                  {modalConfig?.step1}
                </div>
                <textarea
                  className="psx-modal-input"
                  placeholder="Describe the ridiculous premise..."
                  value={modalScenario}
                  onChange={(e) => setModalScenario(e.target.value)}
                />
              </div>
              <div className="psx-modal-actions">
                <div className="psx-scenario-picker">
                  <button
                    className="psx-btn psx-secondary"
                    onClick={() => setScenarioPickerOpen((open) => !open)}
                  >
                    Scenarios
                  </button>
                  {scenarioPickerOpen && (
                    <div className="psx-scenario-popover">
                      <div className="psx-scenario-popover-title">Known Funny Scenarios</div>
                      <div className="psx-scenarios">
                        {scenarioPresets.map((scenario) => (
                          <button
                            key={scenario}
                            className="psx-scenario"
                            onClick={() => handleScenarioPresetClick(scenario)}
                            title="Load into this voice"
                          >
                            {scenario}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <button
                  className="psx-btn psx-primary"
                  onClick={handleModalApply}
                  disabled={!modalScenario.trim()}
                >
                  Apply Prompt
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
