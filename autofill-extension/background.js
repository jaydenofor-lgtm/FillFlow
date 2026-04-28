// FillFlow Background Service Worker
// Handles extension lifecycle events

chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    // Set defaults on first install
    chrome.storage.local.set({
      enabled: true,
      autoFill: true,
      highlight: true,
      observer: true,
      skipPassword: true,
      activityLog: []
    });

    // Open extensions page so user can pin the extension
    chrome.tabs.create({ url: 'chrome://extensions' });
  }
});

// Keep service worker alive
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === 'PING') sendResponse({ pong: true });
});
