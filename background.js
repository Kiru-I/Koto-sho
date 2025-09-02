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
