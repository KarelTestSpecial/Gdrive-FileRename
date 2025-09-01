// Background service worker

chrome.runtime.onInstalled.addListener(() => {
  console.log('Drive Bulk File Rename extension installed');
});

// Handle extension icon click
chrome.action.onClicked.addListener(async (tab) => {
  if (tab.url && tab.url.includes('drive.google.com')) {
    // Open popup if on Google Drive
    chrome.action.openPopup();
  } else {
    // Navigate to Google Drive if not there
    chrome.tabs.create({ url: 'https://drive.google.com' });
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
  // Actions to be forwarded to the content script
  const contentScriptActions = ['checkDriveFolder', 'removePrefix', 'sequentialRename'];

  if (contentScriptActions.includes(request.action)) {
    // Forward the message to the active tab
    (async () => {
      try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (!tab) {
          throw new Error("No active tab found.");
        }

        const response = await chrome.tabs.sendMessage(tab.id, request);

        // For rename actions, show a notification on completion
        if (request.action === 'removePrefix' || request.action === 'sequentialRename') {
          let notifMessage = '';
          if (response && response.success) {
            notifMessage = `Successfully renamed ${response.count} files.`;
          } else {
            notifMessage = `Failed to rename files. ${response?.message || ''}`;
          }
          chrome.notifications.create({
            type: 'basic',
            iconUrl: 'icon.png',
            title: 'Drive File Renamer',
            message: notifMessage
          });
        }

        // Send response back to the popup
        sendResponse(response);
      } catch (error) {
        console.error("Background script error:", error);
        const errorMessage = { success: false, message: error.message };
        // For rename actions, notify failure
        if (request.action === 'removePrefix' || request.action === 'sequentialRename') {
          chrome.notifications.create({
            type: 'basic',
            iconUrl: 'icon.png',
            title: 'Drive File Renamer',
            message: `An error occurred: ${error.message}`
          });
        }
        sendResponse(errorMessage);
      }
    })();

    return true; // Indicates async response
  }

  // Keep other message handlers if any
});