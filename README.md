# Antigravity Framework x CEO Assistant

This repository contains the **CEO Assistant Operational System**, an automated Executive Assistant built on the Antigravity Framework. It combines a rules-based decision engine with a desktop "Command Center" dashboard.

## 🚀 Features

- **Core Logic:** Rules engine prioritizing Revenue & Asset Protection.
- **Daily Pulse:** Automated AM/PM routines (Inbox Zero, Calendar Audit).
- **Travel Planner:** Generates comprehensive Markdown Trip Files.
- **Desktop App:** Electron-based dashboard for visual management.
- **Real Integrations:** Connects to **Gmail** and **Google Calendar** via OAuth2.

### 🚀 Installation & Build

**Prerequisites:**

- Node.js (v18+)

**1. Install Dependencies**

```bash
sudo npm install
```

_(Note: `sudo` may be required due to permission settings on some systems)_

**2. Development**

```bash
npm start
```

This launches the app in development mode with hot-reloading.

**3. Package for Distribution (Mac/Win/Linux)**

```bash
npm run dist
```

This generates a standalone installer (e.g., `.dmg`, `.exe`) in the `dist/` folder.

---

### 🔑 Authentication Setup

1.  **Launch the App**: Open Antigravity Assistant.
2.  **Go to Settings**: Click the 'Settings' tab.
3.  **Enter Credentials**: Input your **Google Client ID** and **Client Secret**.
4.  **Connect**: Click 'Save & Connect'.
    - A browser window will open for you to log in to your Google Account.
    - Grant the requested permissions.
5.  **Status**: The app will show "Authenticated" upon success.

_(Credentials are stored securely in your system's User Data directory)_

## 🛠 Setup & Installation

1.  **Install Dependencies:**

    ```bash
    npm install
    ```

2.  **Configure Google Cloud:**
    - Create a project in Google Cloud Console.
    - Enable Gmail and Calendar APIs.
    - Create OAuth2 Desktop App credentials.
    - **Option A (Dev):** Copy `.env.example` to `.env` and add your keys:
      ```bash
      cp .env.example .env
      ```
    - **Option B (Production):** Launch the app (`npm start`), go to **Settings**, and enter your Client ID/Secret directly.

3.  **Run the App:**
    ```bash
    npm start
    ```

## 📂 Project Structure

- `src/index.js` - The Kernel entry point.
- `src/plugins/` - Functional modules:
  - `core_logic/` - Rules & Preferences.
  - `calendar_manager/` - Calendar auditing & sync.
  - `inbox_processor/` - Email triage & drafting.
  - `trip_planner/` - Travel file generation.
  - `auth_manager/` - OAuth2 handling.
- `src/electron/` - Desktop app backend (Main Process).
- `src/ui/` - Dashboard Frontend (HTML/CSS/JS).
- `docs/` - SOPs and Templates.

## 📚 Documentation

See `docs/` for the original SOP and `docs/templates/` for response scripts.
