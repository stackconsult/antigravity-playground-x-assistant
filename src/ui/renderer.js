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
navLinks.forEach((link) => {
  link.addEventListener('click', () => {
    const tabId = link.dataset.tab;

    // Remove active class
    navLinks.forEach((t) => t.classList.remove('active'));
    views.forEach((v) => v.classList.add('hidden'));

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
    data.emails.forEach((email) => {
      const li = document.createElement('li');

      // Map Label to CSS Class
      let tagClass = 'tag ';
      if (email.label === '@Urgent') tagClass += 'urgent';
      else if (email.label === '@Inbox') tagClass += 'inbox';
      else tagClass += 'low';

      // Tooltip for reasoning
      const reasonText = `Score: ${email.score}/100`;

      li.innerHTML = `
                <div class="email-content" title="${reasonText}">
                    <span class="${tagClass}">${email.label}</span> 
                    <span style="font-size:0.8rem; color:#666; margin-right:5px">[${email.score}]</span>
                    ${email.subject}
                </div>
                <div class="email-actions">
                    ${email.draft ? `<button class="action-btn review" title="Review Draft">✎</button>` : ''}
                    <button class="action-btn archive" title="Archive">✔</button>
                    <button class="action-btn delete" title="Delete">✖</button>
                </div>
            `;

      // Draft Preview Container (Hidden by default)
      if (email.draft) {
        const draftDiv = document.createElement('div');
        draftDiv.className = 'draft-preview hidden';
        draftDiv.innerHTML = `
                    <textarea>${email.draft}</textarea>
                    <button class="primary-btn sm-btn">Send Draft</button>
                `;
        li.appendChild(draftDiv);

        // Toggle logic
        li.querySelector('.review').addEventListener('click', (e) => {
          e.stopPropagation();
          draftDiv.classList.toggle('hidden');
        });

        // Send Logic
        draftDiv.querySelector('button').addEventListener('click', (e) => {
          e.stopPropagation();
          alert('Draft Sent! (Simulated)');
          li.remove();
        });
      }

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
    data.issues.forEach((issue) => {
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
      authStatusMsg.textContent =
        'Please enter both Client ID and Client Secret.';
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
        authStatusMsg.textContent =
          'Saved, but connection failed. Please try again.';
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
    statusDiv.innerHTML =
      '<span class="dot" style="background:#03dac6"></span> Connected';
    if (btnAuthGoogle) btnAuthGoogle.innerText = 'Reconnect Account';
  } else {
    statusDiv.innerHTML =
      '<span class="dot" style="background:gray"></span> Disconnected';
  }
}

async function checkInitialStatus() {
  try {
    const status = await window.api.checkAuthStatus();
    updateAuthStatus(status.isAuthenticated);
    if (status.hasCredentials && !status.isAuthenticated) {
      if (authStatusMsg)
        authStatusMsg.textContent = 'Credentials found. Please connect.';
    }
  } catch (e) {
    console.warn('Failed to check auth status', e);
  }
}

// Init
checkInitialStatus();
loadPreferences();

// Preferences Logic - LLM
const btnSavePrefs = document.getElementById('save-prefs-btn');
if (btnSavePrefs) {
  btnSavePrefs.addEventListener('click', async () => {
    const provider = document.getElementById('llm-provider').value;
    const apiKey = document.getElementById('llm-api-key').value;
    const userManual = document.getElementById('user-manual').value;

    btnSavePrefs.innerText = 'Saving...';
    try {
      await window.api.savePreferences({
        llmProvider: provider,
        apiKey: apiKey,
        userManual: userManual,
      });
      alert('Settings Saved!');
      // Reload to reflect changes if needed
    } catch (e) {
      console.error(e);
      alert('Failed to save settings.');
    } finally {
      btnSavePrefs.innerText = 'Save Intelligence Settings';
    }
  });
}

function loadPreferences() {
  if (!window.api.getPreferences) return;

  window.api.getPreferences().then((prefs) => {
    if (!prefs) return;

    // Populate Form
    const manualEl = document.getElementById('user-manual');
    if (manualEl && prefs.userManual) manualEl.value = prefs.userManual;

    const providerEl = document.getElementById('llm-provider');
    if (providerEl && prefs.llmProvider) providerEl.value = prefs.llmProvider;

    const apiKeyEl = document.getElementById('llm-api-key');
    if (apiKeyEl && prefs.apiKey) apiKeyEl.value = prefs.apiKey;

    // Also update JSON view if present
    const prefJson = document.getElementById('pref-json');
    if (prefJson) {
      prefJson.innerText = JSON.stringify(prefs, null, 2);
    }
  });
}

// CRM Logic
const btnAddCrm = document.getElementById('btn-add-crm');
if (btnAddCrm) {
  btnAddCrm.addEventListener('click', async () => {
    const email = document.getElementById('crm-email').value;
    const name = document.getElementById('crm-name').value;
    const type = document.getElementById('crm-type').value;

    if (email && name) {
      btnAddCrm.innerText = 'Adding...';
      try {
        await window.api.addToCampaign({ email, name, type });
        alert(`Added ${name} to ${type}`);
        document.getElementById('crm-email').value = '';
        document.getElementById('crm-name').value = '';
        loadCrm(); // Refresh list
      } catch (e) {
        console.error(e);
        alert('Failed to add to campaign');
      } finally {
        btnAddCrm.innerText = 'Add';
      }
    }
  });
}

function loadCrm() {
  const list = document.getElementById('crm-list');
  if (!list) return;

  // Check if API exists
  if (!window.api.getCampaigns) {
    // Fallback for mock if handler not exposed in preload yet (Note: we need to update preload!)
    console.warn('getCampaigns API not found');
    return;
  }

  window.api.getCampaigns().then((campaigns) => {
    list.innerHTML = '';
    if (campaigns.length === 0) {
      list.innerHTML = '<li style="color:#777">No active campaigns.</li>';
      return;
    }

    campaigns.forEach((c) => {
      const li = document.createElement('li');
      li.innerHTML = `
                <div class="email-content">
                    <span class="tag" style="background:#4caf50">${c.status}</span>
                    <strong>${c.name}</strong> (${c.email})
                    <br>
                    <span style="font-size:0.8rem; color:#888">Step: ${c.step} | Next: ${new Date(c.nextActionDate).toLocaleDateString()}</span>
                </div>
                <div class="email-actions">
                    <button class="action-btn delete" title="Stop">✖</button>
                </div>
            `;
      list.appendChild(li);
    });
  });
}

// Hook into Navigation to load CRM data when tab is clicked
navLinks.forEach((link) => {
  link.addEventListener('click', () => {
    if (link.dataset.tab === 'crm') {
      loadCrm();
    }
  });
});
