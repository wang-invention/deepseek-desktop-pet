export class SettingsForm {
  constructor(root) {
    this.root = root;
    this.form = root.querySelector("#settings-form");
    this.apiKeyInput = root.querySelector("#api-key");
    this.currentKey = root.querySelector("#current-key");
    this.clearKeyRow = root.querySelector("#clear-key-row");
    this.clearKey = root.querySelector("#clear-key");
    this.autoRefresh = root.querySelector("#auto-refresh");
    this.refreshInterval = root.querySelector("#refresh-interval");
    this.queryOnStart = root.querySelector("#query-on-start");
    this.autostart = root.querySelector("#autostart");
    this.testResult = root.querySelector("#test-result");
    this.saveHandler = null;
    this.cancelHandler = null;
    this.testHandler = null;

    this.form.addEventListener("submit", (event) => {
      event.preventDefault();
      if (this.saveHandler) {
        this.saveHandler(this.collect());
      }
    });
    root.querySelector("#cancel-btn").addEventListener("click", () => {
      if (this.cancelHandler) {
        this.cancelHandler();
      }
    });
    root.querySelector("#test-btn").addEventListener("click", () => {
      if (this.testHandler) {
        this.testHandler();
      }
    });
  }

  setValues(safe) {
    this.autoRefresh.checked = Boolean(safe.autoRefresh);
    this.refreshInterval.value = String(safe.refreshInterval || 300);
    this.queryOnStart.checked = Boolean(safe.queryOnStart);
    this.autostart.checked = Boolean(safe.autostart);
    this.currentKey.textContent = safe.hasApiKey ? `当前：${safe.maskedKey}` : "当前：未配置";
    this.clearKeyRow.hidden = !safe.hasApiKey;
  }

  apiKeyValue() {
    return this.apiKeyInput.value.trim();
  }

  collect() {
    const payload = {
      autoRefresh: this.autoRefresh.checked,
      refreshInterval: Number(this.refreshInterval.value) || 300,
      queryOnStart: this.queryOnStart.checked,
      autostart: this.autostart.checked,
    };
    if (this.clearKey.checked) {
      payload.clearApiKey = true;
    } else if (this.apiKeyValue()) {
      payload.apiKey = this.apiKeyValue();
    }
    return payload;
  }

  onSave(handler) {
    this.saveHandler = handler;
  }

  onCancel(handler) {
    this.cancelHandler = handler;
  }

  onTest(handler) {
    this.testHandler = handler;
  }

  setTestResult(text, ok) {
    this.testResult.textContent = text;
    this.testResult.classList.toggle("ok", Boolean(ok));
    this.testResult.classList.toggle("fail", !ok);
  }
}
