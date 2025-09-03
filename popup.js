const recordKeyBtn = document.getElementById("recordKey");
const currentCombo = document.getElementById("currentCombo");
const saveBtn = document.getElementById("save");
const status = document.getElementById("status");

let recordedKeys = [];
let isRecording = false;

function updateDisplay() {
  currentCombo.textContent =
    recordedKeys.length ? recordedKeys.join(" + ") : "No keys set";
}

// Start recording keys
recordKeyBtn.addEventListener("click", () => {
  if (isRecording) return;

  isRecording = true;
  recordedKeys = [];
  updateDisplay();

  recordKeyBtn.classList.add("recording");
  recordKeyBtn.textContent = "⏺️ Recording...";
  status.textContent = "Press up to 3 keys...";

  const handler = (e) => {
    e.preventDefault();

    let key = e.key.toLowerCase();
    if (key === " ") key = "space";
    if (key === "meta") key = "win";

    if (!recordedKeys.includes(key) && recordedKeys.length < 3) {
      recordedKeys.push(key);
      updateDisplay();
      status.textContent = "Pressed: " + recordedKeys.join(" + ");
    }

    if (recordedKeys.length >= 3 || key === "escape") {
      document.removeEventListener("keydown", handler, true);
      recordKeyBtn.classList.remove("recording");
      recordKeyBtn.textContent = "🎹 Press keys...";
      isRecording = false;

      if (key === "escape") {
        status.textContent = "❌ Cancelled";
        recordedKeys = [];
        updateDisplay();
      } else {
        status.textContent = "✅ Combo set!";
      }
    }
  };

  document.addEventListener("keydown", handler, true);

  // Auto-stop after 2 seconds if user doesn’t press anything
  setTimeout(() => {
    if (isRecording) {
      isRecording = false;
      document.removeEventListener("keydown", handler, true);
      recordKeyBtn.classList.remove("recording");
      recordKeyBtn.textContent = "🎹 Press keys...";
      if (recordedKeys.length === 0) {
        currentCombo.textContent = "No keys set";
        status.textContent = "⏹️ Timed out (no input)";
      }
    }
  }, 2000);
});

// Save combo
saveBtn.addEventListener("click", () => {
  chrome.storage.sync.set({ keyCombo: recordedKeys }, () => {
    status.className = "success";
    status.textContent = "💾 Settings saved successfully";

    setTimeout(() => {
      status.textContent = "";
      status.className = "";
    }, 3000);
  });
});

// Load saved combo
chrome.storage.sync.get("keyCombo", (data) => {
  if (data.keyCombo) {
    recordedKeys = data.keyCombo;
    updateDisplay();
  }
});
