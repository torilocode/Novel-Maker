document.addEventListener("DOMContentLoaded", () => {
    const btnUserMenu = document.getElementById("btn-user-menu");
    const userPopup = document.getElementById("user-popup");

    if (btnUserMenu && userPopup) {
        btnUserMenu.addEventListener("click", (e) => {
            e.stopPropagation();
            userPopup.classList.toggle("hidden");
        });

        // Fecha o pop-up ao clicar fora dele
        document.addEventListener("click", (e) => {
            if (!userPopup.contains(e.target) && e.target !== btnUserMenu) {
                userPopup.classList.add("hidden");
            }
        });
    }
});