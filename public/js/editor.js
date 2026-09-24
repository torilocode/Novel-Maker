document.addEventListener('DOMContentLoaded', () => {
  const scenesContainer = document.getElementById('scenes-container');
  const addSceneBtn = document.getElementById('btn-add-scene');
  const btnContainer = document.getElementById('btn-container');

  // Garante que o placeholder reapareça se a pessoa apagar todo o texto
  function checkEmptyEditor(editor) {
    const textContent = editor.innerText.trim();
    if (textContent === '' || editor.innerHTML === '<br>') {
      editor.innerHTML = ''; // Limpa tags invisíveis deixadas pelo navegador
      editor.setAttribute('data-empty', 'true');
    } else {
      editor.removeAttribute('data-empty');
    }
  }

  // Executa formatação Rich Text direta
  function executeFormat(editor, command) {
    editor.focus();
    document.execCommand(command, false, null);
    checkEmptyEditor(editor);
  }

  // Cria um novo card de cena com suporte a WYSIWYG / ContentEditable
  function createSceneCard() {
    const newScene = document.createElement('div');
    newScene.className = 'scene-card mb-4';

    newScene.innerHTML = `
      <div class="scene-header">
        <input type="text" class="scene-title-input" placeholder="New Scene" maxlength="30" spellcheck="false" autocomplete="off" autocorrect="off">

        <div class="toolbar d-flex align-items-center gap-1">
          <button class="toolbar-btn" data-action="bold" title="Bold (Ctrl+B)" type="button"><i class="bi bi-type-bold"></i></button>
          <button class="toolbar-btn" data-action="italic" title="Italic (Ctrl+I)" type="button"><i class="bi bi-type-italic"></i></button>
          <button class="toolbar-btn" data-action="undo" title="Undo (Ctrl+Z)" type="button"><i class="bi bi-arrow-counterclockwise"></i></button>
          <button class="toolbar-btn" data-action="redo" title="Redo (Ctrl+Y)" type="button"><i class="bi bi-arrow-clockwise"></i></button>
          <button class="toolbar-btn toolbar-btn-danger btn-delete-scene" title="Delete Scene" type="button">
            <i class="bi bi-trash3"></i>
          </button>
        </div>
      </div>
      <div class="scene-editor" contenteditable="true" placeholder="Escreva o roteiro aqui..."></div>
    `;

    scenesContainer.insertBefore(newScene, btnContainer);

    const editor = newScene.querySelector('.scene-editor');
    if (editor) {
      checkEmptyEditor(editor);
    }

    const titleInput = newScene.querySelector('.scene-title-input');
    if (titleInput) {
      titleInput.focus();
    }
  }

  if (scenesContainer) {
    // 1. CHECAGEM INICIAL DA CENA 1 (Carregada via HTML)
    const initialEditors = scenesContainer.querySelectorAll('.scene-editor');
    initialEditors.forEach((editor) => checkEmptyEditor(editor));

    // 2. MONITORAMENTO DE EDIÇÃO EM TEMPO REAL
    scenesContainer.addEventListener('input', (event) => {
      if (event.target.classList.contains('scene-editor')) {
        checkEmptyEditor(event.target);
      }
    });

    scenesContainer.addEventListener('blur', (event) => {
      if (event.target.classList.contains('scene-editor')) {
        checkEmptyEditor(event.target);
      }
    }, true);

    // 3. ATALHOS DE TECLADO (Keydown)
    scenesContainer.addEventListener('keydown', (event) => {
      if (!event.target.classList.contains('scene-editor')) return;

      const editor = event.target;
      const isCmdOrCtrl = event.ctrlKey || event.metaKey;
      const key = event.key.toLowerCase();

      if (isCmdOrCtrl) {
        if (key === 'b') {
          event.preventDefault();
          executeFormat(editor, 'bold');
        } else if (key === 'i') {
          event.preventDefault();
          executeFormat(editor, 'italic');
        } else if (key === 'y' || (event.shiftKey && key === 'z')) {
          event.preventDefault();
          executeFormat(editor, 'redo');
        } else if (key === 'z' && !event.shiftKey) {
          event.preventDefault();
          executeFormat(editor, 'undo');
        }
      }
    });

    // 4. CLIQUES NOS BOTÕES DA TOOLBAR
    scenesContainer.addEventListener('click', (event) => {
      const btn = event.target.closest('button');
      if (!btn) return;

      const sceneCard = btn.closest('.scene-card');
      if (!sceneCard) return;

      const editor = sceneCard.querySelector('.scene-editor');
      const action = btn.dataset.action;

      if (editor && action) {
        switch (action) {
          case 'bold':
            executeFormat(editor, 'bold');
            break;
          case 'italic':
            executeFormat(editor, 'italic');
            break;
          case 'undo':
            executeFormat(editor, 'undo');
            break;
          case 'redo':
            executeFormat(editor, 'redo');
            break;
        }
      }

      // Exclusão de cena
      if (btn.classList.contains('btn-delete-scene')) {
        const totalScenes = scenesContainer.querySelectorAll('.scene-card').length;
        if (totalScenes <= 1) {
          alert('Você precisa ter pelo menos uma cena no editor.');
          return;
        }
        sceneCard.remove();
      }
    });
  }

  if (addSceneBtn) {
    addSceneBtn.addEventListener('click', createSceneCard);
  }
});