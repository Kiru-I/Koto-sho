import { translate } from '@vitalets/google-translate-api';
import { franc } from 'franc';

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

// Helper to translate selection
async function translateSelection(text, tabId) {
  try {
    const detectedIso3 = franc(text);
    const detectedLang = detectedIso3 === 'und' ? 'unknown' : detectedIso3;

    const targetLang = detectedIso3 === 'jpn' ? 'en' : 'ja';

    const result = await translate(text, { to: targetLang });

    // Send result to content script
    chrome.tabs.sendMessage(tabId, {
      type: "translationResultFull",
      result: {
        original: text,
        text: result.text,
        raw: result.raw,
        srcTranslit: result.raw.sentences.find(s => s.src_translit)?.src_translit,
        detectedLang: detectedLang,
        detectedLangAuto: result.raw.src,
        targetLang: targetLang
      }
    });
  } catch (err) {
    console.error("Translation error:", err.message);
    chrome.tabs.sendMessage(tabId, {
      type: "translationResultFull",
      result: {
        original: text,
        text: "[Translation failed]",
        raw: { sentences: [] },
        srcTranslit: "",
        detectedLang: "N/A",
        targetLang: "N/A"
      }
    });
  }
}

// Context menu creation
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "kotosho-translate",
    title: "Search with Koto-sho",
    contexts: ["selection"],
  });

  chrome.contextMenus.create({
    id: "vitalets-translate",
    title: "Translate selection",
    contexts: ["selection"],
  });
});

// Handle context menu click
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (!tab?.id || !info.selectionText) return;

  if (info.menuItemId === "kotosho-translate") {
    fetchPagedResults(info.selectionText, tab.id);
  } else if (info.menuItemId === "vitalets-translate") {
    translateSelection(info.selectionText, tab.id);
  }
});

// Still keep listener for popup or manual requests
chrome.runtime.onMessage.addListener((msg, sender) => {
  if (msg.type === "translate" && msg.text && sender.tab?.id) {
    translateSelection(msg.text, sender.tab.id);
  } else if (msg.type === "search" && msg.text && sender.tab?.id) {
    fetchPagedResults(msg.text, sender.tab.id);
  }
});