// Copyright 2017 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

// TLD: top level domain; the "com" in "google.com"

createForm().catch(console.error);

async function createForm() {

  const form = document.getElementById('modelForm');
  const { modelSettings = {} } = await chrome.storage.sync.get('modelSettings');
  form["api_key"].value = modelSettings["api_key"]
  form["model"].value = modelSettings["model"] || "deepseek"
  form["base_url"].value = modelSettings["base_url"]
  form["eng_level"].value = modelSettings["eng_level"] || "四级"

  form.addEventListener('submit', async (event) => {
    try {
      event.preventDefault();
      const form = document.getElementById('modelForm');

      const model = form["model"].value;
      const api_key = form["api_key"].value;
      const base_url = form["base_url"].value;
      const eng_level = form["eng_level"].value;
      const settings = { model, api_key, base_url, eng_level };

      await chrome.storage.sync.set({ modelSettings: settings });
      alert('设置已保存');
    } catch (error) {
      console.error(error)
    }
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