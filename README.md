# Koto-sho

Koto-sho is a Chrome/Chromium extension that helps you **learn Japanese faster** by providing quick dictionary lookups and kanji details directly from any webpage.

✨ Just highlight a word (or use your custom hotkey), and Koto-sho will show:
- **Definitions** from [Jisho.org](https://jisho.org)  
- **Kanji meanings, readings, and strokes** from [kanjiapi.dev](https://kanjiapi.dev)  
- **Kana transliteration** with [Wanakana](https://wanakana.com)  

---

## 🚀 Features
AC
- Instant word lookup with definitions from Jisho.org
- Kanji breakdown (meanings, readings, strokes, JLPT level) via kanjiapi.dev
- Automatic kana → romaji transliteration using Wanakana
- Popup card with draggable UI, keyboard navigation, and escape-to-close
- Customizable hotkey combo (up to 3 keys) stored with Chrome sync
- Popup settings panel for quick adjustments

---

## 🔧 Installation

1. Clone or download this repository.
```bash
    git clone https://github.com/Kiru-I/Koto-sho.git
``` 
or download the latest `Koto-sho.zip`** from [Releases](https://github.com/Kiru-I/Koto-sho/releases) and extract it.  
2. Open Chrome/Chromium and go to `chrome://extensions/`.  
3. Enable **Developer mode**.  
4. Click **Load unpacked** and select the project folder/unzipped folder.  
5. The extension should now appear in your toolbar

---

## 🕹️ Usage

- **Highlight a word** → **Right Click** → **Pick Koto-sho**
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
