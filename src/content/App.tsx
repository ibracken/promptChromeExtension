import React, { useEffect, useMemo, useState } from "react";
import {
  freeVoiceIds,
  paidVoiceIds,
  getVoice,
  VoiceId,
  VoiceOptionId
} from "./templates";
import { useComposerSendPipeline } from "./sendPipeline";

const DARK_HINT = /(dark|theme-dark|dark-mode|night)/i;

function hasExtensionContext() {
  try {
    return Boolean(chrome?.runtime?.id);
  } catch {
    return false;
  }
}

function sendRuntimeMessage<T = unknown>(
  message: unknown,
  callback?: (response: T | undefined) => void
) {
  if (!hasExtensionContext()) {
    callback?.(undefined);
    return;
  }

  try {
    chrome.runtime.sendMessage(message, (response) => {
      if (!hasExtensionContext()) {
        callback?.(undefined);
        return;
      }

      if (chrome.runtime.lastError) {
        callback?.(undefined);
        return;
      }

      callback?.(response as T | undefined);
    });
  } catch {
    callback?.(undefined);
  }
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
  const [isDark, setIsDark] = useState(() => detectHostDarkMode());
  const [isPremium, setIsPremium] = useState(false);
  const [selectedVoiceId, setSelectedVoiceId] = useState<VoiceOptionId>("none");

  const allVoices = useMemo(
    () => [...freeVoiceIds, ...paidVoiceIds].map((id) => getVoice(id)),
    []
  );

  useComposerSendPipeline(selectedVoiceId);

  useEffect(() => {
    sendRuntimeMessage<{ premium?: boolean }>({ type: "GET_PREMIUM" }, (res) => {
      const nextPremium = Boolean(res?.premium);
      setIsPremium(nextPremium);
    });
  }, []);

  useEffect(() => {
    if (!isPremium && paidVoiceIds.includes(selectedVoiceId)) {
      setSelectedVoiceId("none");
    }
  }, [isPremium, selectedVoiceId]);

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

  function handleSelectVoice(id: VoiceId) {
    const locked = paidVoiceIds.includes(id) && !isPremium;
    if (locked) {
      sendRuntimeMessage({ type: "OPEN_PAYMENT" });
      return;
    }

    setSelectedVoiceId(id);
  }

  const host = window.location.host;
  const theme = host.includes("claude.ai")
    ? "psx-theme-claude"
    : host.includes("grok.com")
      ? "psx-theme-grok"
      : "psx-theme-chatgpt";
  const tone = isDark ? "psx-dark" : "psx-light";

  return (
    <div className={`psx-strip ${theme} ${tone}`} role="toolbar" aria-label="Absurdly voices">
      <button
        type="button"
        className={[
          "psx-icon",
          "psx-icon-label",
          selectedVoiceId === "none" ? "psx-icon-selected" : ""
        ].filter(Boolean).join(" ")}
        onClick={() => setSelectedVoiceId("none")}
        aria-pressed={selectedVoiceId === "none"}
        title="No voice"
      >
        <span className="psx-icon-text">No Voice</span>
      </button>
      {allVoices.map((voice) => {
        const locked = voice.tier === "paid" && !isPremium;
        const selected = selectedVoiceId === voice.id;
        const title = locked
          ? `${voice.label} - ${voice.inspiredBy} (premium)`
          : `${voice.label} - ${voice.inspiredBy}`;

        return (
          <button
            key={voice.id}
            type="button"
            className={[
              "psx-icon",
              selected ? "psx-icon-selected" : "",
              locked ? "psx-icon-locked" : ""
            ].filter(Boolean).join(" ")}
            onClick={() => handleSelectVoice(voice.id)}
            aria-pressed={selected}
            aria-label={title}
            title={title}
          >
            <span className="psx-icon-text" aria-hidden="true">{voice.badgeLabel}</span>
            <span className="psx-sr-only">{voice.label}</span>
          </button>
        );
      })}
    </div>
  );
}
