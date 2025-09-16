// Core classes: data store + writer app + reader app

class NotesStore {
  constructor({
    // Destructuring with defaults: lets you override keys or inject a mock storage in tests
    notesKey = "lab1_notes",
    savedAtKey = "lab1_saved_at",
    storage = window.localStorage,  // allows swapping to sessionStorage or a mock
  } = {}) {
    this.notesKey = notesKey;
    this.savedAtKey = savedAtKey;
    this.storage = storage;
  }

  _parse(json, fallback) {
    // Safe parse: if JSON is bad (or null), return fallback instead of throwing
    try { return JSON.parse(json); } catch { return fallback; }
  }

  now() {
    return new Date().toLocaleString();
  }

  load() {
    const raw = this.storage.getItem(this.notesKey);
    const parsed = this._parse(raw, []);
    // Defensive: only accept arrays; anything else becomes []
    return Array.isArray(parsed) ? parsed : [];
  }

  save(notesArray) {
    // Defensive: never write non-arrays
    const safe = Array.isArray(notesArray) ? notesArray : [];
    this.storage.setItem(this.notesKey, JSON.stringify(safe)); // serialize to JSON
    const when = this.now();
    this.storage.setItem(this.savedAtKey, when);               // store last-saved timestamp
    return when;                                               // return for badge update
  }

  getSavedAt() {
    return this.storage.getItem(this.savedAtKey) || "";
  }

  onExternalChange(callback) {
    // 'storage' fires in *other* tabs on the same origin when localStorage changes
    window.addEventListener("storage", (e) => {
      // Only react to our keys; ignore unrelated storage changes
      if (e.key === this.notesKey || e.key === this.savedAtKey) callback(e);
    });
  }
}

class WriterApp {
  constructor({ els, store, messages, autosaveMs = 2000 }) {
    this.els = els;
    this.store = store;
    this.msg = messages;
    this.autosaveMs = autosaveMs;
    this._intervalId = null; // keep handle so you could clearInterval() later
    this.init();
  }

  init() {
    const { title, addBtn, backBtn } = this.els; // destructuring keeps code concise
    title.textContent = this.msg.WRITER_TITLE;
    addBtn.textContent = this.msg.WRITER_ADD_BUTTON;
    backBtn.textContent = this.msg.BACK_TO_ROOT;

    addBtn.addEventListener("click", () => this.addNoteRow("")); // arrow keeps 'this' bound

    const existing = this.store.load(); // single source of truth for data
    if (existing.length === 0) this.renderEmptyState();
    else existing.forEach(text => this.addNoteRow(text));

    this.updateSaveBadge(this.store.getSavedAt());
    // Autosave loop: persist current DOM state every N ms
    this._intervalId = setInterval(() => this.persistNow(), this.autosaveMs);
    // Extra safety: save once more when navigating away/closing
    window.addEventListener("beforeunload", () => this.persistNow());

    // Cross-tab badge refresh (another tab saved)
    this.store.onExternalChange(() => this.updateSaveBadge(this.store.getSavedAt()));
  }

  // Getter for cleaner access (looks like a property, acts like a function)
  get notesContainer() { return this.els.notesContainer; }

  renderEmptyState() {
    if (!this.notesContainer.querySelector(".empty-state")) { // only add once
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
      row.remove();             // remove this specific row
      this.persistNow();        // immediately sync storage (no 2s delay)
      // If no .note remains, show empty-state again
      if (!this.notesContainer.querySelector(".note")) this.renderEmptyState();
    });

    row.appendChild(ta);
    row.appendChild(rm);
    this.notesContainer.appendChild(row);
  }

  collectNotes() {
    // Convert NodeList -> Array, then map textarea values into a plain string[]
    return Array.from(this.notesContainer.querySelectorAll("textarea")).map(t => t.value);
  }

  updateSaveBadge(when) {
    const shown = when || this.store.getSavedAt() || "—"; // fallback chain: passed-in -> store -> em dash
    this.els.saveBadge.textContent = `${this.msg.WRITER_LAST_SAVED_PREFIX}: ${shown}`;
  }

  persistNow() {
    const notes = this.collectNotes(); // DOM -> model
    const when = this.store.save(notes); // model -> storage
    this.updateSaveBadge(when);          // reflect save time in UI
  }
}

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

    this.retrieveAndRender(); // initial fetch
    // Poll loop: refresh UI every N ms to reflect writer changes
    this._intervalId = setInterval(() => this.retrieveAndRender(), this.pollMs);

    // Also refresh instantly on cross-tab storage writes
    this.store.onExternalChange((e) => {
      if (e.key === this.store.notesKey) this.retrieveAndRender(); // only re-render on notes changes
    });
  }

  render(notes) {
    const container = this.els.readerContainer;
    container.innerHTML = ""; // clear previous render
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
      ta.readOnly = true; // reader is view-only

      const label = document.createElement("span");
      label.className = "small";
      label.textContent = `#${idx + 1}`; // simple index tag

      row.appendChild(ta);
      row.appendChild(label);
      container.appendChild(row);
    });
  }

  updateRetrieveBadge() {
    // Reader shows *when it pulled* the data (not when it was saved)
    const when = new Date().toLocaleString();
    this.els.retrieveBadge.textContent = `${this.msg.READER_LAST_RETRIEVED_PREFIX}: ${when}`;
    // (If you wanted the writer's save time, use store.getSavedAt() instead.)
  }

  retrieveAndRender() {
    const notes = this.store.load(); // storage -> model
    this.render(notes);              // model -> UI
    this.updateRetrieveBadge();      // update pull time
  }
}

// Expose classes globally so page scripts can create instances (bootstrap)
window.LAB1_CORE = { NotesStore, WriterApp, ReaderApp };
