// background.js

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchPagedResults(keyword, tabId) {
  let page = 1;

  while (true) {
    console.log(`[fetchPagedResults] Fetching page ${page}`);
    const res = await fetch(
      `https://jisho.org/api/v1/search/words?keyword=${encodeURIComponent(keyword)}&page=${page}`
    );

    if (!res.ok) {
      console.warn(`[fetchPagedResults] Request failed: ${res.status}`);
      break;
    }

    const data = await res.json();
    if (!data || !data.data || data.data.length === 0) {
      console.log("[fetchPagedResults] No more results, stopping.");
      break;
    }

    // Send results to content script
    chrome.tabs.sendMessage(tabId, {
      type: "searchResults",
      entries: data.data,
      page,
    });

    page++;
    await sleep(200); // prevent spamming API
  }
}

// Context menu creation
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "kotosho-translate",
    title: "Search with Koto-sho",
    contexts: ["selection"],
  });
});

// Handle context menu click
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "kotosho-translate" && info.selectionText) {
    console.log(`[contextMenus] Triggered with text: ${info.selectionText}`);
    fetchPagedResults(info.selectionText, tab.id);
  }
});

// Still keep listener for popup or manual requests
chrome.runtime.onMessage.addListener((msg, sender) => {
  if (msg.type === "translate" && msg.text) {
    console.log(`[runtime] Triggered with text: ${msg.text}`);
    fetchPagedResults(msg.text, sender.tab.id);
  }
});
