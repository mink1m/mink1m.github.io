const body = document.body;
const toggler = document.getElementById("toggler");
const clock = document.getElementById("clock");
const portrait = document.getElementById("mypic");
const parallaxFrame = document.querySelector("[data-parallax]");
const favicon = document.getElementById("favicon");
const header = document.querySelector(".site-header");
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function updateClock() {
    if (!clock) return;
    const now = new Intl.DateTimeFormat("en-US", {
        timeZone: "America/New_York",
        month: "2-digit",
        day: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
    }).format(new Date());
    clock.textContent = now + " ET";
}

function setTheme(isDark) {
    body.classList.toggle("dark-mode", isDark);
    if (toggler) toggler.checked = isDark;
    localStorage.setItem("theme", isDark ? "dark" : "light");
    const themeMeta = document.querySelector('meta[name="theme-color"]');
    if (themeMeta) themeMeta.setAttribute("content", isDark ? "#071611" : "#f3f3ee");
    if (favicon) favicon.href = "/images/mk_beige.svg";
}

const savedTheme = localStorage.getItem("theme");
const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
setTheme(savedTheme ? savedTheme === "dark" : prefersDark);
requestAnimationFrame(() => requestAnimationFrame(() => body.classList.add("theme-ready")));
if (toggler) toggler.addEventListener("change", () => setTheme(toggler.checked));

const yearEl = document.getElementById("year");
if (yearEl) yearEl.textContent = new Date().getFullYear();
if (clock) {
    updateClock();
    setInterval(updateClock, 30000);
}

document.querySelectorAll('a[href="#top"]').forEach((link) => {
    link.addEventListener("click", (e) => {
        e.preventDefault();
        window.scrollTo({
            top: 0,
            behavior: prefersReducedMotion ? "auto" : "smooth"
        });
        if (window.location.hash === "#top") {
            history.replaceState(null, "", window.location.pathname + window.location.search);
        }
    });
});

document.querySelectorAll('.site-nav a[href^="#"]').forEach((link) => {
    link.addEventListener("click", (e) => {
        const hash = link.getAttribute("href");
        const target = document.querySelector(hash);
        if (!target) return;
        e.preventDefault();
        target.scrollIntoView({
            behavior: prefersReducedMotion ? "auto" : "smooth",
            block: "start"
        });
        if (window.location.hash !== hash) {
            history.pushState(null, "", hash);
        }
    });
});

const emailLink = document.getElementById("emailLink");
const copyToast = document.getElementById("copyToast");
let toastTimer = null;

function copyTextToClipboard(text) {
    if (navigator.clipboard && window.isSecureContext) {
        return navigator.clipboard.writeText(text);
    }
    return new Promise((resolve, reject) => {
        const textarea = document.createElement("textarea");
        textarea.value = text;
        textarea.setAttribute("readonly", "");
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.select();
        try {
            document.execCommand("copy") ? resolve() : reject();
        } catch (err) {
            reject(err);
        } finally {
            document.body.removeChild(textarea);
        }
    });
}

if (emailLink && copyToast) {
    emailLink.addEventListener("click", (e) => {
        e.preventDefault();
        const email = emailLink.dataset.email || "minhakimjst@gmail.com";

        copyTextToClipboard(email).then(() => {
            emailLink.classList.add("is-copied");
            copyToast.textContent = "copied " + email + " to clipboard";
            copyToast.classList.add("is-visible");

            clearTimeout(toastTimer);
            toastTimer = setTimeout(() => {
                copyToast.classList.remove("is-visible");
                emailLink.classList.remove("is-copied");
            }, 2400);
        });
    });
}

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
let currentActiveId = null;

function updateActiveNav() {
    if (!trackedSections.length) return;
    const triggerLine = (header ? header.offsetHeight : 72) + 56;
    let nextActiveId = null;

    for (const section of trackedSections) {
        if (section.getBoundingClientRect().top <= triggerLine) {
            nextActiveId = section.id;
        }
    }

    if (nextActiveId === currentActiveId) return;
    currentActiveId = nextActiveId;

    sectionLinks.forEach((link) => {
        const isActive = currentActiveId !== null && link.getAttribute("href") === "#" + currentActiveId;
        link.classList.toggle("active", isActive);
        if (isActive) link.setAttribute("aria-current", "location");
        else link.removeAttribute("aria-current");
    });
}

const portraits = ["images/me_0.jpg", "images/me_1.jpg", "images/me_2.jpg"];
let portraitIndex = 0;
let portraitTimer = null;

function cyclePortrait() {
    if (!portrait) return;
    portraitIndex = (portraitIndex + 1) % portraits.length;
    portrait.classList.add("is-changing");
    setTimeout(() => {
        portrait.src = portraits[portraitIndex];
        portrait.classList.remove("is-changing");
    }, 180);
}

if (portrait) {
    portraits.slice(1).forEach((src) => {
        const img = new Image();
        img.src = src;
    });
    portraitTimer = setInterval(() => {
        if (document.hidden) return;
        cyclePortrait();
    }, 7000);
}

let hiccupAnim = null;
let lastTiltDir = 1;
let lastDoubleCatch = false;

