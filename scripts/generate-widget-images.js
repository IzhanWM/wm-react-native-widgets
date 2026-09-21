/**
 * Generates the marketplace images for the UI widgets:
 *
 *   wmx/<widget>/assets/images/thumbnail.png   1536x1024, widget inside a window mockup
 *   wmx/<widget>/assets/images/<variant>.png   raw variant shots for the carousel
 *
 * Every image is rendered by the real Expo web bundle (no emulator, no manual cropping) and captured
 * with Playwright. The thumbnail frame is drawn in the page itself, so no image library is needed.
 *
 * Usage:
 *   1. cd expo-app && npx expo start --web        # leave running on :8081
 *   2. node scripts/generate-widget-images.js [widget ...]
 *
 * Needs playwright-core and a local Google Chrome (npm i -D playwright-core).
 */

const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright-core');

const HOST = process.env.EXPO_WEB_HOST || 'http://localhost:8081';
const OUT_ROOT = path.join(__dirname, '..', 'wmx');

// Phone-sized capture viewport: the widgets are laid out for mobile, and the demo routes
// leave large empty gutters at desktop widths.
const CAPTURE = { width: 440, height: 900 };
const THUMB = { width: 1536, height: 1024 };
const CONTENT = { x: 12, width: 416 }; // horizontal band the demo sections occupy
const HEADER_HEIGHT = 64; // expo-router stack header, never part of an image

/**
 * Per widget:
 *   headings  - every section caption on the route, in order; carousel shots address them by text
 *               and the rect runs from one caption down to the next.
 *   thumbnail - { region, pad } for the framed 1536x1024 image.
 *   carousel  - raw variant shots: { name, heading | region, height?, act? }.
 *
 * region/heading rects are in CSS pixels of the 440x900 capture viewport. `act` runs an interaction
 * (drawing, dragging) before the shot is taken.
 */
