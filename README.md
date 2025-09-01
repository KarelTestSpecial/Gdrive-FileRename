# Drive Bulk File Rename Chrome Extension

This Chrome extension allows you to bulk rename files directly within a Google Drive folder. It provides two renaming methods: removing a prefix and sequential renaming. This extension automates the Google Drive web interface and does not require Google API keys.

## Features

-   **Remove Prefix**: Remove a specific prefix (e.g., "Copy of ") from the names of all selected files.
-   **Sequential Rename**: Rename all files in a folder sequentially (e.g., "Document [1]", "Document [2]", etc.).
-   Option to keep original file extensions.
-   Option for descending order in sequential rename.
-   Works directly in the browser without needing a Google Cloud project.

## Installation

1.  **Download the code**: Clone this repository or download it as a ZIP file and unzip it.
2.  **Open Chrome Extensions**: Open a new tab in Chrome and navigate to `chrome://extensions`.
3.  **Enable Developer Mode**: In the top-right corner, toggle the "Developer mode" switch to on.
4.  **Load the Extension**:
    -   Click the "Load unpacked" button that appears on the top-left.
    -   Navigate to the folder where you saved the extension files (the one containing `manifest.json`) and select it.
5.  **Verify**: The "Drive Bulk File Rename" extension should now appear in your list of extensions. Make sure it is enabled.

## How to Use

### 1. Remove Prefix

1.  Navigate to a folder in your Google Drive containing files with a common prefix (e.g., "Copy of document.txt").
2.  Click on the extension's icon in the Chrome toolbar to open the popup.
3.  In the "1. Remove Prefix" section, the `Prefix to Remove:` input defaults to "Copy of ". You can change this to any prefix you need to remove.
4.  Click the **Remove Prefix** button.
5.  A status message will appear in the popup indicating how many files were successfully renamed.

### 2. Sequential Rename

1.  Navigate to a folder in your Google Drive with a set of files you want to rename sequentially.
2.  Click on the extension's icon to open the popup.
3.  In the "2. Sequential Rename" section, enter a `Base Name:` for your files (e.g., "Holiday Photo").
4.  You can choose to rename in descending order (n -> 1) by checking the `Descending order` checkbox.
5.  The `Keep original file extensions` checkbox is enabled by default. It is recommended to keep this checked to preserve file types.
6.  Click the **Sequential Rename** button.
7.  The extension will rename the files in the folder to "Holiday Photo [1]", "Holiday Photo [2]", and so on. A status message will show the number of renamed files.

---

## Instructies in het Nederlands

### Installatie

1.  **Download de code**: Clone deze repository of download de code als ZIP-bestand en pak het uit.
2.  **Open Chrome Extensies**: Open een nieuwe tab in Chrome en ga naar `chrome://extensions`.
3.  **Schakel Ontwikkelaarsmodus in**: Zet de schakelaar "Ontwikkelaarsmodus" rechtsboven aan.
4.  **Laad de Extensie**:
    -   Klik op de knop "Uitgepakte extensie laden" die linksboven verschijnt.
    -   Navigeer naar de map met de extensiebestanden (de map waar `manifest.json` in staat) en selecteer deze.
5.  **Controleer**: De "Drive Bulk File Rename"-extensie is nu zichtbaar in je lijst. Zorg dat de extensie is ingeschakeld.

### Gebruik

#### 1. Voorvoegsel Verwijderen

1.  Ga naar een map in Google Drive met bestanden die een voorvoegsel hebben (bijv. "Kopie van document.txt").
2.  Klik op het icoon van de extensie in de Chrome-werkbalk.
3.  Onder "1. Remove Prefix" is het standaard voorvoegsel "Copy of ". Pas dit aan als dat nodig is.
4.  Klik op de **Remove Prefix** knop.
5.  Een statusbericht toont hoeveel bestanden zijn hernoemd.

#### 2. Sequentieel Hernoemen

1.  Ga naar een map in Google Drive met de bestanden die je wilt hernoemen.
2.  Klik op het icoon van de extensie.
3.  Onder "2. Sequential Rename", vul een basisnaam in (bijv. "Vakantiefoto").
4.  Kies optioneel voor een aflopende volgorde via de `Descending order` checkbox.
5.  Het is aangeraden om `Keep original file extensions` aangevinkt te laten om de bestandstypes te behouden.
6.  Klik op de **Sequential Rename** knop.
7.  De bestanden worden hernoemd naar "Vakantiefoto [1]", "Vakantiefoto [2]", etc.
