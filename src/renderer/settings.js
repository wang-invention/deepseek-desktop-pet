import { SettingsForm } from "./components/settings-form.js";

const form = new SettingsForm(document.querySelector("#settings-app"));
let safeConfig = { hasApiKey: false };

form.onSave(async (payload) => {
  await window.petAPI.saveConfig(payload);
  window.close();
});

form.onCancel(() => window.close());

form.onTest(async () => {
  form.setTestResult("正在测试…", true);
  const typedKey = form.apiKeyValue();
  let result;
  if (typedKey) {
    result = await window.petAPI.testBalance(typedKey);
  } else if (safeConfig.hasApiKey) {
    result = await window.petAPI.getBalance();
  } else {
    form.setTestResult("请先输入 API Key", false);
    return;
  }
  if (result.ok) {
    form.setTestResult("连接成功，余额接口正常", true);
  } else {
    form.setTestResult("连接失败，请检查 Key 和网络", false);
  }
});

async function init() {
  safeConfig = await window.petAPI.getConfig();
  form.setValues(safeConfig);
}

init();
