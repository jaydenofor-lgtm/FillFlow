// FillFlow Content Script v1.1
(function () {
  'use strict';

  if (window.__fillflowLoaded) return;
  window.__fillflowLoaded = true;

  const FIELD_MAP = [
    {
      key: 'email',
      patterns: [/\bemail\b/i, /\be-mail\b/i, /\bcorreo\b/i],
      autocomplete: ['email'],
      inputTypes: ['email']
    },
    {
      key: 'phone',
      patterns: [/\bphone\b/i, /\bmobile\b/i, /\bcell\b/i, /\btel\b/i, /\bphone.?number\b/i],
      autocomplete: ['tel', 'phone', 'tel-national'],
      inputTypes: ['tel']
    },
    {
      key: 'fullName',
      patterns: [/^name$/i, /\bfull.?name\b/i, /\byour.?name\b/i, /\bcontact.?name\b/i],
      autocomplete: ['name']
    },
    {
      key: 'firstName',
      patterns: [/\bfirst.?name\b/i, /\bgiven.?name\b/i, /\bfname\b/i, /\bfirst\b/i],
      autocomplete: ['given-name']
    },
    {
      key: 'lastName',
      patterns: [/\blast.?name\b/i, /\bsur.?name\b/i, /\bfamily.?name\b/i, /\blname\b/i, /\blast\b/i],
      autocomplete: ['family-name']
    },
    {
      key: 'address',
      patterns: [/\baddress\b/i, /\bstreet\b/i, /\bline.?1\b/i],
      autocomplete: ['street-address', 'address-line1']
    },
    {
      key: 'city',
      patterns: [/\bcity\b/i, /\btown\b/i, /\bsuburb\b/i, /\blocality\b/i],
      autocomplete: ['address-level2']
    },
    {
      key: 'state',
      patterns: [/\bstate\b/i, /\bprovince\b/i, /\bregion\b/i],
      autocomplete: ['address-level1']
    },
    {
      key: 'zip',
      patterns: [/\bzip\b/i, /\bpostal\b/i, /\bpost.?code\b/i],
      autocomplete: ['postal-code']
    },
    {
      key: 'country',
      patterns: [/\bcountry\b/i, /\bnation\b/i],
      autocomplete: ['country', 'country-name']
    }
  ];

  const SKIP_TYPES = new Set(['password','hidden','submit','button','checkbox','radio','file','image','reset','range','color']);

  function classifyField(el) {
    if (SKIP_TYPES.has((el.type || '').toLowerCase())) return null;

    const ac = (el.getAttribute('autocomplete') || '').toLowerCase().trim();
    const elType = (el.type || '').toLowerCase();

    const hints = [
      el.name, el.id, el.placeholder,
      el.getAttribute('aria-label'),
      el.getAttribute('data-field'),
      el.getAttribute('data-testid'),
      el.className
    ].map(s => (s || '').toLowerCase());

    for (const fd of FIELD_MAP) {
      if (ac && fd.autocomplete.includes(ac)) return fd.key;
      if (fd.inputTypes && fd.inputTypes.includes(elType)) return fd.key;
      for (const pat of fd.patterns) {
        for (const hint of hints) {
          if (hint && pat.test(hint)) return fd.key;
        }
      }
    }

    const labelText = getLabelText(el);
    if (labelText) {
      for (const fd of FIELD_MAP) {
        for (const pat of fd.patterns) {
          if (pat.test(labelText)) return fd.key;
        }
      }
    }
    return null;
  }

  function getLabelText(el) {
    if (el.id) {
      try {
        const label = document.querySelector(`label[for="${CSS.escape(el.id)}"]`);
        if (label) return label.textContent.trim();
      } catch(e) {}
    }
    const labelledBy = el.getAttribute('aria-labelledby');
    if (labelledBy) {
      const labelEl = document.getElementById(labelledBy);
      if (labelEl) return labelEl.textContent.trim();
    }
    const parentLabel = el.closest('label');
    if (parentLabel) return parentLabel.textContent.trim();
    const parent = el.parentElement;
    if (parent) {
      const label = parent.querySelector('label');
      if (label) return label.textContent.trim();
      const prev = el.previousElementSibling;
      if (prev && ['LABEL','SPAN','DIV','P'].includes(prev.tagName)) {
        return prev.textContent.trim();
      }
    }
    return '';
  }

  function fillInput(el, value, highlight) {
    if (!value || el.dataset.fillflowFilled === 'true') return false;
    if (el.value && el.value.trim().length > 0) return false;
    try {
      const proto = window.HTMLInputElement.prototype;
      const nativeSetter = Object.getOwnPropertyDescriptor(proto, 'value');
      if (nativeSetter && nativeSetter.set) {
        nativeSetter.set.call(el, value);
      } else {
        el.value = value;
      }
      ['input', 'change', 'blur'].forEach(type => {
        el.dispatchEvent(new Event(type, { bubbles: true, cancelable: true }));
      });
      el.dispatchEvent(new KeyboardEvent('keyup', { bubbles: true }));
      el.dataset.fillflowFilled = 'true';
      if (highlight) {
        el.style.transition = 'box-shadow 0.4s ease';
        el.style.boxShadow = '0 0 0 2px rgba(124, 111, 255, 0.45)';
        setTimeout(() => { if (el.style) el.style.boxShadow = ''; }, 2800);
      }
      return true;
    } catch (e) {
      return false;
    }
  }

  function getAllInputs(root) {
    const inputs = [];
    try {
      root.querySelectorAll('input').forEach(el => inputs.push(el));
      root.querySelectorAll('*').forEach(el => {
        if (el.shadowRoot) getAllInputs(el.shadowRoot).forEach(i => inputs.push(i));
      });
    } catch (e) {}
    return inputs;
  }

  function fillForms(profile, settings) {
    const inputs = getAllInputs(document);
    let count = 0;
    const log = [];
    inputs.forEach(input => {
      if (settings.skipPassword && input.type === 'password') return;
      const key = classifyField(input);
      if (!key || !profile[key]) return;
      if (fillInput(input, profile[key], settings.highlight !== false)) {
        count++;
        log.push({ site: window.location.hostname, field: key, filled: true, ts: Date.now() });
      }
    });
    if (log.length > 0) {
      chrome.storage.local.get('activityLog', (data) => {
        const existing = data.activityLog || [];
        chrome.storage.local.set({ activityLog: [...existing, ...log].slice(-100) });
      });
    }
    return count;
  }

  function countFields() {
    return getAllInputs(document).filter(el => classifyField(el) !== null).length;
  }

  function getStorageData(cb) {
    chrome.storage.local.get([
      'fullName','firstName','lastName','email','phone',
      'address','city','state','zip','country',
      'autoFill','highlight','observer','skipPassword','enabled'
    ], cb);
  }

  function runAutoFill() {
    getStorageData((data) => {
      if (data.enabled === false || data.autoFill === false) return;

      const profile = {
        fullName: data.fullName, firstName: data.firstName, lastName: data.lastName,
        email: data.email, phone: data.phone, address: data.address,
        city: data.city, state: data.state, zip: data.zip, country: data.country
      };
      const settings = { highlight: data.highlight !== false, skipPassword: data.skipPassword !== false };

      if (!Object.values(profile).some(v => v && v.trim())) return;

      fillForms(profile, settings);

      if (data.observer !== false && !window.__fillflowObserver) {
        let debounceTimer = null;
        const observer = new MutationObserver(() => {
          clearTimeout(debounceTimer);
          debounceTimer = setTimeout(() => fillForms(profile, settings), 400);
        });
        observer.observe(document.body, { childList: true, subtree: true });
        window.__fillflowObserver = observer;
      }
    });
  }

  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg.type === 'FILL_NOW') {
      getStorageData((data) => {
        const profile = {
          fullName: data.fullName, firstName: data.firstName, lastName: data.lastName,
          email: data.email, phone: data.phone, address: data.address,
          city: data.city, state: data.state, zip: data.zip, country: data.country
        };
        document.querySelectorAll('[data-fillflow-filled]').forEach(el => el.removeAttribute('data-fillflow-filled'));
        const count = fillForms(profile, { highlight: data.highlight !== false, skipPassword: data.skipPassword !== false });
        sendResponse({ count });
      });
      return true;
    }
    if (msg.type === 'COUNT_FIELDS') {
      sendResponse({ count: countFields() });
      return true;
    }
    if (msg.type === 'PROFILE_UPDATED') {
      if (window.__fillflowObserver) { window.__fillflowObserver.disconnect(); window.__fillflowObserver = null; }
      document.querySelectorAll('[data-fillflow-filled]').forEach(el => el.removeAttribute('data-fillflow-filled'));
      runAutoFill();
    }
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', runAutoFill);
  } else {
    runAutoFill();
  }

})();
