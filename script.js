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
    favicon.href = "images/mk_beige.svg";
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

(function () {
  var header = document.querySelector('.site-header');
  if (!header) return;

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var ENTER = 40;
  var EXIT = 12;
  var isGlass = false;
  var ticking = false;

  function applyScrollState() {
    var y = window.scrollY;
    if (!isGlass && y > ENTER) {
      isGlass = true;
      header.classList.add('is-glass');
    } else if (isGlass && y < EXIT) {
      isGlass = false;
      header.classList.remove('is-glass');
    }
    ticking = false;
  }

  function onScroll() {
    if (!ticking) {
      window.requestAnimationFrame(applyScrollState);
      ticking = true;
    }
  }

  applyScrollState();
  window.addEventListener('scroll', onScroll, { passive: true });

  if (!reduceMotion && window.matchMedia('(hover: hover)').matches) {
    header.addEventListener('pointermove', function (e) {
      var rect = header.getBoundingClientRect();
      var cx = rect.left + rect.width / 2;
      var cy = rect.top + rect.height / 2;
      var dx = e.clientX - cx;
      var dy = e.clientY - cy;
      // 0deg = up, increasing clockwise, matching CSS conic-gradient's convention.
      var angle = (Math.atan2(dx, -dy) * 180 / Math.PI + 360) % 360;
      header.style.setProperty('--rim-angle', angle + 'deg');
      header.classList.add('pointer-active');
    });
    header.addEventListener('pointerleave', function () {
      header.classList.remove('pointer-active');
    });
  }
})();


/* ---------------------------------------------------------------------
 * Zen garden scroll background
 *
 * Four rocks (2 circles, 2 rounded squares) sit near the corners of the
 * viewport. Each rock has a bundle of 8 lines that make one full loop
 * around it, then leave together as a single flowing, S-curved rake
 * stroke that winds its way across the empty space toward the next
 * rock in the cycle:
 *
 *   TL circle -> TR square -> BR circle -> BL square -> (back to TL)
 *
 * Every line in a bundle leaves the ring TANGENT to it (not radially),
 * so the 8 strokes stay parallel — offset from each other by a fixed
 * perpendicular distance — all the way through the curve. The tail is
 * built as a chain of cubic Bezier segments with the tangent locked at
 * every waypoint (Hermite-style), and the very first tangent is forced
 * to equal the ring's own exit tangent exactly — so there is no seam,
 * no backward "phantom point" hack, and no kink or self-crossing where
 * the tail leaves the ring. Waypoints stay well inside the viewport, so
 * no stroke ever originates from or reaches the edge of the screen.
 *
 * Two things keep the parallel strokes in a bundle from ever crossing
 * each other, at any window size:
 *   1. The two circle rocks (top-left / bottom-right) get a landscape
 *      path and a portrait path (mirror images of one another), and the
 *      one matching the current width/height ratio is used — a path
 *      tuned for a wide window would otherwise get badly squashed in a
 *      tall one, tightening its curves enough to cross.
 *   2. The bundle's own width is tapered down a little in two situations
 *      where a fixed waypoint path has less room to work with: right
 *      around a square window (neither orientation has an elongated axis
 *      to lean on), and at very elongated windows such as 32:9 ultrawide
 *      monitors (one axis is short enough to compress the path). Either
 *      way, a narrower bundle is enough on its own to keep every curve's
 *      radius safely bigger than half the bundle's width.
 * Both were tuned by measuring the actual radius of curvature of the
 * generated paths against the bundle's width across dozens of window
 * sizes and aspect ratios, rather than by eye.
 *
 * Growth is a shared "revealed length" per line (in pixels), applied
 * via a dash-array on each line's own Path2D, scaled by that line's
 * own path length — so every line, and every rock, finishes growing
 * at exactly the same scroll progress, and the whole thing rewinds
 * identically when scrolling back up.
 * ------------------------------------------------------------------- */
