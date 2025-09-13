(function () {
  if (!window.localStorage) {
    alert(USER_MESSAGES.NOT_SUPPORTED);
    return;
  }

  const store = new LAB1_CORE.NotesStore({
    notesKey: "lab1_notes",
    savedAtKey: "lab1_saved_at",
    storage: window.localStorage
  });

  const app = new LAB1_CORE.WriterApp({
    store,
    messages: USER_MESSAGES,
    autosaveMs: 2000,
    els: {
      title: document.getElementById("writerTitle"),
      addBtn: document.getElementById("addBtn"),
      backBtn: document.getElementById("backBtn"),
      notesContainer: document.getElementById("notesContainer"),
      saveBadge: document.getElementById("saveBadge")
    }
  });
})();