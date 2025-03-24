document.addEventListener("DOMContentLoaded", () => {
  // Element references
  const noteForm = document.getElementById("noteForm");
  const noteText = document.getElementById("noteText");
  const categoryInput = document.getElementById("categoryInput");
  const backgroundColor = document.getElementById("backgroundColor");
  const textColor = document.getElementById("textColor");
  const notesContainer = document.getElementById("notesContainer");
  const searchInput = document.getElementById("searchInput");
  const sortSelect = document.getElementById("sortSelect");
  const darkModeToggle = document.getElementById("darkModeToggle");
  const notification = document.getElementById("notification");

  // Retrieve persisted notes and preferences
  let notes = JSON.parse(localStorage.getItem("notes")) || [];
  let editNoteId = null;
  let lastDeletedNote = null;

  // Load persisted dark mode & color preferences
  if (localStorage.getItem("darkMode") === "true") {
    document.body.setAttribute("data-theme", "dark");
    darkModeToggle.checked = true;
  }
  if (localStorage.getItem("defaultBgColor")) {
    backgroundColor.value = localStorage.getItem("defaultBgColor");
  }
  if (localStorage.getItem("defaultTextColor")) {
    textColor.value = localStorage.getItem("defaultTextColor");
  }

  // Initial render
  renderNotes();

  // Save dark mode preference
  darkModeToggle.addEventListener("change", () => {
    if (darkModeToggle.checked) {
      document.body.setAttribute("data-theme", "dark");
      localStorage.setItem("darkMode", "true");
    } else {
      document.body.removeAttribute("data-theme");
      localStorage.setItem("darkMode", "false");
    }
  });

  // Update default color preferences when changed
  backgroundColor.addEventListener("change", () => {
    localStorage.setItem("defaultBgColor", backgroundColor.value);
  });
  textColor.addEventListener("change", () => {
    localStorage.setItem("defaultTextColor", textColor.value);
  });

  // Handle form submission for note creation/editing
  noteForm.addEventListener("submit", (e) => {
    e.preventDefault();
    if (noteText.value.trim() === "") {
      showNotification("Note cannot be empty!");
      return;
    }
    if (editNoteId) {
      updateNote(editNoteId, noteText.value, categoryInput.value);
    } else {
      createNote(noteText.value, categoryInput.value, backgroundColor.value, textColor.value);
    }
    saveNotes();
    renderNotes();
    noteForm.reset();
  });

  // Create a new note
  function createNote(content, category, bgColor, txtColor) {
    const newNote = {
      id: Date.now(),
      content,
      category: category || "",
      backgroundColor: bgColor || "#ffffff",
      color: txtColor || "#000000",
      createdAt: Date.now()
    };
    notes.push(newNote);
  }

  // Update an existing note
  function updateNote(id, content, category) {
    const note = notes.find(n => n.id === id);
    if (note) {
      note.content = content;
      note.category = category || "";
      editNoteId = null;
    }
  }

  // Delete a note and offer undo option
  function deleteNote(id) {
    const noteIndex = notes.findIndex(n => n.id === id);
    if (noteIndex !== -1) {
      lastDeletedNote = notes.splice(noteIndex, 1)[0];
      saveNotes();
      renderNotes();
      showNotification("Note deleted.", true);
    }
  }

  // Undo deletion if available
  function undoDelete() {
    if (lastDeletedNote) {
      notes.push(lastDeletedNote);
      saveNotes();
      renderNotes();
      lastDeletedNote = null;
      hideNotification();
    }
  }

  // Save notes to localStorage with error handling
  function saveNotes() {
    try {
      localStorage.setItem("notes", JSON.stringify(notes));
    } catch (err) {
      console.error("Failed to save notes", err);
      showNotification("Error saving notes!");
    }
  }

  // Render notes based on search filter and sort option
  function renderNotes() {
    let filteredNotes = notes.filter(note =>
      note.content.toLowerCase().includes(searchInput.value.toLowerCase()) ||
      (note.category && note.category.toLowerCase().includes(searchInput.value.toLowerCase()))
    );
    // Sort notes based on selection
    if (sortSelect.value === "newest") {
      filteredNotes.sort((a, b) => b.createdAt - a.createdAt);
    } else {
      filteredNotes.sort((a, b) => a.createdAt - b.createdAt);
    }
    // Clear and render
    notesContainer.innerHTML = "";
    filteredNotes.forEach(note => {
      const noteEl = document.createElement("article");
      noteEl.classList.add("note");
      noteEl.style.backgroundColor = note.backgroundColor || "#ffffff";
      noteEl.style.color = note.color || "#000000";

      // Note content
      const contentPara = document.createElement("p");
      contentPara.textContent = note.content;
      noteEl.appendChild(contentPara);

      // Category (if provided)
      if (note.category) {
        const catSpan = document.createElement("span");
        catSpan.classList.add("category");
        catSpan.textContent = `Category: ${note.category}`;
        noteEl.appendChild(catSpan);
      }

      // Actions (Edit & Delete)
      const actionsDiv = document.createElement("div");
      actionsDiv.classList.add("actions");

      const editIcon = document.createElement("i");
      editIcon.classList.add("fa-solid", "fa-pencil");
      editIcon.setAttribute("title", "Edit note");
      editIcon.addEventListener("click", () => {
        noteText.value = note.content;
        categoryInput.value = note.category;
        editNoteId = note.id;
        noteText.focus();
      });
      actionsDiv.appendChild(editIcon);

      const deleteIcon = document.createElement("i");
      deleteIcon.classList.add("fa-solid", "fa-trash-can");
      deleteIcon.setAttribute("title", "Delete note");
      deleteIcon.addEventListener("click", () => deleteNote(note.id));
      actionsDiv.appendChild(deleteIcon);

      noteEl.appendChild(actionsDiv);
      notesContainer.appendChild(noteEl);
    });
  }

  // Search filtering
  searchInput.addEventListener("input", renderNotes);

  // Sorting
  sortSelect.addEventListener("change", renderNotes);

  // Notification helper
  function showNotification(message, showUndo = false) {
    notification.innerHTML = message;
    if (showUndo) {
      const undoBtn = document.createElement("button");
      undoBtn.textContent = "Undo";
      undoBtn.style.marginLeft = "0.5rem";
      undoBtn.addEventListener("click", undoDelete);
      notification.appendChild(undoBtn);
    }
    notification.style.display = "block";
    // Auto-hide after 4 seconds if no undo is needed
    if (!showUndo) {
      setTimeout(hideNotification, 4000);
    }
  }

  function hideNotification() {
    notification.style.display = "none";
    notification.innerHTML = "";
  }
});
