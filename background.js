// Background service worker

// Keep-alive machanism for MV3 service workers.
// This is a common workaround to prevent the service worker from becoming inactive
// during long-running operations.
let lifeline;

keep_alive();

chrome.runtime.onConnect.addListener(port => {
  if (port.name === 'keep_alive') {
    lifeline = port;
    setTimeout(keep_alive_ext, 25e3);
    port.onDisconnect.addListener(keep_alive_ext);
  }
});

function keep_alive_ext() {
  if (lifeline) {
    lifeline.disconnect();
    lifeline = null;
  }
  keep_alive();
}

async function keep_alive() {
  if (lifeline) return;
  for (const tab of await chrome.tabs.query({ url: '*://*/*' })) {
    try {
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        function: () => chrome.runtime.connect({ name: 'keep_alive' }),
      });
      chrome.tabs.onUpdated.removeListener(retry_on_updated);
      return;
    } catch (e) {}
  }
  chrome.tabs.onUpdated.addListener(retry_on_updated);
}

async function retry_on_updated(tabId, info, tab) {
  if (info.status === 'complete' && tab.url && /^(http|https)/.test(tab.url)) {
    keep_alive();
  }
}


chrome.runtime.onInstalled.addListener(() => {
  console.log('Drive Bulk File Rename extension installed');
});

// Handle extension icon click
chrome.action.onClicked.addListener(async (tab) => {
  if (tab.url && tab.url.includes('drive.google.com')) {
    // This is largely handled by the default_popup in manifest.json,
    // but we can add logic here if needed.
  } else {
    // Navigate to Google Drive if not there
    chrome.tabs.create({ url: 'https://drive.google.com/drive/my-drive' });
  }
});

// Listen for tab updates to enable/disable extension
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    if (tab.url.includes('drive.google.com')) {
      chrome.action.enable(tabId);
      chrome.action.setBadgeText({ text: '', tabId: tabId });
    } else {
      chrome.action.disable(tabId);
      chrome.action.setBadgeText({ text: '!', tabId: tabId });
    }
  }
});

// Relay messages from popup to content script and handle responses
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  const contentScriptActions = ['checkDriveFolder', 'removePrefix', 'sequentialRename'];

  if (contentScriptActions.includes(request.action)) {
    // This must be handled asynchronously.
    (async () => {
      let activeTab;
      try {
        const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
        if (!tabs || tabs.length === 0) {
          throw new Error("No active tab found to send message to.");
        }
        activeTab = tabs[0];
      } catch (e) {
        // If we can't even get a tab, send an error response.
        sendResponse({ success: false, message: e.message });
        return;
      }

      // Use the callback form of sendMessage, which is the only reliable way
      // to check for runtime.lastError when connecting to a content script.
      chrome.tabs.sendMessage(activeTab.id, request, (response) => {
        if (chrome.runtime.lastError) {
          // This block executes if the content script is not available.
          const errorMessage = "Could not connect to the Google Drive page. Please refresh the page and try again.";
          console.error("Background script error:", chrome.runtime.lastError.message);

          // For rename actions, show a failure notification.
          if (request.action !== 'checkDriveFolder') {
            chrome.notifications.create({
              type: 'basic', iconUrl: 'icon.png', title: 'Drive File Renamer', message: 'Failed to connect to page.'
            });
          }
          // Try to send a response to the popup, but it may have closed.
          try { sendResponse({ success: false, message: errorMessage }); } catch (e) { /* ignore */ }

        } else {
          // This block executes on a successful response from the content script.
          // For rename actions, show a notification.
          if (request.action !== 'checkDriveFolder') {
            let notifMessage = `Failed to rename files. ${response?.message || ''}`;
            if (response && response.success) {
              notifMessage = `Successfully renamed ${response.count} files.`;
            }
            chrome.notifications.create({
              type: 'basic', iconUrl: 'icon.png', title: 'Drive File Renamer', message: notifMessage
            });
          }
          // Try to send the successful response back to the popup.
          try { sendResponse(response); } catch (e) { /* ignore */ }
        }
      });
    })();

    // Return true to indicate that sendResponse will be called asynchronously.
    return true;
  }
});