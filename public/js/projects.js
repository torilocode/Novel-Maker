document.addEventListener("DOMContentLoaded", () => {
    // 1. Modal de Rename
    const renameModal = document.getElementById("rename-project-modal");
    const renameForm = document.getElementById("rename-project-form");
    const renameInput = document.getElementById("rename-title-input");
    const closeRenameBtn = document.getElementById("close-rename-modal");
    const cancelRenameBtn = document.getElementById("cancel-rename-modal");
    const renameButtons = document.querySelectorAll(".btn-rename-project");

    function closeRenameModal() {
        if (renameModal) renameModal.classList.add("hidden");
    }

    renameButtons.forEach((btn) => {
        btn.addEventListener("click", () => {
            const storyId = btn.dataset.storyId;
            const currentTitle = btn.dataset.storyTitle;

            if (renameForm && renameInput && renameModal) {
                renameForm.action = `/projects/${storyId}/rename`;
                renameInput.value = currentTitle;
                renameModal.classList.remove("hidden");
                renameInput.focus();
                renameInput.select();
            }
        });
    });

    if (closeRenameBtn) closeRenameBtn.addEventListener("click", closeRenameModal);
    if (cancelRenameBtn) cancelRenameBtn.addEventListener("click", closeRenameModal);

    if (renameModal) {
        renameModal.addEventListener("click", (e) => {
            if (e.target === renameModal) closeRenameModal();
        });
    }

    // 2. Upload automático de Capa (2:3)
    const coverForms = document.querySelectorAll(".cover-upload-form");
    coverForms.forEach((form) => {
        const triggerBtn = form.querySelector(".btn-change-cover");
        const fileInput = form.querySelector(".cover-file-input");

        if (triggerBtn && fileInput) {
            triggerBtn.addEventListener("click", () => fileInput.click());
            fileInput.addEventListener("change", () => {
                if (fileInput.files && fileInput.files.length > 0) {
                    form.submit();
                }
            });
        }
    });

    // 3. Modal de Confirmação de Exclusão
    const deleteModal = document.getElementById("delete-project-modal");
    const deleteForm = document.getElementById("delete-project-form");
    const deleteStoryName = document.getElementById("delete-story-name");
    const deleteConfirmInput = document.getElementById("delete-confirm-input");
    const confirmDeleteSubmit = document.getElementById("confirm-delete-submit");
    const closeDeleteBtn = document.getElementById("close-delete-modal");
    const cancelDeleteBtn = document.getElementById("cancel-delete-modal");
    const deleteButtons = document.querySelectorAll(".btn-delete-project");

    let expectedDeleteTitle = "";

    function closeDeleteModal() {
        if (deleteModal) deleteModal.classList.add("hidden");
        if (deleteConfirmInput) deleteConfirmInput.value = "";
        if (confirmDeleteSubmit) confirmDeleteSubmit.disabled = true;
        expectedDeleteTitle = "";
    }

    deleteButtons.forEach((btn) => {
        btn.addEventListener("click", () => {
            const storyId = btn.dataset.storyId;
            const storyTitle = btn.dataset.storyTitle || "";

            if (deleteForm && deleteStoryName && deleteModal && deleteConfirmInput && confirmDeleteSubmit) {
                expectedDeleteTitle = storyTitle.trim().toLowerCase();
                deleteForm.action = `/projects/${storyId}/delete`;
                deleteStoryName.textContent = `"${storyTitle}"`;
                deleteConfirmInput.placeholder = storyTitle;
                deleteConfirmInput.value = "";
                confirmDeleteSubmit.disabled = true;
                deleteModal.classList.remove("hidden");
                deleteConfirmInput.focus();
            }
        });
    });

    if (deleteConfirmInput && confirmDeleteSubmit) {
        deleteConfirmInput.addEventListener("input", () => {
            const typed = deleteConfirmInput.value.trim().toLowerCase();
            confirmDeleteSubmit.disabled = typed !== expectedDeleteTitle || expectedDeleteTitle === "";
        });
    }

    if (closeDeleteBtn) closeDeleteBtn.addEventListener("click", closeDeleteModal);
    if (cancelDeleteBtn) cancelDeleteBtn.addEventListener("click", closeDeleteModal);

    if (deleteModal) {
        deleteModal.addEventListener("click", (e) => {
            if (e.target === deleteModal) closeDeleteModal();
        });
    }

    // Fecha qualquer modal aberto ao apertar Escape
    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") {
            closeRenameModal();
            closeDeleteModal();
        }
    });

    // Modal de Edit Details (Sinopse)
    const detailsModal = document.getElementById("details-project-modal");
    const detailsForm = document.getElementById("details-project-form");
    const detailsStoryLabel = document.getElementById("details-story-label");
    const detailsSynopsisInput = document.getElementById("details-synopsis-input");
    const closeDetailsBtn = document.getElementById("close-details-modal");
    const cancelDetailsBtn = document.getElementById("cancel-details-modal");
    const detailsButtons = document.querySelectorAll(".btn-edit-details");

    function closeDetailsModal() {
        if (detailsModal) detailsModal.classList.add("hidden");
    }

    detailsButtons.forEach((btn) => {
        btn.addEventListener("click", () => {
            const storyId = btn.dataset.storyId;
            const storyTitle = btn.dataset.storyTitle || "";
            const currentSynopsis = btn.dataset.storySynopsis || "";

            if (detailsForm && detailsSynopsisInput && detailsModal) {
                detailsForm.action = `/projects/${storyId}/details`;
                if (detailsStoryLabel) detailsStoryLabel.textContent = storyTitle;
                detailsSynopsisInput.value = currentSynopsis;
                detailsModal.classList.remove("hidden");
                detailsSynopsisInput.focus();
            }
        });
    });

    if (closeDetailsBtn) closeDetailsBtn.addEventListener("click", closeDetailsModal);
    if (cancelDetailsBtn) cancelDetailsBtn.addEventListener("click", closeDetailsModal);

    if (detailsModal) {
        detailsModal.addEventListener("click", (e) => {
            if (e.target === detailsModal) closeDetailsModal();
        });
    }
});