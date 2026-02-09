# Antigravity Framework x CEO Assistant

This repository contains the **CEO Assistant Operational System**, an automated Executive Assistant built on the Antigravity Framework. It combines a rules-based decision engine with a desktop "Command Center" dashboard.

## 🚀 Features

*   **Core Logic:** Rules engine prioritizing Revenue & Asset Protection.
*   **Daily Pulse:** Automated AM/PM routines (Inbox Zero, Calendar Audit).
*   **Travel Planner:** Generates comprehensive Markdown Trip Files.
*   **Desktop App:** Electron-based dashboard for visual management.
*   **Real Integrations:** Connects to **Gmail** and **Google Calendar** via OAuth2.

## 🛠 Setup & Installation

1.  **Install Dependencies:**
    ```bash
    npm install
    ```

2.  **Configure Google Cloud:**
    *   Create a project in Google Cloud Console.
    *   Enable Gmail and Calendar APIs.
    *   Create OAuth2 Desktop App credentials.
    *   Copy `.env.example` to `.env` and add your keys:
        ```bash
        cp .env.example .env
        ```

3.  **Run the App:**
    ```bash
    npm start
    ```

## 📂 Project Structure

*   `src/index.js` - The Kernel entry point.
*   `src/plugins/` - Functional modules:
    *   `core_logic/` - Rules & Preferences.
    *   `calendar_manager/` - Calendar auditing & sync.
    *   `inbox_processor/` - Email triage & drafting.
    *   `trip_planner/` - Travel file generation.
    *   `auth_manager/` - OAuth2 handling.
*   `src/electron/` - Desktop app backend (Main Process).
*   `src/ui/` - Dashboard Frontend (HTML/CSS/JS).
*   `docs/` - SOPs and Templates.

## 📚 Documentation
See `docs/` for the original SOP and `docs/templates/` for response scripts.
