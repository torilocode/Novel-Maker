document.addEventListener("DOMContentLoaded", () => {
    const tabs = document.querySelectorAll(".auth-tab");
    const forms = document.querySelectorAll(".auth-form");
    const subtitle = document.getElementById("auth-subtitle");

    tabs.forEach(tab => {
        tab.addEventListener("click", () => {
            const targetId = tab.dataset.target;

            tabs.forEach(t => t.classList.remove("active"));
            tab.classList.add("active");

            forms.forEach(form => {
                form.classList.toggle("hidden", form.id !== targetId);
            });

            if (subtitle) {
                subtitle.textContent = targetId === "form-register"
                    ? "Create your author account to start writing."
                    : "Sign in to continue your manuscript.";
            }
        });
    });
});