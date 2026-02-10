const { google } = require('googleapis');
const http = require('http');
const url = require('url');
const { shell } = require('electron');
const keytar = require('keytar');
const fs = require('fs');
const path = require('path');

const KEYTAR_SERVICE = 'AntigravityAssistant';
const KEYTAR_ACCOUNT = 'GoogleOAuth';

class GoogleStrategy {
    constructor() {
        this.oauth2Client = null;
        this.scopes = [
            'https://www.googleapis.com/auth/gmail.modify',
            'https://www.googleapis.com/auth/calendar.events',
            'https://www.googleapis.com/auth/userinfo.profile'
        ];
        this.tokens = null;
    }

    /**
     * Initialize the strategy. Load tokens if they exist.
     */
    async init() {
        try {
            // Try to load refresh token from secure storage
            const savedTokens = await keytar.getPassword(KEYTAR_SERVICE, KEYTAR_ACCOUNT);
            if (savedTokens) {
                this.tokens = JSON.parse(savedTokens);
                console.log('[AUTH] Loaded saved tokens.');
            }
        } catch (error) {
            console.warn('[AUTH] Failed to load secure tokens:', error);
        }
    }

    /**
     * Start the OAuth2 flow.
     * @param {string} clientId 
     * @param {string} clientSecret 
     */
    async authenticate(clientId, clientSecret) {
        return new Promise((resolve, reject) => {
            if (!clientId || !clientSecret) {
                return reject(new Error('Missing Client ID or Secret'));
            }

            // Create OAuth2 Client
            this.oauth2Client = new google.auth.OAuth2(
                clientId,
                clientSecret,
                'http://localhost:3000/oauth2callback'
            );

            // If we have tokens, check validity
            if (this.tokens) {
                this.oauth2Client.setCredentials(this.tokens);
                resolve(true); // Already authenticated
                return;
            }

            // Otherwise, start Loopback Server
            const server = http.createServer(async (req, res) => {
                try {
                    if (req.url.startsWith('/oauth2callback')) {
                        const qs = new url.URL(req.url, 'http://localhost:3000').searchParams;
                        const code = qs.get('code');

                        res.end('Authentication successful! You can close this window.');
                        server.close();

                        // Exchange code for tokens
                        const { tokens } = await this.oauth2Client.getToken(code);
                        this.tokens = tokens;
                        this.oauth2Client.setCredentials(tokens);

                        // Save to Keychain
                        await keytar.setPassword(KEYTAR_SERVICE, KEYTAR_ACCOUNT, JSON.stringify(tokens));

                        console.log('[AUTH] Tokens acquired and saved.');
                        resolve(true);
                    }
                } catch (e) {
                    res.end('Authentication failed.');
                    reject(e);
                    server.close();
                }
            });

            server.listen(3000, async () => {
                // Generate Auth URL
                const authorizeUrl = this.oauth2Client.generateAuthUrl({
                    access_type: 'offline',
                    scope: this.scopes,
                });

                // Open Browser
                console.log('[AUTH] Opening browser for auth:', authorizeUrl);
                await shell.openExternal(authorizeUrl);
            });
        });
    }

    /**
     * Get the authenticated API client.
     */
    getClient() {
        return this.oauth2Client;
    }
}

module.exports = GoogleStrategy;
