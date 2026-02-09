/**
 * @fileoverview Renderer Script
 * Handles UI interactions and calls the Electron API.
 */

// Navigation
const tabs = document.querySelectorAll('.nav-links li');
const views = document.querySelectorAll('.view');

tabs.forEach(tab => {
    tab.addEventListener('click', () => {
        // Remove active class
        tabs.forEach(t => t.classList.remove('active'));
        views.forEach(v => v.classList.add('hidden'));

        // Activate clicked tab
        tab.classList.add('active');
        const viewId = `view-${tab.dataset.tab}`;
        document.getElementById(viewId).classList.remove('hidden');
        document.getElementById('page-title').innerText = tab.innerText;
    });
});

// Run Daily Pulse
document.getElementById('btn-run-pulse').addEventListener('click', async () => {
    const btn = document.getElementById('btn-run-pulse');
    btn.innerText = 'RUNNING...';
    btn.disabled = true;

    try {
        const data = await window.api.runDailyPulse();
        renderPulse(data);
    } catch (e) {
        console.error(e);
        alert('Failed to run Daily Pulse');
    } finally {
        btn.innerText = 'RUN DAILY PULSE';
        btn.disabled = false;
    }
});

function renderPulse(data) {
    // 1. Inbox
    document.querySelector('#card-inbox .metric').innerText = data.emails.length;
    const inboxList = document.getElementById('inbox-list');
    inboxList.innerHTML = '';
    data.emails.forEach(email => {
        const li = document.createElement('li');
        li.innerHTML = `<span class="tag">${email.label}</span> ${email.subject}`;
        inboxList.appendChild(li);
    });

    // 2. Calendar
    document.querySelector('#card-calendar .metric').innerText = data.issues.length;
    const calList = document.getElementById('calendar-list');
    calList.innerHTML = '';
    data.issues.forEach(issue => {
        const li = document.createElement('li');
        li.innerHTML = `<span class="tag" style="background:#cf6679">${issue.severity}</span> ${issue.title}: ${issue.issue}`;
        calList.appendChild(li);
    });

    // 3. Brief
    document.getElementById('daily-brief-text').innerText = data.summary;
}

// Initial Loads
async function loadPreferences() {
    const prefs = await window.api.getPreferences();
    document.getElementById('pref-json').innerText = JSON.stringify(prefs, null, 2);
}

// Settings & Auth
document.getElementById('btn-auth-google').addEventListener('click', async () => {
    const btn = document.getElementById('btn-auth-google');
    btn.innerText = 'CONNECTING...';
    btn.disabled = true;

    try {
        const success = await window.api.connectGoogle();
        if (success) {
            alert('Connected successfully!');
            updateAuthStatus(true);
        } else {
            alert('Connection failed.');
        }
    } catch (e) {
        console.error(e);
        alert('Error during authentication.');
    } finally {
        btn.innerText = 'Connect Google Account';
        btn.disabled = false;
    }
});

function updateAuthStatus(isConnected) {
    const statusDiv = document.getElementById('auth-status');
    const dot = statusDiv.querySelector('.dot');

    if (isConnected) {
        statusDiv.innerHTML = '<span class="dot" style="background:#03dac6"></span> Connected';
        document.getElementById('btn-auth-google').innerText = 'Reconnect Account';
    } else {
        statusDiv.innerHTML = '<span class="dot" style="background:gray"></span> Disconnected';
    }
}

loadPreferences();
