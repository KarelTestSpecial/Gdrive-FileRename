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
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      if (!tab.url.includes('drive.google.com')) {
        this.showStatus('Please navigate to Google Drive first', 'error');
        return;
      }

      // Check if we're in a folder view
      const response = await chrome.tabs.sendMessage(tab.id, { action: 'checkDriveFolder' });
      
      if (response && response.isInFolder) {
        this.showStatus(`Ready to rename files in folder: ${response.folderName}`, 'success');
      } else {
        this.showStatus('Please open a folder in Google Drive', 'warning');
      }
    } catch (error) {
      this.showStatus('Error accessing Google Drive', 'error');
    }
  }

  async handlePrefixRemoval() {
    const prefix = document.getElementById('prefixInput').value;
    
    if (!prefix.trim()) {
      this.showStatus('Please enter a prefix to remove', 'error');
      return;
    }

    try {
      this.showStatus('Removing prefixes...', 'info');
      
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      const response = await chrome.tabs.sendMessage(tab.id, {
        action: 'removePrefix',
        prefix: prefix
      });

      if (response && response.success) {
        this.showStatus(`Successfully renamed ${response.count} files`, 'success');
      } else {
        this.showStatus(response?.message || 'Failed to remove prefixes', 'error');
      }
    } catch (error) {
      this.showStatus('Error during prefix removal', 'error');
    }
  }

  async handleSequentialRename() {
    const baseName = document.getElementById('baseNameInput').value;
    const reverseOrder = document.getElementById('reverseOrder').checked;
    const keepExtension = document.getElementById('keepExtension').checked;
    
    if (!baseName.trim()) {
      this.showStatus('Please enter a base name', 'error');
      return;
    }

    try {
      this.showStatus('Renaming files sequentially...', 'info');
      
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      const response = await chrome.tabs.sendMessage(tab.id, {
        action: 'sequentialRename',
        baseName: baseName,
        reverseOrder: reverseOrder,
        keepExtension: keepExtension
      });

      if (response && response.success) {
        this.showStatus(`Successfully renamed ${response.count} files`, 'success');
      } else {
        this.showStatus(response?.message || 'Failed to rename files', 'error');
      }
    } catch (error) {
      this.showStatus('Error during sequential rename', 'error');
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