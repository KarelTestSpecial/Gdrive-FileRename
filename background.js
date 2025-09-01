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

// Handle messages from popup and content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  // Forward messages from the popup to the content script
  if (request.action === 'removePrefix' || request.action === 'sequentialRename' || request.action === 'checkDriveFolder') {
    (async () => {
      try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (!tab) {
          throw new Error("No active tab found.");
        }
        if (!tab.url || !tab.url.startsWith("https://drive.google.com/")) {
          // Send a specific response for checkDriveFolder if not on the right page
          if (request.action === 'checkDriveFolder') {
            sendResponse({ isInFolder: false });
            return;
          }
          throw new Error("Not on a Google Drive page.");
        }
        const response = await chrome.tabs.sendMessage(tab.id, request);
        sendResponse(response);
      } catch (error) {
        sendResponse({ success: false, message: error.message });
      }
    })();
    return true; // Indicates async response
  }

  // Handle notification requests
  if (request.action === 'showNotification') {
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icon.png', // Corrected icon path
      title: 'Drive File Renamer',
      message: request.message
    });
  }
});