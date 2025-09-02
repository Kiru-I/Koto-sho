document.addEventListener("mouseup", (e) => {
  const selection = window.getSelection().toString().trim();
  if (!selection) return;

  // If a card already exists, do nothing (avoid respawn at mouse)
  if (document.getElementById("jisho-card")) return;

  chrome.runtime.sendMessage({ type: "translate", text: selection }, (res) => {
    if (!res || !res.success || !res.data.data || res.data.data.length === 0) return;

    const entries = res.data.data;
    let currentIndex = 0;

    // Create card
    const card = document.createElement("div");
    card.id = "jisho-card";
    card.style.position = "fixed";
    card.style.left = e.pageX + "px";
    card.style.top = e.pageY + "px";
    card.style.background = "#ffffff";
    card.style.color = "#000000";
    card.style.border = "1px solid #ccc";
    card.style.padding = "10px";
    card.style.borderRadius = "8px";
    card.style.boxShadow = "0 4px 8px rgba(0,0,0,0.2)";
    card.style.zIndex = "9999";
    card.style.fontFamily = "sans-serif";
    card.style.maxWidth = "250px";

    // Inner structure
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
    closeBtn.addEventListener("click", () => {
      card.remove();
      document.removeEventListener("keydown", keyHandler);
    });

    header.appendChild(title);
    header.appendChild(closeBtn);

    const meaningBox = document.createElement("div");
    meaningBox.style.marginTop = "6px";
    meaningBox.style.minHeight = "40px";

    const nav = document.createElement("div");
    nav.style.marginTop = "8px";
    nav.style.textAlign = "center";

    const prevBtn = document.createElement("button");
    prevBtn.textContent = "⬅️";
    prevBtn.style.marginRight = "10px";

    const counter = document.createElement("span");

    const nextBtn = document.createElement("button");
    nextBtn.textContent = "➡️";
    nextBtn.style.marginLeft = "10px";

    nav.appendChild(prevBtn);
    nav.appendChild(counter);
    nav.appendChild(nextBtn);

    const footer = document.createElement("div");
    footer.textContent = "Use ⬅️/➡️ keys or buttons | Drag to move | Click ✖ to close";
    footer.style.marginTop = "4px";
    footer.style.textAlign = "center";
    footer.style.color = "#666";
    footer.style.fontSize = "12px";

    card.appendChild(header);
    card.appendChild(meaningBox);
    card.appendChild(nav);
    card.appendChild(footer);

    document.body.appendChild(card);

    // Render meaning
    function renderMeaning(index) {
      const entry = entries[index];
      const word = entry.japanese[0]?.word || selection;
      const reading = entry.japanese[0]?.reading || "";
      const meaning = entry.senses[0]?.english_definitions.join(", ") || "No definition";

      title.innerHTML = `<b>${word}</b> (${reading})`;
      meaningBox.innerHTML = `<small>${meaning}</small>`;
      counter.textContent = `${index + 1} / ${entries.length}`;
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

    // Keyboard navigation
    function keyHandler(event) {
      if (!document.getElementById("jisho-card")) return; // ignore if card closed
      if (event.key === "ArrowLeft") goPrev();
      if (event.key === "ArrowRight") goNext();
    }
    document.addEventListener("keydown", keyHandler);

    // Initial render
    renderMeaning(currentIndex);

    // --- Draggable ---
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
});
