// ===== Optimized High-Performance Script =====
(function() {
    'use strict';

    const isMobile = window.innerWidth < 768 || window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const header = document.getElementById('header');
    const cursorDot = document.getElementById('cursorDot');
    const cursorRing = document.getElementById('cursorRing');

    let scrollY = 0, ticking = false;
    let mouseX = window.innerWidth / 2, mouseY = window.innerHeight / 2;
    let ringX = mouseX, ringY = mouseY;

    // ===== Cursor (desktop only) =====
    if (!isMobile) {
        document.addEventListener('mousemove', (e) => { mouseX = e.clientX; mouseY = e.clientY; }, { passive: true });
        document.querySelectorAll('a, button, .feature-card, .gallery-item').forEach(el => {
            el.addEventListener('mouseenter', () => cursorRing.classList.add('hover'));
            el.addEventListener('mouseleave', () => cursorRing.classList.remove('hover'));
        });
    } else {
        cursorDot.style.display = 'none';
        cursorRing.style.display = 'none';
        document.body.style.cursor = 'auto';
        document.querySelectorAll('a, button').forEach(el => el.style.cursor = 'pointer');
    }

    // ===== Mobile Menu =====
    const hamburger = document.getElementById('hamburger');
    const navMenu = document.getElementById('navMenu');
    if (hamburger && navMenu) {
        hamburger.addEventListener('click', () => {
            navMenu.classList.toggle('active');
            const spans = hamburger.querySelectorAll('span');
            const open = navMenu.classList.contains('active');
            spans[0].style.transform = open ? 'rotate(45deg) translate(5px,5px)' : '';
            spans[1].style.opacity = open ? '0' : '';
            spans[2].style.transform = open ? 'rotate(-45deg) translate(5px,-5px)' : '';
        });
        navMenu.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', () => {
                navMenu.classList.remove('active');
                hamburger.querySelectorAll('span').forEach(s => { s.style.transform = ''; s.style.opacity = ''; });
            });
        });
    }

    // ===== Reveal =====
    const revealObs = new IntersectionObserver((entries) => {
        entries.forEach(e => {
            if (e.isIntersecting) { e.target.classList.add('visible'); revealObs.unobserve(e.target); }
        });
    }, { threshold: 0.08, rootMargin: '0px 0px -30px 0px' });
    document.querySelectorAll('.reveal').forEach(el => revealObs.observe(el));

    // ===== Counter =====
    const counterObs = new IntersectionObserver((entries) => {
        entries.forEach(e => {
            if (e.isIntersecting) {
                const tgt = parseInt(e.target.dataset.target);
                const pd = ['۰','۱','۲','۳','۴','۵','۶','۷','۸','۹'];
                let cur = 0;
                const step = Math.max(1, tgt / 40);
                const t = setInterval(() => {
                    cur += step;
                    if (cur >= tgt) { e.target.textContent = tgt.toString().replace(/\d/g, d => pd[d]); clearInterval(t); }
                    else e.target.textContent = Math.floor(cur).toString().replace(/\d/g, d => pd[d]);
                }, 30);
                counterObs.unobserve(e.target);
            }
        });
    }, { threshold: 0.5 });
    document.querySelectorAll('.stat-number').forEach(s => counterObs.observe(s));

    // ===== Smooth Scroll =====
    document.querySelectorAll('a[href^="#"]').forEach(a => {
        a.addEventListener('click', (ev) => {
            ev.preventDefault();
            const href = a.getAttribute('href');
            if (href === '#' || href === '#home') { window.scrollTo({ top: 0, behavior: 'smooth' }); return; }
            const t = document.querySelector(href);
            if (t) window.scrollTo({ top: t.offsetTop - header.offsetHeight, behavior: 'smooth' });
        });
    });

    // ===== Scroll handler =====
    function onScroll() {
        scrollY = window.scrollY;
        header.classList.toggle('scrolled', scrollY > 50);
        let current = '';
        document.querySelectorAll('section[id]').forEach(sec => {
            if (scrollY >= sec.offsetTop - 200) current = sec.id;
        });
        document.querySelectorAll('.nav-link').forEach(l => {
            l.classList.toggle('active', l.getAttribute('href') === '#' + current);
        });
        const orbs = document.querySelectorAll('.orb');
        orbs.forEach((orb, i) => { orb.style.transform = `translateY(${scrollY * (i + 1) * 0.02}px)`; });
        ticking = false;
    }
    window.addEventListener('scroll', () => {
        if (!ticking) { requestAnimationFrame(onScroll); ticking = true; }
    }, { passive: true });

    // ===== Single RAF loop for cursor =====
    function tick() {
        if (!isMobile) {
            cursorDot.style.transform = `translate(${mouseX - 4}px, ${mouseY - 4}px)`;
            ringX += (mouseX - ringX) * 0.2;
            ringY += (mouseY - ringY) * 0.2;
            cursorRing.style.transform = `translate(${ringX - 18}px, ${ringY - 18}px)`;
        }
        requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);

})();
