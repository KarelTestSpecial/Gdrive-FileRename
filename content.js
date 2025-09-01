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
    // Google Drive has a list view and a grid view. We need to handle both.
    const gridViewSelector = 'div[data-id][role="gridcell"]';
    const listViewSelector = 'div[data-id][role="row"]';

    // Wait for either view to be present.
    await this.waitForSelector(`${gridViewSelector}, ${listViewSelector}`, 10000); // Increased timeout

    const gridElements = Array.from(document.querySelectorAll(gridViewSelector));
    const listElements = Array.from(document.querySelectorAll(listViewSelector));

    const allElements = [...gridElements, ...listElements];

    // The way to identify a folder is to check for an aria-label that says "Folder".
    // This seems to be consistent across views.
    return allElements.filter(el => {
        const isFolder = el.querySelector('div[aria-label="Folder"], svg[aria-label="Folder"]');
        return !isFolder;
    });
  }

  async waitForSelector(selector, timeout = 10000) {
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
        const fileId = element.getAttribute('data-id');
        const currentName = element.querySelector('[role="option"] div[aria-label]')?.getAttribute('aria-label');

        if (fileId && currentName && currentName.startsWith(prefix)) {
          const newName = currentName.substring(prefix.length);
          if (newName.trim()) {
            const success = await this.renameFile(fileId, newName);
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
      
      const fileData = fileElements.map(el => ({
        element: el,
        fileId: el.getAttribute('data-id'),
        name: el.querySelector('[role="option"] div[aria-label]')?.getAttribute('aria-label') || ''
      })).filter(f => f.fileId && f.name);

      fileData.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }));

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

        const success = await this.renameFile(item.fileId, newName);
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

  async renameFile(fileId, newName) {
    try {
      // This is a guess based on how Google's batch APIs typically work.
      const BATCH_EXECUTE_URL = 'https://drive.google.com/drive/v2/batch/execute';

      const payload = [{
        "method": "rename",
        "params": {
          "itemId": fileId,
          "title": newName
        }
      }];

      const formData = new FormData();
      formData.append('batchExecute', JSON.stringify(payload));

      const response = await fetch(BATCH_EXECUTE_URL, {
        method: 'POST',
        body: formData,
        // Headers like authorization and cookies are sent automatically by the browser.
      });

      if (!response.ok) {
        throw new Error(`Network response was not ok, status: ${response.status}`);
      }

      const responseText = await response.text();
      // The response is often prefixed with ")]}'" to prevent JSON hijacking.
      const cleanedResponse = JSON.parse(responseText.replace(")]}'", ""));

      // Check the response for the specific operation's success.
      // This structure is a guess.
      const result = cleanedResponse[0];
      if (result && result.result && result.result.id === fileId) {
        console.log(`Successfully renamed file ${fileId} to ${newName}`);
        return true;
      } else {
        console.error('Rename failed. API response:', cleanedResponse);
        return false;
      }
    } catch (error) {
      console.error('Error during renameFile API call:', error);
      return false;
    }
  }
}

// Initialize content script
new DriveContentScript();