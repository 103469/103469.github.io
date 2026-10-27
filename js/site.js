// site.js — menu krijgt een achtergrond na het scrollen, en het menu op mobiel
const nav = document.querySelector('.nav');
const knop = document.querySelector('.menu-knop');
const menu = document.getElementById('menu');

function checkScroll() {
    nav.classList.toggle('vast', window.scrollY > 40);
}
checkScroll();
window.addEventListener('scroll', checkScroll);

knop.addEventListener('click', () => {
    const open = menu.classList.toggle('open');
    knop.setAttribute('aria-expanded', open);
});

menu.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
        menu.classList.remove('open');
        knop.setAttribute('aria-expanded', false);
    });
});
