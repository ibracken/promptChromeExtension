import { useEffect, useRef } from "react";
import { buildPrompt, VoiceOptionId } from "./templates";
import { getActiveInput, resolveSiteAdapter } from "./siteAdapters";
import type { EditableEl, SiteAdapter } from "./siteAdapters/types";

type AppliedState = {
  el: Element | null;
  voiceId: VoiceOptionId;
  output: string;
};

function waitFor(predicate: () => boolean, timeoutMs = 1200) {
  const startedAt = Date.now();

  return new Promise<boolean>((resolve) => {
    const tick = () => {
      if (predicate()) {
        resolve(true);
        return;
      }

      if (Date.now() - startedAt >= timeoutMs) {
        resolve(false);
        return;
      }

      window.requestAnimationFrame(tick);
    };

    tick();
  });
}

export function useComposerSendPipeline(selectedVoiceId: VoiceOptionId) {
  const lastInputRef = useRef<EditableEl | null>(null);
  const lastAppliedRef = useRef<AppliedState | null>(null);

  useEffect(() => {
    function getAdapter() {
      return resolveSiteAdapter();
    }

    function rememberInput(adapter: SiteAdapter) {
      const input = getActiveInput(adapter);
      if (input) {
        lastInputRef.current = input;
      }
      return input;
    }

    function applySelectedVoiceTo(adapter: SiteAdapter, input: EditableEl | null) {
      if (selectedVoiceId === "none" || !input) return null;

      const currentPrompt = adapter.readValue(input);
      if (!currentPrompt.trim()) {
        return null;
      }

      const lastApplied = lastAppliedRef.current;
      if (
        lastApplied &&
        lastApplied.el === input &&
        lastApplied.voiceId === selectedVoiceId &&
        lastApplied.output.trim() === currentPrompt.trim()
      ) {
        return lastApplied.output;
      }

      const upgradedPrompt = buildPrompt(selectedVoiceId, currentPrompt);
      adapter.writeValue(input, upgradedPrompt);
      lastAppliedRef.current = {
        el: input,
        voiceId: selectedVoiceId,
        output: upgradedPrompt
      };
      return upgradedPrompt;
    }

    async function monitorPostSendCleanup(
      adapter: SiteAdapter,
      input: EditableEl | null,
      transformedPrompt: string
    ) {
      if (!input) return;

      const startedAt = Date.now();
      const normalizedPrompt = transformedPrompt.trim();

      await new Promise<void>((resolve) => {
        const tick = () => {
          const currentInput =
            (input.isConnected ? input : null) ||
            adapter.findInput();

          if (!currentInput) {
            lastAppliedRef.current = null;
            resolve();
            return;
          }

          const currentValue = adapter.readValue(currentInput).trim();
          if (!currentValue || currentValue !== normalizedPrompt) {
            lastAppliedRef.current = null;
            resolve();
            return;
          }

          if (Date.now() - startedAt >= 4000) {
            resolve();
            return;
          }

          window.requestAnimationFrame(tick);
        };

        tick();
      });
    }

    function prepareForNativeSend(adapter: SiteAdapter, input: EditableEl | null) {
      if (selectedVoiceId === "none" || !input) return;

      lastInputRef.current = input;
      const transformedPrompt = applySelectedVoiceTo(adapter, input);
      if (!transformedPrompt) return;

      void waitFor(() => {
        if (!input.isConnected) return true;
        return adapter.readValue(input).trim() === transformedPrompt.trim();
      }).then((synced) => {
        if (!synced) return;
        void monitorPostSendCleanup(adapter, input, transformedPrompt);
      });
    }

    const handleInput = (event: Event) => {
      const target = event.target;
      if (!(target instanceof HTMLElement)) return;

      const adapter = getAdapter();
      const input = rememberInput(adapter);
      const lastApplied = lastAppliedRef.current;
      if (!input || !lastApplied) return;
      if (lastApplied.el !== input) return;

      const currentValue = adapter.readValue(input).trim();
      if (!currentValue || currentValue !== lastApplied.output.trim()) {
        lastAppliedRef.current = null;
      }
    };

    const handleFocusIn = () => {
      rememberInput(getAdapter());
    };

    const handleSubmit = (event: Event) => {
      const adapter = getAdapter();
      if (selectedVoiceId === "none") return;

      const input = getActiveInput(adapter) ?? lastInputRef.current;
      if (!input) return;

      prepareForNativeSend(adapter, input);
    };

    const handleClick = (event: MouseEvent) => {
      const adapter = getAdapter();
      const target = event.target instanceof Element ? event.target.closest("button") : null;
      if (!adapter.isSendButton(target)) return;
      if (selectedVoiceId === "none") return;

      const input = getActiveInput(adapter) ?? lastInputRef.current;
      if (!input) return;

      prepareForNativeSend(adapter, input);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Enter" || event.shiftKey || event.altKey || event.ctrlKey || event.metaKey) {
        return;
      }

      if (selectedVoiceId === "none") return;

      const target = event.target instanceof Element ? event.target : null;
      if (!target) return;

      const adapter = getAdapter();
      const input = getActiveInput(adapter);
      if (!input) return;

      lastInputRef.current = input;
      if (target !== input && !(input instanceof HTMLElement && input.contains(target))) {
        return;
      }

      prepareForNativeSend(adapter, input);
    };

    document.addEventListener("input", handleInput, true);
    document.addEventListener("focusin", handleFocusIn, true);
    document.addEventListener("submit", handleSubmit, true);
    document.addEventListener("click", handleClick, true);
    document.addEventListener("keydown", handleKeyDown, true);

    return () => {
      document.removeEventListener("input", handleInput, true);
      document.removeEventListener("focusin", handleFocusIn, true);
      document.removeEventListener("submit", handleSubmit, true);
      document.removeEventListener("click", handleClick, true);
      document.removeEventListener("keydown", handleKeyDown, true);
    };
  }, [selectedVoiceId]);
}