function triggerHiccup() {
    if (!parallaxFrame || prefersReducedMotion) return;
    if (hiccupAnim) hiccupAnim.cancel();

    lastTiltDir *= -1;
    const jumpY = -(11 + Math.random() * 13);
    const driftX = (Math.random() * 8 - 4).toFixed(1);
    const tilt = lastTiltDir * (2.2 + Math.random() * 3.3);
    const stretchY = (1.025 + Math.random() * 0.03).toFixed(3);
    const squashX = (2 - stretchY).toFixed(3);
    const doubleCatch = !lastDoubleCatch && Math.random() < 0.55;
    lastDoubleCatch = doubleCatch;

    const keyframes = doubleCatch
        ? [
            { transform: "translate(0px, 0px) rotate(3deg) scale(1, 1)", offset: 0 },
            { transform: "translate(0px, 2.5px) rotate(3deg) scale(1.02, 0.98)", offset: 0.12 },
            { transform: "translate(" + driftX + "px, " + jumpY.toFixed(1) + "px) rotate(" + (3 + tilt).toFixed(2) + "deg) scale(" + squashX + ", " + stretchY + ")", offset: 0.36 },
            { transform: "translate(" + (driftX * 0.4).toFixed(1) + "px, " + (jumpY * 0.25).toFixed(1) + "px) rotate(" + (3 - tilt * 0.3).toFixed(2) + "deg) scale(1.01, 0.99)", offset: 0.58 },
            { transform: "translate(" + (driftX * 0.2).toFixed(1) + "px, " + (jumpY * 0.55).toFixed(1) + "px) rotate(" + (3 + tilt * 0.45).toFixed(2) + "deg) scale(0.99, 1.015)", offset: 0.74 },
            { transform: "translate(0px, 1.5px) rotate(" + (3 - tilt * 0.15).toFixed(2) + "deg) scale(1.01, 0.99)", offset: 0.9 },
            { transform: "translate(0px, 0px) rotate(3deg) scale(1, 1)", offset: 1 }
        ]
        : [
            { transform: "translate(0px, 0px) rotate(3deg) scale(1, 1)", offset: 0 },
            { transform: "translate(0px, 3px) rotate(3deg) scale(1.025, 0.975)", offset: 0.14 },
            { transform: "translate(" + driftX + "px, " + jumpY.toFixed(1) + "px) rotate(" + (3 + tilt).toFixed(2) + "deg) scale(" + squashX + ", " + stretchY + ")", offset: 0.4 },
            { transform: "translate(" + (-driftX * 0.25).toFixed(1) + "px, 2.5px) rotate(" + (3 - tilt * 0.3).toFixed(2) + "deg) scale(1.012, 0.988)", offset: 0.7 },
            { transform: "translate(0px, -2px) rotate(" + (3 + tilt * 0.12).toFixed(2) + "deg) scale(0.996, 1.004)", offset: 0.86 },
            { transform: "translate(0px, 0px) rotate(3deg) scale(1, 1)", offset: 1 }
        ];

    hiccupAnim = parallaxFrame.animate(keyframes, {
        duration: doubleCatch ? 480 + Math.random() * 70 : 370 + Math.random() * 70,
        easing: "cubic-bezier(0.22, 1, 0.36, 1)"
    });
}

if (parallaxFrame) {
    parallaxFrame.setAttribute("title", "Click to cycle photo");
    parallaxFrame.addEventListener("click", () => {
        triggerHiccup();
        cyclePortrait();
        clearInterval(portraitTimer);
        portraitTimer = setInterval(() => {
            if (document.hidden) return;
            cyclePortrait();
        }, 7000);
    });
}

const supportsSvgRefraction =
    window.CSS &&
    CSS.supports("backdrop-filter", 'url("#g") blur(1px)') &&
    !/Firefox/i.test(navigator.userAgent);

if (supportsSvgRefraction && copyToast) {
    copyToast.classList.add("has-svg-refraction");
}

if (header) {
    if (supportsSvgRefraction) {
        header.classList.add("has-svg-refraction");
    }

    if (!prefersReducedMotion && window.matchMedia("(hover: hover)").matches) {
        header.addEventListener("pointermove", (e) => {
            const rect = header.getBoundingClientRect();
            const cx = rect.left + rect.width / 2;
            const cy = rect.top + rect.height / 2;
            const dx = e.clientX - cx;
            const dy = e.clientY - cy;
            const angle = (Math.atan2(dx, -dy) * 180 / Math.PI + 360) % 360;
            header.style.setProperty("--rim-angle", angle + "deg");
            header.classList.add("pointer-active");
        });
        header.addEventListener("pointerleave", () => {
            header.classList.remove("pointer-active");
        });
    }
}

/* ---------------------------------------------------------------------
 * Pixel-grid aquarium: fixed matrix of square cells turned on/off
 * (waves, bubbles & castle flag remain purely time-driven and ignore scroll)
 * ------------------------------------------------------------------- */