const WIDGETS = [
  {
    dir: 'avatarstack',
    route: 'avatar-stack-widget',
    title: 'Avatar Stack',
    tint: '#eef2f8',
    ink: '#1f2a44',
    headings: [
      'Default — 4 visible, rest collapse to +N',
      'Large, wider overlap',
      'Compact, no status dots',
      'Initials fallback (no images)',
    ],
    // "Large, wider overlap" row, spanning the avatars and the +N overflow badge.
    thumbnail: { region: () => ({ x: 16, y: 243, width: 290, height: 78 }), pad: 0 },
    // One band width across the three rows, so the carousel images line up.
    carousel: [
      { name: 'default', heading: 'Default — 4 visible, rest collapse to +N', x: 12, width: 310, height: 56 },
      { name: 'large-overlap', heading: 'Large, wider overlap', x: 12, width: 310, height: 84 },
      { name: 'initials-fallback', heading: 'Initials fallback (no images)', x: 12, width: 310, height: 58 },
    ],
  },
  {
    dir: 'qrcode',
    route: 'qr-code-widget',
    title: 'QR Code',
    tint: '#eaf1fb',
    ink: '#1e3a8a',
    headings: ['Default', 'Branded colors, larger', 'High error correction (pairs with a logo)', 'Plain text'],
    thumbnail: { region: () => window.__thumb.largest('svg'), pad: 12 },
    // fit: crop to the symbol itself rather than the full-width section band.
    carousel: [
      { name: 'default', heading: 'Default', fit: 'svg' },
      { name: 'branded-colors', heading: 'Branded colors, larger', fit: 'svg' },
      { name: 'plain-text', heading: 'Plain text', height: 200, fit: 'svg' },
    ],
  },
  {
    dir: 'reorderlist',
    route: 'reorder-list-widget',
    title: 'Reorder List',
    tint: '#eef2f7',
    ink: '#243447',
    // Rows only — the demo's "Drag to reorder" caption band sits above them.
    thumbnail: { region: () => ({ x: 0, y: 113, width: 440, height: 336 }), pad: 0 },
    carousel: [
      { name: 'rows', region: { x: 0, y: 113, width: 440, height: 336 } },
      // Starts higher: the lifted row floats above its resting position.
      { name: 'dragging', region: { x: 0, y: 106, width: 440, height: 348 }, act: 'reorderDrag' },
      { name: 'reordered', region: { x: 0, y: 113, width: 440, height: 336 }, act: 'reorderDrop' },
    ],
  },
  {
    dir: 'segmentprogress',
    route: 'segment-progress-widget',
    title: 'Segment Progress',
    tint: '#ecf3ee',
    ink: '#14532d',
    headings: [
      'Summed total — the bar always fills',
      'Fixed total of 128 — remaining capacity stays visible',
      'Thin, square caps',
      'Wide gaps read as chips',
      'Palette fallback (rows carry no color)',
    ],
    // Three bar variants; starts below the first section so the "Tap a segment." caption is left out.
    thumbnail: { region: () => ({ x: 12, y: 196, width: 416, height: 300 }), pad: 10 },
    // One fixed height across the three bars: uniform crops, and the first section's
    // "Tap a segment." caption stays out of frame.
    carousel: [
      { name: 'summed-total', heading: 'Summed total — the bar always fills', height: 34 },
      { name: 'fixed-total', heading: 'Fixed total of 128 — remaining capacity stays visible', height: 34 },
      { name: 'wide-gaps', heading: 'Wide gaps read as chips', height: 34 },
    ],
  },
  {
    dir: 'signaturepad',
    route: 'signature-pad-widget',
    title: 'Signature Pad',
    tint: '#eef1f8',
    ink: '#1e293b',
    // The pad starts blank — a signature is drawn before capture.
    thumbnail: { region: () => ({ x: 20, y: 112, width: 400, height: 240 }), pad: 0, act: 'sign' },
    carousel: [
      { name: 'empty-pad', region: { x: 12, y: 104, width: 416, height: 330 } },
      { name: 'signed', region: { x: 12, y: 104, width: 416, height: 330 }, act: 'sign' },
      { name: 'exported-png', region: { x: 12, y: 104, width: 416, height: 470 }, act: 'signAndRead' },
    ],
  },
  {
    dir: 'skiaeffect',
    route: 'skia-effect-widget',
    title: 'Skia Effect',
    tint: '#f0edf9',
    ink: '#3b2f63',
    headings: [
      'Screen blend on a dark ground',
      'Sunset palette, heavier blur',
      'Multiply on a light ground',
      'No blur — the underlying geometry',
    ],
    thumbnail: { region: () => ({ x: 90, y: 110, width: 260, height: 260 }), pad: 0 },
    carousel: [
      { name: 'screen-blend', heading: 'Screen blend on a dark ground' },
      { name: 'sunset-blur', heading: 'Sunset palette, heavier blur' },
      { name: 'no-blur', heading: 'No blur — the underlying geometry', height: 260 },
    ],
  },
  {
    dir: 'swipedeck',
    route: 'swipe-deck-widget',
    title: 'Swipe Deck',
    tint: '#eef3f6',
    ink: '#14303f',
    thumbnail: { region: () => ({ x: 62, y: 106, width: 316, height: 398 }), pad: 0 },
    carousel: [
      { name: 'deck', region: { x: 50, y: 100, width: 340, height: 410 } },
      // Full width: a tilted card and the demo's log line both run past the deck's own box.
      { name: 'dragging', region: { x: 0, y: 100, width: 440, height: 410 }, act: 'swipeHold' },
      { name: 'after-swipe', region: { x: 0, y: 100, width: 440, height: 445 }, act: 'swipeThrough' },
    ],
  },
];

// The demo screens sit on a light grey page background, which would show up as a visible band
// inside the white window frame. Repaint just that shade white so the capture blends in.
const WHITEN_PAGE_BACKGROUND = () => {
  const GREY = 'rgb(245, 245, 245)';
  document.body.style.background = '#ffffff';
  for (const el of document.querySelectorAll('*')) {
    if (getComputedStyle(el).backgroundColor === GREY) el.style.backgroundColor = '#ffffff';
  }
};

