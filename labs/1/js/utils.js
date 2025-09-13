// Utilities for LocalStorage keys and safe JSON handling
(function (global) {
  const KEYS = {
    NOTES: "lab1_notes",
    SAVED_AT: "lab1_saved_at"
  };

  function tryParse(json, fallback) {
    try { return JSON.parse(json); } catch { return fallback; }
  }

  function nowIso() {
    return new Date().toLocaleString();
  }

  function loadNotes() {
    const raw = localStorage.getItem(KEYS.NOTES);
    const parsed = tryParse(raw, []);
    // Guarantee an array even if someone stored "null" or a non-array.
    if (!Array.isArray(parsed)) return [];
    return parsed;
  }

  function saveNotes(notes) {
    const safe = Array.isArray(notes) ? notes : [];
    localStorage.setItem(KEYS.NOTES, JSON.stringify(safe));
    const when = nowIso();
    localStorage.setItem(KEYS.SAVED_AT, when);
    return when;
  }

  function getSavedAt() {
    return localStorage.getItem(KEYS.SAVED_AT) || "";
  }

  global.LAB1_UTILS = { KEYS, tryParse, nowIso, loadNotes, saveNotes, getSavedAt };
})(window);