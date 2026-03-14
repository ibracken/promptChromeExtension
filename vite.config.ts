import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { crx } from "@crxjs/vite-plugin";

const manifest = {
  manifest_version: 3,
  name: "PromptFix",
  version: "0.1.4",
  description: "Upgrade prompts inside ChatGPT and Claude with one click.",
  permissions: ["storage"],
  host_permissions: [
    "https://chat.openai.com/*",
    "https://chatgpt.com/*",
    "https://claude.ai/*"
  ],
  background: {
    service_worker: "src/background.ts"
  },
  content_scripts: [
    {
      matches: [
        "https://chat.openai.com/*",
        "https://chatgpt.com/*",
        "https://claude.ai/*"
      ],
      js: ["src/content/main.tsx"],
      run_at: "document_idle"
    }
  ],
  action: {
    default_title: "PromptFix",
    default_popup: "src/popup/index.html"
  },
  options_page: "src/options/index.html",
  icons: {
    "16": "src/assets/icon16.png",
    "48": "src/assets/icon48.png",
    "128": "src/assets/icon128.png"
  }
} as const;

export default defineConfig({
  plugins: [react(), crx({ manifest })],
  build: {
    target: "es2020"
  }
});


