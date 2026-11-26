document.addEventListener("DOMContentLoaded", () => {
    const root = document.getElementById("reader-root");
    if (!root) return;

    const chapters = JSON.parse(root.dataset.chapters || "[]");
    const urlParams = new URLSearchParams(window.location.search);
    const requestedChapter = parseInt(urlParams.get("chapter"), 10);

    let currentIndex = (!isNaN(requestedChapter) && requestedChapter >= 0 && requestedChapter < chapters.length)
        ? requestedChapter
        : 0;

    const selectEl = document.getElementById("chapter-select");
    const titleEl = document.getElementById("chapter-title");
    const contentEl = document.getElementById("chapter-content");
    const prevBtn = document.getElementById("prev-chapter-btn");
    const nextBtn = document.getElementById("next-chapter-btn");

    function sanitizeChapterHtml(html) {
        const temp = document.createElement("div");
        temp.innerHTML = html || "";
        temp.querySelectorAll("script, iframe, object, embed, style, link").forEach(el => el.remove());
        return temp.innerHTML;
    }

    function renderChapter(index, updateUrl = true) {
        if (!chapters.length) return;
        currentIndex = index;
        const ch = chapters[currentIndex];

        titleEl.textContent = ch.title || `Chapter ${currentIndex + 1}`;
        contentEl.innerHTML = sanitizeChapterHtml(ch.content);
        selectEl.value = currentIndex;

        prevBtn.disabled = currentIndex === 0;
        nextBtn.disabled = currentIndex === chapters.length - 1;

        if (updateUrl) {
            const nextUrl = new URL(window.location.href);
            nextUrl.searchParams.set("chapter", currentIndex);
            window.history.replaceState({}, "", nextUrl);
        }

        window.scrollTo({ top: 0, behavior: "smooth" });
    }

    if (chapters.length > 0) {
        selectEl.addEventListener("change", (e) => renderChapter(Number(e.target.value)));
        prevBtn.addEventListener("click", () => {
            if (currentIndex > 0) renderChapter(currentIndex - 1);
        });
        nextBtn.addEventListener("click", () => {
            if (currentIndex < chapters.length - 1) renderChapter(currentIndex + 1);
        });

        renderChapter(currentIndex, false);
    }
});