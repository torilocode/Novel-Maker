document.addEventListener("DOMContentLoaded", () => {
    const canvas = document.getElementById("writer-canvas");
    const editor = document.getElementById("writer-editor");
    const btnBold = document.getElementById("btn-bold");
    const btnItalic = document.getElementById("btn-italic");
    const btnUndo = document.getElementById("btn-undo");
    const btnRedo = document.getElementById("btn-redo");

    // --- CHAPTERS STATE ---
    let chapters = [
        { id: 1, title: "Chapter 1", content: "" }
    ];
    let activeChapterId = 1;
    let nextChapterId = 2;

    const chaptersListEl = document.getElementById("chapters-list");
    const btnAddChapter = document.getElementById("btn-add-chapter");
    const chaptersSidebar = document.getElementById("chapters-sidebar");
    const btnHideChapters = document.getElementById("btn-hide-chapters");
    const btnShowChapters = document.getElementById("btn-show-chapters");

    // Hide chapters panel -> circular button appears at bottom-right
    if (btnHideChapters && btnShowChapters && chaptersSidebar) {
        btnHideChapters.addEventListener("click", () => {
            chaptersSidebar.classList.add("collapsed");
            btnShowChapters.classList.remove("hidden");
        });

        // Show chapters panel -> circular button hides
        btnShowChapters.addEventListener("click", () => {
            chaptersSidebar.classList.remove("collapsed");
            btnShowChapters.classList.add("hidden");
        });
    }

    function saveCurrentChapterContent() {
        const current = chapters.find(c => c.id === activeChapterId);
        if (current) {
            current.content = editor.innerText.trim() === "" ? "" : editor.innerHTML;
        }
    }

    function loadChapterContent(chapterId) {
        const target = chapters.find(c => c.id === chapterId);
        if (!target) return;

        activeChapterId = chapterId;
        editor.innerHTML = target.content;

        if (editor.innerText.trim() === "") {
            editor.setAttribute("data-empty", "true");
        } else {
            editor.removeAttribute("data-empty");
        }

        renderChaptersList();
        editor.focus();
    }

    function renderChaptersList() {
        chaptersListEl.innerHTML = "";

        chapters.forEach(chapter => {
            const li = document.createElement("li");
            li.className = `chapter-item ${chapter.id === activeChapterId ? "active" : ""}`;

            li.innerHTML = `
                <div class="chapter-item-left">
                    <svg class="chapter-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                        <polyline points="14 2 14 8 20 8"></polyline>
                        <line x1="16" y1="13" x2="8" y2="13"></line>
                        <line x1="16" y1="17" x2="8" y2="17"></line>
                    </svg>
                    <span class="chapter-title-text">${chapter.title}</span>
                </div>
                <button type="button" class="btn-chapter-options" title="Delete chapter">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                        <circle cx="12" cy="12" r="1"></circle>
                        <circle cx="12" cy="5" r="1"></circle>
                        <circle cx="12" cy="19" r="1"></circle>
                    </svg>
                </button>
            `;

            // Select chapter on click
            li.addEventListener("click", (e) => {
                if (e.target.closest(".btn-chapter-options") || e.target.classList.contains("chapter-title-edit")) {
                    return;
                }
                if (chapter.id !== activeChapterId) {
                    saveCurrentChapterContent();
                    loadChapterContent(chapter.id);
                }
            });

            // Double-click title to rename chapter
            const titleSpan = li.querySelector(".chapter-title-text");
            titleSpan.addEventListener("dblclick", (e) => {
                e.stopPropagation();
                const input = document.createElement("input");
                input.type = "text";
                input.className = "chapter-title-edit";
                input.value = chapter.title;
                input.maxLength = 35;

                titleSpan.replaceWith(input);
                input.focus();
                input.select();

                const finishRename = () => {
                    const newName = input.value.trim();
                    if (newName !== "") {
                        chapter.title = newName;
                    }
                    renderChaptersList();
                };

                input.addEventListener("blur", finishRename);
                input.addEventListener("keydown", (ev) => {
                    if (ev.key === "Enter") {
                        ev.preventDefault();
                        finishRename();
                    }
                });
            });

            // Delete chapter button (keeps at least 1)
            const btnOptions = li.querySelector(".btn-chapter-options");
            btnOptions.addEventListener("click", (e) => {
                e.stopPropagation();
                if (chapters.length <= 1) return;

                chapters = chapters.filter(c => c.id !== chapter.id);
                if (activeChapterId === chapter.id) {
                    loadChapterContent(chapters[0].id);
                } else {
                    renderChaptersList();
                }
            });

            chaptersListEl.appendChild(li);
        });
    }

    // Add new chapter
    btnAddChapter.addEventListener("click", () => {
        saveCurrentChapterContent();
        const newChapter = {
            id: nextChapterId++,
            title: `Chapter ${chapters.length + 1}`,
            content: ""
        };
        chapters.push(newChapter);
        loadChapterContent(newChapter.id);
    });

    renderChaptersList();

    // --- TOOLBAR ACTIVE STATES ---
    function updateToolbarStates() {
        try {
            const isBold = document.queryCommandState("bold");
            const isItalic = document.queryCommandState("italic");

            btnBold.classList.toggle("active", isBold);
            btnItalic.classList.toggle("active", isItalic);
        } catch (err) {
            // Ignore when no active selection
        }
    }

    canvas.addEventListener("click", (e) => {
        if (e.target === canvas) {
            editor.focus();
        }
    });

    btnBold.addEventListener("click", (e) => {
        e.preventDefault();
        document.execCommand("bold", false, null);
        editor.focus();
        updateToolbarStates();
    });

    btnItalic.addEventListener("click", (e) => {
        e.preventDefault();
        document.execCommand("italic", false, null);
        editor.focus();
        updateToolbarStates();
    });

    btnUndo.addEventListener("click", (e) => {
        e.preventDefault();
        document.execCommand("undo", false, null);
        editor.focus();
        updateToolbarStates();
    });

    btnRedo.addEventListener("click", (e) => {
        e.preventDefault();
        document.execCommand("redo", false, null);
        editor.focus();
        updateToolbarStates();
    });

    editor.addEventListener("input", () => {
        if (editor.innerText.trim() === "") {
            editor.innerHTML = "";
            editor.setAttribute("data-empty", "true");
        } else {
            editor.removeAttribute("data-empty");
        }
        saveCurrentChapterContent();
        updateToolbarStates();
    });

    editor.addEventListener("keyup", updateToolbarStates);
    editor.addEventListener("mouseup", updateToolbarStates);
    document.addEventListener("selectionchange", () => {
        if (document.activeElement === editor) {
            updateToolbarStates();
        }
    });

    // --- CHAPTERS SIDEBAR RESIZING ---
    const resizer = document.getElementById("chapters-resizer");
    let isResizing = false;

    if (resizer && chaptersSidebar) {
        resizer.addEventListener("mousedown", (e) => {
            e.preventDefault();
            isResizing = true;
            resizer.classList.add("resizing");
            document.body.classList.add("is-resizing");
        });

        document.addEventListener("mousemove", (e) => {
            if (!isResizing) return;

            const sidebarRightEdge = chaptersSidebar.getBoundingClientRect().right;
            const newWidth = sidebarRightEdge - e.clientX;

            if (newWidth >= 190 && newWidth <= 480) {
                chaptersSidebar.style.width = `${newWidth}px`;
            }
        });

        document.addEventListener("mouseup", () => {
            if (!isResizing) return;
            isResizing = false;
            resizer.classList.remove("resizing");
            document.body.classList.remove("is-resizing");
        });
    }
});