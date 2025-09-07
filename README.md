# Google Drive Bulk File Renamer

A Google Workspace Add-on to help you efficiently rename files in your Google Drive. This tool provides two main functionalities: removing prefixes from filenames and renaming files in a sequential order.

## Features

This add-on offers two powerful renaming tools, accessible directly within the Google Drive interface.

### 1. Remove Prefix
- **What it does:** Deletes a specific text prefix (e.g., "Copy of ") from the beginning of filenames within a selected folder.
- **Customizable:** You specify the exact prefix to be removed.
- **Smart:** It will not rename a file if removing the prefix results in an empty filename.

### 2. Sequential Rename
- **What it does:** Renames all files in a specified folder to a new base name followed by a number (e.g., `Holiday Photo [1]`, `Holiday Photo [2]`).
- **Sorting:** Files are renamed based on a natural sort of their original names.
- **Customizable Options:**
    - **Ordering:** Choose between ascending (1, 2, 3...) or descending (n, n-1, ...) numbering.
    - **Keep Original Ending:** By default, the tool preserves the original file "ending" (anything after the last dot, like `.pdf` or `.jpg`). You can disable this to completely replace the old filename. This is useful for Google Docs, Sheets, or files without traditional extensions.

## How to Use

1.  **Open the Add-on:** In Google Drive, open the add-on from the right-side panel.
2.  **Find the Folder ID:** Navigate to the folder you want to modify. The Folder ID is the last part of the URL.
    - For example, in `https://drive.google.com/drive/folders/1a2b3c4d5e6f7g8h9i0j`, the ID is `1a2b3c4d5e6f7g8h9i0j`.
3.  Copy and paste this ID into the appropriate "Map ID" / "Folder ID" field in the add-on.

### To Remove a Prefix:
1.  Enter the text you want to remove in the **"Prefix to Remove"** field.
2.  Paste the Folder ID into the **"Folder ID (for Prefix)"** field.
3.  Click the **"Remove Prefix"** button.

### To Rename Sequentially:
1.  Paste the Folder ID into the **"Folder ID (for Sequential)"** field.
2.  Enter your desired new name in the **"New Base Name"** field.
3.  (Optional) Check the **"Descending order"** box to count down (e.g., 10, 9, 8...).
4.  (Optional) Uncheck the **"Keep original 'ending'"** box if you do not want to keep the original file extension.
5.  Click the **"Rename Sequentially"** button.

## Important Notes
- This add-on operates on all files within the specified folder. It does not go into subfolders.
- Always double-check the Folder ID before running an operation, as renaming actions cannot be easily undone.
- The "Keep original 'ending'" feature is designed to be safe for all file types. It identifies an "ending" as any text following the *last* dot in the filename. If there is no dot, no ending is added.
