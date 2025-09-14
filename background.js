import { translate } from '@vitalets/google-translate-api';
import { franc } from 'franc';

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

const activeFetches = new Map(); // tabId → {cancel: false, controller: AbortController}

async function fetchPagedResults(keyword, tabId) {
  if (activeFetches.has(tabId)) {
    activeFetches.get(tabId).cancel = true;
    activeFetches.get(tabId).controller?.abort();
  }

  const controller = new AbortController();
  const state = { cancel: false, controller };
  activeFetches.set(tabId, state);

  chrome.tabs.sendMessage(tabId, { type: "clearSearchResults" });

  let page = 1;
  while (!state.cancel) {
    console.log(`[fetchPagedResults] Fetching page ${page}`);

    try {
      const res = await fetch(
        `https://jisho.org/api/v1/search/words?keyword=${encodeURIComponent(keyword)}&page=${page}`,
        { signal: controller.signal }
      );

      if (!res.ok) {
        console.log(`[fetchPagedResults] Response not OK, stopping.`);
        return; // <-- stop loop
      }

      const data = await res.json();
      if (!data?.data?.length) {
        console.log(`[fetchPagedResults] No more results, stopping.`);
        return; // <-- stop loop
      }

      chrome.tabs.sendMessage(tabId, {
        type: "searchResults",
        entries: data.data,
        page,
      });

      page++;
      await sleep(200);
    } catch (err) {
      if (err.name === "AbortError") {
        console.log(`[fetchPagedResults] Aborted for tab ${tabId}`);
        return; // <-- stop loop
      } else {
        console.error("Fetch error:", err);
        return; // <-- stop loop
      }
    }
  }

  console.log(`[fetchPagedResults] Stopped for tab ${tabId}`);
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
  const tabId = msg.tabId || sender.tab?.id;

  console.log("[onMessage]", msg, sender, "resolved tabId:", tabId);

  if (msg.type === "translate" && msg.text && tabId) {
    translateSelection(msg.text, tabId);
  } else if (msg.type === "search" && msg.text && tabId) {
    fetchPagedResults(msg.text, tabId);
  } else if (msg.type === "stopFetch") {
    console.log("test");
    if (tabId && activeFetches.has(tabId)) {
      console.log(`[stopFetch] Stopping fetch for tab ${tabId}`);
      activeFetches.get(tabId).cancel = true;
      activeFetches.get(tabId).controller?.abort();
    } else {
      console.log(`[stopFetch] No active fetch for tab ${tabId}`);
    }
  }
});