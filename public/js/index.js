document.addEventListener("DOMContentLoaded", () => {
    const states = [
        {
            badge: "Preview 01 / 03",
            caption: "Workspace Preview Placeholder",
            step: "Feature 01",
            title: "Immerse Yourself in Your Manuscript",
            description: "Write in a clean, warm-toned fullscreen canvas engineered to reduce eye strain during long creative writing sessions."
        },
        {
            badge: "Preview 02 / 03",
            caption: "Chapters Sidebar Placeholder",
            step: "Feature 02",
            title: "Effortless Chapter Organization",
            description: "Create, rename, and switch between chapters seamlessly using the collapsible and resizable side panel."
        },
        {
            badge: "Preview 03 / 03",
            caption: "Formatting & History Placeholder",
            step: "Feature 03",
            title: "Essential Formatting at Your Fingertips",
            description: "Stay in the flow with quick bold, italic, undo, and redo controls tucked neatly into a minimalist top bar."
        }
    ];

    let currentIndex = 0;

    const tabs = document.querySelectorAll(".showcase-tab");
    const dots = document.querySelectorAll(".dot");
    const btnPrev = document.getElementById("btn-prev-state");
    const btnNext = document.getElementById("btn-next-state");

    const badgeEl = document.getElementById("showcase-badge");
    const captionEl = document.getElementById("showcase-caption");
    const stepEl = document.getElementById("showcase-step");
    const titleEl = document.getElementById("showcase-title");
    const descEl = document.getElementById("showcase-description");

    function updateShowcase(index) {
        currentIndex = (index + states.length) % states.length;
        const data = states[currentIndex];

        badgeEl.textContent = data.badge;
        captionEl.textContent = data.caption;
        stepEl.textContent = data.step;
        titleEl.textContent = data.title;
        descEl.textContent = data.description;

        tabs.forEach((tab, i) => tab.classList.toggle("active", i === currentIndex));
        dots.forEach((dot, i) => dot.classList.toggle("active", i === currentIndex));
    }

    tabs.forEach(tab => {
        tab.addEventListener("click", () => {
            updateShowcase(Number(tab.dataset.state));
        });
    });

    dots.forEach(dot => {
        dot.addEventListener("click", () => {
            updateShowcase(Number(dot.dataset.state));
        });
    });

    if (btnPrev) {
        btnPrev.addEventListener("click", () => updateShowcase(currentIndex - 1));
    }

    if (btnNext) {
        btnNext.addEventListener("click", () => updateShowcase(currentIndex + 1));
    }
});