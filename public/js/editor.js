document.addEventListener("DOMContentLoaded", () => {
    const icons = {
        trash: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>`,
        plus: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>`,
        undo: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7v6h6"></path><path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13"></path></svg>`,
        redo: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 7v6h-6"></path><path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3l3 2.7"></path></svg>`,
        grip: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="5" r="1"></circle><circle cx="9" cy="12" r="1"></circle><circle cx="9" cy="19" r="1"></circle><circle cx="15" cy="5" r="1"></circle><circle cx="15" cy="12" r="1"></circle><circle cx="15" cy="19" r="1"></circle></svg>`
    };

    // --- CONTROLE DO MODAL ---
    const avatarModal = document.getElementById("avatarModal");
    const btnCloseModal = document.getElementById("btn-close-avatar-modal");
    let currentTargetAvatarImg = null;

    function openAvatarModal(imgElement) {
        currentTargetAvatarImg = imgElement;
        if (avatarModal) {
            avatarModal.classList.add("active");
        }
    }

    function closeAvatarModal() {
        if (avatarModal) {
            avatarModal.classList.remove("active");
        }
    }

    if (btnCloseModal) {
        btnCloseModal.addEventListener("click", closeAvatarModal);
    }

    if (avatarModal) {
        avatarModal.addEventListener("click", (e) => {
            if (e.target === avatarModal) {
                closeAvatarModal();
            }
        });

        const avatarOptions = avatarModal.querySelectorAll(".avatar-option");
        avatarOptions.forEach(option => {
            option.addEventListener("click", (e) => {
                if (currentTargetAvatarImg) {
                    const selectedSrc = e.target.getAttribute("data-src");
                    currentTargetAvatarImg.src = selectedSrc;
                }
                closeAvatarModal();
            });
        });
    }

    // --- LÓGICA DE PERSONAGENS ---
    const charContainer = document.getElementById("characters-container");
    const btnAddChar = document.getElementById("btn-add-character");

    const defaultColors = ["#ff2a5f", "#e000d0", "#6133ff", "#2b7fff", "#38d629", "#e09f00"];
    let colorIndex = 0;

    function createCharacterItem(defaultName = "") {
        const item = document.createElement("div");
        item.classList.add("character-item");

        const initialColor = defaultColors[colorIndex % defaultColors.length];
        colorIndex++;

        item.innerHTML = `
            <div class="char-left">
                <img src="/assets/l1.png" class="char-avatar" title="Mudar foto" alt="Avatar">
                <input type="text" class="char-name-input" value="${defaultName}" placeholder="Name" maxlength="20" spellcheck="false" autocomplete="off">
            </div>
            <div class="char-right">
                <button class="btn-delete-char" title="Delete Character">${icons.trash}</button>
                <label class="char-color-badge" style="background-color: ${initialColor};" title="Change Color">
                    <input type="color" class="char-color-picker" value="${initialColor}">
                </label>
            </div>
        `;

        const avatarImg = item.querySelector(".char-avatar");
        const colorPicker = item.querySelector(".char-color-picker");
        const badge = item.querySelector(".char-color-badge");
        const nameInput = item.querySelector(".char-name-input");
        const btnDelete = item.querySelector(".btn-delete-char");

        avatarImg.addEventListener("click", () => {
            openAvatarModal(avatarImg);
        });

        colorPicker.addEventListener("input", (e) => {
            badge.style.backgroundColor = e.target.value;
            triggerAllEditorsHighlight();
        });

        nameInput.addEventListener("change", () => {
            triggerAllEditorsHighlight();
        });

        nameInput.addEventListener("keydown", (e) => {
            if (e.key === "Enter") {
                e.preventDefault();
                nameInput.blur();
            }
        });

        btnDelete.addEventListener("click", () => {
            item.remove();
            triggerAllEditorsHighlight();
        });

        return item;
    }

    if (charContainer && charContainer.children.length === 0) {
        charContainer.appendChild(createCharacterItem());
    }

    if (btnAddChar) {
        btnAddChar.addEventListener("click", () => {
            charContainer.appendChild(createCharacterItem());
        });
    }

    // --- LÓGICA DE DIÁLOGOS ---
    const dialogsContainer = document.getElementById("dialogs-container");
    const btnAddDialog = document.getElementById("btn-add-dialog");

    function updateDialogNumbers() {
        const dialogInputs = dialogsContainer.querySelectorAll(".dialog-title-input");
        dialogInputs.forEach((input, index) => {
            if (!input.value) {
                input.placeholder = `Dialog ${index + 1}`;
            }
        });
    }

    function createDialogCard() {
        const card = document.createElement("div");
        card.classList.add("dialog-card");

        card.innerHTML = `
            <div class="dialog-header">
                <input type="text" class="dialog-title-input" placeholder="New Dialog" maxlength="30" spellcheck="false" autocomplete="off" autocorrect="off">

                <div class="toolbar">
                    <button class="toolbar-btn btn-bold" title="Bold">B</button>
                    <button class="toolbar-btn btn-italic" title="Italic"><i>I</i></button>
                    <button class="toolbar-btn btn-undo" title="Undo">${icons.undo}</button>
                    <button class="toolbar-btn btn-redo" title="Redo">${icons.redo}</button>
                    <button class="toolbar-btn toolbar-btn-danger btn-delete-dialog" title="Delete Dialog">${icons.trash}</button>
                </div>
            </div>
            <div class="dialog-editor" contenteditable="true" data-placeholder="Escreva o diálogo aqui..." data-empty="true" spellcheck="false"></div>
        `;

        const editor = card.querySelector(".dialog-editor");

        card.querySelector(".btn-bold").addEventListener("click", (e) => {
            e.preventDefault();
            document.execCommand("bold", false, null);
        });

        card.querySelector(".btn-italic").addEventListener("click", (e) => {
            e.preventDefault();
            document.execCommand("italic", false, null);
        });

        card.querySelector(".btn-undo").addEventListener("click", (e) => {
            e.preventDefault();
            document.execCommand("undo", false, null);
        });

        card.querySelector(".btn-redo").addEventListener("click", (e) => {
            e.preventDefault();
            document.execCommand("redo", false, null);
        });

        let isComposingLineBreak = false;

        editor.addEventListener("keydown", (e) => {
            if (e.key === "Enter") {
                isComposingLineBreak = true;
            } else {
                isComposingLineBreak = false;
            }
        });

        editor.addEventListener("input", () => {
            const textContent = editor.innerText.trim();

            if (textContent === "") {
                editor.innerHTML = "";
                editor.setAttribute("data-empty", "true");
            } else {
                editor.removeAttribute("data-empty");

                if (!isComposingLineBreak) {
                    highlightCharacters(editor);
                }
            }
        });

        editor.addEventListener("blur", () => {
            if (editor.innerText.trim() !== "") {
                highlightCharacters(editor);
            }
        });

        const btnDelete = card.querySelector(".btn-delete-dialog");
        btnDelete.addEventListener("click", () => {
            card.remove();
            updateDialogNumbers();
        });

        return card;
    }

    if (dialogsContainer && dialogsContainer.children.length === 0) {
        dialogsContainer.appendChild(createDialogCard());
        updateDialogNumbers();
    }

    if (btnAddDialog) {
        btnAddDialog.addEventListener("click", () => {
            dialogsContainer.appendChild(createDialogCard());
            updateDialogNumbers();
        });
    }

    // --- LÓGICA DA STORY TAB ---
    const chaptersContainer = document.getElementById("chapters-container");
    const btnAddChapter = document.getElementById("btn-add-chapter");

    function createSceneItem(sceneIndex) {
        const item = document.createElement("div");
        item.classList.add("scene-item");
        item.setAttribute("draggable", "true");

        item.innerHTML = `
            <div class="scene-left">
                <span class="drag-handle" title="Arrastar para reordenar">${icons.grip}</span>
                <input type="text" class="scene-title-input-story" placeholder="Scene ${sceneIndex}" value="Scene ${sceneIndex}" maxlength="25">
            </div>
            <button class="btn-delete-story-scene" title="Delete Scene">${icons.trash}</button>
        `;

        item.addEventListener("dragstart", (e) => {
            item.classList.add("dragging");
            e.dataTransfer.effectAllowed = "move";
        });

        item.addEventListener("dragend", () => {
            item.classList.remove("dragging");
        });

        const btnDelete = item.querySelector(".btn-delete-story-scene");
        btnDelete.addEventListener("click", () => {
            const list = item.parentElement;
            item.remove();
            updateSceneIndexes(list);
        });

        return item;
    }

    function updateSceneIndexes(scenesListContainer) {
        const sceneItems = scenesListContainer.querySelectorAll(".scene-item");
        sceneItems.forEach((sceneItem, idx) => {
            const input = sceneItem.querySelector(".scene-title-input-story");
            if (input && input.value.startsWith("Scene ")) {
                input.value = `Scene ${idx + 1}`;
                input.placeholder = `Scene ${idx + 1}`;
            }
        });
    }

    function setupDragAndDropList(scenesListContainer) {
        scenesListContainer.addEventListener("dragover", (e) => {
            e.preventDefault();
            const draggingItem = scenesListContainer.querySelector(".dragging");
            if (!draggingItem) return;

            const siblings = [...scenesListContainer.querySelectorAll(".scene-item:not(.dragging)")];
            const nextSibling = siblings.find(sibling => {
                return e.clientY <= sibling.getBoundingClientRect().top + sibling.offsetHeight / 2;
            });

            scenesListContainer.insertBefore(draggingItem, nextSibling);
        });

        scenesListContainer.addEventListener("drop", () => {
            updateSceneIndexes(scenesListContainer);
        });
    }

    function createChapterCard(chapterNumber) {
        const chapterCard = document.createElement("div");
        chapterCard.classList.add("chapter-card");

        chapterCard.innerHTML = `
            <div class="chapter-header">
                <input type="text" class="chapter-title-input" value="Chapter ${chapterNumber}" placeholder="Chapter ${chapterNumber}">
                <button class="btn-delete-chapter" title="Delete Chapter">${icons.trash}</button>
            </div>
            <div class="scenes-list"></div>
            <div class="card-footer-actions">
                <button class="btn-add-scene" title="Add Scene">
                    ${icons.plus}
                </button>
            </div>
        `;

        const scenesList = chapterCard.querySelector(".scenes-list");
        const btnAddScene = chapterCard.querySelector(".btn-add-scene");
        const btnDeleteChapter = chapterCard.querySelector(".btn-delete-chapter");

        setupDragAndDropList(scenesList);
        scenesList.appendChild(createSceneItem(1));

        btnAddScene.addEventListener("click", () => {
            const currentCount = scenesList.querySelectorAll(".scene-item").length;
            scenesList.appendChild(createSceneItem(currentCount + 1));
        });

        btnDeleteChapter.addEventListener("click", () => {
            chapterCard.remove();
        });

        return chapterCard;
    }

    if (chaptersContainer && chaptersContainer.children.length === 0) {
        chaptersContainer.appendChild(createChapterCard(1));
    }

    if (btnAddChapter) {
        btnAddChapter.addEventListener("click", () => {
            const count = chaptersContainer.querySelectorAll(".chapter-card").length;
            chaptersContainer.appendChild(createChapterCard(count + 1));
        });
    }

    // --- DESTAQUE DE PERSONAGENS (HIGHLIGHTER) ---
    function getCharactersMap() {
        const charItems = document.querySelectorAll("#characters-container .character-item");
        const map = [];

        charItems.forEach(item => {
            const nameInput = item.querySelector(".char-name-input");
            const colorPicker = item.querySelector(".char-color-picker");

            if (nameInput && nameInput.value.trim() !== "") {
                map.push({
                    name: nameInput.value.trim(),
                    color: colorPicker ? colorPicker.value : "#ff2a5f"
                });
            }
        });

        return map;
    }

    function triggerAllEditorsHighlight() {
        const editors = document.querySelectorAll(".dialog-editor");
        editors.forEach(editor => {
            if (editor.innerText.trim() !== "") {
                highlightCharacters(editor);
            }
        });
    }

    function highlightCharacters(editor) {
        const characters = getCharactersMap();
        if (characters.length === 0) return;

        const caretOffset = getCaretCharacterOffsetWithin(editor);

        let content = editor.innerHTML;
        content = content.replace(/<span style="color: [^"]+; font-weight: 600;">(.*?)<\/span>/gi, '$1');

        characters.forEach(char => {
            if (char.name.length < 2) return;

            const regex = new RegExp(`\\b(${escapeRegExp(char.name)}):?(?![^<]*>)`, 'gi');
            content = content.replace(regex, `<span style="color: ${char.color}; font-weight: 600;">$&</span>`);
        });

        if (editor.innerHTML !== content) {
            editor.innerHTML = content;
            setCurrentCursorPosition(editor, caretOffset);
        }
    }

    // --- FUNÇÕES UTILITÁRIAS DE CURSOR/DOM ---
    function escapeRegExp(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    function getCaretCharacterOffsetWithin(element) {
        let caretOffset = 0;
        const doc = element.ownerDocument || element.document;
        const win = doc.defaultView || doc.parentWindow;
        const sel = win.getSelection();

        if (sel.rangeCount > 0) {
            const range = win.getSelection().getRangeAt(0);
            const preCaretRange = range.cloneRange();
            preCaretRange.selectNodeContents(element);
            preCaretRange.setEnd(range.endContainer, range.endOffset);
            caretOffset = preCaretRange.toString().length;
        }
        return caretOffset;
    }

    function setCurrentCursorPosition(element, offset) {
        const selection = window.getSelection();
        const range = createRange(element, { count: offset });

        if (range) {
            range.collapse(false);
            selection.removeAllRanges();
            selection.addRange(range);
        }
    }

    function createRange(node, chars, range) {
        if (!range) {
            range = document.createRange();
            range.selectNode(node);
            range.setStart(node, 0);
        }

        if (chars.count === 0) {
            range.setEnd(node, 0);
        } else if (node && chars.count > 0) {
            if (node.nodeType === Node.TEXT_NODE) {
                if (node.textContent.length < chars.count) {
                    chars.count -= node.textContent.length;
                } else {
                    range.setEnd(node, chars.count);
                    chars.count = 0;
                }
            } else {
                for (let lp = 0; lp < node.childNodes.length; lp++) {
                    range = createRange(node.childNodes[lp], chars, range);
                    if (chars.count === 0) break;
                }
            }
        }
        return range;
    }
});