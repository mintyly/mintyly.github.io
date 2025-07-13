// sidebar.js
document.addEventListener('DOMContentLoaded', () => {
  const toggleButton = document.getElementById('nav-toggle');
  const sideNav = document.getElementById('side-navbar');

  if (toggleButton && sideNav) {
    toggleButton.addEventListener('click', () => {
      sideNav.classList.toggle('open');
    });
  }
});
