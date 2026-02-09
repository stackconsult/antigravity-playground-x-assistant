/**
 * @fileoverview Authentication Manager Plugin
 * Handles Google OAuth2 flow and secure token storage.
 */

const { google } = require('googleapis');
const keytar = require('keytar');
const { BrowserWindow, app } = require('electron');
const http = require('http');
const url = require('url');
const fs = require('fs');
const path = require('path');

const SERVICE_NAME = 'Antigravity_CEO_Assistant';
const ACCOUNT_NAME = 'google_oauth_tokens';

class AuthManager {
    constructor() {
        this.scopes = [
            'https://www.googleapis.com/auth/gmail.modify',
            'https://www.googleapis.com/auth/gmail.compose',
            'https://www.googleapis.com/auth/calendar.events'
        ];
        this.oauth2Client = null;
    }

    async init(kernel) {
        console.log('[AUTH] Initializing Authentication Manager...');
        kernel.auth = this;

        // 1. Load Credentials (try Env then File)
        await this.initialize();
    }

    async initialize() {
        const creds = await this.loadCredentials();
        if (creds) {
            this.oauth2Client = new google.auth.OAuth2(
                creds.client_id,
                creds.client_secret,
                creds.redirect_uris ? creds.redirect_uris[0] : 'http://localhost:3000/oauth2callback'
            );
            await this.loadTokens();
        } else {
            console.error('[AUTH] No credentials found. Please set .env vars or add credentials.json');
        }
    }

    /**
     * Load Client ID/Secret from .env OR credentials.json
     */
    async loadCredentials() {
        // Option A: Environment Variables
        if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
            console.log('AuthManager: Loaded credentials from Environment Variables');
            return {
                client_id: process.env.GOOGLE_CLIENT_ID,
                client_secret: process.env.GOOGLE_CLIENT_SECRET
            };
        }

        // Option B: User Data Directory (Production/Custom)
        try {
            const userDataPath = app.getPath('userData');
            const userCredPath = path.join(userDataPath, 'credentials.json');
            if (fs.existsSync(userCredPath)) {
                const content = fs.readFileSync(userCredPath, 'utf8');
                const creds = JSON.parse(content);
                if (creds.client_id && creds.client_secret) {
                    console.log('AuthManager: Loaded credentials from UserData');
                    return creds;
                }
            }
        } catch (err) {
            console.warn('AuthManager: Failed to load from userData', err);
        }

        // Option C: Local File (Dev / credentials.json in root)
        try {
            const localCredPath = path.join(process.cwd(), 'credentials.json');
            if (fs.existsSync(localCredPath)) {
                const content = fs.readFileSync(localCredPath, 'utf8');
                const creds = JSON.parse(content);
                // Handle standard Google download format
                if (creds.installed) return creds.installed;
                if (creds.web) return creds.web;
                return creds;
            }
        } catch (err) {
            console.warn('AuthManager: Failed to load local credentials.json');
        }

        return null;
    }

    /**
     * Save credentials provided by the user via UI
     */
    async saveCredentials({ clientId, clientSecret }) {
        try {
            if (!clientId || !clientSecret) throw new Error('Missing fields');

            const userDataPath = app.getPath('userData');
            // Ensure directory exists
            if (!fs.existsSync(userDataPath)) {
                fs.mkdirSync(userDataPath, { recursive: true });
            }

            const userCredPath = path.join(userDataPath, 'credentials.json');

            const data = {
                client_id: clientId,
                client_secret: clientSecret
            };

            fs.writeFileSync(userCredPath, JSON.stringify(data, null, 2));
            console.log('AuthManager: Saved credentials to', userCredPath);

            // Reload immediately
            await this.initialize();
            return { success: true };
        } catch (error) {
            console.error('AuthManager: Save failed', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Check current authentication status
     */
    async checkStatus() {
        const creds = await this.loadCredentials();
        const hasCreds = !!creds;
        const tokens = await this.loadTokens(); // This sets valid tokens to oauth2Client if found
        const hasTokens = !!tokens;

        return {
            hasCredentials: hasCreds,
            isAuthenticated: hasTokens,
            userEmail: 'Unknown'
        };
    }

    /**
     * Load tokens from secure storage (Keychain/Credential Manager).
     */
    async loadTokens() {
        if (!this.oauth2Client) return false;
        try {
            const tokensStr = await keytar.getPassword(SERVICE_NAME, ACCOUNT_NAME);
            if (tokensStr) {
                const tokens = JSON.parse(tokensStr);
                this.oauth2Client.setCredentials(tokens);
                console.log('[AUTH] Tokens loaded successfully.');
                return true;
            }
        } catch (e) {
            console.error('[AUTH] Failed to load tokens:', e);
        }
        return false;
    }

    /**
     * Start the OAuth2 flow to get new tokens.
     */
    async authenticate() {
        if (!this.oauth2Client) {
            console.error('[AUTH] OAuth2Client not initialized. Missing credentials.');
            return false;
        }

        return new Promise((resolve, reject) => {
            const authorizeUrl = this.oauth2Client.generateAuthUrl({
                access_type: 'offline',
                scope: this.scopes,
            });

            // Spawn a temporary server to handle the callback
            const server = http.createServer(async (req, res) => {
                try {
                    if (req.url.indexOf('/oauth2callback') > -1) {
                        const qs = new url.URL(req.url, 'http://localhost:3000').searchParams;
                        const code = qs.get('code');
                        res.end('Authentication successful! You can close this window.');
                        server.close();

                        const { tokens } = await this.oauth2Client.getToken(code);
                        this.oauth2Client.setCredentials(tokens);
                        await keytar.setPassword(SERVICE_NAME, ACCOUNT_NAME, JSON.stringify(tokens));

                        console.log('[AUTH] New tokens acquired and saved.');
                        resolve(true);
                    }
                } catch (e) {
                    reject(e);
                }
            }).listen(3000, async () => {
                // Open the auth URL in the default browser or Electron window
                const win = new BrowserWindow({ width: 800, height: 600 });
                win.loadURL(authorizeUrl);
                win.on('closed', () => {
                    // Handle user closing window prematurely if needed
                });
            });
        });
    }

    /**
     * Get an authorized client instance.
     */
    getClient() {
        return this.oauth2Client;
    }
}

module.exports = new AuthManager();