// Injected before regions are resolved.
const REGION_HELPERS = (content) => {
  const rectOf = (el) => {
    const r = el.getBoundingClientRect();
    return { x: r.x, y: r.y, width: r.width, height: r.height };
  };
  const visible = (sel) =>
    Array.from(document.querySelectorAll(sel))
      .map(rectOf)
      .filter((r) => r.width > 8 && r.height > 8 && r.y > 64);

  // React Native Web renders <Text> as a leaf div, so the caption is the deepest node holding it.
  const headingRect = (text) => {
    const hit = Array.from(document.querySelectorAll('div, span, p')).find(
      (el) =>
        el.textContent.trim() === text &&
        !Array.from(el.children).some((c) => c.textContent.trim() === text)
    );
    return hit ? rectOf(hit) : null;
  };

  const scrollableAncestor = (el) => {
    for (let n = el; n; n = n.parentElement) {
      if (n.scrollHeight > n.clientHeight + 4 && /auto|scroll/.test(getComputedStyle(n).overflowY)) return n;
    }
    return null;
  };

  window.__thumb = {
    rectOf,
    // Largest element matching `sel` whose centre falls inside `within`, padded outwards.
    fit: (sel, within, pad) => {
      const hit = Array.from(document.querySelectorAll(sel))
        .map(rectOf)
        .filter((r) => {
          const cx = r.x + r.width / 2;
          const cy = r.y + r.height / 2;
          return cx >= within.x && cx <= within.x + within.width &&
                 cy >= within.y && cy <= within.y + within.height;
        })
        .sort((a, b) => b.width * b.height - a.width * a.height)[0];
      if (!hit) return null;
      return { x: hit.x - pad, y: hit.y - pad, width: hit.width + pad * 2, height: hit.height + pad * 2 };
    },
    largest: (sel) => visible(sel).sort((a, b) => b.width * b.height - a.width * a.height)[0],
    // Scrolls a caption that sits below the fold up to a fixed offset, so its section can be clipped.
    reveal: (text) => {
      const hit = Array.from(document.querySelectorAll('div, span, p')).find(
        (el) =>
          el.textContent.trim() === text &&
          !Array.from(el.children).some((c) => c.textContent.trim() === text)
      );
      if (!hit) return false;
      const scroller = scrollableAncestor(hit);
      if (!scroller) return false;
      scroller.scrollTop += rectOf(hit).y - 100;
      return true;
    },
    // The rect below one caption, running down to the next one.
    section: (text, headings) => {
      const rect = headingRect(text);
      if (!rect) return null;
      const following = headings
        .map(headingRect)
        .filter((r) => r && r.y > rect.y + 4)
        .sort((a, b) => a.y - b.y)[0];
      const top = rect.y + rect.height + 8;
      const bottom = following ? following.y - 14 : top + 260;
      return { x: content.x, y: top, width: content.width, height: bottom - top };
    },
  };
};

// A handwritten-looking signature: chains of cubic Béziers in pad-relative coordinates (0-1),
// sampled into points so the strokes curve instead of reading as a zigzag.
const SIGNATURE_CURVES = [
  // Looping capital.
  [[0.07, 0.80], [0.01, 0.42], [0.15, 0.14], [0.17, 0.38],
   [0.19, 0.60], [0.12, 0.72], [0.15, 0.78], [0.22, 0.66],
   [0.28, 0.54], [0.24, 0.24], [0.31, 0.30]],
  // Cursive body.
  [[0.31, 0.58], [0.35, 0.28], [0.40, 0.82], [0.44, 0.56],
   [0.48, 0.34], [0.52, 0.78], [0.57, 0.52],
   [0.61, 0.30], [0.66, 0.80], [0.71, 0.54],
   [0.76, 0.36], [0.82, 0.62], [0.88, 0.44]],
  // Underline flourish.
  [[0.24, 0.88], [0.44, 0.96], [0.66, 0.74], [0.86, 0.84]],
];

const sampleCurves = (chain, perSegment = 16) => {
  const pts = [];
  for (let i = 0; i + 3 < chain.length; i += 3) {
    const [p0, p1, p2, p3] = chain.slice(i, i + 4);
    for (let s = i === 0 ? 0 : 1; s <= perSegment; s++) {
      const t = s / perSegment;
      const u = 1 - t;
      pts.push([
        u * u * u * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t * t * t * p3[0],
        u * u * u * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t * t * t * p3[1],
      ]);
    }
  }
  return pts;
};

