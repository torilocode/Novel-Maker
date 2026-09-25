document.addEventListener("DOMContentLoaded", () => {
  // --- LÓGICA DE PERSONAGENS ---
  const charContainer = document.getElementById("characters-container");
  const btnAddChar = document.getElementById("btn-add-character");

  const defaultColors = ["#ff2a5f", "#e000d0", "#6133ff", "#2b7fff", "#38d629", "#e09f00"];
  let colorIndex = 0;

  // Armazena a referência do avatar (<img.char-avatar>) que está a ser editado
  let currentTargetAvatarImg = null;

  function createCharacterItem(defaultName = "") {
    const item = document.createElement("div");
    item.classList.add("character-item", "d-flex", "align-items-center", "justify-content-between", "mb-3");

    const initialColor = defaultColors[colorIndex % defaultColors.length];
    colorIndex++;

    item.innerHTML = `
            <div class="d-flex align-items-center gap-2">
                <img src="/assets/l1.png" class="char-avatar" title="Mudar foto" alt="Avatar">
                <input type="text" class="char-name-input" value="${defaultName}" placeholder="Name" maxlength="20" spellcheck="false" autocomplete="off">
            </div>
            <div class="d-flex align-items-center gap-2">
                <button class="btn-delete-char" title="Delete Character"><i class="bi bi-trash"></i></button>
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

    // Evento do Avatar: abre o modal de seleção de imagem
    avatarImg.addEventListener("click", () => {
      currentTargetAvatarImg = avatarImg;
      const modalElement = document.getElementById("avatarModal");
      if (modalElement) {
        const modal = new bootstrap.Modal(modalElement);
        modal.show();
      }
    });

    // Evento da Cor
    colorPicker.addEventListener("input", (e) => {
      badge.style.backgroundColor = e.target.value;
      triggerAllEditorsHighlight();
    });

    // Atualiza as cenas APENAS quando você termina de digitar o nome e sai do campo (blur)
    nameInput.addEventListener("change", () => {
      triggerAllEditorsHighlight();
    });

    // Confirma a alteração ao pressionar Enter dentro do input do nome
    nameInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        nameInput.blur();
      }
    });

    // Elimina o personagem
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

  // --- LÓGICA DO MODAL DE SELEÇÃO DE AVATAR ---
  const avatarModalElement = document.getElementById("avatarModal");
  if (avatarModalElement) {
    const avatarOptions = avatarModalElement.querySelectorAll(".avatar-option");

    avatarOptions.forEach(option => {
      option.addEventListener("click", (e) => {
        if (currentTargetAvatarImg) {
          const selectedSrc = e.target.getAttribute("data-src");
          currentTargetAvatarImg.src = selectedSrc;
        }

        const modalInstance = bootstrap.Modal.getInstance(avatarModalElement);
        if (modalInstance) {
          modalInstance.hide();
        }
      });
    });
  }

  // --- LÓGICA DE CENAS ---
  const scenesContainer = document.getElementById("scenes-container");
  const btnAddScene = document.getElementById("btn-add-scene");

  function updateSceneNumbers() {
    const sceneInputs = scenesContainer.querySelectorAll(".scene-title-input");
    sceneInputs.forEach((input, index) => {
      if (!input.value) {
        input.placeholder = `Scene ${index + 1}`;
      }
    });
  }

  function createSceneCard() {
    const card = document.createElement("div");
    card.classList.add("scene-card", "mb-4");

    card.innerHTML = `
            <div class="scene-header">
                <input type="text" class="scene-title-input" placeholder="New Scene" maxlength="30" spellcheck="false" autocomplete="off" autocorrect="off">

                <div class="toolbar d-flex gap-2 align-items-center">
                    <button class="toolbar-btn btn-bold" title="Bold">B</button>
                    <button class="toolbar-btn btn-italic" title="Italic"><i>I</i></button>
                    <button class="toolbar-btn btn-undo" title="Undo"><i class="bi bi-arrow-counterclockwise"></i></button>
                    <button class="toolbar-btn btn-redo" title="Redo"><i class="bi bi-arrow-clockwise"></i></button>
                    <button class="toolbar-btn toolbar-btn-danger btn-delete-scene" title="Delete Scene"><i class="bi bi-trash"></i></button>
                </div>
            </div>
            <div class="scene-editor" contenteditable="true" data-placeholder="Escreva o roteiro aqui..." data-empty="true" spellcheck="false"></div>
        `;

    const editor = card.querySelector(".scene-editor");

    // Eventos da Toolbar de Edição
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

    // Flag para evitar reescrever o DOM durante a criação de quebra de linha (Enter)
    let isComposingLineBreak = false;

    editor.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        isComposingLineBreak = true;
      } else {
        isComposingLineBreak = false;
      }
    });

    // Controlo do Placeholder e Destaque ao Digitar
    editor.addEventListener("input", () => {
      const textContent = editor.innerText.trim();

      if (textContent === "") {
        editor.innerHTML = "";
        editor.setAttribute("data-empty", "true");
      } else {
        editor.removeAttribute("data-empty");

        // Se acabou de dar Enter, ignora o destaque momentaneamente para não quebrar a posição do cursor
        if (!isComposingLineBreak) {
          highlightCharacters(editor);
        }
      }
    });

    // Ao sair do foco do editor, garante o destaque em todo o texto
    editor.addEventListener("blur", () => {
      if (editor.innerText.trim() !== "") {
        highlightCharacters(editor);
      }
    });

    const btnDelete = card.querySelector(".btn-delete-scene");
    btnDelete.addEventListener("click", () => {
      card.remove();
      updateSceneNumbers();
    });

    return card;
  }

  if (scenesContainer && scenesContainer.children.length === 0) {
    scenesContainer.appendChild(createSceneCard());
    updateSceneNumbers();
  }

  if (btnAddScene) {
    btnAddScene.addEventListener("click", () => {
      scenesContainer.appendChild(createSceneCard());
      updateSceneNumbers();
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
    const editors = document.querySelectorAll(".scene-editor");
    editors.forEach(editor => {
      if (editor.innerText.trim() !== "") {
        highlightCharacters(editor);
      }
    });
  }

  function highlightCharacters(editor) {
    const characters = getCharactersMap();
    if (characters.length === 0) return;

    // Guarda a posição do cursor relativa ao texto puro
    const caretOffset = getCaretCharacterOffsetWithin(editor);

    let content = editor.innerHTML;

    // Limpa formatações/spans antigos de personagens para evitar tags aninhadas
    content = content.replace(/<span style="color: [^"]+; font-weight: 600;">(.*?)<\/span>/gi, '$1');

    characters.forEach(char => {
      if (char.name.length < 2) return;

      // Substitui o nome mantendo fora de tags HTML
      const regex = new RegExp(`\\b(${escapeRegExp(char.name)}):?(?![^<]*>)`, 'gi');
      content = content.replace(regex, `<span style="color: ${char.color}; font-weight: 600;">$&</span>`);
    });

    if (editor.innerHTML !== content) {
      editor.innerHTML = content;
      // Restaura a posição exata do cursor
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