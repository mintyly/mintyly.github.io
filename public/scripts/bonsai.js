// bonsai.js - plays the pink bonsai mosaic animation inside bonsai.exe.
//
// Adapted from the standalone boot.js: same frame data (window.FRAMES, from
// bonsai-frames.js) and the same block/hatch/dot painting, but:
//  - painted into a square canvas that fills the window's content box, and
//    re-fitted whenever that box changes size (sidebar.js resizes it);
//  - scaled to the art's own bounding box rather than the full 96-unit grid,
//    so the tree fills the window instead of floating in empty grid;
//  - drawn on the site's window background instead of the standalone page's
//    pink, so it matches the other windows' content areas.
document.addEventListener('DOMContentLoaded', () => {
  const cv = document.getElementById('bonsai-canvas');
  const D = window.FRAMES;
  if (!cv || !D) return;

  const cx = cv.getContext('2d');
  const FR = D.frames;
  const N = FR.length;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // The animation keeps its own palette (window.FRAMES.palette); only the
  // backdrop is the site's - the same off-white every other window's content
  // area uses (--window-background in kangel.css), so the tree sits on the
  // same ground as the rest of the UI instead of its standalone pink page.
  const pal = D.palette;
  const BG = '#f9eff9'; // --window-background
  const HATCH = 'rgba(120, 30, 70, 0.45)';
  // Dot colour depends on what the dot is actually sitting on. On the tree
  // they're the original white sparkle, which reads against the blossoms; off
  // it they're loose petals, and white would vanish into the pale window
  // background (the standalone page could use white everywhere because its
  // backdrop was mid-pink), so those get the original deep magenta and a
  // slightly bigger square.
  const U = D.unit;
  const DOT_ON = '#ffffff';
  const DOT_OFF = '#b23a72';
  const DOT_OFF_SCALE = 1.4;

  // Which grid cells the current frame's blocks cover, filled while drawing
  // them below. `stamp` is bumped every paint so the grid never needs
  // clearing - a cell counts as covered only if it holds the current stamp.
  const cover = new Int32Array(U * U);
  let stamp = 0;

  // Bounding box of every block across every frame (measured from the data:
  // x 14-83, y 26-91 of the 96 unit grid). Drifting petals reach further right
  // (x up to ~109) and are simply clipped by the canvas edge once they leave.
  let bx0 = Infinity, by0 = Infinity, bx1 = -Infinity, by1 = -Infinity;
  FR.forEach((fr) => {
    fr.r.forEach((b) => {
      bx0 = Math.min(bx0, b[0]);
      by0 = Math.min(by0, b[1]);
      bx1 = Math.max(bx1, b[0] + b[2]);
      by1 = Math.max(by1, b[1] + b[3]);
    });
  });
  const PAD = 2; // grid units of breathing room around the box
  const span = Math.max(bx1 - bx0, by1 - by0) + PAD * 2;

  let px, W, H, dpr, ox, oy, hatch;

  function fit() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    // CSS gives the canvas width:100% + aspect-ratio:1, so the box is already
    // laid out as a square by the time this runs (and sidebar.js can measure
    // the window's height before any JS has painted).
    W = cv.clientWidth;
    H = cv.clientHeight;
    px = Math.min(W, H) / span;
    ox = (W - (bx1 - bx0) * px) / 2 - bx0 * px;
    oy = (H - (by1 - by0) * px) / 2 - by0 * px;
    cv.width = W * dpr;
    cv.height = H * dpr;
    cx.setTransform(dpr, 0, 0, dpr, 0, 0);
    hatch = makeHatch();
  }

  // Fine halftone hatch, like the crosshatched blocks in the reference.
  function makeHatch() {
    const s = Math.max(3, Math.round(px * 0.5));
    const o = document.createElement('canvas');
    o.width = o.height = s;
    const g = o.getContext('2d');
    g.fillStyle = HATCH;
    g.fillRect(0, 0, 1, 1);
    g.fillRect(s >> 1, s >> 1, 1, 1);
    return cx.createPattern(o, 'repeat');
  }

  function paint(f) {
    const fr = FR[f];
    cx.fillStyle = BG;
    cx.fillRect(0, 0, W, H);
    stamp++;

    const r = fr.r;
    for (let i = 0; i < r.length; i++) {
      const b = r[i];
      const x = b[0], y = b[1], w = b[2], h = b[3];
      cx.globalAlpha = 0.82;
      cx.fillStyle = pal[b[4]];
      cx.fillRect(ox + x * px, oy + y * px, w * px + 0.5, h * px + 0.5);
      if (b[5]) {
        cx.globalAlpha = 1;
        cx.fillStyle = hatch;
        cx.fillRect(ox + x * px, oy + y * px, w * px + 0.5, h * px + 0.5);
      }
      const gx0 = Math.max(0, x);
      const gy0 = Math.max(0, y);
      const gx1 = Math.min(U, x + w);
      const gy1 = Math.min(U, y + h);
      for (let gy = gy0; gy < gy1; gy++) {
        const row = gy * U;
        for (let gx = gx0; gx < gx1; gx++) cover[row + gx] = stamp;
      }
    }

    // dots
    const d = fr.d;
    const s = Math.max(2, px * 0.42);
    cx.globalAlpha = 1;
    for (let j = 0; j < d.length; j += 2) {
      const dx = d[j], dy = d[j + 1];
      const gx = Math.floor(dx);
      const gy = Math.floor(dy);
      const onTree = gx >= 0 && gx < U && gy >= 0 && gy < U
        && cover[gy * U + gx] === stamp;
      cx.fillStyle = onTree ? DOT_ON : DOT_OFF;
      const ds = onTree ? s : s * DOT_OFF_SCALE;
      cx.fillRect(ox + dx * px - ds / 2, oy + dy * px - ds / 2, ds, ds);
    }
  }

  let frame = 0;
  let last = 0;
  const step = 1000 / D.fps;

  function loop(now) {
    if (now - last >= step) {
      last = now;
      paint(frame);
      frame = (frame + 1) % N;
    }
    requestAnimationFrame(loop);
  }

  fit();
  // The docked width changes with the viewport (sidebar.js resizes the
  // window), so refit off the canvas's own box rather than window resize.
  if (typeof ResizeObserver !== 'undefined') {
    new ResizeObserver(() => {
      fit();
      if (reduced) paint(0);
    }).observe(cv);
  } else {
    window.addEventListener('resize', fit);
  }

  if (reduced) {
    paint(0);
    return;
  }
  requestAnimationFrame(loop);
});
