import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { crx } from "@crxjs/vite-plugin";

const manifest = {
  manifest_version: 3,
  name: "Absurdly",
  version: "0.2.6",
  description: "Turn absurd scenarios into deadpan comedy prompts inside ChatGPT, Claude, and Grok.",
  permissions: ["storage"],
  host_permissions: [
    "https://chat.openai.com/*",
    "https://chatgpt.com/*",
    "https://claude.ai/*",
    "https://grok.com/*"
  ],
  background: {
    service_worker: "src/background.ts"
  },
  content_scripts: [
    {
      matches: [
        "https://chat.openai.com/*",
        "https://chatgpt.com/*",
        "https://claude.ai/*",
        "https://grok.com/*"
      ],
      js: ["src/content/main.tsx"],
      run_at: "document_idle"
    }
  ],
  action: {
    default_title: "Absurdly",
    default_popup: "src/popup/index.html"
  },
  options_page: "src/options/index.html",
  icons: {
    "16": "src/assets/icons/absurdly-icon-16.png",
    "32": "src/assets/icons/absurdly-icon-32.png",
    "48": "src/assets/icons/absurdly-icon-48.png",
    "128": "src/assets/icons/absurdly-icon-128.png"
  }
} as const;

export default defineConfig({
  plugins: [react(), crx({ manifest })],
  build: {
    target: "es2020"
  }
});


