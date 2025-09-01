// Content script for Google Drive interaction

class DriveContentScript {
  constructor() {
    this.initMessageListener();
  }

  initMessageListener() {
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      switch (request.action) {
        case 'checkDriveFolder':
          sendResponse(this.checkCurrentFolder());
          break;
        case 'removePrefix':
          this.removePrefixFromFiles(request.prefix).then(sendResponse);
          return true; // Async response
        case 'sequentialRename':
          this.sequentialRenameFiles(request).then(sendResponse);
          return true; // Async response
      }
    });
  }

  checkCurrentFolder() {
    const folderNameElement = document.querySelector('[data-target="shared-space-header,folder-header"] h1') ||
                              document.querySelector('h1[data-tooltip]') ||
                              document.querySelector('.ndfHFb-c4YZDc-Wrql6b');
    
    const isInFolder = !!folderNameElement && !window.location.href.includes('/search');
    const folderName = folderNameElement?.textContent?.trim() || 'Unknown';
    
    return { isInFolder, folderName };
  }

  async getFileElements() {
    // Wait for files to load
    await this.waitForFiles();
    
    // Multiple selectors for different Google Drive layouts
    const fileSelectors = [
      '[data-target="file,shortcut"] [data-tooltip]', // Grid view
      '[role="row"] [data-tooltip]', // List view
      '.a-s-fa-Ha-pa', // Alternative selector
    ];
    
    let fileElements = [];
    for (const selector of fileSelectors) {
      fileElements = Array.from(document.querySelectorAll(selector))
        .filter(el => el.getAttribute('data-tooltip') && 
                     !el.closest('[data-target="folder,shortcut"]'));
      if (fileElements.length > 0) break;
    }
    
    return fileElements;
  }

  async waitForFiles() {
    return new Promise((resolve) => {
      const checkFiles = () => {
        const files = document.querySelectorAll('[data-tooltip]');
        if (files.length > 0) {
          resolve();
        } else {
          setTimeout(checkFiles, 100);
        }
      };
      checkFiles();
    });
  }

  async removePrefixFromFiles(prefix) {
    try {
      const fileElements = await this.getFileElements();
      let renamedCount = 0;
      
      for (const element of fileElements) {
        const currentName = element.getAttribute('data-tooltip');
        
        if (currentName && currentName.startsWith(prefix)) {
          const newName = currentName.substring(prefix.length);
          
          if (newName.trim()) {
            const success = await this.renameFile(element, newName);
            if (success) renamedCount++;
          }
        }
      }
      
      return { success: true, count: renamedCount };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  async sequentialRenameFiles({ baseName, reverseOrder, keepExtension }) {
    try {
      const fileElements = await this.getFileElements();
      
      // Sort files naturally
      const sortedFiles = fileElements.sort((a, b) => {
        const nameA = a.getAttribute('data-tooltip') || '';
        const nameB = b.getAttribute('data-tooltip') || '';
        return nameA.localeCompare(nameB, undefined, { numeric: true, sensitivity: 'base' });
      });
      
      let renamedCount = 0;
      const totalFiles = sortedFiles.length;
      
      for (let i = 0; i < totalFiles; i++) {
        const element = sortedFiles[i];
        const currentName = element.getAttribute('data-tooltip');
        
        let extension = '';
        if (keepExtension && currentName) {
          extension = this.getFileExtension(currentName);
        }
        
        const index = reverseOrder ? totalFiles - i : i + 1;
        const newName = `${baseName} [${index}]${extension}`;
        
        const success = await this.renameFile(element, newName);
        if (success) renamedCount++;
      }
      
      return { success: true, count: renamedCount };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  getFileExtension(filename) {
    const lastDot = filename.lastIndexOf('.');
    if (lastDot < 1 || lastDot === filename.length - 1) {
      return '';
    }
    return filename.substring(lastDot);
  }

  async renameFile(element, newName) {
    return new Promise((resolve) => {
      try {
        // Right-click to open context menu
        element.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true }));
        
        setTimeout(() => {
          // Look for rename option in context menu
          const renameOption = document.querySelector('[role="menuitem"]') ||
                                document.querySelector('[data-tooltip="Rename"]');
          
          if (renameOption) {
            renameOption.click();
            
            setTimeout(() => {
              // Find input field for new name
              const inputField = document.querySelector('input[type="text"]:focus') ||
                                  document.querySelector('.docs-textfield-input');
              
              if (inputField) {
                inputField.value = newName;
                inputField.dispatchEvent(new Event('input', { bubbles: true }));
                
                // Press Enter to confirm
                inputField.dispatchEvent(new KeyboardEvent('keydown', { 
                  key: 'Enter', 
                  bubbles: true 
                }));
                
                resolve(true);
              } else {
                resolve(false);
              }
            }, 500);
          } else {
            resolve(false);
          }
        }, 300);
      } catch (error) {
        resolve(false);
      }
    });
  }
}

// Initialize content script
new DriveContentScript();