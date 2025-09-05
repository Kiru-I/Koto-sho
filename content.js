let keyCombo = null; // default
let pressedKeys = new Set();

chrome.storage.sync.get("keyCombo", (data) => {
  if (data.keyCombo && data.keyCombo.length) {
    keyCombo = data.keyCombo;
  } else {
    keyCombo = ["alt", "x"]; // fallback if nothing saved
  }
});

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "sync" && changes.keyCombo) {
    keyCombo = changes.keyCombo.newValue;
  }
});

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === "translate" && msg.text) {
    handleTranslation(msg.text);
  }
});

async function handleTranslation(selection) {
  selection = selection.toLowerCase();

    if (document.getElementById("jisho-card")) return;

    chrome.runtime.sendMessage({ type: "translate", text: selection }, async (res) => {
        if (!res || !res.success || !res.data.data || res.data.data.length === 0) return;

        const entries = res.data.data;
        let currentIndex = 0;
        
        // --- find position of highlighted text ---
        let range = window.getSelection().getRangeAt(0);
        let selrect = range.getBoundingClientRect();

        // Default to center of screen if selection rect is invalid
        let x = selrect.left + window.scrollX;
        let y = selrect.top + window.scrollY - 50; // place a bit above
        
        // Create card
        const card = document.createElement("div");
        card.id = "jisho-card";
        card.style.position = "fixed";
        card.style.left = x + "px";
        card.style.top = y + "px";
        card.style.background = "#fff";
        card.style.color = "#000";
        card.style.border = "1px solid #ccc";
        card.style.padding = "16px";
        card.style.borderRadius = "10px";
        card.style.boxShadow = "0 6px 12px rgba(0,0,0,0.25)";
        card.style.zIndex = "9999";
        card.style.fontFamily = "sans-serif";
        card.style.width = "350px";
        card.style.maxWidth = "350px";
        card.style.fontSize = "16px";
        card.style.lineHeight = "1.5";

        // Header
        const header = document.createElement("div");
        header.style.display = "flex";
        header.style.justifyContent = "space-between";
        header.style.alignItems = "center";

        const title = document.createElement("span");
        const closeBtn = document.createElement("span");
        closeBtn.textContent = "✖";
        closeBtn.style.cursor = "pointer";
        closeBtn.style.color = "#666";
        closeBtn.style.fontSize = "14px";

        function closeCard() {
            card.remove();
        }
        closeBtn.addEventListener("click", closeCard);
        header.appendChild(title);
        header.appendChild(closeBtn);

        const meaningBox = document.createElement("div");
        meaningBox.style.marginTop = "6px";
        meaningBox.style.minHeight = "40px";

        const nav = document.createElement("div");
        nav.style.marginTop = "8px";
        nav.style.textAlign = "center";
        const prevBtn = document.createElement("button");
        prevBtn.textContent = "<";
        prevBtn.style.marginRight = "10px";
        const counter = document.createElement("span");
        const nextBtn = document.createElement("button");
        nextBtn.textContent = ">";
        nextBtn.style.marginLeft = "10px";
        nav.appendChild(prevBtn);
        nav.appendChild(counter);
        nav.appendChild(nextBtn);

        const footer = document.createElement("div");
        footer.textContent = "Use arrow keys or buttons | Esc to close | Drag to move";
        footer.style.marginTop = "4px";
        footer.style.textAlign = "center";
        footer.style.color = "#666";
        footer.style.fontSize = "12px";

        card.appendChild(header);
        card.appendChild(meaningBox);
        card.appendChild(nav);
        card.appendChild(footer);
        document.body.appendChild(card);

        // Keep card inside window
        const rect = card.getBoundingClientRect();
        let newLeft = parseInt(card.style.left, 10);
        let newTop = parseInt(card.style.top, 10);
        if (rect.right > window.innerWidth) newLeft = window.innerWidth - rect.width - 10;
        if (rect.bottom > window.innerHeight) newTop = window.innerHeight - rect.height - 10;
        if (rect.left < 0) newLeft = 10;
        if (rect.top < 0) newTop = 10;
        card.style.left = newLeft + "px";
        card.style.top = newTop + "px";

        // Render main word meaning
        function renderMeaning(index) {
            const entry = entries[index];
            const word = entry.japanese[0]?.word || "";
            const reading = entry.japanese[0]?.reading || "";
            const meaning = entry.senses[0]?.english_definitions.join(", ") || "No definition";

            // Render word with ruby
            let displayWord = "";
            if (word && reading) {
                displayWord = `<ruby style="font-size:22px">${word}<rt style="font-size:14px">${reading}</rt></ruby>`;
            } else {
                displayWord = `<span style="font-size:22px">${reading || selection}</span>`;
            }
            const romaji = reading ? wanakana.toRomaji(reading) : "";
            title.innerHTML = `<div>${displayWord}</div>`;
            meaningBox.innerHTML = `
                <div style="font-size:18px; margin-top:4px; color:#333;">${romaji}</div>
                <div style="font-size:14px; margin-top:6px;">${meaning}</div>
            `;
            counter.textContent = `${index + 1} / ${entries.length}`;

            // --- Kanji info at bottom ---
            renderKanjiInfo(word);
        }

        // Kanji info function
        async function renderKanjiInfo(word) {
            const kanjis = [...word].filter(c => /[\u4e00-\u9faf]/.test(c));
            if (!kanjis.length) return;

            let kanjiIndex = 0;

            // Create container
            let kanjiContainer = card.querySelector(".kanji-container");
            if (!kanjiContainer) {
                kanjiContainer = document.createElement("div");
                kanjiContainer.className = "kanji-container";
                kanjiContainer.style.marginTop = "10px";
                kanjiContainer.style.borderTop = "1px solid #eee";
                kanjiContainer.style.paddingTop = "6px";
                card.appendChild(kanjiContainer);
            }

            kanjiContainer.innerHTML = ""; // reset

            const kanjiDisplay = document.createElement("div");
            const nav = document.createElement("div");
            nav.style.textAlign = "center";
            nav.style.marginTop = "4px";

            const prevBtn = document.createElement("button");
            const nextBtn = document.createElement("button");
            const counter = document.createElement("span");
            prevBtn.textContent = "<";
            nextBtn.textContent = ">";
            nav.appendChild(prevBtn);
            nav.appendChild(counter);
            nav.appendChild(nextBtn);

            kanjiContainer.appendChild(kanjiDisplay);
            kanjiContainer.appendChild(nav);

            async function showKanji(idx) {
                const kanji = kanjis[idx];
                counter.textContent = `< ${idx + 1} / ${kanjis.length} >`;

                try {                    
                    const res = await fetch(`https://kanjiapi.dev/v1/kanji/${kanji}`);
                    if (!res.ok) throw new Error("Kanji fetch failed");
                    const data = await res.json();

                    const meanings = data.meanings || [];
                    const onReadings = data.on_readings || [];
                    const kunReadings = data.kun_readings || [];

                    // Build ruby strings for readings
                    const onRuby = onReadings.map(r => {
                        const romaji = wanakana.toRomaji(r);
                        return `<ruby>${r}<rt>${romaji}</rt></ruby>`;
                    }).join(", ");

                    const kunRuby = kunReadings.map(r => {
                        const romaji = wanakana.toRomaji(r);
                        return `<ruby>${r}<rt>${romaji}</rt></ruby>`;
                    }).join(", ");

                    kanjiDisplay.innerHTML = `
                        <strong style="font-size:22px">${data.kanji}</strong><br>
                        Meaning: ${meanings.join(", ")}<br>
                        Onyomi: ${onRuby}<br>
                        Kunyomi: ${kunRuby}<br>
                        Stroke count: ${data.stroke_count}<br>
                        JLPT: ${data.jlpt || "N/A"}
                    `;
                } catch (err) {
                    kanjiDisplay.innerHTML = "Kanji info not available";
                    console.error(err);
                }
            }

            prevBtn.addEventListener("click", () => {
                kanjiIndex = (kanjiIndex - 1 + kanjis.length) % kanjis.length;
                showKanji(kanjiIndex);
            });
            nextBtn.addEventListener("click", () => {
                kanjiIndex = (kanjiIndex + 1) % kanjis.length;
                showKanji(kanjiIndex);
            });

            showKanji(kanjiIndex);
        }

        // Navigation handlers
        function goPrev() {
            currentIndex = (currentIndex - 1 + entries.length) % entries.length;
            renderMeaning(currentIndex);
        }
        function goNext() {
            currentIndex = (currentIndex + 1) % entries.length;
            renderMeaning(currentIndex);
        }
        prevBtn.addEventListener("click", goPrev);
        nextBtn.addEventListener("click", goNext);

        function keyHandler(event) {
            if (!document.getElementById("jisho-card")) return;
            if (event.key === "ArrowLeft") goPrev();
            if (event.key === "ArrowRight") goNext();
        }
        document.addEventListener("keydown", keyHandler);

        renderMeaning(currentIndex);

        // Draggable
        let offsetX, offsetY, isDragging = false;
        card.addEventListener("mousedown", (event) => {
            if (event.target.tagName === "BUTTON" || event.target === closeBtn) return;
            isDragging = true;
            offsetX = event.clientX - card.offsetLeft;
            offsetY = event.clientY - card.offsetTop;
            card.style.opacity = "0.8";
        });
        document.addEventListener("mousemove", (event) => {
            if (!isDragging) return;
            card.style.left = event.clientX - offsetX + "px";
            card.style.top = event.clientY - offsetY + "px";
        });
        document.addEventListener("mouseup", () => {
            isDragging = false;
            card.style.opacity = "1";
        });
    });
};


