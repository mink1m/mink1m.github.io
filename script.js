const body = document.body;
const toggler = document.getElementById("toggler");
const clock = document.getElementById("clock");
const progress = document.getElementById("scrollProgress");
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
    clock.textContent = `${now} ET`;
}

function setTheme(isDark) {
    body.classList.toggle("dark-mode", isDark);
    if (toggler) toggler.checked = isDark;
    localStorage.setItem("theme", isDark ? "dark" : "light");
    const themeMeta = document.querySelector('meta[name="theme-color"]');
    if (themeMeta) themeMeta.setAttribute("content", isDark ? "#0d221d" : "#f3f3ee");
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
            copyToast.textContent = `copied ${email} to clipboard`;
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
        const isActive = currentActiveId !== null && link.getAttribute("href") === `#${currentActiveId}`;
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
            { transform: `translate(${driftX}px, ${jumpY.toFixed(1)}px) rotate(${(3 + tilt).toFixed(2)}deg) scale(${squashX}, ${stretchY})`, offset: 0.36 },
            { transform: `translate(${(driftX * 0.4).toFixed(1)}px, ${(jumpY * 0.25).toFixed(1)}px) rotate(${(3 - tilt * 0.3).toFixed(2)}deg) scale(1.01, 0.99)`, offset: 0.58 },
            { transform: `translate(${(driftX * 0.2).toFixed(1)}px, ${(jumpY * 0.55).toFixed(1)}px) rotate(${(3 + tilt * 0.45).toFixed(2)}deg) scale(0.99, 1.015)`, offset: 0.74 },
            { transform: `translate(0px, 1.5px) rotate(${(3 - tilt * 0.15).toFixed(2)}deg) scale(1.01, 0.99)`, offset: 0.9 },
            { transform: "translate(0px, 0px) rotate(3deg) scale(1, 1)", offset: 1 }
        ]
        : [
            { transform: "translate(0px, 0px) rotate(3deg) scale(1, 1)", offset: 0 },
            { transform: "translate(0px, 3px) rotate(3deg) scale(1.025, 0.975)", offset: 0.14 },
            { transform: `translate(${driftX}px, ${jumpY.toFixed(1)}px) rotate(${(3 + tilt).toFixed(2)}deg) scale(${squashX}, ${stretchY})`, offset: 0.4 },
            { transform: `translate(${(-driftX * 0.25).toFixed(1)}px, 2.5px) rotate(${(3 - tilt * 0.3).toFixed(2)}deg) scale(1.012, 0.988)`, offset: 0.7 },
            { transform: `translate(0px, -2px) rotate(${(3 + tilt * 0.12).toFixed(2)}deg) scale(0.996, 1.004)`, offset: 0.86 },
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

if (header) {
    if (window.CSS && CSS.supports("backdrop-filter", 'url("#g") blur(1px)') && !/Firefox/i.test(navigator.userAgent)) {
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
            header.style.setProperty("--rim-angle", `${angle}deg`);
            header.classList.add("pointer-active");
        });
        header.addEventListener("pointerleave", () => {
            header.classList.remove("pointer-active");
        });
    }
}

/* ---------------------------------------------------------------------
 * Zen garden scroll background + unified scroll synchronization
 * ------------------------------------------------------------------- */
