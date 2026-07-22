// sidebar.js
document.addEventListener('DOMContentLoaded', () => {
  const toggleButton = document.getElementById('nav-toggle');
  const sideNav = document.getElementById('side-navbar');
  const ameWindow = document.getElementById('ame-window');
  const lastfmWindow = document.getElementById('lastfm-window');
  const tipWindow = document.getElementById('tip-window');
  const mainWindow = document.getElementById('container');

  if (toggleButton && sideNav) {
    toggleButton.addEventListener('click', () => {
      sideNav.classList.toggle('open');
    });
  }

  if (!sideNav || !mainWindow) return;

  const GAP = 24; // space kept between the main window and the docked navbar
  const EDGE_MARGIN = 16; // space kept between a docked window and the screen edge
  const AME_MIN_WIDTH = 208; // never shrink smaller than this
  const AME_MAX_WIDTH = 700; // ame_gif.gif is 693x453 natively - beyond this it's just upscaled and blurry
  const LASTFM_GAP = 16; // space kept between ame-window and lastfm-window below it
  const NAV_MIN_WIDTH = 140; // never shrink smaller than this
  const NAV_MAX_WIDTH = 260; // never grow wider than this - it's just a short link list
  const TIP_GAP = 16; // space kept between tip-window and nav.exe below it

  const updateNavLayout = () => {
    const containerRect = mainWindow.getBoundingClientRect();
    // Dock GAP away from the main window's own edge, not pinned to the outer
    // screen edge - on a wide monitor the container is centered with a capped
    // max-width, so anchoring to the viewport edge instead left these windows
    // stranded far from the actual content. Hovering near the main section is
    // the intent on both sides.
    const rightGutter = window.innerWidth - containerRect.right - GAP - EDGE_MARGIN;
    const fits = rightGutter >= NAV_MIN_WIDTH;

    // Once the window-manager script (windows.js) has let the user drag this
    // element, it owns position/size from then on - don't snap it back on resize.
    if (!sideNav.classList.contains('win-user-positioned')) {
      if (fits) {
        // Variable width now, filling the actual right gutter (capped),
        // instead of just sizing to its own short link list.
        const navWidth = Math.min(NAV_MAX_WIDTH, Math.max(NAV_MIN_WIDTH, rightGutter));
        sideNav.style.width = `${navWidth}px`;
        sideNav.style.left = `${containerRect.right + GAP}px`;
        sideNav.style.right = 'auto';
        document.body.classList.remove('nav-collapsed');
        sideNav.classList.remove('open');

        // tip.txt shares nav.exe's width so it can dock flush above it - set
        // this before measuring tip's height below, since its wrap/height
        // depends on the width it's actually rendered at.
        const tipStacked = tipWindow && !tipWindow.classList.contains('win-user-positioned');
        if (tipStacked) {
          tipWindow.style.width = `${navWidth}px`;
          tipWindow.style.left = `${containerRect.right + GAP}px`;
          tipWindow.style.right = 'auto';
          tipWindow.style.display = '';
        }

        // Vertical position: default to vertical-center (mirrors the old
        // static top:50%/translateY(-50%) rule), but on a shorter screen
        // shift up as needed so the tip.txt+nav.exe stack still fits above
        // the taskbar - never higher than welcome.txt's own top, same rule
        // as ame.gif/lastfm.exe on the left.
        const taskbarEl = document.getElementById('window-taskbar');
        const taskbarHeight = taskbarEl ? taskbarEl.getBoundingClientRect().height : 0;
        const navHeight = sideNav.offsetHeight;
        const tipHeight = tipStacked ? tipWindow.offsetHeight : 0;
        const defaultNavTop = (window.innerHeight - navHeight) / 2;
        const bottomLimit = window.innerHeight - taskbarHeight - EDGE_MARGIN;
        const neededTop = bottomLimit - navHeight;
        const minNavTop = containerRect.top + (tipStacked ? TIP_GAP + tipHeight : 0);
        const navTop = Math.max(minNavTop, Math.min(defaultNavTop, neededTop));
        sideNav.style.top = `${navTop}px`;
        sideNav.style.transform = 'none';

        if (tipStacked) {
          tipWindow.style.top = `${navTop - tipHeight - TIP_GAP}px`;
        }
      } else {
        sideNav.style.width = '';
        sideNav.style.left = '';
        sideNav.style.right = '';
        sideNav.style.top = '';
        sideNav.style.transform = '';
        document.body.classList.add('nav-collapsed');

        if (tipWindow && !tipWindow.classList.contains('win-user-positioned')) {
          tipWindow.style.display = 'none';
        }
      }
    }

    // Below the "fits" width, ame.gif/lastfm.exe switch to a CSS-driven mobile
    // layout (see the max-width:1000px block in kangel.css) instead of docking
    // beside the main window - clear any inline styles from a wider viewport
    // so they don't linger and override that CSS after a resize.
    if (ameWindow && !ameWindow.classList.contains('win-user-positioned')) {
      if (fits) {
        // Fill the actual gutter to the left of the main window, not a guess,
        // but capped at AME_MAX_WIDTH - once that cap kicks in on a really
        // wide monitor, dock it GAP away from the container's left edge
        // instead of leaving it pinned out at the screen's edge.
        const leftGutter = containerRect.left - EDGE_MARGIN - GAP;
        const ameWidth = Math.min(AME_MAX_WIDTH, Math.max(AME_MIN_WIDTH, leftGutter));
        ameWindow.style.width = `${ameWidth}px`;
        ameWindow.style.left = `${containerRect.left - GAP - ameWidth}px`;

        // Vertical position: default to 15% down the viewport (the original
        // static value), but on a shorter screen (e.g. 1920x1080), shift up
        // as needed so the ame.gif+lastfm.exe stack actually fits above the
        // taskbar instead of overflowing - never higher than welcome.txt's
        // own top, though.
        const taskbarEl = document.getElementById('window-taskbar');
        const taskbarHeight = taskbarEl ? taskbarEl.getBoundingClientRect().height : 0;
        const defaultTop = window.innerHeight * 0.15;
        // offsetHeight reflects the width we just set (ame.gif keeps its
        // aspect ratio), and is unaffected by the float-ame bob animation's
        // transform, unlike getBoundingClientRect().
        const ameHeight = ameWindow.offsetHeight;
        const lastfmHeight = lastfmWindow ? lastfmWindow.offsetHeight : 0;
        const stackHeight = ameHeight + (lastfmWindow ? LASTFM_GAP + lastfmHeight : 0);
        const bottomLimit = window.innerHeight - taskbarHeight - EDGE_MARGIN;
        const neededTop = bottomLimit - stackHeight;
        const ameTop = Math.max(containerRect.top, Math.min(defaultTop, neededTop));
        ameWindow.style.top = `${ameTop}px`;
      } else {
        ameWindow.style.width = '';
        ameWindow.style.left = '';
        ameWindow.style.top = '';
      }
    }

    if (lastfmWindow && ameWindow && !lastfmWindow.classList.contains('win-user-positioned')) {
      if (fits) {
        // ame-window bobs via a continuous transform animation, so its live
        // getBoundingClientRect() top/bottom reflect whatever phase that
        // animation happens to be in right now, not its rest position - use
        // the rest-position top we just set plus offsetHeight instead (the
        // transform is Y-only, so left/width from the live rect are safe).
        const ameRect = ameWindow.getBoundingClientRect();
        const ameBottom = parseFloat(ameWindow.style.top) + ameWindow.offsetHeight;
        lastfmWindow.style.width = `${ameRect.width}px`;
        lastfmWindow.style.left = `${ameRect.left}px`;
        lastfmWindow.style.top = `${ameBottom + LASTFM_GAP}px`;
      } else {
        lastfmWindow.style.width = '';
        lastfmWindow.style.left = '';
        lastfmWindow.style.top = '';
      }
    }
  };

  updateNavLayout();

  // The custom pixel font (zpix, @font-face) can finish loading after this
  // first run, changing tip-window/ame-window's text metrics and therefore
  // their measured height/width after the fact - nothing else re-triggers
  // this positioning pass, so a resize-only listener would miss it (same
  // class of bug already fixed for the taskbar in windows.js).
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(updateNavLayout);
  }

  // ame.gif's vertical position now depends on the taskbar's real height and
  // lastfm.exe's real (post-fetch) height, but this script (sidebar.js) runs
  // and builds its own layout independently of windows.js (which builds the
  // taskbar) and lastfm.js (which fetches the track list asynchronously) -
  // both dispatch a custom event once they're actually done, so this can
  // re-run with accurate numbers instead of whatever was true at this exact
  // instant (same class of bug as the font-loading race above).
  window.addEventListener('taskbar:ready', updateNavLayout);
  window.addEventListener('lastfm:loaded', updateNavLayout);

  let resizeFrame;
  window.addEventListener('resize', () => {
    cancelAnimationFrame(resizeFrame);
    resizeFrame = requestAnimationFrame(updateNavLayout);
  });
});
