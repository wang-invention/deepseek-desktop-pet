const fs = require('fs');
const path = require('path');
const { safeStorage } = require('electron');

const DEFAULTS = {
  apiKeyEncrypted: '',
  refreshInterval: 300,
  autoRefresh: true,
  queryOnStart: true,
  autostart: false,
};

class ConfigStore {
  constructor(filePath) {
    this.filePath = filePath;
    this.data = { ...DEFAULTS };
    this.load();
  }

  load() {
    try {
      const raw = fs.readFileSync(this.filePath, 'utf8');
      const parsed = JSON.parse(raw);
      this.data = { ...DEFAULTS, ...parsed };
    } catch {
      this.data = { ...DEFAULTS };
    }
  }

  save() {
    fs.mkdirSync(path.dirname(this.filePath), { recursive: true });
    fs.writeFileSync(this.filePath, JSON.stringify(this.data, null, 2), 'utf8');
  }

  getApiKey() {
    const stored = this.data.apiKeyEncrypted || '';
    if (!stored) {
      return '';
    }
    if (stored.startsWith('enc:') && safeStorage.isEncryptionAvailable()) {
      try {
        return safeStorage.decryptString(Buffer.from(stored.slice(4), 'base64'));
      } catch {
        return '';
      }
    }
    if (stored.startsWith('plain:')) {
      return stored.slice(6);
    }
    return '';
  }

  setApiKey(apiKey) {
    const key = (apiKey || '').trim();
    if (!key) {
      this.data.apiKeyEncrypted = '';
    } else if (safeStorage.isEncryptionAvailable()) {
      this.data.apiKeyEncrypted = 'enc:' + safeStorage.encryptString(key).toString('base64');
    } else {
      this.data.apiKeyEncrypted = 'plain:' + key;
    }
    this.save();
  }

  update(patch) {
    if (Object.prototype.hasOwnProperty.call(patch, 'refreshInterval')) {
      this.data.refreshInterval = Number(patch.refreshInterval) || 300;
    }
    if (Object.prototype.hasOwnProperty.call(patch, 'autoRefresh')) {
      this.data.autoRefresh = Boolean(patch.autoRefresh);
    }
    if (Object.prototype.hasOwnProperty.call(patch, 'queryOnStart')) {
      this.data.queryOnStart = Boolean(patch.queryOnStart);
    }
    if (Object.prototype.hasOwnProperty.call(patch, 'autostart')) {
      this.data.autostart = Boolean(patch.autostart);
    }
    if (Object.prototype.hasOwnProperty.call(patch, 'apiKey')) {
      this.setApiKey(patch.apiKey);
      return;
    }
    if (Object.prototype.hasOwnProperty.call(patch, 'clearApiKey') && patch.clearApiKey) {
      this.setApiKey('');
    }
    this.save();
  }

  maskKey(key) {
    if (!key) {
      return '';
    }
    if (key.length <= 8) {
      return key.slice(0, 2) + '****';
    }
    return key.slice(0, 3) + '************' + key.slice(-4);
  }

  toSafeConfig() {
    const key = this.getApiKey();
    return {
      hasApiKey: Boolean(key),
      maskedKey: this.maskKey(key),
      refreshInterval: this.data.refreshInterval,
      autoRefresh: this.data.autoRefresh,
      queryOnStart: this.data.queryOnStart,
      autostart: this.data.autostart,
    };
  }
}

module.exports = { ConfigStore };
