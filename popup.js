// Copyright 2017 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

// TLD: top level domain; the "com" in "google.com"

createForm().catch(console.error);

const modelList = {
  'deepseek': 'deepseek',
  'qwen': 'qwen',
  // 添加更多模型
};

async function createForm() {
  const form = document.getElementById('modelForm');
  const { modelSettings = {} } = await chrome.storage.sync.get('modelSettings');

  for (const [model, modelName] of Object.entries(modelList)) {
    const apiKeyInput = document.createElement('input');
    apiKeyInput.type = 'text';
    apiKeyInput.name = `${model}_apikey`;
    apiKeyInput.placeholder = 'API Key';
    apiKeyInput.value = modelSettings[model]?.apikey || '';

    const baseUrlInput = document.createElement('input');
    baseUrlInput.type = 'text';
    baseUrlInput.name = `${model}_base_url`;
    baseUrlInput.placeholder = 'Base URL';
    baseUrlInput.value = modelSettings[model]?.base_url || '';

    const span = document.createElement('span');
    span.textContent = modelName;

    const div = document.createElement('div');
    div.className = 'model-item';
    div.appendChild(span);
    div.appendChild(apiKeyInput);
    div.appendChild(baseUrlInput);

    form.appendChild(div);
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const settings = {};

    for (const [model, modelName] of Object.entries(modelList)) {
      const apikey = form[`${model}_apikey`].value;
      const base_url = form[`${model}_base_url`].value;
      settings[model] = { apikey, base_url };
    }

    await chrome.storage.sync.set({ modelSettings: settings });
    alert('设置已保存');
  });
}


async function handleCheckboxClick(event) {
  const checkbox = event.target;
  const tld = checkbox.name;
  const enabled = checkbox.checked;

  const { enabledTlds = Object.keys(tldLocales) } =
    await chrome.storage.sync.get('enabledTlds');
  const tldSet = new Set(enabledTlds);

  if (enabled) tldSet.add(tld);
  else tldSet.delete(tld);

  await chrome.storage.sync.set({ enabledTlds: [...tldSet] });
}


// popup.js
chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
  chrome.tabs.sendMessage(tabs[0].id, { action: 'getSelectedText' }, (response) => {
    if (response && response.text) {
      document.getElementById('popup-content').textContent = response.text;
    }
  });
});