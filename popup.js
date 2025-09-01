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

  async sendMessageToBackground(payload) {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage(payload, (response) => {
        if (chrome.runtime.lastError) {
          return reject(new Error(chrome.runtime.lastError.message));
        }
        if (response && !response.success) {
            return reject(new Error(response.message || 'An unknown error occurred.'));
        }
        resolve(response);
      });
    });
  }

  async checkDriveAccess() {
    try {
        const response = await this.sendMessageToBackground({ action: 'checkDriveFolder' });
        if (response && response.isInFolder) {
            this.showStatus(`Ready to rename in folder: ${response.folderName}`, 'success');
        } else {
            this.showStatus('Please navigate to a valid folder in Google Drive.', 'warning');
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
    try {
      const response = await this.sendMessageToBackground({
        action: 'removePrefix',
        prefix: prefix
      });
      this.showStatus(`Successfully renamed ${response.count} files.`, 'success');
      // The popup might close before this is shown, notifications are better.
    } catch (error) {
      this.showStatus(`Error: ${error.message}`, 'error');
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

    this.showStatus('Requesting sequential rename...', 'info');
    try {
      const response = await this.sendMessageToBackground({
        action: 'sequentialRename',
        baseName: baseName,
        reverseOrder: reverseOrder,
        keepExtension: keepExtension
      });
      this.showStatus(`Successfully renamed ${response.count} files.`, 'success');
      // The popup might close before this is shown, notifications are better.
    } catch (error) {
      this.showStatus(`Error: ${error.message}`, 'error');
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