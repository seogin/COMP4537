// All user-facing strings for Lab 1.
// Keep translations in parallel files, e.g., lang/messages/ko/user.js
(function (global) {
  const USER_MESSAGES = {
    // General / Index
    INDEX_PAGE_TITLE: "Lab 1: JSON, Object Constructor, localStorage",
    INDEX_STUDENT_LINE: "Student: Seogin",
    INDEX_LINK_WRITER: "Open Writer",
    INDEX_LINK_READER: "Open Reader",

    // Writer
    WRITER_TITLE: "Writer — Edit Notes",
    WRITER_ADD_BUTTON: "Add note",
    WRITER_REMOVE_BUTTON: "Remove",
    WRITER_LAST_SAVED_PREFIX: "Last saved at",
    WRITER_EMPTY_STATE: "No notes yet. Click “Add note” to start.",

    // Reader
    READER_TITLE: "Reader — View Notes",
    READER_LAST_RETRIEVED_PREFIX: "Last retrieved at",
    READER_EMPTY_STATE: "No notes to display.",

    // Shared
    BACK_TO_ROOT: "Back to Index",
    NOT_SUPPORTED: "Sorry, your browser does not support Web Storage..."
  };

  // Expose globally (no ES modules needed)
  global.USER_MESSAGES = USER_MESSAGES;
})(window);
