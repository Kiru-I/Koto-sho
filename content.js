// content.js

let keyCombo = null;
let pressedKeys = new Set();
let allEntries = [];
let currentIndex = 0;

// --- Load key combo ---
chrome.storage.sync.get("keyCombo", (data) => {
  keyCombo = (data.keyCombo && data.keyCombo.length) ? data.keyCombo : ["alt", "x"];
});

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "sync" && changes.keyCombo) keyCombo = changes.keyCombo.newValue;
});

// --- Listen for messages ---
chrome.runtime.onMessage.addListener((msg) => {
  switch (msg.type) {
    case "translate":
      allEntries = [];
      currentIndex = 0;
      break;

    case "translate-page":
    case "searchResults":
      if (!Array.isArray(msg.items) && !Array.isArray(msg.entries)) return;
      const items = msg.items || msg.entries;
      allEntries = allEntries.concat(items);
      openOrUpdateCard(msg.keyword || items[0]?.japanese?.[0]?.word || items[0]?.japanese?.[0]?.reading || "");
      break;
    case "translate-done":
      const card = document.getElementById("jisho-card");
      if (card) card.dataset.done = "true";
      console.log("✅ Translation done");
      break;
  }
});

// --- Helpers ---
function normalizeKey(key) {
  key = key.toLowerCase();
  if (key === " ") return "space";
  if (key === "meta") return "win";
  return key;
}

function updateCounter() {
  const counter = document.querySelector("#jisho-card .jisho-counter");
  if (counter) counter.textContent = `${currentIndex + 1} / ${allEntries.length}`;
}

// --- Main card ---
function openOrUpdateCard(selection) {
  let card = document.getElementById("jisho-card");
  if (!card) {
    card = createJishoCard(selection);
    document.body.appendChild(card);
  }

  if (allEntries.length) {
    currentIndex = 0;
    renderMeaning(currentIndex);
  }
}

// --- Render meaning ---
function renderMeaning(index) {
  const card = document.getElementById("jisho-card");
  if (!card) return;

  const entry = allEntries[index];
  const title = card.querySelector(".jisho-title");
  const meaningBox = card.querySelector(".jisho-meaning");
  const counter = card.querySelector(".jisho-counter");

  if (!entry) {
    title.textContent = "No definition yet";
    meaningBox.textContent = "Waiting for more results...";
    counter.textContent = `${index + 1} / ${allEntries.length || 1}`;
    return;
  }

  const word = entry.japanese?.[0]?.word || "";
  const reading = entry.japanese?.[0]?.reading || "";
  const meaning = entry.senses?.[0]?.english_definitions?.join(", ") || "No definition";

  const romaji = (typeof wanakana !== "undefined" && reading) ? wanakana.toRomaji(reading) : "";

  title.innerHTML = word ? `<ruby>${word}<rt>${reading}</rt></ruby>` : reading;
  meaningBox.innerHTML = `<div style="margin-top:4px; font-size:16px; color:#333;">${romaji}</div>
                          <div style="margin-top:6px;">${meaning}</div>`;
  counter.textContent = `${index + 1} / ${allEntries.length}`;

  renderKanjiInfo(word);
}

// --- Kanji info ---
async function renderKanjiInfo(word) {
  const card = document.getElementById("jisho-card");
  if (!card) return;

  const kanjis = [...(word || "")].filter(c => /[\u4e00-\u9faf]/.test(c));
  let container = card.querySelector(".kanji-container");
  if (!kanjis.length) {
    if (container) container.remove();
    return;
  }

  if (!container) {
    container = document.createElement("div");
    container.className = "kanji-container";
    container.style.marginTop = "10px";
    container.style.borderTop = "1px solid #eee";
    container.style.paddingTop = "6px";
    card.appendChild(container);
  }

  container.innerHTML = "";
  const display = document.createElement("div");
  const nav = document.createElement("div");
  nav.style.textAlign = "center";
  const prevBtn = document.createElement("button"); prevBtn.textContent = "<";
  const nextBtn = document.createElement("button"); nextBtn.textContent = ">";
  const kCounter = document.createElement("span");
  nav.append(prevBtn, kCounter, nextBtn);
  container.append(display, nav);

  let kanjiIndex = 0;

  async function showKanji(idx) {
    const kanji = kanjis[idx];
    kCounter.textContent = `< ${idx + 1} / ${kanjis.length} >`;

    try {
      const res = await fetch(`https://kanjiapi.dev/v1/kanji/${encodeURIComponent(kanji)}`);
      const data = await res.json();
      const onReadings = data.on_readings?.map(r => (typeof wanakana !== "undefined") ? wanakana.toRomaji(r) : r).join(", ") || "";
      const kunReadings = data.kun_readings?.map(r => (typeof wanakana !== "undefined") ? wanakana.toRomaji(r) : r).join(", ") || "";
      display.innerHTML = `<strong>${kanji}</strong><br>Meaning: ${data.meanings?.join(", ")}<br>
                           Onyomi: ${onReadings}<br>Kunyomi: ${kunReadings}<br>
                           Stroke: ${data.stroke_count}<br>JLPT: ${data.jlpt || "N/A"}`;
    } catch {
      display.textContent = "Kanji info not available";
    }
  }

  prevBtn.onclick = () => { kanjiIndex = (kanjiIndex - 1 + kanjis.length) % kanjis.length; showKanji(kanjiIndex); };
  nextBtn.onclick = () => { kanjiIndex = (kanjiIndex + 1) % kanjis.length; showKanji(kanjiIndex); };

  showKanji(kanjiIndex);
}

