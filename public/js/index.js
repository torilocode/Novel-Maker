document.addEventListener("DOMContentLoaded", () => {
    const states = [
        {
            badge: "PREVIEW 01",
            caption: "Full-Screen Writing Canvas Placeholder",
            stepLabel: "Feature 1 of 3",
            title: "Distraction-Free Writing Canvas",
            description: "Focus entirely on your narrative with a clean, full-screen editor crafted for long writing sessions without clutter or unnecessary menus getting in your way.",
            bgColor: "var(--color-emerald)",
            mockupHtml: `
                <div class="mockup-bar"></div>
                <div class="mockup-line w-90"></div>
                <div class="mockup-line w-80"></div>
                <div class="mockup-line w-60"></div>
            `
        },
        {
            badge: "PREVIEW 02",
            caption: "Resizable Chapters Sidebar Placeholder",
            stepLabel: "Feature 2 of 3",
            title: "Seamless Chapter Management",
            description: "Switch between chapters effortlessly using the adjustable right-hand panel. Create, rename, and organize every part of your manuscript in one place.",
            bgColor: "#2b1d19",
            mockupHtml: `
                <div class="mockup-line w-60" style="background-color: var(--color-cognac);"></div>
                <div class="mockup-line w-80"></div>
                <div class="mockup-line w-60"></div>
                <div class="mockup-bar" style="width: 55%;"></div>
            `
        },
        {
            badge: "PREVIEW 03",
            caption: "Top Toolbar & Quick Actions Placeholder",
            stepLabel: "Feature 3 of 3",
            title: "Essential Formatting at Your Fingertips",
            description: "Apply bold, italic, undo, and redo actions directly from the top bar with instant visual feedback, keeping your workflow fast and intuitive.",
            bgColor: "#242c2a",
            mockupHtml: `
                <div style="display: flex; gap: 8px;">
                    <div class="mockup-bar" style="width: 28px;"></div>
                    <div class="mockup-bar" style="width: 28px; background-color: var(--color-cognac);"></div>
                    <div class="mockup-bar" style="width: 28px;"></div>
                </div>
                <div class="mockup-line w-90"></div>
                <div class="mockup-line w-80"></div>
            `
        }
    ];

    let currentIndex = 0;

    const imageBox = document.getElementById("showcase-image-box");
    const badgeEl = document.getElementById("showcase-badge");
    const mockupEl = document.getElementById("showcase-mockup");
    const captionEl = document.getElementById("showcase-caption");
    const stepLabelEl = document.getElementById("showcase-step-label");
    const titleEl = document.getElementById("showcase-title");
    const descriptionEl = document.getElementById("showcase-description");

    const tabs = document.querySelectorAll(".showcase-tab");
    const dots = document.querySelectorAll(".dot");
    const btnPrev = document.getElementById("btn-prev-state");
    const btnNext = document.getElementById("btn-next-state");

    function renderState(index) {
        currentIndex = (index + states.length) % states.length;
        const data = states[currentIndex];

        imageBox.style.backgroundColor = data.bgColor;
        badgeEl.textContent = data.badge;
        mockupEl.innerHTML = data.mockupHtml;
        captionEl.textContent = data.caption;
        stepLabelEl.textContent = data.stepLabel;
        titleEl.textContent = data.title;
        descriptionEl.textContent = data.description;

        tabs.forEach((tab, idx) => {
            tab.classList.toggle("active", idx === currentIndex);
        });

        dots.forEach((dot, idx) => {
            dot.classList.toggle("active", idx === currentIndex);
        });
    }

    tabs.forEach(tab => {
        tab.addEventListener("click", () => {
            const step = Number(tab.getAttribute("data-step"));
            renderState(step);
        });
    });

    dots.forEach(dot => {
        dot.addEventListener("click", () => {
            const step = Number(dot.getAttribute("data-step"));
            renderState(step);
        });
    });

    btnPrev.addEventListener("click", () => {
        renderState(currentIndex - 1);
    });

    btnNext.addEventListener("click", () => {
        renderState(currentIndex + 1);
    });
});