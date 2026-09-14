/* ディメンション・ゼロ 構成サンプル モーション
   参照：shiba-company/departments/product/restaurant_hp_design_principles_2026-07-03.md
   原則：transform / opacity / clip-path のみ。prefers-reduced-motion で全停止。画像の出現にフェードは使わない。 */
(function () {
  'use strict';
  var d = document, root = d.documentElement;
  var RM = !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
  root.classList.add('js');
  if (RM) root.classList.add('rm');

  /* ---------- ヒーローの地域検索 ---------- */
  var DZREG = { '福岡': 0, '佐賀': 0, '長崎': 0, '熊本': 0, '大分': 0, '宮崎': 0, '鹿児島': 0, '沖縄': 0, '東京': 1, '神奈川': 1, '埼玉': 1, '千葉': 1, '愛知': 2, '大阪': 2, '兵庫': 2, '広島': 3, '岡山': 3, '北海道': 3, 'Hawaii': 4 };
  window.dzGo = function (f) {
    var p = f.pref.value;
    location.href = p ? ('salons.html?region=' + DZREG[p] + '&pref=' + encodeURIComponent(p)) : 'salons.html';
    return false;
  };

  /* ---------- メニュー ---------- */
  var burger = d.getElementById('burger'), menu = d.getElementById('menu');
  if (burger && menu) burger.addEventListener('click', function () { menu.classList.toggle('open'); });

  /* ---------- 慣性スクロール（Lenis） ---------- */
  var lenis = null;
  if (!RM && window.Lenis) {
    lenis = new window.Lenis({ lerp: 0.09, smoothWheel: true });
    var rafLenis = function (t) { lenis.raf(t); requestAnimationFrame(rafLenis); };
    requestAnimationFrame(rafLenis);
  }
  function scrollToY(y) {
    if (lenis) lenis.scrollTo(y, { duration: 1.2 });
    else window.scrollTo({ top: y, behavior: RM ? 'auto' : 'smooth' });
  }
  d.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href^="#"]');
    if (!a) return;
    var id = a.getAttribute('href').slice(1);
    var t = id && d.getElementById(id);
    if (!t) return;
    e.preventDefault();
    scrollToY(t.getBoundingClientRect().top + window.scrollY - 80);
  });

  /* ---------- スクロール購読 ---------- */
  var subs = [], layouts = [], ticking = false;
  function onScroll(fn) { subs.push(fn); }
  function tick() { ticking = false; var y = window.scrollY, vh = window.innerHeight; for (var i = 0; i < subs.length; i++) subs[i](y, vh); }
  function req() { if (!ticking) { ticking = true; requestAnimationFrame(tick); } }
  function layout() { for (var i = 0; i < layouts.length; i++) layouts[i](); req(); }
  window.addEventListener('scroll', req, { passive: true });
  window.addEventListener('resize', layout);
  window.addEventListener('load', layout);

  /* ---------- 開幕：ひと雫 → 波紋 → 水面が開く ---------- */
  var op = d.getElementById('opening');
  if (op) {
    var seen = false;
    try { seen = sessionStorage.getItem('dzOpen') === '1'; } catch (e) {}
    if (RM || seen) { op.parentNode.removeChild(op); root.classList.add('opened'); }
    else {
      root.classList.add('opening');
      if (lenis) lenis.stop();
      setTimeout(function () { op.classList.add('drop'); }, 120);
      setTimeout(function () { op.classList.add('ripple'); }, 980);
      setTimeout(function () { op.classList.add('open'); root.classList.add('opened'); }, 1750);
      setTimeout(function () {
        if (op.parentNode) op.parentNode.removeChild(op);
        root.classList.remove('opening');
        if (lenis) lenis.start();
      }, 2800);
      try { sessionStorage.setItem('dzOpen', '1'); } catch (e) {}
    }
  } else {
    root.classList.add('opened');
  }

  /* ---------- 見出し：一文字ずつ ---------- */
  d.querySelectorAll('[data-chars]').forEach(function (el) {
    var base = parseFloat(el.getAttribute('data-chars')) || 0, i = 0;
    el.setAttribute('aria-label', el.textContent.replace(/\s+/g, ''));
    el.querySelectorAll('.ln').forEach(function (ln) {
      var txt = ln.textContent;
      ln.textContent = '';
      ln.setAttribute('aria-hidden', 'true');
      Array.from(txt).forEach(function (c) {
        var s = d.createElement('span');
        s.className = 'ch';
        s.textContent = c;
        s.style.transitionDelay = (base + i * 0.055).toFixed(3) + 's';
        ln.appendChild(s);
        i++;
      });
    });
  });

  /* ---------- 行マスク見出し（監視は外側、動くのは内側） ---------- */
  d.querySelectorAll('.lr').forEach(function (el) {
    if (el.querySelector(':scope > .lr-i')) return;
    var inner = d.createElement('span');
    inner.className = 'lr-i';
    while (el.firstChild) inner.appendChild(el.firstChild);
    el.appendChild(inner);
  });

  /* ---------- 出現の監視 ---------- */
  function countUp(el) {
    var to = parseFloat(el.getAttribute('data-count')), dur = 1400, t0 = null;
    if (RM || !isFinite(to)) { el.textContent = el.getAttribute('data-count'); return; }
    function step(t) {
      if (t0 === null) t0 = t;
      var k = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - k, 3);
      el.textContent = String(Math.round(to * e));
      if (k < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
  var io = ('IntersectionObserver' in window) ? new IntersectionObserver(function (es) {
    es.forEach(function (e) {
      if (!e.isIntersecting) return;
      e.target.classList.add('in');
      if (e.target.hasAttribute('data-count')) countUp(e.target);
      io.unobserve(e.target);
    });
  }, { rootMargin: '0px 0px -8% 0px' }) : null;
  d.querySelectorAll('.lr, .mask, .fade, [data-count]').forEach(function (el) {
    if (!io || RM) { el.classList.add('in'); if (el.hasAttribute('data-count')) countUp(el); }
    else io.observe(el);
  });

  /* ---------- 視差（枠より大きく仕込んだ写真を枠内で動かす） ---------- */
  var px = [].slice.call(d.querySelectorAll('[data-speed]'));
  if (!RM && px.length) {
    onScroll(function (y, vh) {
      px.forEach(function (el) {
        var box = el.parentElement.getBoundingClientRect();
        if (box.bottom < -200 || box.top > vh + 200) return;
        var c = box.top + box.height / 2 - vh / 2;
        el.style.transform = 'translate3d(0,' + (c * parseFloat(el.getAttribute('data-speed')) * -0.12).toFixed(1) + 'px,0) scale(1.14)';
      });
    });
  }

  /* ---------- ヒーロー：スクロールで沈む・暗転 ---------- */
  var hero = d.querySelector('.hero');
  if (hero && !RM) {
    var hm = hero.querySelector('.hero-media'), hc = hero.querySelector('.hero-in'), hs = hero.querySelector('.hero-dim');
    onScroll(function (y, vh) {
      if (y > vh * 1.3) return;
      var k = y / vh;
      if (hm) hm.style.transform = 'translate3d(0,' + (y * 0.38).toFixed(1) + 'px,0) scale(' + (1 + k * 0.12).toFixed(3) + ')';
      if (hc) { hc.style.transform = 'translate3d(0,' + (-y * 0.14).toFixed(1) + 'px,0)'; hc.style.opacity = String(Math.max(0, 1 - k * 1.15)); }
      if (hs) hs.style.opacity = String(Math.min(0.85, k * 1.1));
    });
  }

  /* ---------- ヒーローの映像リール（複数クリップを順に） ---------- */
  var reel = d.querySelector('[data-reel]');
  if (reel) {
    var vids = [].slice.call(reel.querySelectorAll('video'));
    var dots = [].slice.call(d.querySelectorAll('.reel-dot'));
    var cur = 0, MAX = parseFloat(reel.getAttribute('data-max')) || 7, timer = null, switching = false;
    var playSafe = function (v) { var p = v.play(); if (p && p.catch) p.catch(function () {}); };
    var mark = function (i) {
      vids.forEach(function (v, j) { v.classList.toggle('on', j === i); });
      dots.forEach(function (dt, j) {
        dt.classList.remove('on');
        if (j === i) { void dt.offsetWidth; dt.style.setProperty('--dur', clipLen(vids[j]) + 's'); dt.classList.add('on'); }
      });
    };
    var clipLen = function (v) { return (v.duration && isFinite(v.duration)) ? Math.max(3, Math.min(v.duration - 0.4, MAX)) : MAX; };
    var go = function (n) {
      if (n === cur && vids[cur].classList.contains('on')) return;
      var old = vids[cur];
      switching = true;
      cur = n;
      vids[n].currentTime = 0;
      playSafe(vids[n]);
      mark(n);
      setTimeout(function () { if (old !== vids[cur]) old.pause(); switching = false; }, 1500);
      arm();
    };
    var arm = function () {
      clearTimeout(timer);
      if (vids.length < 2) return;
      timer = setTimeout(function () { go((cur + 1) % vids.length); }, clipLen(vids[cur]) * 1000);
    };
    vids.forEach(function (v) {
      v.muted = true; v.playsInline = true;
      if (vids.length === 1) v.loop = true;
      v.addEventListener('pause', function () { if (!RM && !switching && v === vids[cur] && !d.hidden) setTimeout(function () { if (v.paused) playSafe(v); }, 300); });
    });
    if (RM) {
      vids.forEach(function (v) { v.pause(); v.removeAttribute('autoplay'); });
      if (vids[0]) vids[0].classList.add('on');
    } else if (vids.length) {
      playSafe(vids[0]);
      mark(0);
      if (vids[0].readyState >= 1) arm(); else vids[0].addEventListener('loadedmetadata', function () { mark(0); arm(); }, { once: true });
      d.addEventListener('visibilitychange', function () { if (!d.hidden && vids[cur].paused) playSafe(vids[cur]); });
      dots.forEach(function (dt, j) { dt.addEventListener('click', function () { go(j); }); });
    }
  }

  /* ---------- 写真の切替フレーム（幕が上がるように入れ替わる） ---------- */
  d.querySelectorAll('[data-cycle]').forEach(function (box) {
    var items = [].slice.call(box.querySelectorAll('.fr'));
    var cap = box.querySelector('.fr-cap');
    if (!items.length) return;
    var i = 0;
    items[0].classList.add('on');
    if (cap) cap.textContent = items[0].getAttribute('data-cap') || '';
    if (RM || items.length < 2) return;
    setInterval(function () {
      var prev = items[i];
      i = (i + 1) % items.length;
      items.forEach(function (x) { x.classList.remove('prev'); });
      prev.classList.remove('on');
      prev.classList.add('prev');
      items[i].classList.add('on');
      if (cap) cap.textContent = items[i].getAttribute('data-cap') || '';
    }, (parseFloat(box.getAttribute('data-cycle')) || 4) * 1000);
  });

  /* ---------- 製品フレーム（円柱）：ゆっくり動かすと隣の製品へ、すばやく払うとくるくる回って、正面の製品でポンと止まる ---------- */
  d.querySelectorAll('[data-roul]').forEach(function (sec) {
    var stage = sec.querySelector('.roul-stage'), ring = sec.querySelector('.roul-ring');
    var items = [].slice.call(sec.querySelectorAll('.ri'));
    var tabs = [].slice.call(sec.querySelectorAll('.roul-tab'));
    var panels = [].slice.call(sec.querySelectorAll('.rp'));
    var pin = sec.querySelector('.roul-pin');
    var prevBtn = sec.querySelector('.roul-prev'), nextBtn = sec.querySelector('.roul-next');
    var n = items.length;
    if (!n || !stage || !ring) return;
    var step = 360 / n, R = 260, cw = 220;
    var angle = 0, vel = 0, mode = 'idle', target = 0, tw = null, running = false;
    var active = -1, lastFront = 0, drag = null, moved = false, hinted = false;
    var FAST = 0.5; /* 指を離す直前の速さ（px/ms）がこれを超えたら「すばやく払った」 */
    function mod(a, m) { return ((a % m) + m) % m; }
    function norm(a) { return mod(a + 180, 360) - 180; }
    function front(a) { return mod(Math.round(-a / step), n); }
    function degPerPx() { return step / (cw * 1.05); }
    function restart(el, cls) { el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls); }
    function unland() { items.forEach(function (it) { it.classList.remove('on'); }); }
    function render() {
      ring.style.transform = 'translateZ(' + (-R).toFixed(1) + 'px) rotateY(' + angle.toFixed(2) + 'deg)';
      for (var i = 0; i < n; i++) {
        var rel = norm(i * step + angle);
        items[i].style.setProperty('--f', Math.max(0, Math.cos(rel * Math.PI / 180)).toFixed(3));
      }
      var f = front(angle);
      if (f !== lastFront) { lastFront = f; if (!RM && mode !== 'idle' && pin) restart(pin, 'tick'); }
    }
    function measure() {
      cw = items[0].offsetWidth || 220;
      R = (cw / 2) / Math.tan(Math.PI / n) * 1.3;
      items.forEach(function (it, i) { it.style.transform = 'rotateY(' + (i * step) + 'deg) translateZ(' + R.toFixed(1) + 'px)'; });
      render();
    }
    function land(quiet) {
      var i = front(angle);
      items.forEach(function (it, j) { it.classList.toggle('on', j === i); });
      tabs.forEach(function (t, j) { t.classList.toggle('on', j === i); t.setAttribute('aria-selected', j === i ? 'true' : 'false'); });
      if (i !== active) panels.forEach(function (pn, j) { pn.classList.toggle('on', j === i); });
      if (!quiet && !RM) {
        restart(items[i], 'pop');
        restart(stage, 'flash');
        if (pin) { pin.classList.remove('tick'); restart(pin, 'land'); }
      }
      active = i;
      sec.setAttribute('data-active', String(i));
    }
    var EASE = {
      out: function (k) { return 1 - Math.pow(1 - k, 4); },
      back: function (k) { var c1 = 1.1, c3 = c1 + 1, x = k - 1; return 1 + c3 * x * x * x + c1 * x * x; }
    };
    function loop(now) {
      if (mode === 'spin') {
        angle += vel;
        vel *= 0.965;
        if (Math.abs(vel) < 0.35) { mode = 'snap'; target = Math.round(angle / step) * step; }
      } else if (mode === 'snap') {
        angle += (target - angle) * 0.14;
        if (Math.abs(target - angle) < 0.03) { angle = target; mode = 'idle'; }
      } else if (mode === 'tween' && tw) {
        var k = Math.min(1, (now - tw.t0) / tw.dur);
        angle = tw.from + (tw.to - tw.from) * EASE[tw.ease](k);
        if (k >= 1) { angle = tw.to; var after = tw.after; tw = null; mode = 'idle'; if (after) after(); }
      }
      render();
      if (mode === 'drag') { running = false; return; }
      if (mode === 'idle') { running = false; land(false); return; }
      requestAnimationFrame(loop);
    }
    function wake() { if (running) return; running = true; unland(); requestAnimationFrame(loop); }
    function tween(to, dur, ease, after) {
      if (RM) { angle = to; render(); if (after) after(); else land(true); return; }
      tw = { from: angle, to: to, t0: performance.now(), dur: dur, ease: ease || 'out', after: after };
      mode = 'tween';
      vel = 0;
      wake();
    }
    function goTo(i) {
      var base = -i * step;
      tween(base + Math.round((angle - base) / 360) * 360, 650, 'out');
    }
    function stepBy(dir) { goTo(mod((active < 0 ? 0 : active) + dir, n)); }
    /* 離したときの判定：速ければ回す、ゆっくりなら一つ隣へ */
    function release(total, v, base) {
      if (Math.abs(v) > FAST && !RM) {
        vel = Math.max(-36, Math.min(36, v * 16.7 * degPerPx() * 2.6));
        mode = 'spin';
        wake();
        return;
      }
      var nearest = Math.round(angle / step) * step, to;
      if (Math.abs(total) < cw * 0.08) to = base;
      else if (nearest !== base) to = nearest;
      else to = base + (total > 0 ? step : -step);
      tween(to, 560, 'back');
    }
    function speedOf(samples) {
      var now = performance.now();
      var s = samples.filter(function (q) { return now - q[1] <= 100; });
      if (s.length < 2) return 0;
      var dt = s[s.length - 1][1] - s[0][1];
      return dt > 0 ? (s[s.length - 1][0] - s[0][0]) / dt : 0;
    }
    function grab() {
      mode = 'drag';
      vel = 0;
      tw = null;
      unland();
      stage.classList.add('grabbing');
      return Math.round(angle / step) * step;
    }

    layouts.push(measure);
    measure();
    land(true);

    /* ドラッグ・スワイプ */
    stage.addEventListener('pointerdown', function (e) {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      if (e.target.closest('.roul-nav')) return;
      drag = { x0: e.clientX, y0: e.clientY, last: e.clientX, axis: null, base: 0, s: [[e.clientX, performance.now()]] };
      moved = false;
    });
    window.addEventListener('pointermove', function (e) {
      if (!drag) return;
      if (drag.axis === null) {
        var ax = Math.abs(e.clientX - drag.x0), ay = Math.abs(e.clientY - drag.y0);
        if (ax < 6 && ay < 6) return;
        drag.axis = ax > ay ? 'x' : 'y';
        if (drag.axis === 'y') { drag = null; return; }
        moved = true;
        drag.base = grab();
      }
      var dx = e.clientX - drag.last;
      drag.last = e.clientX;
      drag.s.push([e.clientX, performance.now()]);
      if (drag.s.length > 12) drag.s.shift();
      angle += dx * degPerPx();
      render();
      if (e.cancelable) e.preventDefault();
    }, { passive: false });
    function endDrag() {
      if (!drag) return;
      var dd = drag;
      drag = null;
      stage.classList.remove('grabbing');
      if (dd.axis !== 'x') return;
      dd.s.push([dd.last, performance.now()]);
      release(dd.last - dd.x0, speedOf(dd.s), dd.base);
    }
    window.addEventListener('pointerup', endDrag);
    window.addEventListener('pointercancel', endDrag);

    /* トラックパッドの横スワイプ */
    var wh = null;
    stage.addEventListener('wheel', function (e) {
      if (Math.abs(e.deltaX) <= Math.abs(e.deltaY) || Math.abs(e.deltaX) < 1) return;
      e.preventDefault();
      if (!wh) wh = { base: grab(), total: 0, x: 0, s: [], peak: 0 };
      var dx = -e.deltaX;
      wh.total += dx;
      wh.x += dx;
      wh.s.push([wh.x, performance.now()]);
      if (wh.s.length > 12) wh.s.shift();
      wh.peak = Math.max(Math.abs(speedOf(wh.s)), wh.peak) * (wh.total < 0 ? -1 : 1) || wh.peak;
      angle += dx * degPerPx();
      render();
      clearTimeout(wh.timer);
      var cur = wh;
      cur.timer = setTimeout(function () {
        if (wh !== cur) return;
        wh = null;
        stage.classList.remove('grabbing');
        release(cur.total, Math.abs(cur.peak) > FAST * 1.6 ? cur.peak : 0, cur.base);
      }, 120);
    }, { passive: false });

    /* 押す・タブ・前後ボタン・キー */
    items.forEach(function (it, i) {
      it.addEventListener('click', function (e) {
        if (moved) { e.preventDefault(); moved = false; return; }
        if (i !== active || mode !== 'idle') { e.preventDefault(); goTo(i); }
      });
    });
    tabs.forEach(function (t, j) { t.addEventListener('click', function () { goTo(j); }); });
    if (prevBtn) prevBtn.addEventListener('click', function () { stepBy(-1); });
    if (nextBtn) nextBtn.addEventListener('click', function () { stepBy(1); });
    stage.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight') { e.preventDefault(); stepBy(1); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); stepBy(-1); }
      else if (e.key === 'Enter' && items[active] && e.target === stage) { location.href = items[active].href; }
    });

    /* 初めて見えたとき、少しだけ揺らして「動かせる」ことを伝える */
    if ('IntersectionObserver' in window && !RM) {
      var ho = new IntersectionObserver(function (es) {
        es.forEach(function (e) {
          if (!e.isIntersecting || hinted || mode !== 'idle') return;
          hinted = true;
          ho.disconnect();
          var base = Math.round(angle / step) * step;
          setTimeout(function () {
            if (mode !== 'idle') return;
            tween(base - step * 0.3, 420, 'out', function () { tween(base, 700, 'back'); });
          }, 500);
        });
      }, { threshold: 0.6 });
      ho.observe(stage);
    }
  });

  /* ---------- 体験の3コマ（画面中央の帯を跨いだら切替） ---------- */
  d.querySelectorAll('[data-steps]').forEach(function (sec) {
    var steps = [].slice.call(sec.querySelectorAll('.st'));
    var media = [].slice.call(sec.querySelectorAll('.st-media .sm'));
    var num = sec.querySelector('.st-count b');
    var hues = [205, 190, 262];
    function set(i) {
      steps.forEach(function (s, j) { s.classList.toggle('on', j === i); });
      media.forEach(function (m, j) { m.classList.toggle('on', j === i); m.classList.toggle('prev', j < i); });
      sec.style.setProperty('--hue', hues[i] || 205);
      if (num) num.textContent = '0' + (i + 1);
    }
    set(0);
    if (!('IntersectionObserver' in window) || RM) return;
    var o = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) set(steps.indexOf(e.target)); });
    }, { rootMargin: '-48% 0px -48% 0px' });
    steps.forEach(function (s) { o.observe(s); });
  });

  /* ---------- 水面の波紋（キャンバス） ---------- */
  d.querySelectorAll('canvas[data-ripples]').forEach(function (c) {
    if (RM) return;
    var x = c.getContext('2d'), W = 0, H = 0, dpr = Math.min(window.devicePixelRatio || 1, 2), rings = [];
    var color = c.getAttribute('data-ripples') || '233,217,176';
    var area = c.parentElement;
    function size() { W = c.clientWidth; H = c.clientHeight; c.width = W * dpr; c.height = H * dpr; x.setTransform(dpr, 0, 0, dpr, 0, 0); }
    size();
    layouts.push(size);
    function drop(px, py, n) { var now = performance.now(); for (var i = 0; i < (n || 3); i++) rings.push({ x: px, y: py, d: i * 380, born: now }); }
    function auto() { drop(W * (0.25 + Math.random() * 0.6), H * (0.35 + Math.random() * 0.45)); }
    auto();
    setInterval(function () { if (!d.hidden) auto(); }, 3600);
    area.addEventListener('pointerdown', function (e) {
      if (e.target.closest('a,button,select,input,form')) return;
      var b = c.getBoundingClientRect(); drop(e.clientX - b.left, e.clientY - b.top, 4);
    });
    area.querySelectorAll('[data-drop]').forEach(function (el) {
      el.addEventListener('pointerenter', function () {
        var b = c.getBoundingClientRect(), r = el.getBoundingClientRect();
        drop(r.left + r.width / 2 - b.left, r.top + r.height / 2 - b.top, 3);
      });
    });
    function loop(now) {
      x.clearRect(0, 0, W, H);
      rings = rings.filter(function (g) {
        var age = now - g.born - g.d;
        if (age < 0) return true;
        var life = 5200;
        if (age > life) return false;
        var k = age / life, r = 30 + k * Math.max(W, H) * 0.5, a = (1 - k) * (1 - k) * 0.6;
        x.beginPath();
        x.ellipse(g.x, g.y, r, r * 0.42, 0, 0, Math.PI * 2);
        x.strokeStyle = 'rgba(' + color + ',' + a.toFixed(3) + ')';
        x.lineWidth = 1.4 * (1 - k) + 0.3;
        x.stroke();
        return true;
      });
      requestAnimationFrame(loop);
    }
    requestAnimationFrame(loop);
  });

  /* ---------- ボタンの波紋 ---------- */
  d.addEventListener('pointerdown', function (e) {
    var b = !RM && e.target.closest && e.target.closest('.rip');
    if (!b) return;
    var r = b.getBoundingClientRect(), s = d.createElement('span'), size = Math.max(r.width, r.height) * 2.2;
    s.className = 'rip-wave';
    s.style.width = s.style.height = size + 'px';
    s.style.left = (e.clientX - r.left - size / 2) + 'px';
    s.style.top = (e.clientY - r.top - size / 2) + 'px';
    b.appendChild(s);
    setTimeout(function () { if (s.parentNode) s.parentNode.removeChild(s); }, 900);
  });

  layout();
})();