function normalizeKey(key) {
  key = key.toLowerCase();
  if (key === " ") return "space";
  if (key === "meta") return "win"; // keep consistent with popup
  return key;
}

// --- Alt+X card ---
document.addEventListener("keydown", (e) => {
    pressedKeys.add(normalizeKey(e.key));
    if (keyCombo.every((key) => pressedKeys.has(key))){
        e.preventDefault();

        // Prevent multiple cards
        if (document.getElementById("altx-card")) return;

        // Get mouse position (or center if none)
        const target = document.elementFromPoint(window.lastMouseX, window.lastMouseY);
        let hoveredText = target ? target.textContent.trim() : "";
        if (!hoveredText) hoveredText = "No text detected"

        // Create card
        const card = document.createElement("div");
        card.id = "altx-card";
        card.style.position = "fixed";
        card.style.left = window.lastMouseX + "px";
        card.style.top = window.lastMouseY + "px";
        card.style.background = "#fff";
        card.style.border = "1px solid #ccc";
        card.style.padding = "16px";
        card.style.borderRadius = "10px";
        card.style.boxShadow = "0 6px 12px rgba(0,0,0,0.25)";
        card.style.zIndex = "9999";
        card.style.width = "320px";
        card.style.color = "#000000"
        card.style.fontFamily = "sans-serif";
        card.style.fontSize = "14px";
        card.style.lineHeight = "1.5";

        // Header with close
        const header = document.createElement("div");
        header.style.display = "flex";
        header.style.justifyContent = "space-between";
        header.style.alignItems = "center";

        const title = document.createElement("span");
        title.textContent = hoveredText;

        const closeBtn = document.createElement("span");
        closeBtn.textContent = "✖";
        closeBtn.style.cursor = "pointer";
        closeBtn.style.color = "#666";
        closeBtn.style.fontSize = "14px";

        closeBtn.addEventListener("click", () => card.remove());

        header.appendChild(title);
        header.appendChild(closeBtn);

        const body = document.createElement("div");
        body.style.marginTop = "8px";
        body.textContent = "Highlight part of the text to translate";

        const footer = document.createElement("div");
        footer.style.marginTop = "8px";
        footer.style.textAlign = "center";
        footer.style.fontSize = "12px";
        footer.style.color = "#666";
        footer.textContent = "Press Esc to close";

        card.appendChild(header);
        card.appendChild(body);
        card.appendChild(footer);

        document.body.appendChild(card);

        // Keep inside screen
        const rect = card.getBoundingClientRect();
        let newLeft = parseInt(card.style.left, 10);
        let newTop = parseInt(card.style.top, 10);
        if (rect.right > window.innerWidth) newLeft = window.innerWidth - rect.width - 10;
        if (rect.bottom > window.innerHeight) newTop = window.innerHeight - rect.height - 10;
        if (rect.left < 0) newLeft = 10;
        if (rect.top < 0) newTop = 10;
        card.style.left = newLeft + "px";
        card.style.top = newTop + "px";
    }
});

document.addEventListener("keyup", (e) => {
  pressedKeys.delete(normalizeKey(e.key));
});

document.addEventListener("mousemove", (e) => {
    window.lastMouseX = e.clientX;
    window.lastMouseY = e.clientY;
});

document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
        const jisho = document.getElementById("jisho-card");
        const altx = document.getElementById("altx-card");

        if (jisho) {
            jisho.remove();
            return; // only close jisho first
        }
        if (altx) {
            altx.remove();
            return;
        }
    }
});