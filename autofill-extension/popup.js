const FIELDS = ['fullName','firstName','lastName','email','phone','address','city','state','zip','country'];
const SETTINGS = ['autoFill','highlight','observer','skipPassword'];

function $(id) { return document.getElementById(id); }

// Tab switching
document.querySelectorAll('.tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
    tab.classList.add('active');
    $('tab-' + tab.dataset.tab).classList.add('active');
    if (tab.dataset.tab === 'activity') loadActivity();
  });
});

// Load saved profile
chrome.storage.local.get([...FIELDS, ...SETTINGS, 'enabled'], (data) => {
  FIELDS.forEach(key => { if (data[key]) $(key).value = data[key]; });

  SETTINGS.forEach(key => {
    const el = $(key);
    if (el) el.checked = data[key] !== false;
  });

  $('globalStatus').textContent = data.enabled !== false ? 'active' : 'paused';
  $('globalStatus').className = 'status-badge ' + (data.enabled !== false ? 'on' : 'off');
});

// Auto-sync first/last name from full name
$('fullName').addEventListener('input', () => {
  const parts = $('fullName').value.trim().split(' ');
  if (parts.length >= 2) {
    if (!$('firstName').value) $('firstName').value = parts[0];
    if (!$('lastName').value) $('lastName').value = parts.slice(1).join(' ');
  }
});

// Save profile
$('saveBtn').addEventListener('click', () => {
  const data = {};
  FIELDS.forEach(key => { data[key] = $(key).value.trim(); });

  chrome.storage.local.set(data, () => {
    $('saveConfirm').classList.add('show');
    setTimeout(() => $('saveConfirm').classList.remove('show'), 2000);

    // Notify content scripts
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        chrome.tabs.sendMessage(tabs[0].id, { type: 'PROFILE_UPDATED', data });
      }
    });
  });
});

// Save settings on toggle
SETTINGS.forEach(key => {
  const el = $(key);
  if (el) {
    el.addEventListener('change', () => {
      chrome.storage.local.set({ [key]: el.checked });
    });
  }
});

// Fill Now button
$('fillNowBtn').addEventListener('click', () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0]) {
      chrome.tabs.sendMessage(tabs[0].id, { type: 'FILL_NOW' }, (response) => {
        if (response && response.count > 0) {
          $('fillNowBtn').textContent = `Filled ${response.count} field${response.count > 1 ? 's' : ''}`;
          setTimeout(() => {
            $('fillNowBtn').innerHTML = `<svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M2 7l3.5 3.5 5.5-6" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg> Fill forms on this page now`;
          }, 2000);
        }
      });
    }
  });
});

// Load activity log
function loadActivity() {
  chrome.storage.local.get('activityLog', (data) => {
    const log = data.activityLog || [];
    const list = $('activityList');

    if (log.length === 0) {
      list.innerHTML = `<div class="empty-state">
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none"><rect x="4" y="8" width="24" height="3" rx="1.5" fill="currentColor"/><rect x="4" y="14" width="18" height="3" rx="1.5" fill="currentColor"/><rect x="4" y="20" width="12" height="3" rx="1.5" fill="currentColor"/></svg>
        <div>No activity yet</div>
        <div style="margin-top:4px;font-size:10px;">Fields filled will appear here</div>
      </div>`;
      return;
    }

    list.innerHTML = log.slice(-20).reverse().map(item => `
      <div class="activity-item">
        <div class="activity-dot ${item.filled ? 'filled' : 'skipped'}"></div>
        <div>
          <div class="activity-text"><strong>${item.site}</strong> — ${item.field}</div>
          <div class="activity-time">${formatTime(item.ts)}</div>
        </div>
      </div>
    `).join('');
  });
}

function formatTime(ts) {
  const d = new Date(ts);
  const now = new Date();
  const diff = Math.floor((now - d) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return d.toLocaleDateString();
}

// Check for detected fields on current tab
chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
  if (tabs[0]) {
    chrome.tabs.sendMessage(tabs[0].id, { type: 'COUNT_FIELDS' }, (response) => {
      if (chrome.runtime.lastError) return;
      if (response && response.count > 0) {
        $('detectedBar').style.display = 'flex';
        $('detectedCount').textContent = response.count;
      }
    });
  }
});
