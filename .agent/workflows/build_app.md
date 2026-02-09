---
description: Build and Package the Application
---

This workflow builds the Electron application for distribution.

1.  **Install Dependencies**
    Ensure all dependencies, including dev dependencies, are installed.
    ```bash
    npm install
    ```

2.  **Run Build**
    Execute the electron-builder process.
    // turbo
    ```bash
    npm run dist
    ```

3.  **Verify Output**
    Check the `dist/` directory for the installers.
