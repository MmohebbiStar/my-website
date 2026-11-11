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
    let splineRotTicking = false;

    // ===== Spline 3D: robot HEAD follows mouse =====
    const splineViewer = document.getElementById('splineViewer');
    let splineApp = null;
    let headObjects = [];
    let eyeObjects = [];
    let splineReady = false;

    function findHeadObjects(obj, depth = 0) {
        if (!obj) return;
        const name = (obj.name || '').toLowerCase();
        // Common Spline robot head naming patterns
        if (/head|face|skull|neck|chin|eye/.test(name)) {
            if (/eye/.test(name)) eyeObjects.push(obj);
            else headObjects.push(obj);
        }
        // Also look for any top-level child group that is the robot body
        if (obj.children && obj.children.length) {
            obj.children.forEach(c => findHeadObjects(c, depth + 1));
        }
    }

    function initSplineHead() {
        if (!splineViewer || splineReady) return;
        splineViewer.getSplineInstance ? splineViewer.getSplineInstance().then(app => {
            splineApp = app;
            const allObjs = app.getAllObjects ? app.getAllObjects() : (app._objects || []);
            allObjs.forEach(o => findHeadObjects(o));

            // If no specific head found, find top-level "Robot" or first named object that's a group
            if (headObjects.length === 0) {
                const robotObj = allObjs.find(o => /robot|character|bot|spline|model/i.test(o.name));
                if (robotObj) headObjects.push(robotObj);
            }

            splineReady = true;
        }).catch(() => setTimeout(initSplineHead, 800)) : setTimeout(initSplineHead, 800);
    }
    if (!isMobile && splineViewer) {
        splineViewer.addEventListener('load', initSplineHead, { once: true });
        setTimeout(initSplineHead, 4000);
    }

    // Mouse target for head rotation (normalized -1 to 1)
    let targetRotY = 0, targetRotX = 0;
    let curRotY = 0, curRotX = 0;

    if (!isMobile && splineViewer) {
        const splineWrap = splineViewer.parentElement;
        document.addEventListener('mousemove', (e) => {
            const r = splineWrap.getBoundingClientRect();
            targetRotY = ((e.clientX - (r.left + r.width/2)) / r.width) * 0.6;   // radians (~34deg)
            targetRotX = -((e.clientY - (r.top + r.height/2)) / r.height) * 0.4;
        }, { passive: true });

        // Smooth head-follow loop (separate, lightweight rAF)
        function animateHead() {
            if (splineReady && headObjects.length) {
                curRotY += (targetRotY - curRotY) * 0.08;
                curRotX += (targetRotX - curRotX) * 0.08;

                headObjects.forEach(obj => {
                    if (obj.rotation) {
                        obj.rotation.y = curRotY;
                        obj.rotation.x = curRotX;
                    } else if (obj.quaternion) {
                        obj.quaternion.setFromEuler(curRotX, curRotY, 0);
                    }
                });
                // Eyes follow slightly faster for more alive feel
                eyeObjects.forEach(obj => {
                    if (obj.rotation) {
                        obj.rotation.y = curRotY * 1.3;
                        obj.rotation.x = curRotX * 1.3;
                    }
                });
            }
            requestAnimationFrame(animateHead);
        }
        animateHead();
    }

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
        // Orb parallax - minimal
        const orbs = document.querySelectorAll('.orb');
        orbs.forEach((orb, i) => { orb.style.transform = `translateY(${scrollY * (i + 1) * 0.02}px)`; });
        ticking = false;
    }
    window.addEventListener('scroll', () => {
        if (!ticking) { requestAnimationFrame(onScroll); ticking = true; }
    }, { passive: true });

    // ===== Single RAF loop for cursor (NO spline parallax - too heavy) =====
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