const SIGNATURE_STROKES = SIGNATURE_CURVES.map((chain) => sampleCurves(chain));

const PAD = { x: 20, y: 112, width: 400, height: 240 };
const DECK_CARD = { x: 220, y: 300 }; // a point on the top card
const LIST_ROW = { x: 220, y: 200 }; // third row of the reorder list

const sign = async (page) => {
  for (const stroke of SIGNATURE_STROKES) {
    const [sx, sy] = stroke[0];
    await page.mouse.move(PAD.x + sx * PAD.width, PAD.y + sy * PAD.height);
    await page.mouse.down();
    for (const [px, py] of stroke.slice(1)) {
      await page.mouse.move(PAD.x + px * PAD.width, PAD.y + py * PAD.height, { steps: 3 });
    }
    await page.mouse.up();
    await page.waitForTimeout(120);
  }
  await page.waitForTimeout(250);
};

const drag = async (page, from, dx, dy, { hold = 0, release = true, steps = 24 } = {}) => {
  await page.mouse.move(from.x, from.y);
  await page.mouse.down();
  if (hold) await page.waitForTimeout(hold); // let a long-press recogniser fire
  await page.mouse.move(from.x + dx, from.y + dy, { steps });
  await page.waitForTimeout(400);
  if (release) {
    await page.mouse.up();
    await page.waitForTimeout(700); // settle animation
  }
};

const ACTS = {
  sign,
  signAndRead: async (page) => {
    await sign(page);
    await page.getByText('Read', { exact: true }).click();
    await page.waitForTimeout(600);
  },
  // Card held past the threshold, still under the pointer.
  swipeHold: (page) => drag(page, DECK_CARD, 120, -28, { release: false }),
  // Card thrown right, so the next card and the demo's log line show.
  swipeThrough: (page) => drag(page, DECK_CARD, 260, -40),
  // Row picked up (long-press) and lifted, still held.
  reorderDrag: (page) => drag(page, LIST_ROW, 0, -58, { hold: 700, release: false }),
  reorderDrop: (page) => drag(page, LIST_ROW, 0, -116, { hold: 700 }),
};

const frameHtml = (widget, dataUri) => `<!doctype html>
<html><head><meta charset="utf-8"><style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body { width: ${THUMB.width}px; height: ${THUMB.height}px; }
  body {
    background: ${widget.tint};
    display: flex; align-items: center; justify-content: center;
    font-family: 'Avenir Next', 'Optima', 'Palatino', Georgia, serif;
  }
  .window {
    width: 1256px; height: 800px;
    background: #ffffff;
    border-radius: 34px;
    box-shadow: 0 32px 80px -24px rgba(15, 32, 52, .28), 0 4px 16px rgba(15, 32, 52, .06);
    display: flex; flex-direction: column;
    overflow: hidden;
  }
  .chrome { display: flex; gap: 12px; padding: 30px 0 0 36px; }
  .dot { width: 17px; height: 17px; border-radius: 50%; }
  h1 {
    text-align: center;
    font-size: 40px; font-weight: 600; letter-spacing: -.01em;
    color: ${widget.ink};
    margin: 18px 0 0;
  }
  /* height:0 + flex-grow gives the stage a definite height, so the capture scales to fit
     instead of overflowing the window and getting clipped. */
  .stage { flex: 1 1 0; height: 0; display: flex; align-items: center; justify-content: center; padding: 34px 64px 54px; }
  img { width: 100%; height: 100%; object-fit: contain; }
</style></head>
<body>
  <div class="window">
    <div class="chrome">
      <span class="dot" style="background:#ff5f57"></span>
      <span class="dot" style="background:#febc2e"></span>
      <span class="dot" style="background:#28c840"></span>
    </div>
    <h1>${widget.title}</h1>
    <div class="stage"><img src="${dataUri}"></div>
  </div>
</body></html>`;

const imagePath = (widget, name) =>
  path.join(OUT_ROOT, widget.dir, 'assets', 'images', `${name}.png`);

const writeShot = (file, buffer) => {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, buffer);
  console.log(`  ✓ ${path.relative(process.cwd(), file)}`);
};

