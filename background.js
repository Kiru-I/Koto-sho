chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === "translate") {
    fetch(`https://jisho.org/api/v1/search/words?keyword=${encodeURIComponent(msg.text)}`)
      .then(res => res.json())
      .then(data => {
        sendResponse({ success: true, data });
      })
      .catch(err => {
        sendResponse({ success: false, error: err.toString() });
      });
    return true; // important! keep the channel open
  }
});


chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "kotosho-translate",
    title: "Koto-sho",
    contexts: ["selection"] // only show when text is selected
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "kotosho-translate" && info.selectionText) {
    chrome.tabs.sendMessage(tab.id, {
      type: "translate",
      text: info.selectionText,
    });
  }
});