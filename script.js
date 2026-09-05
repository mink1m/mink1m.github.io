const body = document.body;
const toggler = document.getElementById("toggler");
const clock = document.getElementById("clock");
const progress = document.getElementById("scrollProgress");
const portrait = document.getElementById("mypic");
const parallaxFrame = document.querySelector("[data-parallax]");
const favicon = document.getElementById("favicon");
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function updateClock() {
    const now = new Intl.DateTimeFormat("en-US", {
        timeZone: "America/New_York",
        month: "2-digit",
        day: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
    }).format(new Date());
    clock.textContent = `${now} ET`;
}

function updateProgress() {
    const pageHeight = document.documentElement.scrollHeight - window.innerHeight;
    progress.style.width = `${pageHeight > 0 ? (window.scrollY / pageHeight) * 100 : 0}%`;
    if (parallaxFrame && !prefersReducedMotion) {
        const offset = Math.max(-14, Math.min(14, (window.scrollY - parallaxFrame.offsetTop) * 0.035));
        portrait.style.setProperty("--image-shift", `${offset}px`);
    }
}

function setTheme(isDark) {
    body.classList.toggle("dark-mode", isDark);
    toggler.checked = isDark;
    localStorage.setItem("theme", isDark ? "dark" : "light");
    document.querySelector('meta[name="theme-color"]').setAttribute("content", isDark ? "#0d221d" : "#f3f3ee");
    favicon.href = "images/mk_green.svg";
}

const savedTheme = localStorage.getItem("theme");
setTheme(savedTheme === "dark");
toggler.addEventListener("change", () => setTheme(toggler.checked));

document.getElementById("year").textContent = new Date().getFullYear();
updateClock();
setInterval(updateClock, 30000);
window.addEventListener("scroll", updateProgress, { passive: true });
updateProgress();

if (!prefersReducedMotion) {
    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.classList.add("is-visible");
                revealObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.12 });
    document.querySelectorAll(".reveal").forEach((element) => revealObserver.observe(element));
    document.querySelectorAll(".project-card").forEach((element) => {
        element.classList.add("reveal-card");
        revealObserver.observe(element);
    });
} else {
    document.querySelectorAll(".reveal").forEach((element) => element.classList.add("is-visible"));
    document.querySelectorAll(".project-card").forEach((element) => element.classList.add("is-visible"));
}

const sectionLinks = [...document.querySelectorAll('.site-nav a[href^="#"]')];
const trackedSections = sectionLinks
    .map((link) => document.querySelector(link.getAttribute("href")))
    .filter(Boolean);
const sectionObserver = new IntersectionObserver((entries) => {
    const visibleSection = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
    if (!visibleSection) return;

    sectionLinks.forEach((link) => {
        const isActive = link.getAttribute("href") === `#${visibleSection.target.id}`;
        link.classList.toggle("active", isActive);
        if (isActive) link.setAttribute("aria-current", "location");
        else link.removeAttribute("aria-current");
    });
}, { rootMargin: "-18% 0px -62% 0px", threshold: [0, 0.2, 0.5, 1] });
trackedSections.forEach((section) => sectionObserver.observe(section));

const portraits = ["images/me_0.jpg", "images/me_1.jpg", "images/me_2.jpg"];
let portraitIndex = 0;
setInterval(() => {
    if (document.hidden) return;
    portraitIndex = (portraitIndex + 1) % portraits.length;
    portrait.classList.add("is-changing");
    setTimeout(() => {
        portrait.src = portraits[portraitIndex];
        portrait.classList.remove("is-changing");
    }, 180);
}, 7000);