/** Fresh page state per shot: interactions are one-way (a swiped card does not come back). */
async function loadRoute(page, widget) {
  await page.goto(`${HOST}/${widget.route}`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2200); // images, gradients and entry animations settle
  await page.evaluate(WHITEN_PAGE_BACKGROUND);
  await page.evaluate(REGION_HELPERS, CONTENT);
}

async function resolveRegion(page, widget, shot) {
  if (shot.region) return typeof shot.region === 'function' ? page.evaluate(shot.region) : shot.region;
  await page.evaluate((heading) => window.__thumb.reveal(heading), shot.heading);
  await page.waitForTimeout(250); // scroll settle
  const rect = await page.evaluate(
    ([heading, headings]) => window.__thumb.section(heading, headings),
    [shot.heading, widget.headings || []]
  );
  if (!rect) throw new Error(`${widget.dir}: section "${shot.heading}" not found`);

  const box = {
    ...rect,
    ...(shot.x !== undefined ? { x: shot.x } : {}),
    ...(shot.width !== undefined ? { width: shot.width } : {}),
    ...(shot.height !== undefined ? { height: shot.height } : {}),
  };
  if (!shot.fit) return box;

  const fitted = await page.evaluate(
    ([sel, within, pad]) => window.__thumb.fit(sel, within, pad),
    [shot.fit, box, shot.fitPad ?? 14]
  );
  if (!fitted) throw new Error(`${widget.dir}: no "${shot.fit}" inside section "${shot.heading}"`);

  // Keep the padded rect inside the section, so the caption above never bleeds in.
  const top = Math.max(fitted.y, box.y);
  const bottom = Math.min(fitted.y + fitted.height, box.y + box.height);
  return { ...fitted, y: top, height: bottom - top };
}

const clamp = (rect, pad = 0) => {
  const x = Math.max(0, rect.x - pad);
  const y = Math.max(HEADER_HEIGHT, rect.y - pad);
  return {
    x,
    y,
    width: Math.min(rect.width + pad * 2, CAPTURE.width - x),
    height: Math.min(rect.height + pad * 2, CAPTURE.height - y),
  };
};

async function main() {
  const only = process.argv.slice(2);
  const widgets = only.length ? WIDGETS.filter((w) => only.includes(w.dir)) : WIDGETS;
  if (!widgets.length) {
    console.error(`No widget matched. Known: ${WIDGETS.map((w) => w.dir).join(', ')}`);
    process.exit(1);
  }

  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const capturePage = await browser.newPage({ viewport: CAPTURE, deviceScaleFactor: 3 });
  const carouselPage = await browser.newPage({ viewport: CAPTURE, deviceScaleFactor: 2 });
  const framePage = await browser.newPage({ viewport: THUMB, deviceScaleFactor: 1 });

  for (const widget of widgets) {
    console.log(widget.dir);

    // Thumbnail: capture, then composite into the window frame.
    await loadRoute(capturePage, widget);
    if (widget.thumbnail.act) await ACTS[widget.thumbnail.act](capturePage);
    const region = await resolveRegion(capturePage, widget, widget.thumbnail);
    const shot = await capturePage.screenshot({ clip: clamp(region, widget.thumbnail.pad), type: 'png' });
    await framePage.setContent(frameHtml(widget, `data:image/png;base64,${shot.toString('base64')}`), {
      waitUntil: 'load',
    });
    await framePage.waitForTimeout(150);
    writeShot(imagePath(widget, 'thumbnail'), await framePage.screenshot({ type: 'png' }));

    // Carousel: one raw shot per variant or interaction state.
    for (const entry of widget.carousel) {
      await loadRoute(carouselPage, widget);
      if (entry.act) await ACTS[entry.act](carouselPage);
      const rect = await resolveRegion(carouselPage, widget, entry);
      writeShot(
        imagePath(widget, entry.name),
        await carouselPage.screenshot({ clip: clamp(rect), type: 'png' })
      );
      if (entry.act && !entry.act.startsWith('sign')) await carouselPage.mouse.up().catch(() => {});
    }
  }

  await browser.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
