document.addEventListener("DOMContentLoaded", () => {
    // Render all Lucide icons on the page
    if (typeof lucide !== "undefined") {
        lucide.createIcons();
    }

    // User Account Pop-up Logic
    const btnUserMenu = document.getElementById("btn-user-menu");
    const userPopup = document.getElementById("user-popup");

    if (btnUserMenu && userPopup) {
        btnUserMenu.addEventListener("click", (e) => {
            e.stopPropagation();
            userPopup.classList.toggle("hidden");
        });

        document.addEventListener("click", (e) => {
            if (!userPopup.contains(e.target) && e.target !== btnUserMenu) {
                userPopup.classList.add("hidden");
            }
        });
    }
});