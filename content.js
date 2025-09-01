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
    const folderNameElement = document.querySelector('a[aria-label^="location "][role="button"]');
    const isInFolder = !!folderNameElement;
    const folderName = folderNameElement?.textContent?.trim() || 'Unknown';
    return { isInFolder, folderName };
  }

  async getFileElements() {
    await this.waitForSelector('[data-id][role="gridcell"]');
    const fileElements = Array.from(document.querySelectorAll('[data-id][role="gridcell"]'));
    // Filter out folders
    return fileElements.filter(el => !el.querySelector('div[aria-label="Folder"]'));
  }

  async waitForSelector(selector, timeout = 5000) {
    return new Promise((resolve, reject) => {
      const element = document.querySelector(selector);
      if (element) {
        resolve(element);
        return;
      }

      const observer = new MutationObserver(mutations => {
        const targetNode = document.querySelector(selector);
        if (targetNode) {
          observer.disconnect();
          resolve(targetNode);
        }
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true
      });

      setTimeout(() => {
        observer.disconnect();
        reject(new Error(`Timeout waiting for selector: ${selector}`));
      }, timeout);
    });
  }

  async removePrefixFromFiles(prefix) {
    try {
      const fileElements = await this.getFileElements();
      let renamedCount = 0;

      for (const element of fileElements) {
        const currentName = element.querySelector('[role="option"] div[aria-label]')?.getAttribute('aria-label');
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
      let fileElements = await this.getFileElements();
      
      const fileData = fileElements.map(el => {
          const name = el.querySelector('[role="option"] div[aria-label]')?.getAttribute('aria-label') || '';
          return { element: el, name: name };
      });

      fileData.sort((a, b) => {
        return a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' });
      });

      let renamedCount = 0;
      const totalFiles = fileData.length;

      for (let i = 0; i < totalFiles; i++) {
        const item = fileData[i];
        const currentName = item.name;
        let extension = '';

        if (keepExtension && currentName) {
          extension = this.getFileExtension(currentName);
        }

        const index = reverseOrder ? totalFiles - i : i + 1;
        const newName = `${baseName} [${index}]${extension}`;

        const success = await this.renameFile(item.element, newName);
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

  async findElementByText(selector, text, parent = document) {
      const elements = Array.from(parent.querySelectorAll(selector));
      return elements.find(el => el.textContent.trim() === text);
  }

  async simulateClick(element) {
    const dispatchMouseEvent = (type) => {
        element.dispatchEvent(new MouseEvent(type, { bubbles: true, cancelable: true, view: window }));
    };
    dispatchMouseEvent('mousedown');
    dispatchMouseEvent('mouseup');
    element.click();
  }

  async renameFile(element, newName) {
    try {
      const fileOption = element.querySelector('[role="option"]');
      if (!fileOption) throw new Error("Could not find file option to click");
      await this.simulateClick(fileOption);

      element.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, cancelable: true }));

      const menu = await this.waitForSelector('div[role="menu"]');
      const renameMenuItem = await this.findElementByText('div[role="menuitem"]', 'Hernoemen', menu) || await this.findElementByText('div[role="menuitem"]', 'Rename', menu);
      if (!renameMenuItem) throw new Error("Rename menu item not found");
      await this.simulateClick(renameMenuItem);

      const renameDialog = await this.waitForSelector('div[role="dialog"]');
      const renameInput = renameDialog.querySelector('input[type="text"]');
      if (!renameInput) throw new Error("Rename input not found in dialog");

      await new Promise(resolve => setTimeout(resolve, 100)); // Wait for input to be ready

      renameInput.value = newName;
      renameInput.dispatchEvent(new Event('input', { bubbles: true, cancelable: true }));

      const confirmButton = await this.findElementByText('button', 'Hernoemen', renameDialog) || await this.findElementByText('button', 'Rename', renameDialog);
      if (!confirmButton) throw new Error("Confirm button not found in dialog");
      await this.simulateClick(confirmButton);

      await this.waitForSelectorToDisappear('div[role="dialog"]');

      // Final check to see if the file with the new name exists
      await this.waitForSelector(`[aria-label="${newName}"]`);

      return true;
    } catch (error) {
      console.error('Rename failed:', error.message);
      // Attempt to close any open dialogs or menus
      const closeButton = document.querySelector('button[aria-label="Close"]');
      if (closeButton) closeButton.click();
      document.body.click(); // Deselect
      return false;
    }
  }

  async waitForSelectorToDisappear(selector, timeout = 5000) {
    return new Promise((resolve, reject) => {
      let element = document.querySelector(selector);
      if (!element) {
        resolve();
        return;
      }

      const observer = new MutationObserver(mutations => {
        element = document.querySelector(selector);
        if (!element) {
          observer.disconnect();
          resolve();
        }
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true
      });

      setTimeout(() => {
        observer.disconnect();
        reject(new Error(`Timeout waiting for selector to disappear: ${selector}`));
      }, timeout);
    });
  }
}

// Initialize content script
new DriveContentScript();