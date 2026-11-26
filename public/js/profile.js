document.addEventListener("DOMContentLoaded", () => {
    // 1. Upload automático de avatar
    const triggerBtn = document.getElementById("avatar-trigger");
    const fileInput = document.getElementById("avatar-input");
    const avatarForm = document.getElementById("avatar-form");

    if (triggerBtn && fileInput && avatarForm) {
        triggerBtn.addEventListener("click", () => fileInput.click());
        fileInput.addEventListener("change", () => {
            if (fileInput.files && fileInput.files.length > 0) {
                avatarForm.submit();
            }
        });
    }

    // 2. Modal de Edição de Perfil (Nickname + Bio)
    const modal = document.getElementById("edit-profile-modal");
    const openSettingsBtn = document.getElementById("open-settings-profile-btn");
    const closeModalBtn = document.getElementById("close-edit-profile-btn");
    const cancelModalBtn = document.getElementById("cancel-edit-profile-btn");
    const nicknameInput = document.getElementById("input-nickname");

    function openModal() {
        if (!modal) return;
        modal.classList.remove("hidden");
        if (nicknameInput) nicknameInput.focus();
    }

    function closeModal() {
        if (!modal) return;
        modal.classList.add("hidden");
    }

    if (openSettingsBtn) openSettingsBtn.addEventListener("click", openModal);
    if (closeModalBtn) closeModalBtn.addEventListener("click", closeModal);
    if (cancelModalBtn) cancelModalBtn.addEventListener("click", closeModal);

    if (modal) {
        modal.addEventListener("click", (e) => {
            if (e.target === modal) closeModal();
        });
    }

    // 3. Botão Follow / Following / Unfollow (no hover) sem recarregar a página
    const followBtn = document.getElementById("follow-btn");
    const followBtnText = document.getElementById("follow-btn-text");
    const followersCountEl = document.getElementById("followers-count");

    function updateFollowButtonUI(isFollowing, isHovering = false) {
        if (!followBtn || !followBtnText) return;

        let label = "Follow";
        let iconName = "user-plus";

        if (isFollowing) {
            label = isHovering ? "Unfollow" : "Following";
            iconName = isHovering ? "user-minus" : "user-check";
        }

        followBtnText.textContent = label;

        const icon = followBtn.querySelector("svg, i");
        if (icon) {
            const newIcon = document.createElement("i");
            newIcon.setAttribute("data-lucide", iconName);
            icon.replaceWith(newIcon);
            if (window.lucide) lucide.createIcons();
        }
    }

    if (followBtn) {
        followBtn.addEventListener("mouseenter", () => {
            if (followBtn.classList.contains("is-following")) {
                updateFollowButtonUI(true, true);
            }
        });

        followBtn.addEventListener("mouseleave", () => {
            if (followBtn.classList.contains("is-following")) {
                updateFollowButtonUI(true, false);
            }
        });

        followBtn.addEventListener("click", async () => {
            const targetUserId = followBtn.dataset.userId;
            followBtn.disabled = true;

            try {
                const res = await fetch(`/api/users/${targetUserId}/follow`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" }
                });
                const data = await res.json();

                if (data.redirect) {
                    window.location.href = data.redirect;
                    return;
                }

                if (data.success) {
                    followBtn.classList.toggle("is-following", data.following);
                    const isHovering = followBtn.matches(":hover");
                    updateFollowButtonUI(data.following, isHovering);

                    if (followersCountEl) {
                        followersCountEl.textContent = data.followersCount;
                    }
                }
            } catch (err) {
                console.error("Failed to toggle follow:", err);
            } finally {
                followBtn.disabled = false;
            }
        });
    }
});