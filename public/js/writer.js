document.addEventListener("DOMContentLoaded", () => {
    const canvas = document.getElementById("writer-canvas");
    const editor = document.getElementById("writer-editor");
    const btnBold = document.getElementById("btn-bold");
    const btnItalic = document.getElementById("btn-italic");
    const btnUndo = document.getElementById("btn-undo");
    const btnRedo = document.getElementById("btn-redo");

    // --- CHAPTERS STATE (Loaded from DB or Fresh) ---
    const workspaceEl = document.getElementById("editor-workspace");
    const rawStoryData = workspaceEl ? workspaceEl.dataset.story : "";
    const initialStory = rawStoryData ? JSON.parse(rawStoryData) : null;

    let currentStoryId = initialStory ? initialStory.id : null;
    let chapters = (initialStory && initialStory.chapters.length > 0)
        ? initialStory.chapters.map((ch, idx) => ({
            id: idx + 1,
            title: ch.title,
            content: ch.content
        }))
        : [{ id: 1, title: "Chapter 1", content: "" }];

    let activeChapterId = 1;
    let nextChapterId = chapters.length + 1;

    // Carrega o conteúdo inicial do capítulo 1 se já existir texto salvo
    if (chapters[0].content) {
        editor.innerHTML = chapters[0].content;
        editor.removeAttribute("data-empty");
    }

    // --- SAVE STORY TO MONGODB ---
    const btnSaveStory = document.getElementById("btn-save-story");
    const saveBtnLabel = document.getElementById("save-btn-label");
    const titleInput = document.getElementById("doc-title-input");

    if (btnSaveStory) {
        btnSaveStory.addEventListener("click", async () => {
            saveCurrentChapterContent();
            saveBtnLabel.textContent = "Saving...";
            btnSaveStory.disabled = true;

            try {
                const response = await fetch("/api/stories/save", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        storyId: currentStoryId,
                        title: titleInput.value,
                        chapters: chapters.map(c => ({ title: c.title, content: c.content }))
                    })
                });

                const data = await response.json();
                if (data.success) {
                    currentStoryId = data.storyId;
                    window.history.replaceState({}, "", `/writer/${currentStoryId}`);
                    saveBtnLabel.textContent = "Saved!";
                    setTimeout(() => {
                        saveBtnLabel.textContent = "Save Story";
                    }, 1800);
                }
            } catch (err) {
                saveBtnLabel.textContent = "Error";
            } finally {
                btnSaveStory.disabled = false;
            }
        });
    }

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
                    <i data-lucide="file-text" class="chapter-icon"></i>
                    <span class="chapter-title-text">${chapter.title}</span>
                </div>
                <button type="button" class="btn-chapter-options" title="Delete chapter">
                    <i data-lucide="more-vertical"></i>
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

        // Re-render Lucide icons for newly created chapter items
        if (typeof lucide !== "undefined") {
            lucide.createIcons();
        }
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

    const editorEl = document.getElementById("editor") || document.querySelector("[contenteditable='true']");

    if (editorEl) {
        editorEl.addEventListener("paste", (e) => {
            e.preventDefault();

            // Pega apenas o texto puro sem HTML, cores, links ou fontes externas
            const plainText = (e.clipboardData || window.clipboardData).getData("text/plain");
            if (!plainText) return;

            // Normaliza quebras de linha e insere mantendo a estrutura de parágrafos
            const selection = window.getSelection();
            if (!selection.rangeCount) return;

            const range = selection.getRangeAt(0);
            range.deleteContents();

            const lines = plainText.replace(/\r\n/g, "\n").split("\n");
            const fragment = document.createDocumentFragment();

            lines.forEach((line, index) => {
                if (index > 0) {
                    fragment.appendChild(document.createElement("br"));
                }
                if (line.length > 0) {
                    fragment.appendChild(document.createTextNode(line));
                }
            });

            range.insertNode(fragment);

            // Move o cursor para o final do texto colado
            range.collapse(false);
            selection.removeAllRanges();
            selection.addRange(range);

            // Dispara o evento 'input' para atualizar contagem de palavras / autosave
            editorEl.dispatchEvent(new Event("input", { bubbles: true }));
        });
    }
});