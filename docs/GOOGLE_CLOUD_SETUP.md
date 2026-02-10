# Google Cloud Setup Guide for Antigravity Assistant

This document details exactly why Google Cloud Platform (GCP) is required and how
to configure it to enable the Executive Assistant's capabilities (Inbox Zero,
Calendar Audit, etc.).

## ❓ Why Google Cloud?

The Assistant needs to interact with your personal/work data (Emails, Calendar
Events) programmatically. Google does not allow apps to access this data with
just a password. Instead, it uses **OAuth 2.0**, a secure protocol where:

1. **GCP Project:** Represents the "App" (the Assistant).
2. **APIs:** Define _what_ the App can do (Read Email, Edit Calendar).
3. **Credentials:** Provide the keys (Client ID/Secret) for the App to prove its
   identity to Google.
4. **Consent Screen:** Shows you (the user) what permissions the App is
   requesting, so you can approve them.

## 🔑 Required APIs & Scopes (Permissions)

The Assistant requires the following specialized access:

| API Name                | Scope URL                                        | Why it's needed                                                            |
| :---------------------- | :----------------------------------------------- | :------------------------------------------------------------------------- |
| **Google Calendar API** | `https://www.googleapis.com/auth/calendar`       | To **Audit** your schedule for conflicts and missing details (Zoom links). |
| **Gmail API**           | `https://www.googleapis.com/auth/gmail.readonly` | To **Read** incoming emails for triage.                                    |
| **Gmail API**           | `https://www.googleapis.com/auth/gmail.modify`   | To **Star/Label** emails based on priority.                                |
| **Gmail API**           | `https://www.googleapis.com/auth/gmail.compose`  | To **Draft** responses for you to review.                                  |

---

## 🛠 Step-by-Step Configuration

### Step 1: Create a Project

1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
2. Click the project dropdown (top left) > **"New Project"**.
3. Name it `Antigravity-Assistant` and click **Create**.
4. Select the new project.

### Step 2: Enable APIs

1. In the left sidebar, go to **APIs & Services > Library**.
2. Search for **"Google Calendar API"** > Click **Enable**.
3. Search for **"Gmail API"** > Click **Enable**.

### Step 3: Configure Consent Screen

1. Go to **APIs & Services > OAuth consent screen**.
2. Select **External** (unless you have a Google Workspace organization, then
   Internal is fine). Click **Create**.
3. **App Information:**
   - App Name: `CEO Assistant`
   - User Support Email: Your email.
   - Developer Contact Info: Your email.
4. **Scopes:** Click "Add or Remove Scopes" and add the ones listed above
   (`calendar`, `gmail.readonly`, etc.).
5. **Test Users:** Add your own email address (This is **CRITICAL** while the
   app is in "Testing" mode).

### Step 4: Create Credentials

1. Go to **APIs & Services > Credentials**.
2. Click **+ CREATE CREDENTIALS** > **OAuth client ID**.
3. **Application Type:** Select **Desktop App**.
4. Name: `Antigravity Desktop Client`.
5. Click **Create**.
6. You will see a popup with "Your Client ID" and "Your Client Secret".
7. **Download JSON:** Click the **Download JSON** button (looks like a download
   icon). Save this file (it will be `client_secret_....json`).

---

## 🚀 Connecting to the App

1. **Rename & Move:** Rename the downloaded JSON file to `credentials.json` and
   place it in the root of the project:
   `antigravity-playground-x-assistant/credentials.json`

   _(Note: This file is `.gitignored` to keep your secrets safe)._

2. **Environment Variables:**
   Create a `.env` file in the root directory (copy from `.env.example` if
   available) and add:

   ```bash
   GOOGLE_CLIENT_ID=your_client_id_here
   GOOGLE_CLIENT_SECRET=your_client_secret_here
   ```

   _(The default implementation might use `credentials.json` directly, but
   having them in `.env` is good practice)._

3. **Run the App:**

   ```bash
   npm start
   ```

   Click **"Connect Google Account"** in the dashboard. A browser window will
   open asking for permission. Grant it.
