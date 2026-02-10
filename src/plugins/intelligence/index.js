const https = require('https');

class IntelligenceManager {
    constructor() {
        this.name = 'IntelligenceManager';
        this.kernel = null;
    }

    async init(kernel) {
        console.log('[INTELLIGENCE] Initializing LLM Engine...');
        this.kernel = kernel;
        kernel.intelligence = this;
    }

    /**
     * Generate a draft email response.
     * @param {string} sender 
     * @param {string} subject 
     * @param {string} body 
     */
    async generateDraft(sender, subject, body) {
        const userManual = this.kernel.preferences.get('userManual') || 'Be professional.';
        const prompt = `
Context: You are an executive assistant acting on behalf of the user.
User Manual: ${userManual}
Task: Write a reply to the following email.
From: ${sender}
Subject: ${subject}
Body: "${body}"

Reply Draft:
`;
        return this.ask(prompt);
    }

    async ask(prompt) {
        const prefs = this.kernel.preferences.get('apiKey');
        const provider = this.kernel.preferences.get('llmProvider') || 'openai';

        if (!prefs) {
            console.warn('[INTELLIGENCE] No API Key found.');
            return "Antigravity Assistant: Please configure your API Key in Settings to enable AI features.";
        }

        try {
            if (provider === 'openai') {
                return await this.callOpenAI(prefs, prompt);
            } else {
                return "Provider not supported yet.";
            }
        } catch (e) {
            console.error('[INTELLIGENCE] API Call Failed:', e);
            return "Error generating content. Please checks logs.";
        }
    }

    async callOpenAI(apiKey, prompt) {
        return new Promise((resolve, reject) => {
            const data = JSON.stringify({
                model: "gpt-3.5-turbo-instruct", // or chat model
                prompt: prompt,
                max_tokens: 150,
                temperature: 0.7
            });

            // Note: Use Chat Completions for better results, using Completions for simplicity here
            // Converting to Chat API format is recommended.
            // Let's use Chat API actually.
            const chatData = JSON.stringify({
                model: "gpt-4",
                messages: [
                    { role: "system", content: "You are a helpful executive assistant." },
                    { role: "user", content: prompt }
                ]
            });

            const options = {
                hostname: 'api.openai.com',
                path: '/v1/chat/completions',
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Length': chatData.length
                }
            };

            const req = https.request(options, (res) => {
                let responseBody = '';
                res.on('data', (chunk) => responseBody += chunk);
                res.on('end', () => {
                    if (res.statusCode !== 200) {
                        reject(`OpenAI Error: ${res.statusCode} ${responseBody}`);
                        return;
                    }
                    try {
                        const parsed = JSON.parse(responseBody);
                        resolve(parsed.choices[0].message.content.trim());
                    } catch (e) {
                        reject(e);
                    }
                });
            });

            req.on('error', (e) => reject(e));
            req.write(chatData);
            req.end();
        });
    }
}

module.exports = new IntelligenceManager();
