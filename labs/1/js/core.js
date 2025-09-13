// OOP Core for Lab 1
// NotesStore handles JSON <-> localStorage with two keys.
class NotesStore {
  constructor({ notesKey = "lab1_notes", savedAtKey = "lab1_saved_at", storage = window.localStorage } = {}) {
    this.notesKey = notesKey;
    this.savedAtKey = savedAtKey;
    this.storage = storage;
  }

  _parse(json, fallback) {
    try { return JSON.parse(json); } catch { return fallback; }
  }

  now() {
    return new Date().toLocaleString();
  }

  load() {
    const raw = this.storage.getItem(this.notesKey);
    const parsed = this._parse(raw, []);
    return Array.isArray(parsed) ? parsed : [];
  }

  save(notesArray) {
    const safe = Array.isArray(notesArray) ? notesArray : [];
    this.storage.setItem(this.notesKey, JSON.stringify(safe));
    const when = this.now();
    this.storage.setItem(this.savedAtKey, when);
    return when;
  }

  getSavedAt() {
    return this.storage.getItem(this.savedAtKey) || "";
  }

  onExternalChange(callback) {
    // Fires when other tabs/windows change storage
    window.addEventListener("storage", (e) => {
      if (e.key === this.notesKey || e.key === this.savedAtKey) callback(e);
    });
  }
}

// WriterApp orchestrates the writer page.
class WriterApp {
  constructor({ els, store, messages, autosaveMs = 2000 }) {
    this.els = els;
    this.store = store;
    this.msg = messages;
    this.autosaveMs = autosaveMs;
    this._intervalId = null;

    this.init();
  }

  init() {
    const { title, addBtn, backBtn, saveBadge } = this.els;
    title.textContent = this.msg.WRITER_TITLE;
    addBtn.textContent = this.msg.WRITER_ADD_BUTTON;
    backBtn.textContent = this.msg.BACK_TO_ROOT;

    addBtn.addEventListener("click", () => this.addNoteRow(""));

    const existing = this.store.load();
    if (existing.length === 0) {
      this.renderEmptyState();
    } else {
      existing.forEach(text => this.addNoteRow(text));
    }

    this.updateSaveBadge(this.store.getSavedAt());
    this._intervalId = setInterval(() => this.persistNow(), this.autosaveMs);
    window.addEventListener("beforeunload", () => this.persistNow());

    // update the badge if another tab saves
    this.store.onExternalChange(() => this.updateSaveBadge(this.store.getSavedAt()));
  }

  get notesContainer() { return this.els.notesContainer; }

  renderEmptyState() {
    if (!this.notesContainer.querySelector(".empty-state")) {
      const p = document.createElement("p");
      p.className = "empty-state small";
      p.textContent = this.msg.WRITER_EMPTY_STATE;
      this.notesContainer.appendChild(p);
    }
  }

  clearEmptyState() {
    const es = this.notesContainer.querySelector(".empty-state");
    if (es) es.remove();
  }

  addNoteRow(initialValue = "") {
    this.clearEmptyState();

    const row = document.createElement("div");
    row.className = "note";

    const ta = document.createElement("textarea");
    ta.value = initialValue;

    const rm = document.createElement("button");
    rm.textContent = this.msg.WRITER_REMOVE_BUTTON;
    rm.addEventListener("click", () => {
      row.remove();
      this.persistNow(); // save immediately
      if (!this.notesContainer.querySelector(".note")) this.renderEmptyState();
    });

    row.appendChild(ta);
    row.appendChild(rm);
    this.notesContainer.appendChild(row);
  }

  collectNotes() {
    return Array.from(this.notesContainer.querySelectorAll("textarea")).map(t => t.value);
  }

  updateSaveBadge(when) {
    const shown = when || this.store.getSavedAt() || "—";
    this.els.saveBadge.textContent = `${this.msg.WRITER_LAST_SAVED_PREFIX}: ${shown}`;
  }

  persistNow() {
    const notes = this.collectNotes();
    const when = this.store.save(notes);
    this.updateSaveBadge(when);
  }
}

// ReaderApp orchestrates the reader page.
class ReaderApp {
  constructor({ els, store, messages, pollMs = 2000 }) {
    this.els = els;
    this.store = store;
    this.msg = messages;
    this.pollMs = pollMs;
    this._intervalId = null;

    this.init();
  }

  init() {
    const { title, backBtn } = this.els;
    title.textContent = this.msg.READER_TITLE;
    backBtn.textContent = this.msg.BACK_TO_ROOT;

    this.retrieveAndRender();
    this._intervalId = setInterval(() => this.retrieveAndRender(), this.pollMs);

    // Update live on storage events from other tabs
    this.store.onExternalChange((e) => {
      if (e.key === this.store.notesKey) this.retrieveAndRender();
    });
  }

  render(notes) {
    const container = this.els.readerContainer;
    container.innerHTML = "";
    if (!notes || notes.length === 0) {
      const p = document.createElement("p");
      p.className = "small";
      p.textContent = this.msg.READER_EMPTY_STATE;
      container.appendChild(p);
      return;
    }
    notes.forEach((text, idx) => {
      const row = document.createElement("div");
      row.className = "note";

      const ta = document.createElement("textarea");
      ta.value = text;
      ta.readOnly = true;

      const label = document.createElement("span");
      label.className = "small";
      label.textContent = `#${idx + 1}`;

      row.appendChild(ta);
      row.appendChild(label);
      container.appendChild(row);
    });
  }

  updateRetrieveBadge() {
    const when = new Date().toLocaleString();
    this.els.retrieveBadge.textContent = `${this.msg.READER_LAST_RETRIEVED_PREFIX}: ${when}`;
  }

  retrieveAndRender() {
    const notes = this.store.load();
    this.render(notes);
    this.updateRetrieveBadge();
  }
}

window.LAB1_CORE = { NotesStore, WriterApp, ReaderApp };
