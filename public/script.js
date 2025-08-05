document.addEventListener('DOMContentLoaded', () => {
  const btn = document.querySelector('.hamburger');
  const nav = document.querySelector('.nav-links');
  btn.addEventListener('click', () => {
    nav.classList.toggle('open');
    btn.querySelector('i').classList.toggle('fa-bars');
    btn.querySelector('i').classList.toggle('fa-times');
  });
});