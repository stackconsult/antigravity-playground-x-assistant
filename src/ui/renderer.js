/**
 * @fileoverview Renderer Script
 * Handles UI interactions and calls the Electron API.
 */

// Navigation
const navLinks = document.querySelectorAll('.nav-link');
const views = document.querySelectorAll('.view');

// UI Elements
const saveAuthBtn = document.getElementById('save-auth-btn');
const clientIdInput = document.getElementById('client-id-input');
const clientSecretInput = document.getElementById('client-secret-input');
const authStatusMsg = document.getElementById('auth-status-msg');
const btnAuthGoogle = document.getElementById('btn-auth-google');
const statusDiv = document.getElementById('auth-status');
const btnCalendar = document.getElementById('btn-calendar');

// Calendar Button Logic
if (btnCalendar) {
    btnCalendar.addEventListener('click', () => {
        alert('📅 Opening Calendar View...\n(Integration coming in Phase 3)');
    });
}

// Navigation Logic
navLinks.forEach(link => {
    link.addEventListener('click', () => {
        const tabId = link.dataset.tab;

        // Remove active class
        navLinks.forEach(t => t.classList.remove('active'));
        views.forEach(v => v.classList.add('hidden'));

        // Activate clicked tab
        link.classList.add('active');
        const viewId = `view-${tabId}`;
        const viewEl = document.getElementById(viewId);
        if (viewEl) {
            viewEl.classList.remove('hidden');
            document.getElementById('page-title').innerText = link.innerText;
        }
    });
});

// Run Daily Pulse
const btnRunPulse = document.getElementById('btn-run-pulse');
if (btnRunPulse) {
    btnRunPulse.addEventListener('click', async () => {
        btnRunPulse.innerText = 'RUNNING...';
        btnRunPulse.disabled = true;

        // Initial check
        const status = await window.api.checkAuthStatus();
        updateAuthStatus(status.isAuthenticated);

        try {
            const data = await window.api.runDailyPulse();
            renderPulse(data);
        } catch (e) {
            console.error(e);
            alert('Failed to run Daily Pulse');
        } finally {
            btnRunPulse.innerText = 'RUN DAILY PULSE';
            btnRunPulse.disabled = false;
        }
    });
}

function renderPulse(data) {
    // 1. Inbox
    const inboxMetric = document.querySelector('#card-inbox .metric');
    if (inboxMetric) inboxMetric.innerText = data.emails.length;

    const inboxList = document.getElementById('inbox-list');
    if (inboxList) {
        inboxList.innerHTML = '';
        data.emails.forEach(email => {
            const li = document.createElement('li');
            li.innerHTML = `
                <div class="email-content">
                    <span class="tag">${email.label}</span> ${email.subject}
                </div>
                <div class="email-actions">
                    <button class="action-btn archive" title="Archive">✔</button>
                    <button class="action-btn delete" title="Delete">✖</button>
                </div>
            `;

            // Add interactions
            li.querySelector('.archive').addEventListener('click', (e) => {
                e.stopPropagation();
                li.style.transform = 'scale(0.95)';
                li.style.opacity = '0';
                setTimeout(() => li.remove(), 300);
            });

            li.querySelector('.delete').addEventListener('click', (e) => {
                e.stopPropagation();
                li.style.transform = 'translateX(20px)';
                li.style.opacity = '0';
                setTimeout(() => li.remove(), 300);
            });

            inboxList.appendChild(li);
        });
    }

    // 2. Calendar
    const calMetric = document.querySelector('#card-calendar .metric');
    if (calMetric) calMetric.innerText = data.issues.length;

    const calList = document.getElementById('calendar-list');
    if (calList) {
        calList.innerHTML = '';
        data.issues.forEach(issue => {
            const li = document.createElement('li');
            li.innerHTML = `<span class="tag" style="background:#cf6679">${issue.severity}</span> ${issue.title}: ${issue.issue}`;
            calList.appendChild(li);
        });
    }

    // 3. Brief
    const briefText = document.getElementById('daily-brief-text');
    if (briefText) briefText.innerText = data.summary;
}

// Initial Loads
async function loadPreferences() {
    try {
        const prefs = await window.api.getPreferences();
        const jsonEl = document.getElementById('pref-json');
        if (jsonEl) jsonEl.innerText = JSON.stringify(prefs, null, 2);
    } catch (e) {
        console.warn('Failed to load preferences', e);
    }
}

// Settings & Auth - SAVE Credentials
if (saveAuthBtn) {
    saveAuthBtn.addEventListener('click', async () => {
        const clientId = clientIdInput.value.trim();
        const clientSecret = clientSecretInput.value.trim();

        if (!clientId || !clientSecret) {
            authStatusMsg.textContent = 'Please enter both Client ID and Client Secret.';
            authStatusMsg.style.color = '#ff6b6b';
            return;
        }

        authStatusMsg.textContent = 'Saving credentials...';
        authStatusMsg.style.color = '#bb86fc';

        try {
            await window.api.saveCredentials({ clientId, clientSecret });
            authStatusMsg.textContent = 'Credentials saved! Connecting...';

            // Auto-trigger connection
            const success = await window.api.connectGoogle();
            if (success) {
                authStatusMsg.textContent = 'Connected successfully!';
                authStatusMsg.style.color = '#03dac6';
                updateAuthStatus(true);
            } else {
                authStatusMsg.textContent = 'Saved, but connection failed. Please try again.';
                authStatusMsg.style.color = '#ff6b6b';
            }
        } catch (error) {
            authStatusMsg.textContent = 'Error: ' + error.message;
            authStatusMsg.style.color = '#ff6b6b';
        }
    });

    // Load initial credentials status if possible? 
    // For security we might not want to fill the inputs, but we can check if they exist.
}

// Auth - Connect Button (Legacy/Direct)
if (btnAuthGoogle) {
    btnAuthGoogle.addEventListener('click', async () => {
        btnAuthGoogle.innerText = 'CONNECTING...';
        btnAuthGoogle.disabled = true;

        try {
            const success = await window.api.connectGoogle();
            if (success) {
                alert('Connected successfully!');
                updateAuthStatus(true);
            } else {
                alert('Connection failed. Please check your credentials in Settings.');
            }
        } catch (e) {
            console.error(e);
            alert('Error during authentication.');
        } finally {
            btnAuthGoogle.innerText = 'Connect Google Account';
            btnAuthGoogle.disabled = false;
        }
    });
}

function updateAuthStatus(isConnected) {
    if (!statusDiv) return;

    if (isConnected) {
        statusDiv.innerHTML = '<span class="dot" style="background:#03dac6"></span> Connected';
        if (btnAuthGoogle) btnAuthGoogle.innerText = 'Reconnect Account';
    } else {
        statusDiv.innerHTML = '<span class="dot" style="background:gray"></span> Disconnected';
    }
}

async function checkInitialStatus() {
    try {
        const status = await window.api.checkAuthStatus();
        updateAuthStatus(status.isAuthenticated);
        if (status.hasCredentials && !status.isAuthenticated) {
            if (authStatusMsg) authStatusMsg.textContent = 'Credentials found. Please connect.';
        }
    } catch (e) {
        console.warn('Failed to check auth status', e);
    }
}

// Init
loadPreferences();
checkInitialStatus();
