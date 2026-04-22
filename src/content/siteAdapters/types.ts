export type EditableEl = HTMLTextAreaElement | HTMLInputElement | HTMLElement;

export type SiteAdapter = {
  id: "chatgpt" | "claude" | "grok";
  matchesHost: (host: string) => boolean;
  findInput: () => EditableEl | null;
  findMountTarget: () => HTMLElement | null;
  readValue: (input: EditableEl | null) => string;
  writeValue: (input: EditableEl | null, value: string) => void;
  isSendButton: (el: Element | null) => boolean;
  triggerSend: (input: EditableEl | null, sourceTarget?: HTMLElement | null) => void | Promise<void>;
};
