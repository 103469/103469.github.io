/* site.js — menu op mobiel, menu donker na scrollen, blokken die rustig verschijnen */
(function () {
    const nav = document.querySelector('.nav');
    const knop = document.querySelector('.menu-knop');
    const menu = document.getElementById('menu');

    // menu krijgt een achtergrond zodra je van de foto af scrollt
    const zetNav = () => nav.classList.toggle('vast', window.scrollY > 40);
    zetNav();
    window.addEventListener('scroll', zetNav, { passive: true });

    // mobiel menu open/dicht
    knop.addEventListener('click', () => {
        const open = knop.getAttribute('aria-expanded') === 'true';
        knop.setAttribute('aria-expanded', String(!open));
        menu.classList.toggle('open', !open);
    });
    menu.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => {
        knop.setAttribute('aria-expanded', 'false');
        menu.classList.remove('open');
    }));

    // actieve link in het menu
    const links = [...menu.querySelectorAll('a')];
    const secties = links.map((a) => document.querySelector(a.getAttribute('href'))).filter(Boolean);
    const kijker = new IntersectionObserver((items) => {
        items.forEach((item) => {
            if (!item.isIntersecting) return;
            links.forEach((a) => a.classList.toggle('actief', a.getAttribute('href') === '#' + item.target.id));
        });
    }, { rootMargin: '-45% 0px -50% 0px' });
    secties.forEach((s) => kijker.observe(s));

    // verschijnen bij scrollen (alleen als de bezoeker beweging oké vindt)
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const dingen = document.querySelectorAll('.kop, .over-foto, .over-tekst, .project, .skills li, .reis li, .contact .wrap > *');
    dingen.forEach((el) => el.classList.add('verschijn'));
    const zichtbaar = new IntersectionObserver((items) => {
        items.forEach((item) => {
            if (item.isIntersecting) {
                item.target.classList.add('zichtbaar');
                zichtbaar.unobserve(item.target);
            }
        });
    }, { rootMargin: '0px 0px -8% 0px' });
    dingen.forEach((el) => zichtbaar.observe(el));
})();
