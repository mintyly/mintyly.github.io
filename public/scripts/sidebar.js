// sidebar.js
document.addEventListener('DOMContentLoaded', () => {
  const toggleButton = document.getElementById('nav-toggle');
  const sideNav = document.getElementById('side-navbar');
  const ameWindow = document.getElementById('ame-window');
  const lastfmWindow = document.getElementById('lastfm-window');
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

  const updateNavLayout = () => {
    const containerRect = mainWindow.getBoundingClientRect();
    const navWidth = sideNav.getBoundingClientRect().width;
    // Dock GAP away from the main window's own edge, not pinned to the outer
    // screen edge - on a wide monitor the container is centered with a capped
    // max-width, so anchoring to the viewport edge instead left these windows
    // stranded far from the actual content. Hovering near the main section is
    // the intent on both sides.
    const desiredNavLeft = containerRect.right + GAP;
    const fits = desiredNavLeft + navWidth + EDGE_MARGIN <= window.innerWidth;

    // Once the window-manager script (windows.js) has let the user drag this
    // element, it owns position/size from then on - don't snap it back on resize.
    if (!sideNav.classList.contains('win-user-positioned')) {
      if (fits) {
        sideNav.style.left = `${desiredNavLeft}px`;
        sideNav.style.right = 'auto';
        document.body.classList.remove('nav-collapsed');
        sideNav.classList.remove('open');
      } else {
        sideNav.style.left = '';
        sideNav.style.right = '';
        document.body.classList.add('nav-collapsed');
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
        const availableGutter = containerRect.left - EDGE_MARGIN - GAP;
        const ameWidth = Math.min(AME_MAX_WIDTH, Math.max(AME_MIN_WIDTH, availableGutter));
        ameWindow.style.width = `${ameWidth}px`;
        ameWindow.style.left = `${containerRect.left - GAP - ameWidth}px`;
      } else {
        ameWindow.style.width = '';
        ameWindow.style.left = '';
      }
    }

    if (lastfmWindow && ameWindow && !lastfmWindow.classList.contains('win-user-positioned')) {
      if (fits) {
        // Dock directly beneath ame-window, matching its (just-updated) width and left edge.
        const ameRect = ameWindow.getBoundingClientRect();
        lastfmWindow.style.width = `${ameRect.width}px`;
        lastfmWindow.style.left = `${ameRect.left}px`;
        lastfmWindow.style.top = `${ameRect.bottom + LASTFM_GAP}px`;
      } else {
        lastfmWindow.style.width = '';
        lastfmWindow.style.left = '';
        lastfmWindow.style.top = '';
      }
    }
  };

  updateNavLayout();

  let resizeFrame;
  window.addEventListener('resize', () => {
    cancelAnimationFrame(resizeFrame);
    resizeFrame = requestAnimationFrame(updateNavLayout);
  });
});
