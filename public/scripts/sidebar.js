// sidebar.js
document.addEventListener('DOMContentLoaded', () => {
  const toggleButton = document.getElementById('nav-toggle');
  const sideNav = document.getElementById('side-navbar');
  const mainWindow = document.getElementById('container');

  if (toggleButton && sideNav) {
    toggleButton.addEventListener('click', () => {
      sideNav.classList.toggle('open');
    });
  }

  if (!sideNav || !mainWindow) return;

  const GAP = 24; // space kept between the main window and the docked navbar
  const EDGE_MARGIN = 16; // space kept between the navbar and the screen edge

  const updateNavLayout = () => {
    const containerRight = mainWindow.getBoundingClientRect().right;
    const navWidth = sideNav.getBoundingClientRect().width;
    const desiredLeft = containerRight + GAP;
    const fits = desiredLeft + navWidth + EDGE_MARGIN <= window.innerWidth;

    if (fits) {
      sideNav.style.left = `${desiredLeft}px`;
      sideNav.style.right = 'auto';
      document.body.classList.remove('nav-collapsed');
      sideNav.classList.remove('open');
    } else {
      sideNav.style.left = '';
      sideNav.style.right = '';
      document.body.classList.add('nav-collapsed');
    }
  };

  updateNavLayout();

  let resizeFrame;
  window.addEventListener('resize', () => {
    cancelAnimationFrame(resizeFrame);
    resizeFrame = requestAnimationFrame(updateNavLayout);
  });
});
