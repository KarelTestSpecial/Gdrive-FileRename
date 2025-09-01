// Popup script for Drive Bulk File Rename extension

class DriveFileRenamer {
  constructor() {
    this.initEventListeners();
    this.checkDriveAccess();
  }

  initEventListeners() {
    document.getElementById('removePrefixBtn').addEventListener('click', () => {
      this.handlePrefixRemoval();
    });

    document.getElementById('sequentialRenameBtn').addEventListener('click', () => {
      this.handleSequentialRename();
    });
  }

  async checkDriveAccess() {
    // This initial check can still go directly to the content script for a quick UI response.
    // But we'll route it through the background script to keep the architecture consistent.
    try {
      const response = await chrome.runtime.sendMessage({ action: 'checkDriveFolder' });
      if (response && response.isInFolder) {
        this.showStatus(`Ready to rename in folder: ${response.folderName}`, 'success');
      } else {
        this.showStatus(response?.message || 'Please navigate to a valid folder in Google Drive.', 'warning');
      }
    } catch (error) {
      this.showStatus(`Error: ${error.message}`, 'error');
    }
  }

  async handlePrefixRemoval() {
    const prefix = document.getElementById('prefixInput').value;
    if (!prefix) {
      this.showStatus('Please enter a prefix to remove.', 'error');
      return;
    }

    this.showStatus('Requesting prefix removal...', 'info');
    chrome.runtime.sendMessage({
      action: 'removePrefix',
      prefix: prefix
    });
    // The background script will handle the response and notification.
    // We can close the popup immediately.
    setTimeout(() => window.close(), 1000);
  }

  async handleSequentialRename() {
    const baseName = document.getElementById('baseNameInput').value;
    if (!baseName.trim()) {
      this.showStatus('Please enter a base name.', 'error');
      return;
    }

    const reverseOrder = document.getElementById('reverseOrder').checked;
    const keepExtension = document.getElementById('keepExtension').checked;

    this.showStatus('Requesting sequential rename...', 'info');
    chrome.runtime.sendMessage({
      action: 'sequentialRename',
      baseName: baseName,
      reverseOrder: reverseOrder,
      keepExtension: keepExtension
    });
    // The background script will handle the response and notification.
    setTimeout(() => window.close(), 1000);
  }

  showStatus(message, type) {
    const status = document.getElementById('status');
    status.textContent = message;
    status.className = `status ${type}`;
    status.classList.remove('hidden');
    
    if (type === 'success' || type === 'info') {
      setTimeout(() => {
        status.classList.add('hidden');
      }, 3000);
    }
  }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new DriveFileRenamer();
});