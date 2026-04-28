# FillFlow — AI-Powered Universal Form Filler

A Chrome extension that proactively scans web pages and auto-fills forms with your stored profile data — no clicking required.

## How to install (Developer Mode)

Since this isn't published to the Chrome Web Store yet, install it as an unpacked extension:

1. Open Chrome and go to `chrome://extensions`
2. Enable **Developer mode** (toggle in the top-right corner)
3. Click **Load unpacked**
4. Select this folder (`autofill-extension/`)
5. The FillFlow icon will appear in your toolbar

> **Tip:** Pin the extension by clicking the puzzle icon in Chrome's toolbar and pinning FillFlow.

## How to use

1. Click the FillFlow icon in your toolbar
2. Go to the **Profile** tab and fill in your info (name, email, phone, address)
3. Click **Save profile**
4. Browse the web — FillFlow will automatically detect and fill forms as you go

## Features

- **Smart field detection** — identifies fields by name, ID, placeholder, autocomplete attribute, and label text
- **React/Vue/Angular support** — uses MutationObserver to catch dynamically rendered forms
- **Highlight mode** — subtle purple glow on filled fields so you know what was filled
- **Activity log** — tracks every fill across sites
- **Manual fill** — use "Fill forms on this page now" in Settings for instant on-demand fill
- **Privacy first** — all data stored locally via `chrome.storage.local`, never sent anywhere

## Files

| File | Purpose |
|------|---------|
| `manifest.json` | Extension config and permissions |
| `popup.html` | The UI shown when clicking the extension icon |
| `popup.js` | Popup logic — storage read/write, tab switching |
| `content.js` | Core brain — runs on every page, scans and fills forms |
| `background.js` | Service worker — handles install and lifecycle |

## Next steps / roadmap

- [ ] Add an AI classifier using Claude API for unusual/custom form fields
- [ ] Multi-profile support (work, personal, shipping address)
- [ ] Per-site whitelist/blacklist
- [ ] Export/import profile data
- [ ] Publish to Chrome Web Store
