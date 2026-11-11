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

    // ===== Spline 3D Scene - make robot "grab" / look at mouse =====
    const splineViewer = document.querySelector('spline-viewer');
    let splineApp = null;
    let splineLoaded = false;

    function setupSplineInteraction() {
        if (!splineViewer || splineLoaded) return;
        // Wait until spline is ready and we can access objects
        const tryLoad = () => {
            if (splineViewer.getSplineInstance) {
                splineViewer.getSplineInstance().then(app => {
                    splineApp = app;
                    splineLoaded = true;
                }).catch(() => setTimeout(tryLoad, 500));
            } else {
                setTimeout(tryLoad, 500);
            }
        };
        // Try after scene loads
        splineViewer.addEventListener('load', tryLoad, { once: true });
        setTimeout(tryLoad, 3000);
    }
    setupSplineInteraction();

    // ===== Single RAF loop for cursor (desktop only) =====
    function tick() {
        if (!isMobile) {
            // Cursor dot - direct follow
            cursorDot.style.transform = `translate(${mouseX - 4}px, ${mouseY - 4}px)`;

            // Cursor ring - smooth follow
            ringX += (mouseX - ringX) * 0.22;
            ringY += (mouseY - ringY) * 0.22;
            cursorRing.style.transform = `translate(${ringX - 18}px, ${ringY - 18}px)`;
        }
        requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);

    // ===== Make the Spline 3D scene follow/rotate toward mouse =====
    // This adds a parallax/tilt so the robot appears to "reach" toward cursor
    if (!isMobile && splineViewer) {
        const splineWrapper = splineViewer.parentElement;
        let splineRotY = 0, splineRotX = 0;
        let targetRotY = 0, targetRotX = 0;
        let splineScale = 1;

        document.addEventListener('mousemove', (e) => {
            const rect = splineWrapper.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;

            // Normalize mouse position relative to scene center (-1 to 1)
            targetRotY = ((e.clientX - centerX) / rect.width) * 0.4;
            targetRotX = ((e.clientY - centerY) / rect.height) * -0.3;
        });

        // Smoothly rotate spline viewer to look at cursor
        function splineLook() {
            splineRotY += (targetRotY - splineRotY) * 0.05;
            splineRotX += (targetRotX - splineRotX) * 0.05;

            splineViewer.style.transform =
                `perspective(1000px) rotateY(${splineRotY}rad) rotateX(${splineRotX}rad) scale(1.05)`;

            requestAnimationFrame(splineLook);
        }
        splineLook();
    }

})();