(function () {
  var canvas = document.getElementById('zenGarden');
  if (!canvas || !canvas.getContext) return;
  var ctx = canvas.getContext('2d');
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var dpr = Math.min(window.devicePixelRatio || 1, 2);
  var width = 0, height = 0;
  var targetProgress = 0;
  var currentProgress = 0;
  var rafId = null;
  var cachedColor = '#004225';

  var LINE_COUNT = 8;
  var MID_OFFSET = (LINE_COUNT - 1) / 2; // 3.5
  var RING_SAMPLES = 90;   // samples around one full circle loop
  var SEG_SAMPLES = 30;    // samples per tail Bezier segment
  // Ring radius/spacing scale with viewport size so the rings never grow
  // large enough, relative to a short viewport, to reach past the top or
  // bottom edge; an aspect-ratio-driven taper (computed in resize()) also
  // narrows the bundle near square and very elongated windows — see the
  // block comment above.
  var R_MIN = 26, SPACING = 14, R_MID = R_MIN + MID_OFFSET * SPACING;

  // ---- small vector helpers ----
  function normalize(v) { var m = Math.hypot(v.x, v.y) || 1; return { x: v.x / m, y: v.y / m }; }
  function rotate90(v) { return { x: -v.y, y: v.x }; }
  function rotateVec(v, a) { var c = Math.cos(a), s = Math.sin(a); return { x: v.x * c - v.y * s, y: v.x * s + v.y * c }; }
  function add(a, b) { return { x: a.x + b.x, y: a.y + b.y }; }
  function sub(a, b) { return { x: a.x - b.x, y: a.y - b.y }; }
  function scale(a, s) { return { x: a.x * s, y: a.y * s }; }
  function dist(a, b) { return Math.hypot(a.x - b.x, a.y - b.y); }

  // Chain of cubic Bezier segments through [exitPoint, ...waypoints], with
  // the tangent at every joint chosen so the curve stays smooth (Hermite-
  // style, control points placed at 1/3 of each segment's length along the
  // local tangent). The tangent at the very first point is forced to equal
  // the ring's own exit tangent, so the tail continues the ring perfectly
  // instead of kinking or looping back on itself — this is what removes
  // the old self-crossing artifact right where the tail left the ring.
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

  // ---- unit rounded-square template (half-size 1), starts at top-mid, runs clockwise ----
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
  // The template is a closed loop: its last point duplicates its first, so
  // there are (length - 1) unique steps in one full trip around it.
  var SQUARE_LOOP_LEN = SQUARE_TEMPLATE.length - 1;
  // Index nearest the left-mid point (-1, 0): the one spot on the loop where
  // the boundary's tangent is exactly perpendicular to its radial direction,
  // so a tail leaving from here stays perfectly seamless with the rings.
  var SQUARE_EXIT_IDX = (function () {
    var best = 0, bestD = Infinity;
    SQUARE_TEMPLATE.forEach(function (p, i) {
      var d = (p.x + 1) * (p.x + 1) + p.y * p.y;
      if (d < bestD) { bestD = d; best = i; }
    });
    return best;
  })();
  // Template indices for one full loop, starting and ending at startIdx —
  // drawing them in order is a complete rotation around the shape.
  function squareLoopIndices(startIdx) {
    var out = [];
    for (var i = 0; i <= SQUARE_LOOP_LEN; i++) out.push((startIdx + i) % SQUARE_LOOP_LEN);
    return out;
  }

  // ---- the four rocks, positions as fractions of viewport size ----
  // Each feeds a tail toward the next rock in the cycle: TL -> TR -> BR -> BL -> TL.
  // exitAngleDeg/rotationDeg fix where each ring's gap sits (and so its exit
  // tangent); every ring is always drawn as one complete rotation. The two
  // square rocks look fine at any aspect ratio as-is, so they're shared
  // between the landscape and portrait configs below; the two circle rocks
  // get an orientation-specific (mirror-image) waypoint path.
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

  // Build the 8 parallel Path2D lines (+ each one's real length) for one rock.
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

    // Shared tail centerline (offset 0 = the middle line of the bundle)
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
    // The finite-difference estimate above is only approximately radial at
    // the very first sample; pin it to the exact analytic radial direction
    // so every offset line's tail starts exactly on its ring point, with no
    // sub-pixel seam mismatch between the ring and the tail.
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
    // Taper the bundle's width down for aspect ratios where the fixed
    // waypoint paths have less room to curve gently: right around a square
    // window (neither orientation has an elongated axis to work with), and
    // again at very elongated windows (e.g. 32:9 ultrawide monitors), where
    // one axis is so short that the paths get compressed. See the block
    // comment at the top of this file.
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

  function scrollProgress() {
    var scrollTop = window.scrollY || document.documentElement.scrollTop;
    var max = document.documentElement.scrollHeight - window.innerHeight;
    if (max <= 0) return 0;
    return Math.min(1, Math.max(0, scrollTop / max));
  }

  function render() {
    var ease = reduceMotion ? 1 : 0.09;
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
      rafId = requestAnimationFrame(render);
    } else {
      rafId = null;
    }
  }

  function requestRender() {
    if (!rafId) rafId = requestAnimationFrame(render);
  }

  function onScroll() {
    targetProgress = scrollProgress();
    requestRender();
  }

  window.addEventListener('resize', function () {
    resize();
    onScroll();
  });
  window.addEventListener('scroll', onScroll, { passive: true });
  toggler.addEventListener('change', function () {
    readColor();
    requestRender();
  });

  readColor();
  resize();
  targetProgress = scrollProgress();
  currentProgress = targetProgress;
  requestRender();
})();