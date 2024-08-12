
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "aiAssistant",
    title: "AI Tutor讲解",
    contexts: ["selection"]
  });
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === "aiAssistant") {
      const response = await chrome.tabs.sendMessage(tab.id, { type: 'aiAssistant',text: info.selectionText});
      console.log(response);
      // publish link details for use in side_panel.js
      // chrome.runtime.sendMessage({
      //   type: 'linkInfo',
      //   linkText: response.link.linkText,
      //   title: response.link.title,
      //   sourceUrl: response.link.sourceUrl,
      //   href: response.link.href,
      //   id: response.link.id || null
      // });
  }
});

// Add or removes the locale from context menu
// when the user checks or unchecks the locale in the popup
chrome.storage.onChanged.addListener(({ enabledTlds }) => {
  if (typeof enabledTlds === 'undefined') return;

  const allTlds = Object.keys(tldLocales);
  const currentTlds = new Set(enabledTlds.newValue);
  const oldTlds = new Set(enabledTlds.oldValue ?? allTlds);
  const changes = allTlds.map((tld) => ({
    tld,
    added: currentTlds.has(tld) && !oldTlds.has(tld),
    removed: !currentTlds.has(tld) && oldTlds.has(tld)
  }));

  for (const { tld, added, removed } of changes) {
    if (added) {
      chrome.contextMenus.create({
        id: tld,
        title: tldLocales[tld],
        type: 'normal',
        contexts: ['selection']
      });
    } else if (removed) {
      chrome.contextMenus.remove(tld);
    }
  }
});