(function () {
    var canvas = document.getElementById("scrollField");
    var ctx = canvas && canvas.getContext ? canvas.getContext("2d") : null;
    var orb1 = document.querySelector(".ambient-orb-1");
    var orb2 = document.querySelector(".ambient-orb-2");
    var orb3 = document.querySelector(".ambient-orb-3");

    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var width = 0;
    var height = 0;

    // Grid tuning constants
    var CELL_STEP_DESKTOP = 6;      // Pitch of each square grid cell in CSS px
    var CELL_STEP_COMPACT = 5;      // Pitch on screens < 640px wide
    var CELL_GAP = 1;               // Gap between squares (set to 0 for flush cells)
    var GRID_FPS = 12;              // Discrete grid refresh rate (cells snap on/off per tick)
    var TICK_INTERVAL = 1 / GRID_FPS;

    // Motion tuning constants
    var AUTO_DRIFT_SPEED = 0.014;   // Slow automatic drift (progress units / sec)
    var MAX_SCROLL_SPEED_BOOST = 0.2;

    // Grid framebuffer state
    var cellStep = CELL_STEP_DESKTOP;
    var cellDrawSize = CELL_STEP_DESKTOP - CELL_GAP;
    var gridCols = 0;
    var gridRows = 0;
    var gridOffsetX = 0;
    var gridOffsetY = 0;
    var grid = new Uint16Array(0);
    var frameColors = [""];         // index 0 = cell off
    var colorLookup = Object.create(null);
    var colorBuckets = [[]];

    var autoProgress = 0;
    var scrollSpeedBoost = 0;
    var lastOrbProgress = -1;
    var lastScrollY = window.scrollY || document.documentElement.scrollTop || 0;

    var bubbleTime = 0;
    var tickAccum = 0;
    var forceGridRedraw = true;
    var lastFrameTime = null;

    var hasHover = window.matchMedia("(hover: hover)").matches;
    var pointerActive = false;
    var mouseX = -999;
    var mouseY = -999;
    var smoothMouseX = -999;
    var smoothMouseY = -999;
    var pointerAlpha = 0;

    var rafId = null;
    var scrollTicking = false;
    var isGlass = false;

    var ENTER_GLASS = 40;
    var EXIT_GLASS = 12;
    var POINTER_RADIUS = 165;
    var POINTER_RADIUS_SQ = POINTER_RADIUS * POINTER_RADIUS;

    var palette = {
        base: [0, 66, 37],
        accent: [181, 72, 118],
        water: [0, 66, 37],
        alphaScale: 1
    };

    // 4-bit quadrant masks: 1=TL, 2=TR, 4=BL, 8=BR
    var BLOCK_MASKS = {
        " ": 0,
        "▘": 1,
        "▝": 2,
        "▀": 3,
        "▖": 4,
        "▌": 5,
        "▞": 6,
        "▛": 7,
        "▗": 8,
        "▚": 9,
        "▐": 10,
        "▜": 11,
        "▄": 12,
        "▙": 13,
        "▟": 14,
        "█": 15
    };

    var MIRROR_MAP = {
        "▘": "▝",
        "▝": "▘",
        "▖": "▗",
        "▗": "▖",
        "▌": "▐",
        "▐": "▌",
        "▞": "▚",
        "▚": "▞",
        "▛": "▜",
        "▜": "▛",
        "▙": "▟",
        "▟": "▙"
    };

    function mirrorFrame(lines) {
        var maxLen = 0;
        for (var i = 0; i < lines.length; i++) {
            if (lines[i].length > maxLen) maxLen = lines[i].length;
        }
        return lines.map(function (line) {
            var padded = line;
            while (padded.length < maxLen) padded += " ";
            var out = "";
            for (var j = maxLen - 1; j >= 0; j--) {
                var ch = padded[j];
                out += MIRROR_MAP[ch] || ch;
            }
            return out;
        });
    }

    function compileBlockFrame(lines) {
        var maxLen = 0;
        for (var i = 0; i < lines.length; i++) {
            if (lines[i].length > maxLen) maxLen = lines[i].length;
        }
        var subCols = maxLen * 2;
        var subRows = lines.length * 2;
        var maskGrid = [];
        for (var sr = 0; sr < subRows; sr++) {
            maskGrid.push(new Uint8Array(subCols));
        }

        for (var r = 0; r < lines.length; r++) {
            var line = lines[r];
            for (var c = 0; c < line.length; c++) {
                var mask = BLOCK_MASKS[line[c]] || 0;
                if (!mask) continue;
                if (mask & 1) maskGrid[r * 2][c * 2] = 1;
                if (mask & 2) maskGrid[r * 2][c * 2 + 1] = 1;
                if (mask & 4) maskGrid[r * 2 + 1][c * 2] = 1;
                if (mask & 8) maskGrid[r * 2 + 1][c * 2 + 1] = 1;
            }
        }

        var rects = [];
        for (var y = 0; y < subRows; y++) {
            var row = maskGrid[y];
            var x = 0;
            while (x < subCols) {
                if (!row[x]) {
                    x++;
                    continue;
                }
                var start = x;
                while (x < subCols && row[x]) x++;
                rects.push({ x: start, y: y, w: x - start });
            }
        }

        return {
            subCols: subCols,
            subRows: subRows,
            rects: rects
        };
    }

    function makeSpecies(rightFrames, symmetric) {
        var compiledRight = rightFrames.map(compileBlockFrame);
        return {
            right: compiledRight,
            left: symmetric
                ? compiledRight
                : rightFrames.map(function (lines) {
                    return compileBlockFrame(mirrorFrame(lines));
                })
        };
    }

    var CASTLE_SPRITE = compileBlockFrame([
        "   ▐▟▟▟    ",
        "▖▖▖▐█▐█ ▖▖▖",
        "█▜▌▐███ █▜▌",
        "██▙▟███▄██▌",
        "████▛▀████▌",
        "████  ▐███▌",
        "████  ▐███▌"
    ]);

    var SPECIES = {
        koi: makeSpecies([
            [
                "▜▖▗▟██▄▖ ",
                " █████▙█▌",
                "▟▘▝▀█▛▀▘ "
            ],
            [
                "▄▖▗▄██▄▖ ",
                "▐█████▙█▌",
                "▀▘▝▀█▛▀▘ "
            ]
        ]),
        angel: makeSpecies([
            [
                "  ▟█▖  ",
                "▙▄██▛▙▖",
                "▛▀███▛▀",
                "  ▜█▘  "
            ],
            [
                " ▝██▖  ",
                "▖▄██▛▙▖",
                "▘▀███▛▀",
                " ▗██▘  "
            ]
        ]),
        round: makeSpecies([
            [
                "▖▗▟█▙ ",
                "████▙▌",
                "▘▝▜█▛ "
            ],
            [
                " ▗▟█▙ ",
                "▐███▙▌",
                " ▝▜█▛ "
            ]
        ]),
        minnow: makeSpecies([
            [
                "▙▟█▛▖",
                "▛▜██▘"
            ],
            [
                "▖▟█▛▖",
                "▘▜██▘"
            ]
        ]),
        fry: makeSpecies([
            ["▚█▙"],
            ["▞█▙"]
        ]),
        jelly: makeSpecies([
            [
                "▗▟██▙▖",
                "█▙██▟█",
                "▞ ▚▞ ▚",
                "▝ ▚▞ ▘"
            ],
            [
                " ▟██▙ ",
                "▐▙██▟▌",
                " ▚▞▚▞ ",
                " ▝▘▝▘ "
            ]
        ], true),
        crab: makeSpecies([
            [
                "▙▗▟██▙▖▟",
                "▝█▙██▟█▘",
                "▞ ▚  ▞ ▚"
            ],
            [
                "▌▗▟██▙▖▐",
                "▝█▙██▟█▘",
                "▚ ▞  ▚ ▞"
            ]
        ], true)
    };

    var CREATURES = [
        // Foreground hero fish
        { type: "koi", dir: 1, startX: 0.14, travel: 1.55, baseY: 0.24, waveAmp: 22, waveFreq: 9.5, phase: 0.4, depthShift: -44, tailCycles: 26, tint: 0.72, alpha: 0.44, bubbles: true },
        { type: "angel", dir: -1, startX: 0.84, travel: 1.35, baseY: 0.66, waveAmp: 26, waveFreq: 8.2, phase: 2.1, depthShift: -36, tailCycles: 22, tint: 0.55, alpha: 0.42, bubbles: true },
        { type: "koi", dir: -1, startX: 0.62, travel: 1.15, baseY: 0.82, waveAmp: 16, waveFreq: 7.4, phase: 4.2, depthShift: -28, tailCycles: 20, tint: 0.2, alpha: 0.32, bubbles: true },

        // Midground fish
        { type: "round", dir: 1, startX: 0.72, travel: 1.8, baseY: 0.41, waveAmp: 18, waveFreq: 12.0, phase: 1.2, depthShift: -22, tailCycles: 32, tint: 0.85, alpha: 0.36, bubbles: true },
        { type: "round", dir: -1, startX: 0.28, travel: 1.65, baseY: 0.55, waveAmp: 15, waveFreq: 11.0, phase: 3.6, depthShift: -18, tailCycles: 28, tint: 0.15, alpha: 0.32, bubbles: true },
        { type: "angel", dir: 1, startX: 0.04, travel: 1.25, baseY: 0.76, waveAmp: 20, waveFreq: 9.0, phase: 5.0, depthShift: -24, tailCycles: 24, tint: 0.42, alpha: 0.3, bubbles: true },
        { type: "minnow", dir: 1, startX: 0.38, travel: 2.1, baseY: 0.18, waveAmp: 11, waveFreq: 14.5, phase: 0.8, depthShift: -14, tailCycles: 38, tint: 0.1, alpha: 0.34, bubbles: false },
        { type: "minnow", dir: -1, startX: 0.92, travel: 2.25, baseY: 0.48, waveAmp: 12, waveFreq: 15.2, phase: 2.7, depthShift: -14, tailCycles: 40, tint: 0.65, alpha: 0.32, bubbles: false },
        { type: "minnow", dir: 1, startX: 0.54, travel: 1.95, baseY: 0.72, waveAmp: 10, waveFreq: 13.0, phase: 4.5, depthShift: -12, tailCycles: 34, tint: 0.25, alpha: 0.28, bubbles: false },

        // Coordinated school of tiny block fry (upper-mid)
        { type: "fry", dir: 1, startX: 0.20, travel: 2.45, baseY: 0.32, waveAmp: 13, waveFreq: 13.5, phase: 0.0, depthShift: -10, tailCycles: 44, tint: 0.0, alpha: 0.28, bubbles: false },
        { type: "fry", dir: 1, startX: 0.23, travel: 2.45, baseY: 0.345, waveAmp: 13, waveFreq: 13.5, phase: 0.22, depthShift: -10, tailCycles: 44, tint: 0.2, alpha: 0.26, bubbles: false },
        { type: "fry", dir: 1, startX: 0.175, travel: 2.45, baseY: 0.355, waveAmp: 13, waveFreq: 13.5, phase: 0.44, depthShift: -10, tailCycles: 44, tint: 0.0, alpha: 0.24, bubbles: false },
        { type: "fry", dir: 1, startX: 0.21, travel: 2.45, baseY: 0.375, waveAmp: 13, waveFreq: 13.5, phase: 0.65, depthShift: -10, tailCycles: 44, tint: 0.35, alpha: 0.24, bubbles: false },

        // Deep background school going opposite way
        { type: "fry", dir: -1, startX: 0.78, travel: 1.9, baseY: 0.60, waveAmp: 9, waveFreq: 11.5, phase: 1.5, depthShift: -6, tailCycles: 36, tint: 0.1, alpha: 0.22, bubbles: false },
        { type: "fry", dir: -1, startX: 0.81, travel: 1.9, baseY: 0.625, waveAmp: 9, waveFreq: 11.5, phase: 1.75, depthShift: -6, tailCycles: 36, tint: 0.45, alpha: 0.21, bubbles: false },
        { type: "fry", dir: -1, startX: 0.76, travel: 1.9, baseY: 0.64, waveAmp: 9, waveFreq: 11.5, phase: 2.0, depthShift: -6, tailCycles: 36, tint: 0.1, alpha: 0.2, bubbles: false },

        // Gentle margin jellyfish
        { type: "jelly", dir: 1, startX: 0.07, travel: 0.14, baseY: 0.46, waveAmp: 34, waveFreq: 6.0, phase: 0.6, depthShift: -52, tailCycles: 14, tint: 0.88, alpha: 0.34, bubbles: false },
        { type: "jelly", dir: -1, startX: 0.93, travel: 0.12, baseY: 0.30, waveAmp: 30, waveFreq: 5.5, phase: 2.9, depthShift: -46, tailCycles: 12, tint: 0.78, alpha: 0.3, bubbles: false },

        // Tank-floor crab buddies
        { type: "crab", dir: 1, startX: 0.12, travel: 0.78, baseY: 0.94, waveAmp: 2, waveFreq: 18.0, phase: 0.2, depthShift: 0, tailCycles: 34, tint: 0.82, alpha: 0.36, bubbles: false, floorBound: true },
        { type: "crab", dir: -1, startX: 0.88, travel: 0.46, baseY: 0.94, waveAmp: 2, waveFreq: 9.0, phase: 2.4, depthShift: 0, tailCycles: 17, tint: 0.68, alpha: 0.36, bubbles: false, floorBound: true }
    ];

    // Time-based upward bubbles (speed = tank heights per second, completely independent of scroll)
    var BUBBLES = [
        { x: 0.03, startY: 0.41, speed: 0.061, sway: 6, wobbleFreq: 1.75, phase: 2.4, ring: false, alpha: 0.26 },
        { x: 0.05, startY: 0.92, speed: 0.052, sway: 8, wobbleFreq: 1.5, phase: 0.3, ring: true, alpha: 0.3 },
        { x: 0.07, startY: 0.76, speed: 0.074, sway: 5, wobbleFreq: 2.1, phase: 4.2, ring: false, alpha: 0.27 },
        { x: 0.09, startY: 0.58, speed: 0.068, sway: 6, wobbleFreq: 1.9, phase: 1.9, ring: false, alpha: 0.26 },
        { x: 0.11, startY: 0.19, speed: 0.056, sway: 7, wobbleFreq: 1.65, phase: 5.4, ring: true, alpha: 0.25 },
        { x: 0.14, startY: 0.78, speed: 0.044, sway: 7, wobbleFreq: 1.3, phase: 3.1, ring: true, alpha: 0.25 },
        { x: 0.17, startY: 0.46, speed: 0.066, sway: 5, wobbleFreq: 1.85, phase: 1.2, ring: false, alpha: 0.22 },
        { x: 0.23, startY: 0.34, speed: 0.058, sway: 5, wobbleFreq: 1.7, phase: 0.8, ring: false, alpha: 0.22 },
        { x: 0.28, startY: 0.88, speed: 0.051, sway: 7, wobbleFreq: 1.45, phase: 3.8, ring: true, alpha: 0.2 },
        { x: 0.34, startY: 0.62, speed: 0.069, sway: 5, wobbleFreq: 1.95, phase: 0.6, ring: false, alpha: 0.18 },
        { x: 0.38, startY: 0.86, speed: 0.048, sway: 6, wobbleFreq: 1.4, phase: 4.4, ring: false, alpha: 0.19 },
        { x: 0.44, startY: 0.29, speed: 0.059, sway: 6, wobbleFreq: 1.7, phase: 5.0, ring: true, alpha: 0.18 },
        { x: 0.52, startY: 0.18, speed: 0.064, sway: 6, wobbleFreq: 1.85, phase: 2.7, ring: true, alpha: 0.19 },
        { x: 0.57, startY: 0.73, speed: 0.047, sway: 5, wobbleFreq: 1.35, phase: 1.5, ring: false, alpha: 0.18 },
        { x: 0.64, startY: 0.44, speed: 0.055, sway: 7, wobbleFreq: 1.6, phase: 2.2, ring: false, alpha: 0.2 },
        { x: 0.69, startY: 0.91, speed: 0.071, sway: 6, wobbleFreq: 2.05, phase: 4.8, ring: true, alpha: 0.21 },
        { x: 0.73, startY: 0.14, speed: 0.053, sway: 5, wobbleFreq: 1.5, phase: 0.9, ring: false, alpha: 0.22 },
        { x: 0.77, startY: 0.70, speed: 0.062, sway: 6, wobbleFreq: 1.8, phase: 5.1, ring: true, alpha: 0.25 },
        { x: 0.81, startY: 0.38, speed: 0.067, sway: 7, wobbleFreq: 1.9, phase: 2.6, ring: false, alpha: 0.24 },
        { x: 0.84, startY: 0.82, speed: 0.049, sway: 6, wobbleFreq: 1.4, phase: 4.0, ring: false, alpha: 0.25 },
        { x: 0.86, startY: 0.25, speed: 0.046, sway: 9, wobbleFreq: 1.35, phase: 1.1, ring: true, alpha: 0.28 },
        { x: 0.89, startY: 0.61, speed: 0.063, sway: 7, wobbleFreq: 1.75, phase: 5.6, ring: true, alpha: 0.26 },
        { x: 0.91, startY: 0.84, speed: 0.072, sway: 7, wobbleFreq: 2.0, phase: 3.7, ring: false, alpha: 0.26 },
        { x: 0.93, startY: 0.12, speed: 0.057, sway: 6, wobbleFreq: 1.65, phase: 1.8, ring: false, alpha: 0.27 },
        { x: 0.95, startY: 0.52, speed: 0.054, sway: 8, wobbleFreq: 1.55, phase: 0.5, ring: true, alpha: 0.29 },
        { x: 0.97, startY: 0.79, speed: 0.065, sway: 5, wobbleFreq: 1.85, phase: 3.3, ring: false, alpha: 0.26 }
    ];

    var KELP = [
        { x: 0.03, height: 11, phase: 0.2, alpha: 0.25 },
        { x: 0.06, height: 15, phase: 1.4, alpha: 0.22 },
        { x: 0.11, height: 8, phase: 2.8, alpha: 0.18 },
        { x: 0.18, height: 5, phase: 4.1, alpha: 0.13 },
        { x: 0.82, height: 6, phase: 0.9, alpha: 0.14 },
        { x: 0.89, height: 10, phase: 2.1, alpha: 0.19 },
        { x: 0.94, height: 14, phase: 3.5, alpha: 0.24 },
        { x: 0.97, height: 9, phase: 4.9, alpha: 0.22 }
    ];

    function getSurfaceY() {
        return Math.max(44, (header ? header.offsetHeight : 64) - 8);
    }

    function readPalette() {
        var isDark = body.classList.contains("dark-mode");
        if (isDark) {
            palette = {
                base: [66, 214, 152],
                accent: [244, 122, 174],
                water: [34, 158, 114],
                alphaScale: 1.08
            };
        } else {
            palette = {
                base: [0, 66, 37],
                accent: [181, 72, 118],
                water: [0, 82, 56],
                alphaScale: 1
            };
        }
    }

    function rgbaMix(c1, c2, t, alpha) {
        var r = Math.round(c1[0] + (c2[0] - c1[0]) * t);
        var g = Math.round(c1[1] + (c2[1] - c1[1]) * t);
        var b = Math.round(c1[2] + (c2[2] - c1[2]) * t);
        return "rgba(" + r + ", " + g + ", " + b + ", " + (alpha * palette.alphaScale).toFixed(3) + ")";
    }

    function resetGridFrame() {
        grid.fill(0);
        frameColors.length = 1;
        colorLookup = Object.create(null);
    }

    function registerColor(rgba) {
        var existing = colorLookup[rgba];
        if (existing !== undefined) return existing;
        var id = frameColors.length;
        frameColors.push(rgba);
        if (!colorBuckets[id]) colorBuckets[id] = [];
        colorLookup[rgba] = id;
        return id;
    }

    function setCell(col, row, colorId) {
        if (col < 0 || col >= gridCols || row < 0 || row >= gridRows) return;
        grid[row * gridCols + col] = colorId;
    }

    function stampBubble(col, row, ring, colorId) {
        if (!ring) {
            setCell(col, row, colorId);
            return;
        }
        // Hollow 3x3 grid-cell bubble ring
        setCell(col + 1, row, colorId);
        setCell(col, row + 1, colorId);
        setCell(col + 2, row + 1, colorId);
        setCell(col + 1, row + 2, colorId);
    }

    function stampSprite(frame, baseCol, baseRow, colorId) {
        var rects = frame.rects;
        for (var i = 0; i < rects.length; i++) {
            var r = rects[i];
            var row = baseRow + r.y;
            if (row < 0 || row >= gridRows) continue;
            var startCol = baseCol + r.x;
            var endCol = startCol + r.w;
            if (endCol <= 0 || startCol >= gridCols) continue;
            var c0 = startCol < 0 ? 0 : startCol;
            var c1 = endCol > gridCols ? gridCols : endCol;
            var rowOffset = row * gridCols;
            for (var c = c0; c < c1; c++) {
                grid[rowOffset + c] = colorId;
            }
        }
    }

    function flushGrid() {
        ctx.clearRect(0, 0, width, height);

        var total = grid.length;
        for (var i = 0; i < total; i++) {
            var cid = grid[i];
            if (cid !== 0) {
                colorBuckets[cid].push(i);
            }
        }

        for (var c = 1; c < frameColors.length; c++) {
            var bucket = colorBuckets[c];
            var len = bucket.length;
            if (len === 0) continue;

            ctx.fillStyle = frameColors[c];
            for (var j = 0; j < len; j++) {
                var idx = bucket[j];
                var row = (idx / gridCols) | 0;
                var col = idx - row * gridCols;
                ctx.fillRect(
                    gridOffsetX + col * cellStep,
                    gridOffsetY + row * cellStep,
                    cellDrawSize,
                    cellDrawSize
                );
            }
            bucket.length = 0;
        }
    }

    function updateAmbientOrbs(p) {
        if (Math.abs(p - lastOrbProgress) < 0.0001) return;
        lastOrbProgress = p;

        // Smoothly loops between 0 and 1 so orbs stay in bounds as p grows
        var cycle = 0.5 - 0.5 * Math.cos(p * Math.PI);

        if (orb1) {
            var x1 = 76 - Math.sin(p * Math.PI * 1.15) * 54;
            var y1 = 10 + cycle * 74;
            var s1 = 1 + Math.sin(p * Math.PI) * 0.16;
            orb1.style.transform = "translate3d(" + x1.toFixed(2) + "vw, " + y1.toFixed(2) + "vh, 0) scale(" + s1.toFixed(3) + ")";
        }
        if (orb2) {
            var x2 = 12 + Math.sin(p * Math.PI * 0.95) * 66;
            var y2 = 82 - cycle * 60;
            var s2 = 1.04 - Math.cos(p * Math.PI * 1.4) * 0.12;
            orb2.style.transform = "translate3d(" + x2.toFixed(2) + "vw, " + y2.toFixed(2) + "vh, 0) scale(" + s2.toFixed(3) + ")";
        }
        if (orb3) {
            var x3 = 36 + Math.cos(p * Math.PI * 1.35) * 34;
            var y3 = 34 + Math.sin(p * Math.PI * 1.2) * 32;
            var s3 = 0.92 + cycle * 0.2;
            orb3.style.transform = "translate3d(" + x3.toFixed(2) + "vw, " + y3.toFixed(2) + "vh, 0) scale(" + s3.toFixed(3) + ")";
        }
    }

    function resize() {
        width = window.innerWidth;
        height = window.innerHeight;
        dpr = Math.min(window.devicePixelRatio || 1, 2);

        cellStep = width < 640 ? CELL_STEP_COMPACT : CELL_STEP_DESKTOP;
        cellDrawSize = Math.max(1, cellStep - CELL_GAP);
        gridCols = Math.ceil(width / cellStep);
        gridRows = Math.floor(height / cellStep);
        gridOffsetX = 0;
        // Align bottom grid row flush with the viewport floor for kelp, castle, and crabs
        gridOffsetY = height - gridRows * cellStep;

        if (grid.length !== gridCols * gridRows) {
            grid = new Uint16Array(gridCols * gridRows);
        }

        if (!ctx) return;
        canvas.width = Math.ceil(width * dpr);
        canvas.height = Math.ceil(height * dpr);
        canvas.style.width = width + "px";
        canvas.style.height = height + "px";
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        forceGridRedraw = true;
    }

    function rasterWaterSurface(time) {
        var surfaceRow = Math.round((getSurfaceY() - gridOffsetY) / cellStep);
        var waveLenCols = (width < 640 ? 115 : 165) / cellStep;
        var phaseShift = time * Math.PI * 6.6;

        // Softer background swell for layered depth
        var backColor = registerColor(rgbaMix(palette.water, palette.base, 0.25, 0.14));
        var prevBack = null;
        for (var c2 = 0; c2 < gridCols; c2++) {
            var w2 = Math.sin((c2 / waveLenCols) * Math.PI * 2 - phaseShift * 0.65 + 1.4) * 1.6
                + Math.sin((c2 / (waveLenCols * 0.5)) * Math.PI * 2 - phaseShift * 0.35) * 0.5;
            var row2 = surfaceRow + Math.round(w2) + 1;
            var top2 = row2;
            var bot2 = row2 + 1;
            if (prevBack !== null && Math.abs(row2 - prevBack) > 1) {
                top2 = Math.min(top2, prevBack + 1);
                bot2 = Math.max(bot2, prevBack);
            }
            for (var r2 = top2; r2 <= bot2; r2++) {
                setCell(c2, r2, backColor);
            }
            prevBack = row2;
        }

        // Solid stepped foreground wave crest
        var frontColor = registerColor(rgbaMix(palette.water, palette.base, 0.35, 0.28));
        var prevFront = null;
        for (var c = 0; c < gridCols; c++) {
            var w1 = Math.sin((c / waveLenCols) * Math.PI * 2 + phaseShift) * 2.2
                + Math.cos((c / (waveLenCols * 0.55)) * Math.PI * 2 + phaseShift * 0.5) * 0.65;
            var row1 = surfaceRow + Math.round(w1);
            var top1 = row1;
            var bot1 = row1 + 1;
            if (prevFront !== null && Math.abs(row1 - prevFront) > 1) {
                top1 = Math.min(top1, prevFront + 1);
                bot1 = Math.max(bot1, prevFront);
            }
            for (var r1 = top1; r1 <= bot1; r1++) {
                setCell(c, r1, frontColor);
            }
            prevFront = row1;
        }
    }

    function rasterKelp(p) {
        var isCompact = width < 640;

        for (var k = 0; k < KELP.length; k++) {
            var stalk = KELP[k];
            if (isCompact && stalk.x > 0.12 && stalk.x < 0.88) continue;

            var baseCol = Math.round(stalk.x * (gridCols - 1));
            var segments = isCompact ? Math.max(5, Math.round(stalk.height * 0.7)) : stalk.height;
            var kelpColor = registerColor(rgbaMix(palette.water, palette.base, 0.35, stalk.alpha));

            for (var s = 0; s < segments; s++) {
                var sway = Math.sin(p * Math.PI * 20 + stalk.phase + s * 0.45);
                var stepOffset = Math.round(sway * (0.4 + s * 0.18));
                var col = baseCol + stepOffset;
                var row = gridRows - 1 - s;
                setCell(col, row, kelpColor);

                if (s > 1 && s < segments - 1 && s % 3 === 0) {
                    var leafDir = (s % 6 === 0) ? 1 : -1;
                    setCell(col + leafDir, row, kelpColor);
                }
            }
        }
    }

    function rasterCastle(t) {
        var castleCol = Math.max(2, Math.round(gridCols * 0.045));
        var castleRow = gridRows - CASTLE_SPRITE.subRows;

        // Stone castle silhouette flush with the tank floor (overwrites kelp cells behind it)
        var castleColor = registerColor(rgbaMix(palette.water, palette.base, 0.35, 0.28));
        stampSprite(CASTLE_SPRITE, castleCol, castleRow, castleColor);

        // Flagpole centered on top of the middle tower (subpixel col 10)
        var poleCol = castleCol + 10;
        var poleTopRow = castleRow - 6;
        var poleBottomRow = castleRow + 1;
        var poleColor = registerColor(rgbaMix(palette.water, palette.base, 0.38, 0.3));
        for (var pr = poleTopRow; pr <= poleBottomRow; pr++) {
            setCell(poleCol, pr, poleColor);
        }

        // Waving triangular pennant flag (time-driven, independent of scroll)
        var flagCols = 7;
        var flagStartCol = poleCol + 1;
        var maxFlagRows = 4;
        var flagMidRow = poleTopRow + 1.5;
        var flagColor = registerColor(rgbaMix(palette.water, palette.accent, 0.72, 0.34));

        for (var fc = 0; fc < flagCols; fc++) {
            var frac = fc / (flagCols - 1);
            var colRows = Math.max(1, Math.round(maxFlagRows * (1 - frac * 0.75)));
            var waveRaw = Math.sin(t * 3.6 - fc * 0.75) * frac * 1.4;
            var waveRow = fc === 0 ? 0 : Math.round(waveRaw);
            var topRow = Math.round(flagMidRow + waveRow - (colRows - 1) * 0.5);
            for (var dr = 0; dr < colRows; dr++) {
                setCell(flagStartCol + fc, topRow + dr, flagColor);
            }
        }
    }

    function rasterBubbles(t) {
        var surfaceRow = Math.round((getSurfaceY() + 6 - gridOffsetY) / cellStep);
        var travelRows = Math.max(20, gridRows - surfaceRow + 3);

        for (var i = 0; i < BUBBLES.length; i++) {
            var b = BUBBLES[i];
            var rawY = b.startY - t * b.speed;
            var wrapped = ((rawY % 1) + 1) % 1;
            var row = Math.round(surfaceRow + wrapped * travelRows);
            var col = Math.round(
                b.x * (gridCols - 1) + (Math.sin(t * b.wobbleFreq + b.phase) * b.sway) / cellStep
            );

            // Fade near waterline and floor
            var edgeFade = wrapped < 0.08
                ? wrapped / 0.08
                : (wrapped > 0.94 ? (1 - wrapped) / 0.06 : 1);

            if (edgeFade < 0.05) continue;
            var bubbleColor = registerColor(rgbaMix(palette.water, palette.accent, 0.2, b.alpha * edgeFade));
            stampBubble(col, row, b.ring, bubbleColor);
        }
    }

    function rasterCreatures(p, t) {
        var isCompact = width < 640;
        var depthWave = -Math.cos(p * Math.PI) * 0.5;

        for (var i = 0; i < CREATURES.length; i++) {
            var c = CREATURES[i];
            if (isCompact && c.type === "fry" && i % 2 === 1) continue;

            var spec = SPECIES[c.type];
            var frames = c.dir >= 0 ? spec.right : spec.left;
            var frameIndex = Math.floor(Math.abs(p * c.tailCycles + c.phase)) % frames.length;
            var frame = frames[frameIndex];

            var padCols = frame.subCols + Math.round(40 / cellStep);
            var spanCols = gridCols + padCols * 2;
            var rawCol = c.startX * spanCols + c.dir * (p * c.travel * spanCols);
            var colFloat = (((rawCol % spanCols) + spanCols) % spanCols) - padCols;

            var rowFloat = c.floorBound
                ? (gridRows - frame.subRows) - Math.abs(Math.sin(p * c.waveFreq + c.phase)) * (c.waveAmp / cellStep)
                : c.baseY * gridRows
                    + (Math.sin(p * c.waveFreq + c.phase) * c.waveAmp + depthWave * c.depthShift) / cellStep;

            // Gentle pointer avoidance quantized onto grid cells
            if (pointerAlpha > 0.005) {
                var cx = gridOffsetX + (colFloat + frame.subCols * 0.5) * cellStep;
                var cy = gridOffsetY + (rowFloat + frame.subRows * 0.5) * cellStep;
                var dx = cx - smoothMouseX;
                var dy = cy - smoothMouseY;
                var d2 = dx * dx + dy * dy;
                if (d2 < POINTER_RADIUS_SQ) {
                    var d = Math.sqrt(d2) || 1;
                    var inv = 1 - d / POINTER_RADIUS;
                    var force = inv * inv * (3 - 2 * inv) * pointerAlpha;
                    colFloat += ((dx / d) * force * 26) / cellStep;
                    if (!c.floorBound) rowFloat += ((dy / d) * force * 20) / cellStep;
                }
            }

            var baseCol = Math.round(colFloat);
            var baseRow = Math.round(rowFloat);
            if (c.floorBound && baseRow > gridRows - frame.subRows) {
                baseRow = gridRows - frame.subRows;
            }

            // Keep center body copy easy to read while letting creatures pop along margins
            var nx = (baseCol + frame.subCols * 0.5) / Math.max(1, gridCols);
            var edgeEmphasis = 0.6 + 0.4 * Math.min(1, Math.abs(nx - 0.5) * 2.1);
            var finalAlpha = Math.min(0.75, c.alpha * edgeEmphasis);

            var creatureColor = registerColor(rgbaMix(palette.base, palette.accent, c.tint, finalAlpha));
            stampSprite(frame, baseCol, baseRow, creatureColor);

            // Rising wake bubbles snapped to grid cells (time-driven, ignoring scroll)
            if (c.bubbles) {
                var headCol = c.dir >= 0 ? baseCol + frame.subCols + 1 : baseCol - 3;
                var midRow = baseRow + Math.round(frame.subRows * 0.4);
                var step1 = (t * 0.45 + c.phase) % 1;
                var step2 = (step1 + 0.5) % 1;

                var bCol1 = Math.round(headCol + c.dir * (step1 * 2) + Math.sin(t * 2.6 + c.phase) * 0.6);
                var bRow1 = Math.round(midRow - step1 * 6);
                var bCol2 = Math.round(headCol + c.dir * (step2 * 3) + Math.cos(t * 2.2 + c.phase) * 0.6);
                var bRow2 = Math.round(midRow - step2 * 7);

                var wakeColor1 = registerColor(rgbaMix(palette.water, palette.accent, c.tint * 0.5, finalAlpha * 0.6 * (1 - step1 * 0.7)));
                stampBubble(bCol1, bRow1, true, wakeColor1);

                var wakeColor2 = registerColor(rgbaMix(palette.water, palette.accent, c.tint * 0.5, finalAlpha * 0.55 * (1 - step2 * 0.7)));
                stampBubble(bCol2, bRow2, false, wakeColor2);
            }
        }
    }

    function drawAquarium() {
        var motionProgress = autoProgress;
        updateAmbientOrbs(motionProgress);
        if (!ctx || !gridCols || !gridRows) return;

        resetGridFrame();

        // Painter's order onto the fixed pixel grid
        rasterWaterSurface(bubbleTime * 0.08);
        rasterKelp(motionProgress);
        rasterCastle(bubbleTime);
        rasterBubbles(bubbleTime);
        rasterCreatures(motionProgress, bubbleTime);

        flushGrid();
    }

    function renderFrame(now) {
        if (lastFrameTime === null) lastFrameTime = now;
        var dt = Math.min(0.05, Math.max(0, (now - lastFrameTime) / 1000));
        lastFrameTime = now;

        if (prefersReducedMotion) {
            scrollSpeedBoost = 0;
            pointerAlpha = 0;
        } else {
            bubbleTime += dt;
            autoProgress += AUTO_DRIFT_SPEED * dt * (1 + scrollSpeedBoost);
            scrollSpeedBoost *= Math.exp(-dt * 4);
            tickAccum += dt;

            var targetPointerAlpha = pointerActive ? 1 : 0;
            pointerAlpha += (targetPointerAlpha - pointerAlpha) * 0.12;
            if (pointerActive) {
                smoothMouseX += (mouseX - smoothMouseX) * 0.18;
                smoothMouseY += (mouseY - smoothMouseY) * 0.18;
            }
        }

        var targetPtr = (!prefersReducedMotion && pointerActive) ? 1 : 0;
        var pointerSettled =
            Math.abs(targetPtr - pointerAlpha) < 0.004 &&
            (!pointerActive || (Math.abs(mouseX - smoothMouseX) < 0.5 && Math.abs(mouseY - smoothMouseY) < 0.5));

        if (pointerSettled) {
            pointerAlpha = targetPtr;
            if (pointerActive) {
                smoothMouseX = mouseX;
                smoothMouseY = mouseY;
            }
        }

        if (forceGridRedraw || tickAccum >= TICK_INTERVAL) {
            tickAccum = tickAccum % TICK_INTERVAL;
            forceGridRedraw = false;
            drawAquarium();
        }

        var keepAnimating = !prefersReducedMotion && !document.hidden;
        if (keepAnimating || !pointerSettled) {
            rafId = requestAnimationFrame(renderFrame);
        } else {
            rafId = null;
            lastFrameTime = null;
        }
    }

    function requestRender() {
        if (!rafId) {
            lastFrameTime = null;
            rafId = requestAnimationFrame(renderFrame);
        }
    }

    function syncScrollState(fromScroll) {
        var scrollTop = window.scrollY || document.documentElement.scrollTop;

        if (parallaxFrame && portrait && !prefersReducedMotion) {
            var offset = Math.max(-14, Math.min(14, (scrollTop - parallaxFrame.offsetTop) * 0.035));
            portrait.style.setProperty("--image-shift", offset + "px");
        }

        if (header) {
            if (!isGlass && scrollTop > ENTER_GLASS) {
                isGlass = true;
                header.classList.add("is-glass");
            } else if (isGlass && scrollTop < EXIT_GLASS) {
                isGlass = false;
                header.classList.remove("is-glass");
            }
        }

        updateActiveNav();

        // Scrolling briefly speeds up automatic motion without changing its position.
        if (fromScroll && !prefersReducedMotion) {
            var deltaY = scrollTop - lastScrollY;
            if (deltaY !== 0) {
                scrollSpeedBoost = Math.min(
                    MAX_SCROLL_SPEED_BOOST,
                    scrollSpeedBoost + Math.abs(deltaY) / 500 * MAX_SCROLL_SPEED_BOOST
                );
            }
        }
        lastScrollY = scrollTop;

        requestRender();
        scrollTicking = false;
    }

    function onScroll() {
        if (!scrollTicking) {
            scrollTicking = true;
            requestAnimationFrame(function () {
                syncScrollState(true);
            });
        }
    }

    if (hasHover && !prefersReducedMotion) {
        window.addEventListener("pointermove", function (e) {
            if (!pointerActive) {
                smoothMouseX = e.clientX;
                smoothMouseY = e.clientY;
            }
            mouseX = e.clientX;
            mouseY = e.clientY;
            pointerActive = true;
            requestRender();
        }, { passive: true });

        document.addEventListener("pointerleave", function () {
            pointerActive = false;
            requestRender();
        });

        window.addEventListener("blur", function () {
            pointerActive = false;
            requestRender();
        });
    }

    document.addEventListener("visibilitychange", function () {
        if (!document.hidden && !prefersReducedMotion) {
            forceGridRedraw = true;
            requestRender();
        }
    });

    window.addEventListener("resize", function () {
        resize();
        syncScrollState(false);
        drawAquarium();
    });
    window.addEventListener("scroll", onScroll, { passive: true });
    if (toggler) {
        toggler.addEventListener("change", function () {
            readPalette();
            forceGridRedraw = true;
            drawAquarium();
            requestRender();
        });
    }

    readPalette();
    resize();
    lastScrollY = window.scrollY || document.documentElement.scrollTop || 0;
    syncScrollState(false);
    drawAquarium();
    if (!prefersReducedMotion) requestRender();
})();