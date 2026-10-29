// site.js — menu op mobiel en binnenkomende onderdelen
const knop = document.querySelector('.menu-knop');
const menu = document.getElementById('menu');
const rustig = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Menu op mobiel
function sluitMenu() {
    menu.classList.remove('open');
    knop.setAttribute('aria-expanded', false);
}
knop.addEventListener('click', () => {
    const open = menu.classList.toggle('open');
    knop.setAttribute('aria-expanded', open);
});
menu.querySelectorAll('a').forEach((link) => link.addEventListener('click', sluitMenu));
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && menu.classList.contains('open')) {
        sluitMenu();
        knop.focus();
    }
});

// Onderdelen komen een voor een binnen als hun stap in beeld komt
const binnen = new IntersectionObserver((items) => {
    items.forEach((item) => {
        if (!item.isIntersecting) return;
        item.target.querySelectorAll('[data-op]').forEach((el, i) => {
            el.style.transitionDelay = (rustig ? 0 : Math.min(i, 8) * 70) + 'ms';
            el.classList.add('zichtbaar');
        });
        binnen.unobserve(item.target);
    });
}, { threshold: 0.15 });
document.querySelectorAll('.stap').forEach((stap) => binnen.observe(stap));
