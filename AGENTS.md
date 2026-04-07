# Agent Notes

## Chrome Web Store Packaging Rule

Before creating or uploading `promptfix-cws.zip`, always bump the extension version to a value higher than the currently published version.

- Update `version` in `vite.config.ts` (this drives `dist/manifest.json`).
- Keep `package.json` version in sync.
- Then run `npm run package:cws`.

Reason: CWS rejects uploads when `manifest.json` version is not greater than the published version, e.g.:
"Invalid version number in manifest ... Please make sure the newly uploaded package has a larger version ..."

## Paywall Release Check

Before packaging for release, verify that only the intended free voice is usable without premium.

Step by step:

1. Confirm the free and paid voice lists in `src/content/templates.ts`.
   - `freeVoiceIds` should contain only the intended free voice.
   - `paidVoiceIds` should contain every paywalled voice.
   - Keep each voice's `tier` field consistent with those lists.

2. Confirm the content UI actually locks paid voices in `src/content/App.tsx`.
   - In the `allVoices` mapping, free voices should use `locked: false`.
   - Paid voices should use `locked: !isPremium`.
   - Do not leave paid voices hardcoded as unlocked during release prep.

3. Test the extension in the unpaid state.
   - Load the unpacked extension.
   - Make sure premium is effectively off.
   - Verify the free voice opens normally.
   - Verify each paid voice is visibly locked and cannot be used.

4. Test the extension in the paid state if payment is configured.
   - Verify all voices unlock when `GET_PREMIUM` returns true.

5. Only after those checks, package the release zip.
