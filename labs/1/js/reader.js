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

  const app = new LAB1_CORE.ReaderApp({
    store,
    messages: USER_MESSAGES,
    pollMs: 2000,
    els: {
      title: document.getElementById("readerTitle"),
      backBtn: document.getElementById("backBtn"),
      retrieveBadge: document.getElementById("retrieveBadge"),
      readerContainer: document.getElementById("readerContainer")
    }
  });
})();