// The Dentist — motion + bilingual + WhatsApp booking. Fails soft everywhere.
(function () {
  'use strict';
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hasGsap = typeof gsap !== 'undefined';
  var hasST = typeof ScrollTrigger !== 'undefined';
  var lenis = null;

  if (hasGsap && hasST) { try { gsap.registerPlugin(ScrollTrigger); } catch (e) {} }

  // Smooth scroll
  if (!reduce && typeof Lenis !== 'undefined') {
    try {
      lenis = new Lenis({ duration: 1.15, smoothWheel: true });
      if (hasGsap) {
        if (hasST) { lenis.on('scroll', ScrollTrigger.update); }
        gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
        gsap.ticker.lagSmoothing(0);
      } else {
        var raf = function (time) { lenis.raf(time); requestAnimationFrame(raf); };
        requestAnimationFrame(raf);
      }
      document.querySelectorAll('a[href^="#"]').forEach(function (a) {
        a.addEventListener('click', function (e) {
          var id = a.getAttribute('href');
          if (id && id.length > 1) {
            var el = document.querySelector(id);
            if (el) { e.preventDefault(); lenis.scrollTo(el, { offset: -70 }); }
          }
        });
      });
    } catch (e) { lenis = null; }
  }

  // Mobile menu
  var menuBtn = document.getElementById('menuBtn');
  var navLinks = document.getElementById('navLinks');
  if (menuBtn && navLinks) {
    menuBtn.addEventListener('click', function () { navLinks.classList.toggle('open'); });
    navLinks.addEventListener('click', function (e) { if (e.target.tagName === 'A') navLinks.classList.remove('open'); });
  }

  // ---- Bilingual (EN/HI), no framework ----
  var lang = 'en';
  function applyLang(l) {
    lang = l;
    document.documentElement.lang = (l === 'hi') ? 'hi' : 'en';
    document.querySelectorAll('[data-en]').forEach(function (el) {
      var v = el.getAttribute('data-' + l);
      if (v !== null) el.textContent = v;
    });
    var btn = document.getElementById('langBtn');
    if (btn) btn.textContent = (l === 'hi') ? 'EN' : 'हिंदी';
    buildTreatments(); buildDays(); buildMarquee();
  }
  var langBtn = document.getElementById('langBtn');
  if (langBtn) langBtn.addEventListener('click', function () { applyLang(lang === 'en' ? 'hi' : 'en'); });

  // ---- Treatments (single source for grid + booking select) ----
  var TREATS = [
    { en: 'General Checkup & Cleaning', hi: 'जांच और सफाई' },
    { en: 'Cavity Filling', hi: 'कैविटी फिलिंग' },
    { en: 'Root Canal (RCT)', hi: 'नस का इलाज (RCT)' },
    { en: 'Braces & Aligners', hi: 'ब्रेसेस और अलाइनर' },
    { en: 'Kids Dentistry', hi: 'बच्चों के दांत' },
    { en: 'Tooth Pain Visit', hi: 'दांत दर्द का इलाज' },
    { en: 'Not sure — need advice', hi: 'समझ नहीं आ रहा — सलाह चाहिए' }
  ];
  var TREAT_DESC = [
    { en: 'Complete checkup, scaling and polish for a fresh mouth.', hi: 'मुंह की पूरी जांच, स्केलिंग और पॉलिश।' },
    { en: 'Painless clearing of decay, sealed to look natural.', hi: 'सड़न की दर्दरहित सफाई, natural दिखने वाली सीलिंग।' },
    { en: 'Save the natural tooth — single or multi-sitting care.', hi: 'असली दांत बचाएं — एक या कई sitting में इलाज।' },
    { en: 'Straighter teeth for teens and adults, metal or clear.', hi: 'टीनेजर्स और बड़ों के लिए सीधे दांत — metal या clear।' },
    { en: 'Gentle first visits, habit correction, cavity care.', hi: 'पहली visit आसान, आदत सुधार, कैविटी इलाज।' },
    { en: 'Same-day relief visits for sudden tooth pain.', hi: 'अचानक दांत दर्द के लिए उसी दिन राहत।' },
    { en: 'Message us your symptoms — we guide before you visit.', hi: 'अपने लक्षण message करें — आने से पहले बता देंगे।' }
  ];
  var DOTS = ['🦷', '✨', '🛡', '😁', '🧒', '⚡', '💬'];
  function buildTreatments() {
    var grid = document.getElementById('treatGrid');
    var sel = document.getElementById('bkTreat');
    if (grid) {
      grid.innerHTML = '';
      TREATS.slice(0, 6).forEach(function (t, i) {
        var d = document.createElement('div');
        d.className = 'card spotlight rv in';
        d.innerHTML = '<div class="dot">' + DOTS[i % DOTS.length] + '</div><h3></h3><p></p>';
        d.querySelector('h3').textContent = t[lang];
        d.querySelector('p').textContent = TREAT_DESC[i][lang];
        grid.appendChild(d);
      });
      wireSpotlight(grid);
      revealNow(grid);
    }
    if (sel) {
      sel.innerHTML = '';
      TREATS.forEach(function (t) {
        var o = document.createElement('option');
        o.textContent = t[lang];
        sel.appendChild(o);
      });
    }
  }
  function buildDays() {
    var sel = document.getElementById('bkDay');
    if (!sel) return;
    var daysEn = ['Today', 'Tomorrow', 'Day after', 'This Saturday', 'Will confirm on call'];
    var daysHi = ['आज', 'कल', 'परसों', 'इस शनिवार', 'कॉल पर confirm करूंगा'];
    var days = (lang === 'hi') ? daysHi : daysEn;
    sel.innerHTML = '';
    days.forEach(function (d) {
      var o = document.createElement('option');
      o.textContent = d;
      sel.appendChild(o);
    });
  }
  function buildMarquee() {
    var track = document.getElementById('marqueeTrack');
    if (!track) return;
    var items = TREATS.slice(0, 6).map(function (t) { return t[lang]; });
    var half = items.map(function (t) { return '<span>✦ ' + t + '</span>'; }).join('');
    track.innerHTML = half + half;
  }

  // ---- Booking → WhatsApp ----
  var form = document.getElementById('bookForm');
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var name = document.getElementById('bkName').value.trim();
      var treat = document.getElementById('bkTreat').value;
      var day = document.getElementById('bkDay').value;
      if (!name) return;
      var msg = (lang === 'hi')
        ? 'Namaste! Main ' + name + ' bol raha/rahi hoon. Mujhe "' + treat + '" ke liye appointment chahiye (' + day + '). Kripya time bata dijiye.'
        : 'Namaste! This is ' + name + '. I would like to book "' + treat + '" (' + day + '). Please share a time slot.';
      window.open('https://wa.me/919470650206?text=' + encodeURIComponent(msg), '_blank');
    });
  }

  // ---- CountUp stats ----
  function countUp(el) {
    var end = parseFloat(el.getAttribute('data-count')) || 0;
    var t0 = null;
    function step(ts) {
      if (!t0) t0 = ts;
      var p = Math.min((ts - t0) / 1600, 1);
      el.textContent = Math.round(end * (1 - Math.pow(2, -10 * p)));
      if (p < 1) requestAnimationFrame(step);
      else el.textContent = end;
    }
    requestAnimationFrame(step);
  }
  var counted = false;
  function watchStats() {
    var s = document.querySelector('.stats');
    if (!s || counted) return;
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (en) {
        if (en.isIntersecting && !counted) {
          counted = true;
          s.querySelectorAll('[data-count]').forEach(countUp);
          io.disconnect();
        }
      });
    }, { threshold: 0.3 });
    io.observe(s);
  }

  // ---- Scroll reveals (no GSAP needed) ----
  function revealNow(root) {
    var els = (root || document).querySelectorAll('.rv:not(.in)');
    if (!('IntersectionObserver' in window)) {
      els.forEach(function (el) { el.classList.add('in'); });
      return;
    }
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
      });
    }, { threshold: 0.12 });
    els.forEach(function (el) { io.observe(el); });
  }

  // ---- Spotlight + magnetic (fine pointer only) ----
  function wireSpotlight(root) {
    (root || document).querySelectorAll('.spotlight').forEach(function (card) {
      if (card.dataset.spot) return;
      card.dataset.spot = '1';
      card.addEventListener('mousemove', function (e) {
        var r = card.getBoundingClientRect();
        card.style.setProperty('--mx', (e.clientX - r.left) + 'px');
        card.style.setProperty('--my', (e.clientY - r.top) + 'px');
      });
    });
  }
  function wireMagnetic() {
    if (!window.matchMedia('(pointer: fine)').matches || !hasGsap) return;
    document.querySelectorAll('[data-magnet]').forEach(function (btn) {
      var xTo = gsap.quickTo(btn, 'x', { duration: 0.4, ease: 'power3' });
      var yTo = gsap.quickTo(btn, 'y', { duration: 0.4, ease: 'power3' });
      btn.addEventListener('mousemove', function (e) {
        var r = btn.getBoundingClientRect();
        xTo((e.clientX - (r.left + r.width / 2)) * 0.3);
        yTo((e.clientY - (r.top + r.height / 2)) * 0.3);
      });
      btn.addEventListener('mouseleave', function () {
        gsap.to(btn, { x: 0, y: 0, duration: 0.7, ease: 'elastic.out(1, 0.4)' });
      });
    });
  }

  // ---- Click sparks ----
  function wireSparks() {
    if (reduce) return;
    var cv = document.createElement('canvas');
    cv.id = 'sparkCanvas';
    document.body.appendChild(cv);
    var ctx = cv.getContext('2d');
    var sparks = [];
    var on = false;
    function size() {
      cv.width = window.innerWidth; cv.height = window.innerHeight;
      cv.style.width = window.innerWidth + 'px'; cv.style.height = window.innerHeight + 'px';
    }
    size();
    window.addEventListener('resize', size);
    function burst(x, y) {
      for (var i = 0; i < 12; i++) {
        var a = Math.random() * Math.PI * 2, sp = 2 + Math.random() * 4;
        sparks.push({ x: x, y: y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 1, life: 1 });
      }
      if (!on) { on = true; requestAnimationFrame(tick); }
    }
    function tick() {
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
      sparks = sparks.filter(function (p) { return p.life > 0; });
      sparks.forEach(function (p) {
        p.x += p.vx; p.y += p.vy; p.vy += 0.12; p.life -= 0.02;
        ctx.globalAlpha = Math.max(p.life, 0);
        ctx.fillStyle = '#0E7C7B';
        ctx.fillRect(p.x, p.y, 2.5, 2.5);
      });
      if (sparks.length) requestAnimationFrame(tick);
      else { on = false; ctx.clearRect(0, 0, window.innerWidth, window.innerHeight); }
    }
    document.querySelectorAll('[data-magnet], .btn-solid').forEach(function (b) {
      b.addEventListener('click', function (e) { burst(e.clientX, e.clientY); });
    });
  }

  // ---- Gallery (fill GALLERY, section unhides itself) ----
  var GALLERY = [
    // { src: 'assets/chair.jpg', cap: { en: 'Modern dental chair', hi: 'आधुनिक डेंटल चेयर' } },
  ];
  (function buildGallery() {
    if (!GALLERY.length) return;
    var sec = document.getElementById('gallery');
    var grid = document.getElementById('galGrid');
    if (!sec || !grid) return;
    sec.hidden = false;
    GALLERY.forEach(function (g) {
      var f = document.createElement('figure');
      var img = document.createElement('img');
      img.src = g.src; img.alt = g.cap[lang] || g.cap.en; img.loading = 'lazy';
      img.onclick = function () { openViewer(g); };
      var cap = document.createElement('figcaption');
      cap.textContent = g.cap[lang] || g.cap.en;
      cap.dataset.capEn = g.cap.en; cap.dataset.capHi = g.cap.hi;
      f.appendChild(img); f.appendChild(cap);
      grid.appendChild(f);
    });
    var origApply = applyLang;
    applyLang = function (l) {
      origApply(l);
      grid.querySelectorAll('figcaption').forEach(function (c) {
        c.textContent = (l === 'hi') ? (c.dataset.capHi || c.dataset.capEn) : c.dataset.capEn;
      });
    };
  })();
  window.openViewer = function (g) {
    var v = document.getElementById('viewer');
    if (!v) return;
    document.getElementById('viewerImg').src = g.src;
    document.getElementById('viewerCap').textContent = g.cap[lang] || g.cap.en;
    v.hidden = false;
    document.body.style.overflow = 'hidden';
    if (lenis) lenis.stop();
  };
  window.closeViewer = function () {
    var v = document.getElementById('viewer');
    if (!v) return;
    v.hidden = true;
    document.getElementById('viewerImg').src = '';
    document.body.style.overflow = '';
    if (lenis) lenis.start();
  };
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') window.closeViewer();
  });

  // ---- Boot ----
  buildTreatments();
  buildDays();
  buildMarquee();
  watchStats();
  revealNow(document);
  wireSpotlight(document);
  wireMagnetic();
  wireSparks();
  if (hasGsap && hasST && !reduce) {
    try {
      gsap.utils.toArray('.hero-art').forEach(function (el) {
        gsap.to(el, { yPercent: 8, ease: 'none', scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: true } });
      });
      window.addEventListener('load', function () { ScrollTrigger.refresh(); });
    } catch (e) {}
  }
})();