// --- Create Jisho card ---
function createJishoCard(selection) {
  const card = document.createElement("div");
  card.id = "jisho-card";
  card.dataset.rendered = "true";
  Object.assign(card.style, {
    position: "fixed", top: "50px", left: "50px", width: "350px",
    background: "#fff", border: "1px solid #ccc", padding: "16px",
    borderRadius: "10px", boxShadow: "0 6px 12px rgba(0,0,0,0.25)",
    zIndex: 9999, fontFamily: "sans-serif", color: "black"
  });

  const header = document.createElement("div");
  header.style.display = "flex"; header.style.justifyContent = "space-between";
  const title = document.createElement("span"); title.className = "jisho-title"; title.textContent = selection;
  const closeBtn = document.createElement("span"); closeBtn.textContent = "✖"; closeBtn.style.cursor = "pointer"; closeBtn.onclick = () => card.remove();
  header.append(title, closeBtn);

  const meaningBox = document.createElement("div"); meaningBox.className = "jisho-meaning"; meaningBox.style.marginTop = "6px"; meaningBox.textContent = "Searching...";

  const nav = document.createElement("div"); nav.style.marginTop = "8px"; nav.style.textAlign = "center";
  const prevBtn = document.createElement("button"); prevBtn.textContent = "<";
  const counter = document.createElement("span"); counter.className = "jisho-counter";
  const nextBtn = document.createElement("button"); nextBtn.textContent = ">";
  nav.append(prevBtn, counter, nextBtn);

  prevBtn.onclick = () => { currentIndex = (currentIndex - 1 + allEntries.length) % allEntries.length; renderMeaning(currentIndex); };
  nextBtn.onclick = () => { currentIndex = (currentIndex + 1) % allEntries.length; renderMeaning(currentIndex); };

  const footer = document.createElement("div"); footer.style.marginTop = "4px"; footer.style.textAlign = "center"; footer.style.color = "#666"; footer.style.fontSize = "12px";
  footer.textContent = "Use arrows | Esc to close | Drag";

  card.append(header, meaningBox, nav, footer);

  // Keyboard nav & draggable
  document.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft") prevBtn.click();
    if (e.key === "ArrowRight") nextBtn.click();
    if (e.key === "Escape") card.remove();
  });

  let offsetX, offsetY, dragging = false;
  card.onmousedown = (e) => { if (e.target.tagName !== "BUTTON") { dragging = true; offsetX = e.clientX - card.offsetLeft; offsetY = e.clientY - card.offsetTop; } };
  document.onmousemove = (e) => { if (dragging) { card.style.left = e.clientX - offsetX + "px"; card.style.top = e.clientY - offsetY + "px"; } };
  document.onmouseup = () => { dragging = false; };

  return card;
}

// --- Alt+X hover card ---
document.addEventListener("keydown", (e) => {
  pressedKeys.add(normalizeKey(e.key));
  if (Array.isArray(keyCombo) && keyCombo.every(k => pressedKeys.has(k))) {
    e.preventDefault();
    openAltXCard();
  }
});

document.addEventListener("keyup", (e) => pressedKeys.delete(normalizeKey(e.key)));
document.addEventListener("mousemove", (e) => { window.lastMouseX = e.clientX; window.lastMouseY = e.clientY; });

function openAltXCard() {
  if (document.getElementById("altx-card")) return;

  const mx = window.lastMouseX || (window.innerWidth / 2);
  const my = window.lastMouseY || (window.innerHeight / 2);

  const target = document.elementFromPoint(mx, my);
  let hoveredText = target?.textContent?.trim() || "No text detected";

  const card = document.createElement("div");
  card.id = "altx-card";
  Object.assign(card.style, {
    position: "fixed", left: mx + "px", top: my + "px",
    background: "#fff", border: "1px solid #ccc", padding: "16px",
    borderRadius: "10px", boxShadow: "0 6px 12px rgba(0,0,0,0.25)",
    zIndex: 9999, width: "320px", color: "#000", fontFamily: "sans-serif", fontSize: "14px"
  });

  const header = document.createElement("div"); header.style.display = "flex"; header.style.justifyContent = "space-between";
  const title = document.createElement("span"); title.textContent = hoveredText;
  const closeBtn = document.createElement("span"); closeBtn.textContent = "✖"; closeBtn.style.cursor = "pointer"; closeBtn.onclick = () => card.remove();
  header.append(title, closeBtn);

  const body = document.createElement("div"); body.style.marginTop = "8px"; body.textContent = "Highlight text to translate";

  const footer = document.createElement("div"); footer.style.marginTop = "8px"; footer.style.textAlign = "center"; footer.style.fontSize = "12px"; footer.style.color = "#666"; footer.textContent = "Press Esc to close";

  card.append(header, body, footer);
  document.body.appendChild(card);

  // Keep inside screen
  const rect = card.getBoundingClientRect();
  if (rect.right > window.innerWidth) card.style.left = (window.innerWidth - rect.width - 10) + "px";
  if (rect.bottom > window.innerHeight) card.style.top = (window.innerHeight - rect.height - 10) + "px";
  if (rect.left < 0) card.style.left = "10px";
  if (rect.top < 0) card.style.top = "10px";
}

// --- Close cards on Esc ---
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    document.getElementById("jisho-card")?.remove();
    document.getElementById("altx-card")?.remove();
  }
});
