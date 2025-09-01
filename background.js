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

// Handle messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'showNotification') {
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon48.png',
      title: 'Drive File Renamer',
      message: request.message
    });
  }
});