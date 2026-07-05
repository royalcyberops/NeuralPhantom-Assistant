const TOGGLE_MESSAGE = { type: "NEURALPHANTOM_TOGGLE" };
const CONTENT_FILES = [
  "src/core/modules.js",
  "src/core/storage.js",
  "src/core/assistant-engine.js",
  "src/content/context-detector.js",
  "src/content/sidebar.js"
];

async function toggleSidebar(tab) {
  if (!tab?.id || !tab.url || !/^https?:\/\//i.test(tab.url)) {
    return;
  }

  try {
    await chrome.tabs.sendMessage(tab.id, TOGGLE_MESSAGE);
  } catch {
    await chrome.scripting.insertCSS({
      target: { tabId: tab.id },
      files: ["src/content/sidebar.css"]
    });
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: CONTENT_FILES
    });
    await chrome.tabs.sendMessage(tab.id, TOGGLE_MESSAGE);
  }
}

chrome.action.onClicked.addListener(toggleSidebar);

chrome.commands.onCommand.addListener(async (command) => {
  if (command !== "toggle-sidebar") {
    return;
  }

  const [tab] = await chrome.tabs.query({
    active: true,
    currentWindow: true
  });
  await toggleSidebar(tab);
});

chrome.runtime.onInstalled.addListener(async () => {
  await chrome.storage.local.set({
    neuralPhantomInstalledAt: new Date().toISOString()
  });
});
