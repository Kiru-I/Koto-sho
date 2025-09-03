# Koto-sho

Koto-sho is a Chrome/Chromium extension that helps you **learn Japanese faster** by providing quick dictionary lookups and kanji details directly from any webpage.

✨ Just highlight a word (or use your custom hotkey), and Koto-sho will show:
- **Definitions** from [Jisho.org](https://jisho.org)  
- **Kanji meanings, readings, and strokes** from [kanjiapi.dev](https://kanjiapi.dev)  
- **Kana transliteration** with [Wanakana](https://wanakana.com)  

---

## 🚀 Features

- Highlight words on any website and instantly view their meanings.  
- Popup card with **word, reading, and English definition**.  
- Kanji breakdown: onyomi, kunyomi, stroke count, and meanings.  
- **Customizable keybinds** (up to 3 keys) to trigger the popup.  
- Popup settings UI – no need to open `options.html` separately.  
- Settings saved with `chrome.storage.sync` (syncs across browsers).  

---

## 🔧 Installation

1. Clone or download this repository.
```bash
    git clone https://github.com/Kiru-I/Koto-sho.git
```
2. Open Chrome/Chromium and go to `chrome://extensions/`.  
3. Enable **Developer mode**.  
4. Click **Load unpacked** and select the project folder.  
5. The extension should now appear in your toolbar

---

## 🕹️ Usage

- **Highlight a word** → translation popup appears.
- Or use your **custom keybind**:
  1. Open the popup (`Koto-sho` icon in toolbar).  
  2. Set up your hotkey (e.g. `Ctrl + Shift + K`).  
  3. Save – now use this combo to trigger translations.  

---

## ⚙️ Settings

- Open the popup from the extensions toolbar.  
- Press `🎹 Press keys...` to record your hotkey combo.  
- Save to apply.  
- You can cancel with `Esc`.  

---

## 📜 Permissions

- `activeTab`, `scripting` → to inject the content script on any page.  
- `storage` → to save your settings.  
- `https://jisho.org/*` and `https://kanjiapi.dev/*` → API requests for dictionary and kanji data.  

---

## 📌 Roadmap

Work In Progress

---

## 📝 License

MIT License.  
