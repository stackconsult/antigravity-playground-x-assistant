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
    const userManual =
      this.kernel.userManual.get('userManual') || 'Be professional.';
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
    const provider = this.kernel.config.get('llmProvider') || 'openai';

    console.log(`[INTELLIGENCE] Generating with provider: ${provider}`);

    try {
      if (provider === 'openai') {
        const key = this.kernel.config.get('apiKey');
        if (!key) throw new Error('Missing OpenAI API Key');
        return await this.callOpenAI(key, prompt);
      } else if (provider === 'anthropic') {
        const key = this.kernel.config.get('anthropicKey');
        if (!key) throw new Error('Missing Anthropic API Key');
        return await this.callAnthropic(key, prompt);
      } else if (provider === 'gemini') {
        const key = this.kernel.config.get('geminiKey');
        if (!key) throw new Error('Missing Gemini API Key');
        return await this.callGemini(key, prompt);
      } else {
        return 'Provider not supported yet.';
      }
    } catch (e) {
      console.error('[INTELLIGENCE] API Call Failed:', e);
      return `Error generating content: ${e.message}`;
    }
  }

  async callOpenAI(apiKey, prompt) {
    return new Promise((resolve, reject) => {
      const chatData = JSON.stringify({
        model: 'gpt-4',
        messages: [
          { role: 'system', content: 'You are a helpful executive assistant.' },
          { role: 'user', content: prompt },
        ],
      });

      const options = {
        hostname: 'api.openai.com',
        path: '/v1/chat/completions',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
          'Content-Length': chatData.length,
        },
      };

      const req = https.request(options, (res) => {
        let responseBody = '';
        res.on('data', (chunk) => (responseBody += chunk));
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

  async callAnthropic(apiKey, prompt) {
    return new Promise((resolve, reject) => {
      const data = JSON.stringify({
        model: 'claude-3-opus-20240229',
        max_tokens: 1024,
        messages: [{ role: 'user', content: prompt }],
      });

      const options = {
        hostname: 'api.anthropic.com',
        path: '/v1/messages',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'Content-Length': data.length,
        },
      };

      const req = https.request(options, (res) => {
        let responseBody = '';
        res.on('data', (chunk) => (responseBody += chunk));
        res.on('end', () => {
          if (res.statusCode !== 200) {
            reject(`Anthropic Error: ${res.statusCode} ${responseBody}`);
            return;
          }
          try {
            const parsed = JSON.parse(responseBody);
            resolve(parsed.content[0].text.trim());
          } catch (e) {
            reject(e);
          }
        });
      });

      req.on('error', (e) => reject(e));
      req.write(data);
      req.end();
    });
  }

  async callGemini(apiKey, prompt) {
    // Gemini implementation TBD - specific endpoint research needed for raw HTTP
    return 'Gemini integration placeholder - Requires specific regional endpoint research.';
  }
}

module.exports = new IntelligenceManager();