(function () {
    var canvas = document.getElementById('zenGarden');
    var ctx = canvas && canvas.getContext ? canvas.getContext('2d') : null;

    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var width = 0, height = 0;
    var targetProgress = 0;
    var currentProgress = 0;
    var rafId = null;
    var scrollTicking = false;
    var isGlass = false;
    var cachedColor = '#004225';

    var ENTER_GLASS = 40;
    var EXIT_GLASS = 12;

    var LINE_COUNT = 8;
    var MID_OFFSET = (LINE_COUNT - 1) / 2;
    var RING_SAMPLES = 90;
    var SEG_SAMPLES = 30;
    var R_MIN = 26, SPACING = 14, R_MID = R_MIN + MID_OFFSET * SPACING;

    function normalize(v) { var m = Math.hypot(v.x, v.y) || 1; return { x: v.x / m, y: v.y / m }; }
    function rotate90(v) { return { x: -v.y, y: v.x }; }
    function rotateVec(v, a) { var c = Math.cos(a), s = Math.sin(a); return { x: v.x * c - v.y * s, y: v.x * s + v.y * c }; }
    function add(a, b) { return { x: a.x + b.x, y: a.y + b.y }; }
    function sub(a, b) { return { x: a.x - b.x, y: a.y - b.y }; }
    function scale(a, s) { return { x: a.x * s, y: a.y * s }; }
    function dist(a, b) { return Math.hypot(a.x - b.x, a.y - b.y); }

    function buildTailCenterline(exitPoint, exitTangent, waypointsPx, samplesPerSeg) {
        var pts = [exitPoint].concat(waypointsPx);
        var n = pts.length;
        var tangents = [exitTangent];
        for (var i = 1; i < n - 1; i++) {
            tangents.push(normalize(sub(pts[i + 1], pts[i - 1])));
        }
        tangents.push(normalize(sub(pts[n - 1], pts[n - 2])));

        var centerline = [pts[0]];
        for (var i = 0; i < n - 1; i++) {
            var p0 = pts[i], p1 = pts[i + 1];
            var pull = (dist(p0, p1) || 1) / 3;
            var c1 = add(p0, scale(tangents[i], pull));
            var c2 = sub(p1, scale(tangents[i + 1], pull));
            for (var s = 1; s <= samplesPerSeg; s++) {
                var t = s / samplesPerSeg, mt = 1 - t;
                var a = mt * mt * mt, b = 3 * mt * mt * t, c = 3 * mt * t * t, d = t * t * t;
                centerline.push({
                    x: a * p0.x + b * c1.x + c * c2.x + d * p1.x,
                    y: a * p0.y + b * c1.y + c * c2.y + d * p1.y
                });
            }
        }
        return centerline;
    }

    var SQUARE_TEMPLATE = (function () {
        var rc = 0.32;
        var pts = [];
        function lerp(a, b, t) { return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t }; }
        function side(p0, p1, count) {
            var start = pts.length ? 1 : 0;
            for (var i = start; i <= count; i++) pts.push(lerp(p0, p1, i / count));
        }
        function corner(cx, cy, a0, a1, count) {
            for (var i = 0; i <= count; i++) {
                var a = a0 + (a1 - a0) * (i / count);
                pts.push({ x: cx + rc * Math.cos(a), y: cy + rc * Math.sin(a) });
            }
        }
        var TR = { x: 1 - rc, y: -1 + rc }, BR = { x: 1 - rc, y: 1 - rc };
        var BL = { x: -1 + rc, y: 1 - rc }, TL = { x: -1 + rc, y: -1 + rc };
        var n = 10;
        pts.push({ x: 0, y: -1 });
        side({ x: 0, y: -1 }, { x: 1 - rc, y: -1 }, n);
        corner(TR.x, TR.y, -Math.PI / 2, 0, 8);
        side({ x: 1, y: -1 + rc }, { x: 1, y: 1 - rc }, n);
        corner(BR.x, BR.y, 0, Math.PI / 2, 8);
        side({ x: 1 - rc, y: 1 }, { x: -1 + rc, y: 1 }, n);
        corner(BL.x, BL.y, Math.PI / 2, Math.PI, 8);
        side({ x: -1, y: 1 - rc }, { x: -1, y: -1 + rc }, n);
        corner(TL.x, TL.y, Math.PI, Math.PI * 1.5, 8);
        side({ x: -1 + rc, y: -1 }, { x: 0, y: -1 }, n);
        return pts;
    })();

    var SQUARE_LOOP_LEN = SQUARE_TEMPLATE.length - 1;
    var SQUARE_EXIT_IDX = (function () {
        var best = 0, bestD = Infinity;
        SQUARE_TEMPLATE.forEach(function (p, i) {
            var d = (p.x + 1) * (p.x + 1) + p.y * p.y;
            if (d < bestD) { bestD = d; best = i; }
        });
        return best;
    })();

    function squareLoopIndices(startIdx) {
        var out = [];
        for (var i = 0; i <= SQUARE_LOOP_LEN; i++) out.push((startIdx + i) % SQUARE_LOOP_LEN);
        return out;
    }

    var SQUARE_TR = { shape: 'square', fx: 0.82, fy: 0.18, rotationDeg: 180,
        waypoints: [[0.86, 0.40], [0.74, 0.56], [0.68, 0.76]] };
    var SQUARE_BL = { shape: 'square', fx: 0.18, fy: 0.82, rotationDeg: 0,
        waypoints: [[0.14, 0.60], [0.26, 0.44], [0.32, 0.24]] };

    var LANDSCAPE_FOCAL_POINTS = [
        { shape: 'circle', fx: 0.18, fy: 0.18, exitAngleDeg: 294, dir: 1,
            waypoints: [[0.42, 0.28], [0.58, 0.22], [0.74, 0.30]] },
        SQUARE_TR,
        { shape: 'circle', fx: 0.82, fy: 0.82, exitAngleDeg: 114, dir: 1,
            waypoints: [[0.58, 0.72], [0.42, 0.78], [0.26, 0.70]] },
        SQUARE_BL
    ];
    var PORTRAIT_FOCAL_POINTS = [
        { shape: 'circle', fx: 0.18, fy: 0.18, exitAngleDeg: 156, dir: -1,
            waypoints: [[0.28, 0.42], [0.22, 0.58], [0.30, 0.74]] },
        SQUARE_TR,
        { shape: 'circle', fx: 0.82, fy: 0.82, exitAngleDeg: 336, dir: -1,
            waypoints: [[0.72, 0.58], [0.78, 0.42], [0.70, 0.26]] },
        SQUARE_BL
    ];
    var activeFocalPoints = LANDSCAPE_FOCAL_POINTS;

    function readColor() {
        var v = getComputedStyle(document.body).getPropertyValue('--green');
        cachedColor = v ? v.trim() : '#004225';
    }

    function buildFocalLines(fp) {
        var center = { x: fp.fx * width, y: fp.fy * height };
        var radial, tangent, rotA;

        if (fp.shape === 'circle') {
            var exitA = fp.exitAngleDeg * Math.PI / 180;
            radial = { x: Math.cos(exitA), y: Math.sin(exitA) };
            tangent = normalize({ x: -Math.sin(exitA) * fp.dir, y: Math.cos(exitA) * fp.dir });
        } else {
            rotA = (fp.rotationDeg || 0) * Math.PI / 180;
            radial = normalize(rotateVec(SQUARE_TEMPLATE[SQUARE_EXIT_IDX], rotA));
            var tRaw = sub(
                SQUARE_TEMPLATE[(SQUARE_EXIT_IDX + 1) % SQUARE_LOOP_LEN],
                SQUARE_TEMPLATE[(SQUARE_EXIT_IDX - 1 + SQUARE_LOOP_LEN) % SQUARE_LOOP_LEN]
            );
            tangent = normalize(rotateVec(tRaw, rotA));
        }

        var exitMid = add(center, scale(radial, R_MID));
        var waypointsPx = fp.waypoints.map(function (w) { return { x: w[0] * width, y: w[1] * height }; });
        var centerline = buildTailCenterline(exitMid, tangent, waypointsPx, SEG_SAMPLES);

        var normals = centerline.map(function (p, i) {
            var a = centerline[Math.max(0, i - 1)];
            var b = centerline[Math.min(centerline.length - 1, i + 1)];
            return rotate90(normalize(sub(b, a)));
        });
        if (normals.length && (normals[0].x * radial.x + normals[0].y * radial.y) < 0) {
            normals = normals.map(function (n) { return { x: -n.x, y: -n.y }; });
        }
        if (normals.length) normals[0] = { x: radial.x, y: radial.y };

        var loopIdx = fp.shape === 'square' ? squareLoopIndices(SQUARE_EXIT_IDX) : null;

        var lines = [];
        for (var i = 0; i < LINE_COUNT; i++) {
            var r = R_MIN + i * SPACING;
            var offset = (i - MID_OFFSET) * SPACING;
            var pts = [];

            if (fp.shape === 'circle') {
                for (var s = 0; s <= RING_SAMPLES; s++) {
                    var a2 = fp.exitAngleDeg * Math.PI / 180 + (2 * Math.PI * fp.dir) * (s / RING_SAMPLES);
                    pts.push({ x: center.x + r * Math.cos(a2), y: center.y + r * Math.sin(a2) });
                }
            } else {
                for (var li = 0; li < loopIdx.length; li++) {
                    pts.push(add(center, scale(rotateVec(SQUARE_TEMPLATE[loopIdx[li]], rotA), r)));
                }
            }

            for (var k = 0; k < centerline.length; k++) {
                pts.push(add(centerline[k], scale(normals[k], offset)));
            }

            var path = new Path2D();
            path.moveTo(pts[0].x, pts[0].y);
            var total = 0;
            for (var m = 1; m < pts.length; m++) {
                path.lineTo(pts[m].x, pts[m].y);
                total += dist(pts[m - 1], pts[m]);
            }
            lines.push({ path: path, length: total });
        }
        return lines;
    }

    function buildAll() {
        activeFocalPoints.forEach(function (fp) { fp.lines = buildFocalLines(fp); });
    }

    function resize() {
        if (!ctx) return;
        width = window.innerWidth;
        height = window.innerHeight;
        canvas.width = Math.round(width * dpr);
        canvas.height = Math.round(height * dpr);
        canvas.style.width = width + 'px';
        canvas.style.height = height + 'px';
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        activeFocalPoints = width < height ? PORTRAIT_FOCAL_POINTS : LANDSCAPE_FOCAL_POINTS;

        var minDim = Math.min(width, height);
        R_MIN = Math.max(14, Math.min(30, minDim * 0.032));
        var spacingBase = Math.max(6, Math.min(15, minDim * 0.0165));
        var aspect = Math.max(width, height) / Math.max(1, Math.min(width, height));
        var spacingScale;
        if (aspect <= 1.45) {
            var t1 = Math.max(0, Math.min(1, (aspect - 1) / 0.45));
            spacingScale = 0.62 + t1 * (1 - 0.62);
        } else if (aspect <= 2.3) {
            spacingScale = 1;
        } else {
            var t2 = Math.max(0, Math.min(1, (aspect - 2.3) / 1.7));
            spacingScale = 1 - t2 * (1 - 0.55);
        }
        SPACING = spacingBase * spacingScale;
        R_MID = R_MIN + MID_OFFSET * SPACING;

        buildAll();
    }

    function renderCanvas() {
        if (!ctx) return;
        var ease = prefersReducedMotion ? 1 : 0.09;
        currentProgress += (targetProgress - currentProgress) * ease;
        if (Math.abs(targetProgress - currentProgress) < 0.0004) currentProgress = targetProgress;

        ctx.clearRect(0, 0, width, height);
        if (currentProgress > 0.003) {
            ctx.strokeStyle = cachedColor;
            ctx.lineWidth = 1;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.globalAlpha = 0.48;
            activeFocalPoints.forEach(function (fp) {
                fp.lines.forEach(function (line) {
                    var revealLen = currentProgress * line.length * 1.02;
                    ctx.setLineDash([revealLen, 1e6]);
                    ctx.stroke(line.path);
                });
            });
            ctx.setLineDash([]);
            ctx.globalAlpha = 1;
        }

        if (currentProgress !== targetProgress) {
            rafId = requestAnimationFrame(renderCanvas);
        } else {
            rafId = null;
        }
    }

    function requestCanvasRender() {
        if (ctx && !rafId) rafId = requestAnimationFrame(renderCanvas);
    }

    function syncScrollState() {
        var scrollTop = window.scrollY || document.documentElement.scrollTop;
        var maxScroll = document.documentElement.scrollHeight - window.innerHeight;
        var rawRatio = maxScroll > 0 ? Math.min(1, Math.max(0, scrollTop / maxScroll)) : 0;

        if (progress) progress.style.width = (rawRatio * 100) + '%';

        if (parallaxFrame && !prefersReducedMotion) {
            var offset = Math.max(-14, Math.min(14, (scrollTop - parallaxFrame.offsetTop) * 0.035));
            portrait.style.setProperty('--image-shift', offset + 'px');
        }

        if (header) {
            if (!isGlass && scrollTop > ENTER_GLASS) {
                isGlass = true;
                header.classList.add('is-glass');
            } else if (isGlass && scrollTop < EXIT_GLASS) {
                isGlass = false;
                header.classList.remove('is-glass');
            }
        }

        updateActiveNav();

        targetProgress = rawRatio;
        requestCanvasRender();
        scrollTicking = false;
    }

    function onScroll() {
        if (!scrollTicking) {
            scrollTicking = true;
            requestAnimationFrame(syncScrollState);
        }
    }

    window.addEventListener('resize', function () {
        resize();
        syncScrollState();
    });
    window.addEventListener('scroll', onScroll, { passive: true });
    if (toggler) {
        toggler.addEventListener('change', function () {
            readColor();
            requestCanvasRender();
        });
    }

    readColor();
    resize();
    syncScrollState();
    currentProgress = targetProgress;
    requestCanvasRender();
})();