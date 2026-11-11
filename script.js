// ===== Minimal, High-Performance Script =====
(function() {
    'use strict';

    const isMobile = window.innerWidth < 768 || window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const header = document.getElementById('header');
    let scrollY = 0;
    let mouseX = window.innerWidth / 2, mouseY = window.innerHeight / 2;
    let ringX = mouseX, ringY = mouseY;

    // ===== Custom Cursor (single RAF, desktop only) =====
    const cursorDot = document.getElementById('cursorDot');
    const cursorRing = document.getElementById('cursorRing');

    if (!isMobile) {
        document.addEventListener('mousemove', (e) => {
            mouseX = e.clientX;
            mouseY = e.clientY;
        }, { passive: true });

        document.querySelectorAll('a, button, .feature-card, .gallery-item').forEach(el => {
            el.addEventListener('mouseenter', () => cursorRing.classList.add('hover'));
            el.addEventListener('mouseleave', () => cursorRing.classList.remove('hover'));
        });
    } else {
        if (cursorDot) cursorDot.style.display = 'none';
        if (cursorRing) cursorRing.style.display = 'none';
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

    // ===== Scroll Reveal =====
    const revealObs = new IntersectionObserver((entries) => {
        entries.forEach(e => {
            if (e.isIntersecting) {
                e.target.classList.add('visible');
                revealObs.unobserve(e.target);
            }
        });
    }, { threshold: 0.1, rootMargin: '0px 0px -30px 0px' });
    document.querySelectorAll('.reveal').forEach(el => revealObs.observe(el));

    // ===== Counter =====
    const counterObs = new IntersectionObserver((entries) => {
        entries.forEach(e => {
            if (e.isIntersecting) {
                const tgt = parseInt(e.target.dataset.target);
                const pd = ['۰','۱','۲','۳','۴','۵','۶','۷','۸','۹'];
                let cur = 0;
                const step = tgt / 40;
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
            if (href === '#' || href === '#home') {
                window.scrollTo({ top: 0, behavior: 'smooth' });
                return;
            }
            const t = document.querySelector(href);
            if (t) window.scrollTo({ top: t.offsetTop - header.offsetHeight, behavior: 'smooth' });
        });
    });

    // ===== Scroll handler (throttled via RAF) =====
    let scrollTicking = false;
    function onScroll() {
        scrollY = window.scrollY;
        // Header state
        header.classList.toggle('scrolled', scrollY > 50);
        // Active nav
        let current = '';
        document.querySelectorAll('section[id]').forEach(sec => {
            if (scrollY >= sec.offsetTop - 200) current = sec.id;
        });
        document.querySelectorAll('.nav-link').forEach(l => {
            l.classList.toggle('active', l.getAttribute('href') === '#' + current);
        });
        scrollTicking = false;
    }
    window.addEventListener('scroll', () => {
        if (!scrollTicking) { requestAnimationFrame(onScroll); scrollTicking = true; }
    }, { passive: true });

    // ===== Hand chaser =====
    const handChaser = document.getElementById('handChaser');
    let handX = mouseX, handY = mouseY;
    let handActive = false;
    let handRotation = 0;

    // Activate hand after 1.5s (so it appears from edge dramatically)
    if (!isMobile) {
        setTimeout(() => { handActive = true; handChaser.classList.add('active'); }, 1500);
    }

    // Grab animation when hovering on interactive elements
    document.querySelectorAll('a, button, .feature-card, .gallery-item, .floating-card, .btn').forEach(el => {
        el.addEventListener('mouseenter', () => handChaser.classList.add('grabbing'));
        el.addEventListener('mouseleave', () => handChaser.classList.remove('grabbing'));
    });

    // ===== Single RAF loop for cursor + hand (desktop only) =====
    function tick() {
        if (!isMobile) {
            // Cursor dot - direct follow
            cursorDot.style.transform = `translate(${mouseX - 4}px, ${mouseY - 4}px)`;

            // Cursor ring - smooth follow
            ringX += (mouseX - ringX) * 0.22;
            ringY += (mouseY - ringY) * 0.22;
            cursorRing.style.transform = `translate(${ringX - 18}px, ${ringY - 18}px)`;

            // Hand chaser - delayed follow (comes from behind)
            if (handActive) {
                const dx = mouseX - handX;
                const dy = mouseY - handY - 10; // hand appears slightly below
                const dist = Math.sqrt(dx*dx + dy*dy);

                handX += dx * 0.08;
                handY += dy * 0.08;

                // Calculate rotation based on movement direction
                if (dist > 2) {
                    handRotation = Math.atan2(dy, dx) * (180 / Math.PI) + 90;
                }

                // When close enough, trigger grab via ring scale (visual feedback)
                const isClose = dist < 20;
                const scale = isClose ? 1.1 : 1;

                // Place hand below cursor point with rotation
                handChaser.style.transform =
                    `translate(${handX - 22}px, ${handY - 8}px) rotate(${handRotation}deg) scale(${scale})`;
            }
        }
        requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);

})();
