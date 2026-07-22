// windows.js - drag, close, and taskbar behavior for .window elements
document.addEventListener('DOMContentLoaded', () => {
  const AUTO_OPEN_QUERY = '(max-width: 1000px)';
  let zTop = 1000;

  function findFrame(win) {
    const parent = win.parentElement;
    if (parent && (parent.id === 'side-navbar' || parent.id === 'ame-window' || parent.id === 'lastfm-window' || parent.id === 'tip-window')) {
      return { frame: parent, mode: 'fixed' };
    }
    const grandparent = parent && parent.parentElement;
    if (grandparent && grandparent.id === 'container') {
      return { frame: grandparent, mode: 'flow' };
    }
    return { frame: win, mode: 'flow' };
  }

  const items = Array.from(document.querySelectorAll('.window')).map((win) => {
    const { frame, mode } = findFrame(win);
    const titleEl = win.querySelector('.title-bar .title');
    return {
      win,
      frame,
      mode,
      titleBar: win.querySelector('.title-bar'),
      closeBtn: win.querySelector('.window-controls .btn.close'),
      title: titleEl ? titleEl.textContent.trim() : 'window',
      // Every #container-wrapped "main page" window (welcome/portfolio/ctf
      // blog/writing/individual posts/writeups - one per page) is pinned, plus
      // the navbar. ame.gif and lastfm.exe ('fixed' mode) stay closeable.
      pinned: mode === 'flow' || Boolean(win.closest('#side-navbar')),
    };
  });

  if (!items.length) return;

  function bringToFront(frame) {
    // nav.exe always sits on top of everything via its own static z-index
    // (kangel.css) - never let the shared counter touch it, or dragging it
    // would demote it below the taskbar/other windows once zTop catches up.
    if (frame.id === 'side-navbar') return;
    frame.style.zIndex = String(++zTop);
  }

  const CLOSE_ANIMATION_MS = 200;
  const OPEN_ANIMATION_MS = 200;

  function setOpen(item, open) {
    if (item.taskbarBtn) {
      item.taskbarBtn.classList.toggle('active', open);
    }

    if (open) {
      // Only pop in if it was actually closed - openAllForLowRes() calls this
      // on every window (including already-open ones) on first mobile load,
      // and those shouldn't suddenly animate for no visible reason.
      const wasClosed = item.frame.classList.contains('win-closed');
      item.frame.classList.remove('win-closing');
      item.frame.classList.remove('win-closed');
      if (wasClosed) {
        item.frame.classList.add('win-opening');
        window.setTimeout(() => {
          item.frame.classList.remove('win-opening');
        }, OPEN_ANIMATION_MS);
      }
      bringToFront(item.frame);
      return;
    }

    // Play a quick scale/fade close animation (macOS-ish) before actually
    // hiding it, instead of just vanishing instantly.
    item.frame.classList.add('win-closing');
    window.setTimeout(() => {
      item.frame.classList.remove('win-closing');
      item.frame.classList.add('win-closed');
    }, CLOSE_ANIMATION_MS);
  }

  function buildTaskbar() {
    const bar = document.createElement('div');
    bar.id = 'window-taskbar';

    const startLink = document.createElement('a');
    startLink.href = 'https://june.ong';
    startLink.className = 'taskbar-start-link';

    const startBtn = document.createElement('img');
    startBtn.src = '/assets/button_start_juneong.png';
    startBtn.alt = 'Start';
    startBtn.className = 'taskbar-start';
    startBtn.addEventListener('mousedown', () => {
      startBtn.src = '/assets/button_start_closed_juneong.png';
    });
    startBtn.addEventListener('mouseup', () => {
      startBtn.src = '/assets/button_start_juneong.png';
    });

    startLink.appendChild(startBtn);
    bar.appendChild(startLink);

    items.forEach((item) => {
      if (item.pinned) return; // never listed - can't be closed, so nothing to restore

      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'taskbar-btn active';
      if (item.frame.id === 'ame-window') {
        // ame.gif is dropped entirely in mobile view (kangel.css) - its
        // taskbar entry would otherwise be a dead button there.
        btn.classList.add('taskbar-btn-ame');
      }
      if (item.frame.id === 'tip-window') {
        // Same deal - tip.txt is desktop-only and dropped entirely on mobile.
        btn.classList.add('taskbar-btn-tip');
      }

      const icon = document.createElement('img');
      icon.src = '/assets/windowbase_icon.png';
      icon.alt = '';
      icon.className = 'taskbar-btn-icon';

      const label = document.createElement('span');
      label.className = 'taskbar-btn-label';
      label.textContent = item.title;

      btn.append(icon, label);
      btn.addEventListener('click', () => {
        setOpen(item, item.frame.classList.contains('win-closed'));
      });
      item.taskbarBtn = btn;
      bar.appendChild(btn);
    });

    // Clock and notice share one tray wrapper (margin-left:auto lives on the
    // wrapper, see kangel.css) so they're always a single bunched-together
    // group at the far right, in this fixed order, regardless of which of
    // the two is currently hidden - two independent auto-margins here would
    // each grab their own share of the free space and split the pair apart
    // instead of keeping them adjacent.
    const tray = document.createElement('div');
    tray.className = 'taskbar-tray';
    bar.appendChild(tray);

    // Clock/date, second-from-right (system-tray style) - reuses the same
    // "pressed-in" bevel .active already gives an open window's taskbar
    // button, just never toggled off, so it always reads as permanently
    // down. Unlike the notice, this is allowed to disappear under
    // updateTaskbarLayout()'s last-resort "still no space" stage.
    const clockBtn = document.createElement('div');
    clockBtn.className = 'taskbar-btn taskbar-clock active';
    tray.appendChild(clockBtn);

    // Always the rightmost element, and never hidden by the responsive
    // hide/shrink cascade in updateTaskbarLayout() - see kangel.css.
    const mobileNotice = document.createElement('span');
    mobileNotice.className = 'taskbar-btn taskbar-mobile-notice';
    mobileNotice.textContent = 'best viewed on desktop!';
    tray.appendChild(mobileNotice);

    const timeFormatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Singapore',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
    const dateFormatter = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Asia/Singapore',
      day: '2-digit',
      month: '2-digit',
      year: '2-digit',
    });
    function updateClock() {
      const now = new Date();
      clockBtn.textContent = `${timeFormatter.format(now)}  ${dateFormatter.format(now)}`;
    }
    updateClock();
    setInterval(updateClock, 1000);

    document.body.appendChild(bar);
  }

  function syncTaskbarButtonWidths() {
    const buttons = items.map((item) => item.taskbarBtn).filter(Boolean);
    if (!buttons.length) return;
    buttons.forEach((btn) => { btn.style.width = ''; });
    const maxWidth = Math.max(...buttons.map((btn) => btn.getBoundingClientRect().width));
    buttons.forEach((btn) => { btn.style.width = `${maxWidth}px`; });
  }

  function isTaskbarWrapped(bar) {
    const visible = Array.from(bar.children).filter((el) => getComputedStyle(el).display !== 'none');
    if (visible.length < 2) return false;
    const firstTop = visible[0].getBoundingClientRect().top;
    return visible.some((el) => Math.abs(el.getBoundingClientRect().top - firstTop) > 1);
  }

  // Too narrow for everything on one row: drop the clock first, then if it's
  // still wrapped drop the window buttons too (keep just the start button +
  // notice), then if even THAT still wraps, shrink what's left - the notice
  // is exempt from every stage here, it always stays.
  function updateTaskbarLayout() {
    const bar = document.getElementById('window-taskbar');
    if (!bar) return;
    bar.classList.remove('taskbar-hide-clock', 'taskbar-hide-windows', 'taskbar-shrink');

    if (isTaskbarWrapped(bar)) {
      bar.classList.add('taskbar-hide-clock');
    }
    if (isTaskbarWrapped(bar)) {
      bar.classList.add('taskbar-hide-windows');
    }
    if (isTaskbarWrapped(bar)) {
      bar.classList.add('taskbar-shrink');
    }
  }

  // #nav-toggle's CSS bottom offset was tuned for one specific taskbar height,
  // but that height has changed many times since (normal/hide-windows/shrink
  // states, plus repeated size tweaks) - a static value drifts out of sync and
  // ends up sitting on top of window content instead of just above the
  // taskbar. Measure the taskbar's actual current height instead of guessing.
  function updateNavTogglePosition() {
    const toggle = document.getElementById('nav-toggle');
    const bar = document.getElementById('window-taskbar');
    if (!toggle || !bar) return;
    const gap = 16;
    toggle.style.bottom = `${bar.getBoundingClientRect().height + gap}px`;
  }

  function makeDraggable(item) {
    const { frame, titleBar, mode } = item;
    if (!titleBar) return;
    let dragging = false;
    let startX = 0;
    let startY = 0;
    let startLeft = 0;
    let startTop = 0;

    titleBar.addEventListener('pointerdown', (e) => {
      if (e.target.closest('.window-controls')) return;

      if (!frame.classList.contains('win-user-positioned')) {
        const rect = frame.getBoundingClientRect();
        frame.classList.add('win-user-positioned');
        frame.style.transform = 'none';
        frame.style.right = 'auto';
        frame.style.margin = '0';
        frame.style.width = rect.width + 'px';
        if (mode === 'fixed') {
          frame.style.position = 'fixed';
          frame.style.left = rect.left + 'px';
          frame.style.top = rect.top + 'px';
        } else {
          frame.style.position = 'absolute';
          frame.style.left = rect.left + window.scrollX + 'px';
          frame.style.top = rect.top + window.scrollY + 'px';
        }
      }

      dragging = true;
      startX = e.clientX;
      startY = e.clientY;
      startLeft = parseFloat(frame.style.left);
      startTop = parseFloat(frame.style.top);
      titleBar.setPointerCapture(e.pointerId);
      titleBar.classList.add('dragging');
      bringToFront(frame);
      e.preventDefault();
    });

    titleBar.addEventListener('pointermove', (e) => {
      if (!dragging) return;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      const boundWidth = mode === 'fixed' ? window.innerWidth : document.documentElement.scrollWidth;
      const maxLeft = Math.max(0, boundWidth - frame.offsetWidth);
      const newLeft = Math.max(0, Math.min(startLeft + dx, maxLeft));

      // Never let a window's bottom edge end up under the taskbar - its
      // z-index (3000) always wins, so anything dragged behind it becomes
      // stuck/unreachable rather than just visually covered.
      const taskbar = document.getElementById('window-taskbar');
      const taskbarHeight = taskbar ? taskbar.getBoundingClientRect().height : 0;
      const viewportBottomLimit = mode === 'fixed'
        ? window.innerHeight - taskbarHeight
        : window.scrollY + window.innerHeight - taskbarHeight;
      const maxTop = Math.max(0, viewportBottomLimit - frame.offsetHeight);
      const newTop = Math.max(0, Math.min(startTop + dy, maxTop));

      frame.style.left = newLeft + 'px';
      frame.style.top = newTop + 'px';
    });

    function endDrag() {
      dragging = false;
      titleBar.classList.remove('dragging');
    }
    titleBar.addEventListener('pointerup', endDrag);
    titleBar.addEventListener('pointercancel', endDrag);

    frame.addEventListener('pointerdown', () => bringToFront(frame));
  }

  buildTaskbar();
  syncTaskbarButtonWidths();
  updateTaskbarLayout();
  updateNavTogglePosition();
  // sidebar.js positions ame.gif relative to the taskbar's real height, but
  // runs independently of this script - let it know the taskbar now actually
  // exists with its final layout, instead of it having to guess/re-poll.
  window.dispatchEvent(new CustomEvent('taskbar:ready'));

  // The taskbar's height can still change after this (e.g. the custom pixel
  // font finishing its async load and swapping in with different text
  // metrics, shifting button sizes) with nothing else to trigger a re-check -
  // react to the taskbar's actual size whenever it changes, for any reason,
  // instead of trying to guess every possible cause of a late layout shift.
  const taskbarEl = document.getElementById('window-taskbar');
  if (taskbarEl && typeof ResizeObserver !== 'undefined') {
    new ResizeObserver(() => updateNavTogglePosition()).observe(taskbarEl);
  }

  // Belt-and-suspenders: explicitly re-run everything once the custom font
  // (zpix, loaded via @font-face) actually finishes loading, instead of
  // relying solely on the ResizeObserver noticing the resulting size change.
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => {
      syncTaskbarButtonWidths();
      updateTaskbarLayout();
      updateNavTogglePosition();
    });
  }

  items.forEach((item) => {
    if (item.pinned) {
      // Can't be closed, so it shouldn't be movable either - it's an anchored
      // part of the page layout, not an app window. Marked with a class (not
      // just skipping makeDraggable) so kangel.css can drop the grab cursor too.
      item.win.classList.add('win-pinned');
    } else {
      makeDraggable(item);
    }
    if (item.closeBtn && !item.pinned) {
      item.closeBtn.addEventListener('click', () => setOpen(item, false));
    }
  });

  // Re-sync on resize too: the site's <1000px breakpoint bumps the root
  // font-size, which shifts every rem-based button width under our feet.
  // Widths must be resynced before checking for wrapping, or the check would
  // run against stale sizes from the previous viewport.
  let taskbarResizeFrame;
  window.addEventListener('resize', () => {
    cancelAnimationFrame(taskbarResizeFrame);
    taskbarResizeFrame = requestAnimationFrame(() => {
      syncTaskbarButtonWidths();
      updateTaskbarLayout();
      updateNavTogglePosition();
    });
  });

  const mql = window.matchMedia(AUTO_OPEN_QUERY);
  function openAllForLowRes() {
    items.forEach((item) => setOpen(item, true));
  }
  mql.addEventListener('change', (e) => {
    if (e.matches) openAllForLowRes();
  });
  if (mql.matches) openAllForLowRes();
});
