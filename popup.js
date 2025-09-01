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
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    if (!tab || !tab.url || !tab.url.startsWith('https://drive.google.com/')) {
      this.showStatus('Please navigate to a Google Drive folder first.', 'error');
      return;
    }

    // Use callback form to check for chrome.runtime.lastError
    chrome.tabs.sendMessage(tab.id, { action: 'checkDriveFolder' }, (response) => {
      if (chrome.runtime.lastError) {
        this.showStatus('Could not connect to the page. Please refresh Google Drive and try again.', 'error');
        console.error(chrome.runtime.lastError.message);
        return;
      }
      
      if (response && response.isInFolder) {
        this.showStatus(`Ready to rename in folder: ${response.folderName}`, 'success');
      } else {
        this.showStatus('Please navigate to a valid folder in Google Drive.', 'warning');
      }
    });
  }

  async sendMessageToContentScript(payload) {
    return new Promise((resolve, reject) => {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (!tabs || tabs.length === 0) {
                return reject(new Error("No active tab found."));
            }
            const tabId = tabs[0].id;
            chrome.tabs.sendMessage(tabId, payload, (response) => {
                if (chrome.runtime.lastError) {
                    return reject(new Error(chrome.runtime.lastError.message));
                }
                resolve(response);
            });
        });
    });
  }

  async handlePrefixRemoval() {
    const prefix = document.getElementById('prefixInput').value;
    if (!prefix) { // An empty prefix is a valid case (to do nothing), but let's consider non-empty for action.
      this.showStatus('Please enter a prefix to remove.', 'error');
      return;
    }

    try {
      this.showStatus('Removing prefixes...', 'info');
      const response = await this.sendMessageToContentScript({
        action: 'removePrefix',
        prefix: prefix
      });

      if (response && response.success) {
        this.showStatus(`Successfully renamed ${response.count} files.`, 'success');
      } else {
        this.showStatus(response?.message || 'Failed to remove prefixes.', 'error');
      }
    } catch (error) {
      this.showStatus(`Error: ${error.message}. Please refresh the page.`, 'error');
    }
  }

  async handleSequentialRename() {
    const baseName = document.getElementById('baseNameInput').value;
    if (!baseName.trim()) {
      this.showStatus('Please enter a base name.', 'error');
      return;
    }

    const reverseOrder = document.getElementById('reverseOrder').checked;
    const keepExtension = document.getElementById('keepExtension').checked;

    try {
      this.showStatus('Renaming files sequentially...', 'info');
      const response = await this.sendMessageToContentScript({
        action: 'sequentialRename',
        baseName: baseName,
        reverseOrder: reverseOrder,
        keepExtension: keepExtension
      });

      if (response && response.success) {
        this.showStatus(`Successfully renamed ${response.count} files.`, 'success');
      } else {
        this.showStatus(response?.message || 'Failed to rename files.', 'error');
      }
    } catch (error) {
      this.showStatus(`Error: ${error.message}. Please refresh the page.`, 'error');
    }
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