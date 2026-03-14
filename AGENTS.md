# Agent Notes

## Chrome Web Store Packaging Rule

Before creating or uploading `promptfix-cws.zip`, always bump the extension version to a value higher than the currently published version.

- Update `version` in `vite.config.ts` (this drives `dist/manifest.json`).
- Keep `package.json` version in sync.
- Then run `npm run package:cws`.

Reason: CWS rejects uploads when `manifest.json` version is not greater than the published version, e.g.:
"Invalid version number in manifest ... Please make sure the newly uploaded package has a larger version ..."
