/**
 * @fileoverview Authentication Manager Plugin
 * Handles Google OAuth2 flow and secure token storage.
 */

const { google } = require('googleapis');
const keytar = require('keytar');
const { BrowserWindow } = require('electron');
const http = require('http');
const url = require('url');

const SERVICE_NAME = 'Antigravity_CEO_Assistant';
const ACCOUNT_NAME = 'google_oauth_tokens';

class AuthManager {
    constructor() {
        this.oauth2Client = new google.auth.OAuth2(
            process.env.GOOGLE_CLIENT_ID,
            process.env.GOOGLE_CLIENT_SECRET,
            'http://localhost:3000/oauth2callback'
        );

        this.scopes = [
            'https://www.googleapis.com/auth/gmail.modify',
            'https://www.googleapis.com/auth/calendar.events'
        ];
    }

    async init(kernel) {
        console.log('[AUTH] Initializing Authentication Manager...');
        kernel.auth = this;
        await this.loadTokens();
    }

    /**
     * Load tokens from secure storage (Keychain/Credential Manager).
     */
    async loadTokens() {
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
