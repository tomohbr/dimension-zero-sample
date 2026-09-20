/* 投稿画面（サンプル）
   サンプルでは保存先をこのブラウザの localStorage にしている。本番では管理画面のデータ（CMS）に置き換える。 */
(function () {
  'use strict';
  var d = document, R = window.DZRisk, KEY = 'dz_posts_v1';
  var $ = function (id) { return d.getElementById(id); };
  var seed = [];
  var WD = ['日', '月', '火', '水', '木', '金', '土'];

  function local() { try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch (e) { return []; } }
  function saveLocal(arr) {
    try { localStorage.setItem(KEY, JSON.stringify(arr)); return true; }
    catch (e) { alert('保存できませんでした。写真が大きすぎる可能性があります。写真を小さくするか、写真なしで保存してください。'); return false; }
  }
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function today() { var t = new Date(); return t.getFullYear() + '-' + pad(t.getMonth() + 1) + '-' + pad(t.getDate()); }
  function md(s) { if (!s) return ''; var p = s.split('-'), dt = new Date(+p[0], +p[1] - 1, +p[2]); return (+p[1]) + '月' + (+p[2]) + '日（' + WD[dt.getDay()] + '）'; }
  function ymd(s) { return s ? s.split('-')[0] + '年' + md(s) : ''; }
  function esc(s) { return R.esc(s); }
  function inline(t) { return R.mark(esc(t)); }
  function rich(t) { return String(t || '').split(/\n{2,}/).map(function (p) { return '<p>' + inline(p).replace(/\n/g, '<br>') + '</p>'; }).join(''); }
  function timeStr(e) { return e.start ? e.start + (e.end ? '〜' + e.end : '〜') : ''; }

  /* ---------- タブ ---------- */
  var tabs = [].slice.call(d.querySelectorAll('#admTabs button'));
  function show(t) {
    tabs.forEach(function (b) { b.classList.toggle('on', b.getAttribute('data-t') === t); });
    d.querySelectorAll('.pane').forEach(function (p) { p.classList.toggle('on', p.id === 'pane-' + t); });
    if (t === 'list') renderList();
    if (t === 'promo') renderPromoSelect();
    if (t === 'plan') renderPlanSelect();
    try { history.replaceState(null, '', '#' + t); } catch (e) {}
  }
  tabs.forEach(function (b) { b.addEventListener('click', function () { show(b.getAttribute('data-t')); }); });

  /* ---------- 写真（長い辺1200pxに縮めて保存） ---------- */
  var images = { ev: '', po: '' };
  function readImage(file, cb) {
    var fr = new FileReader();
    fr.onload = function () {
      var im = new Image();
      im.onload = function () {
        var k = Math.min(1, 1200 / Math.max(im.width, im.height));
        var c = d.createElement('canvas');
        c.width = Math.round(im.width * k); c.height = Math.round(im.height * k);
        c.getContext('2d').drawImage(im, 0, 0, c.width, c.height);
        cb(c.toDataURL('image/jpeg', 0.8));
      };
      im.src = fr.result;
    };
    fr.readAsDataURL(file);
  }

  /* ---------- 表現チェック ---------- */
  function checkHtml(text) {
    var hits = R.scan(text);
    if (!hits.length) return '<p class="ok">気になる言葉は見つかりませんでした。</p>';
    return hits.map(function (h) {
      return '<div class="chk"><span class="lv ' + h.lv + '">' + (h.lv === 'red' ? '先に直す' : '言い換え') + '</span><b>「' + esc(h.word) + '」' + (h.count > 1 ? ' ×' + h.count : '') + '</b><small>' + esc(h.why) + '　例：' + esc(h.fix) + '</small></div>';
    }).join('') + '<p class="hint" style="margin:10px 0 0">言葉の自動チェックです。文の流れで問題になる書き方もあるので、迷ったらご相談ください。</p>';
  }

  /* ---------- イベント ---------- */
  var evFields = ['evTitle', 'evDate', 'evStart', 'evEnd', 'evVenue', 'evAddress', 'evFee', 'evCapacity', 'evOrg', 'evApply', 'evBody', 'evDeadline', 'evPublish', 'evNotes', 'evContact'];
  function evData() {
    return {
      type: 'event', id: $('evId').value || ('ev-' + Date.now()), title: $('evTitle').value.trim(), date: $('evDate').value,
      start: $('evStart').value, end: $('evEnd').value, venue: $('evVenue').value.trim(), address: $('evAddress').value.trim(),
      fee: $('evFee').value.trim(), capacity: $('evCapacity').value.trim(), organizer: $('evOrg').value.trim(),
      applyUrl: $('evApply').value.trim(), image: images.ev, body: $('evBody').value,
      deadline: $('evDeadline').value, publishAt: $('evPublish').value,
      notes: $('evNotes').value.trim(), contact: $('evContact').value.trim()
    };
  }
  function evPreview() {
    var e = evData();
    $('evPreview').innerHTML = '<div class="evc"><div class="evc-img"><img src="' + esc(e.image || 'img/tex-water.jpg') + '" alt=""></div><div class="evc-body">' +
      '<div class="evc-date">' + esc(e.date ? ymd(e.date) : '開催日') + (e.start ? '　' + esc(e.start) + '〜' : '') + '</div>' +
      '<h3>' + (e.title ? inline(e.title) : '<span style="color:var(--faint)">イベント名</span>') + '</h3>' +
      '<div class="evc-meta">' + esc(e.venue || '会場名') + (e.address ? '（' + esc(e.address) + '）' : '') + '</div>' +
      (e.fee ? '<div class="evc-meta">参加費 ' + esc(e.fee) + '</div>' : '') +
      (e.deadline ? '<div class="evc-meta">お申し込みは ' + esc(md(e.deadline)) + ' まで</div>' : '') + '</div></div>' +
      (e.body ? '<div class="evd-body" style="margin-top:14px">' + rich(e.body) + '</div>' : '') +
      (e.notes ? '<div class="evd-body" style="margin-top:8px"><p><b>持ち物・お願い</b>　' + inline(e.notes) + '</p></div>' : '') +
      (e.applyUrl ? '<p style="margin-top:10px"><span class="btn small primary">申し込む</span></p>' : '');
    $('evCheck').innerHTML = checkHtml([e.title, e.venue, e.organizer, e.body].join('\n'));
  }
  evFields.forEach(function (f) { $(f).addEventListener('input', evPreview); });
  $('evImage').addEventListener('change', function () {
    var f = this.files[0]; if (!f) return;
    $('evImgState').textContent = '写真を読み込み中…';
    readImage(f, function (url) { images.ev = url; $('evImgState').textContent = '写真を入れました（' + Math.round(url.length / 1024) + 'KB）'; evPreview(); });
  });
  function evClear() {
    $('evForm').reset(); $('evId').value = ''; images.ev = '';
    $('evImgState').textContent = '写真がないときは水面の写真が入ります';
    $('evSaved').hidden = true; evPreview();
  }
  $('evClear').addEventListener('click', evClear);
  $('evForm').addEventListener('submit', function (ev) {
    ev.preventDefault();
    var e = evData();
    var reds = R.scan([e.title, e.venue, e.body].join('\n')).filter(function (h) { return h.lv === 'red'; });
    if (reds.length && !confirm('「先に直す」言葉が ' + reds.length + ' 種類あります。このまま保存しますか？')) return;
    if (!upsert(e)) return;
    $('evId').value = e.id;
    $('evSaved').hidden = false;
    $('evSaved').innerHTML = '保存しました。<a href="event.html?id=' + encodeURIComponent(e.id) + '" target="_blank" rel="noopener">サイトで見る</a>　／　<a href="#promo" data-go-promo="' + esc(e.id) + '">このイベントの告知をつくる</a>';
  });

  /* ---------- ブログ ---------- */
  var poFields = ['poTitle', 'poDate', 'poAuthor', 'poBody'];
  function poData() {
    return { type: 'post', id: $('poId').value || ('post-' + Date.now()), title: $('poTitle').value.trim(), date: $('poDate').value, author: $('poAuthor').value, image: images.po, body: $('poBody').value };
  }
  function poPreview() {
    var p = poData();
    $('poPreview').innerHTML = '<div class="evc-date">' + esc(p.date ? ymd(p.date) : '日付') + '　' + esc(p.author) + '</div>' +
      '<h1 class="post-title" style="font-size:26px">' + (p.title ? inline(p.title) : '<span style="color:var(--faint)">タイトル</span>') + '</h1>' +
      (p.image ? '<div class="post-img"><img src="' + esc(p.image) + '" alt=""></div>' : '') +
      '<div class="post-body">' + (p.body ? rich(p.body) : '<p style="color:var(--faint)">本文</p>') + '</div>';
    $('poCheck').innerHTML = checkHtml(p.title + '\n' + p.body);
  }
  poFields.forEach(function (f) { $(f).addEventListener('input', poPreview); });
  $('poImage').addEventListener('change', function () {
    var f = this.files[0]; if (!f) return;
    $('poImgState').textContent = '写真を読み込み中…';
    readImage(f, function (url) { images.po = url; $('poImgState').textContent = '写真を入れました（' + Math.round(url.length / 1024) + 'KB）'; poPreview(); });
  });
  function poClear() {
    $('poForm').reset(); $('poId').value = ''; images.po = ''; $('poDate').value = today();
    $('poImgState').textContent = '写真がないときは夕景の写真が入ります';
    $('poSaved').hidden = true; poPreview();
  }
  $('poClear').addEventListener('click', poClear);
  $('poForm').addEventListener('submit', function (ev) {
    ev.preventDefault();
    var p = poData();
    var reds = R.scan(p.title + '\n' + p.body).filter(function (h) { return h.lv === 'red'; });
    if (reds.length && !confirm('「先に直す」言葉が ' + reds.length + ' 種類あります。このまま保存しますか？')) return;
    if (!upsert(p)) return;
    $('poId').value = p.id;
    $('poSaved').hidden = false;
    $('poSaved').innerHTML = '保存しました。<a href="post.html?id=' + encodeURIComponent(p.id) + '" target="_blank" rel="noopener">サイトで見る</a>';
  });

  function upsert(item) {
    var arr = local().filter(function (x) { return x.id !== item.id; });
    arr.push(item);
    return saveLocal(arr);
  }

  /* ---------- 載せたもの ---------- */
  function allItems() {
    var byId = {};
    seed.forEach(function (p) { byId[p.id] = Object.assign({}, p, { seed: true }); });
    local().forEach(function (p) { byId[p.id] = Object.assign({}, p, { local: true }); });
    return Object.keys(byId).map(function (k) { return byId[k]; }).sort(function (a, b) { return a.date < b.date ? 1 : -1; });
  }
  function renderList() {
    var items = allItems();
    $('admList').innerHTML = items.map(function (p) {
      var url = (p.type === 'event' ? 'event.html' : 'post.html') + '?id=' + encodeURIComponent(p.id);
      var hits = R.scan([p.title, p.body].join('\n'));
      var red = hits.filter(function (h) { return h.lv === 'red'; }).length, yel = hits.length - red;
      return '<div class="li"><div><div class="kind">' + (p.type === 'event' ? 'イベント' : 'ブログ') + '</div><div class="d">' + esc(p.date) + '</div></div>' +
        '<div><div class="t">' + inline(p.title) + '</div><div class="d">' + (p.local ? '投稿画面から追加' : '現行サイトから移したもの') +
        (red ? '　<span style="color:#B4231E;font-weight:700">先に直す ' + red + '</span>' : '') + (yel ? '　<span style="color:#8C6A12;font-weight:700">言い換え ' + yel + '</span>' : '') + '</div></div>' +
        '<div class="acts"><a class="btn small ghost" href="' + url + '" target="_blank" rel="noopener">見る</a>' +
        '<button class="btn small ghost" type="button" data-edit="' + esc(p.id) + '">直す</button>' +
        (p.local ? '<button class="btn small ghost" type="button" data-del="' + esc(p.id) + '">消す</button>' : '') + '</div></div>';
    }).join('') || '<p class="hint">まだありません。</p>';
  }
  d.addEventListener('click', function (ev) {
    var del = ev.target.closest('[data-del]');
    if (del) {
      if (!confirm('この投稿を消しますか？')) return;
      var id = del.getAttribute('data-del');
      saveLocal(local().filter(function (x) { return x.id !== id; }));
      renderList();
      return;
    }
    var ed = ev.target.closest('[data-edit]');
    if (ed) {
      var id2 = ed.getAttribute('data-edit');
      var it = allItems().filter(function (x) { return x.id === id2; })[0];
      if (!it) return;
      if (it.type === 'event') {
        show('event');
        $('evId').value = it.id; $('evTitle').value = it.title || ''; $('evDate').value = it.date || ''; $('evStart').value = it.start || ''; $('evEnd').value = it.end || '';
        $('evVenue').value = it.venue || ''; $('evAddress').value = it.address || ''; $('evFee').value = it.fee || ''; $('evCapacity').value = it.capacity || '';
        $('evOrg').value = it.organizer || ''; $('evApply').value = it.applyUrl || ''; $('evBody').value = it.body || ''; images.ev = it.image || '';
        $('evDeadline').value = it.deadline || ''; $('evPublish').value = it.publishAt || '';
        $('evNotes').value = it.notes || ''; $('evContact').value = it.contact || '';
        $('evSaved').hidden = true; evPreview();
      } else {
        show('post');
        $('poId').value = it.id; $('poTitle').value = it.title || ''; $('poDate').value = it.date || ''; $('poAuthor').value = it.author || 'ZAK';
        $('poBody').value = it.body || ''; images.po = it.image || ''; $('poSaved').hidden = true; poPreview();
      }
      window.scrollTo(0, 0);
      return;
    }
    var go = ev.target.closest('[data-go-promo]');
    if (go) {
      ev.preventDefault();
      show('promo');
      $('prEvent').value = go.getAttribute('data-go-promo');
      renderPromo();
    }
  });

  /* ---------- 告知をつくる ---------- */
  function eventsForPromo() {
    var t = today();
    return allItems().filter(function (p) { return p.type === 'event'; }).sort(function (a, b) {
      var au = a.date >= t, bu = b.date >= t;
      if (au !== bu) return au ? -1 : 1;
      return au ? (a.date < b.date ? -1 : 1) : (a.date < b.date ? 1 : -1);
    });
  }
  function renderPromoSelect() {
    var cur = $('prEvent').value, evs = eventsForPromo();
    $('prEvent').innerHTML = evs.map(function (e) { return '<option value="' + esc(e.id) + '">' + esc(e.date) + '　' + esc(e.title) + '</option>'; }).join('');
    if (cur && evs.some(function (e) { return e.id === cur; })) $('prEvent').value = cur;
    renderPromo();
  }
  $('prEvent').addEventListener('change', renderPromo);
  function siteUrl(e) { return location.href.replace(/admin\.html.*$/, '') + 'event.html?id=' + encodeURIComponent(e.id); }
  function pref(addr) { var m = String(addr || '').match(/^(北海道|東京都|京都府|大阪府|.{2,3}県)/); return m ? m[1].replace(/[都府県]$/, '') : ''; }
  function texts(e) {
    var when = ymd(e.date) + (e.start ? '　' + timeStr(e) : '');
    var where = (e.venue || '') + (e.address ? '（' + e.address + '）' : '');
    var lead = String(e.body || '').split(/\n/).filter(Boolean)[0] || '';
    if (lead.length > 60) lead = lead.slice(0, 60) + '…';
    var apply = e.applyUrl || siteUrl(e);
    var p = pref(e.address);
    var line = ['【イベントのお知らせ】', e.title, '', '■日時　' + when, '■会場　' + where]
      .concat(e.fee ? ['■参加費　' + e.fee] : []).concat(e.capacity ? ['■定員　' + e.capacity] : [])
      .concat(lead ? ['', lead] : []).concat(['', '▼お申し込みはこちら', apply, '', 'ご質問は、このトークにそのまま返信してください。']).join('\n');
    var tagsIg = ['#ディメンションゼロ', '#オハナシ会', '#水と振動'].concat(p ? ['#' + p + 'イベント'] : []).join(' ');
    var ig = [e.title, '', '日時　' + when, '会場　' + where].concat(e.fee ? ['参加費　' + e.fee] : [])
      .concat(lead ? ['', lead] : []).concat(['', 'お申し込みは、プロフィールのリンクから。', '公式LINEでもご案内しています。', '', tagsIg]).join('\n');
    var fb = ['【' + e.title + '】', '', '日時：' + when, '会場：' + where].concat(e.fee ? ['参加費：' + e.fee] : []).concat(e.capacity ? ['定員：' + e.capacity] : [])
      .concat(lead ? ['', lead] : []).concat(['', 'くわしい内容とお申し込みはこちら', apply, '', '主催：' + (e.organizer || '一般財団法人ディメンション・ゼロ')]).join('\n');
    var gbp = [e.title + '　' + md(e.date) + (e.start ? ' ' + e.start + '〜' : ''), where].concat(lead ? [lead] : []).concat(['お申し込みはサイトから。']).join('\n');
    var dl = e.deadline ? ('お申し込みは ' + md(e.deadline) + ' まで') : '';
    var remind = ['【明日です】' + e.title, '', 'いよいよ明日になりました。お待ちしています。', '',
      '■日時　' + when, '■会場　' + where]
      .concat(e.notes ? ['■お願い　' + e.notes] : [])
      .concat(e.contact ? ['■当日の連絡先　' + e.contact] : [])
      .concat(['', '道に迷われたときは、このトークにご連絡ください。']).join('\n');
    var salon = ['サロンのみなさまへ', '', '下記のイベントを開きます。よろしければ、お店のSNSやLINEでご紹介ください。',
      'この文はそのままお使いいただけます。', '', '───────', e.title, '日時　' + when, '会場　' + where]
      .concat(e.fee ? ['参加費　' + e.fee] : []).concat(dl ? [dl] : [])
      .concat(['お申し込み　' + apply, '───────', '', '告知画像は、この画面の右側から保存できます。']).join('\n');
    return [
      ['LINE配信', line, 'LINE公式アカウントの「メッセージ配信」に貼ります。'],
      ['前日のリマインド', remind, '申込者へのメッセージです。前日にお送りします。'],
      ['サロンさんへの共有', salon, '近くのサロンさんに送る文です。そのまま転載していただけます。'],
      ['Instagram', ig, '投稿の説明文に貼ります。リンクはプロフィール欄に置きます。'],
      ['Facebook', fb, 'Facebookページの投稿、またはFacebookイベントの詳細に貼ります。'],
      ['Googleビジネスプロフィール', gbp, '「イベント」の投稿に貼ります。タイトルと日時は投稿画面の欄にも入れます。']
    ];
  }
  function renderPromo() {
    var id = $('prEvent').value;
    var e = allItems().filter(function (x) { return x.id === id; })[0];
    if (!e) { $('prTexts').innerHTML = '<p class="hint">イベントがありません。先に「イベントを載せる」から保存してください。</p>'; return; }
    var list = texts(e);
    $('prTexts').innerHTML = list.map(function (t, i) {
      return '<div class="ptx"><div class="ptx-hd"><div><b>' + t[0] + '</b><small>' + t[1].length + '文字</small></div><button class="btn small ghost" type="button" data-copy="pt' + i + '">コピー</button></div>' +
        '<textarea id="pt' + i + '" readonly>' + esc(t[1]) + '</textarea><div class="hint" style="margin:6px 0 0;font-size:12.5px">' + t[2] + '</div></div>';
    }).join('');
    $('prCheck').innerHTML = checkHtml(list.map(function (t) { return t[1]; }).join('\n'));
    drawAll(e);
  }
  d.addEventListener('click', function (ev) {
    var c = ev.target.closest('[data-copy]');
    if (!c) return;
    var ta = $(c.getAttribute('data-copy'));
    var done = function () { c.textContent = 'コピーしました'; setTimeout(function () { c.textContent = 'コピー'; }, 1500); };
    var fallback = function () { ta.select(); try { d.execCommand('copy'); done(); } catch (e) {} };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(ta.value).then(done, fallback);
    else fallback();
  });

  /* ---------- 告知画像 ---------- */
  function loadImg(src) { return new Promise(function (res) { var im = new Image(); im.onload = function () { res(im); }; im.onerror = function () { res(null); }; im.src = src; }); }
  function cover(x, im, dx, dy, dw, dh) {
    var r = Math.max(dw / im.width, dh / im.height), w = im.width * r, h = im.height * r;
    x.save(); x.beginPath(); x.rect(dx, dy, dw, dh); x.clip();
    x.drawImage(im, dx + (dw - w) / 2, dy + (dh - h) / 2, w, h);
    x.restore();
  }
  function wrap(x, text, maxW) {
    var lines = [], cur = '';
    Array.from(String(text || '')).forEach(function (ch) {
      var t = cur + ch;
      if (x.measureText(t).width > maxW && cur) { lines.push(cur); cur = ch; } else cur = t;
    });
    if (cur) lines.push(cur);
    return lines;
  }
  var token = 0;
  function drawAll(e) {
    var tk = ++token;
    var fonts = (d.fonts && d.fonts.load) ? Promise.all([
      d.fonts.load('600 72px "Shippori Mincho"'), d.fonts.load('italic 500 40px "Cormorant Garamond"'), d.fonts.load('700 40px "Zen Kaku Gothic New"'), d.fonts.load('500 36px "Zen Kaku Gothic New"')
    ]).catch(function () {}) : Promise.resolve();
    Promise.all([fonts, loadImg(e.image || 'img/tex-water.jpg')]).then(function (r) {
      if (tk !== token) return;
      draw($('prSquare'), e, r[1]);
      draw($('prStory'), e, r[1]);
    });
  }
  function draw(c, e, im) {
    var x = c.getContext('2d'), W = c.width, H = c.height, story = H > W;
    var s = story ? 1.15 : 1;
    x.fillStyle = '#061626'; x.fillRect(0, 0, W, H);
    var ph = Math.round(story ? H * 0.44 : H * 0.38);
    if (im) cover(x, im, 0, 0, W, ph);
    var g = x.createLinearGradient(0, ph * 0.3, 0, ph);
    g.addColorStop(0, 'rgba(6,22,38,0)'); g.addColorStop(1, 'rgba(6,22,38,1)');
    x.fillStyle = g; x.fillRect(0, 0, W, ph + 2);
    x.strokeStyle = 'rgba(233,217,176,.7)'; x.lineWidth = 2; x.strokeRect(36, 36, W - 72, H - 72);
    var pad = 90, y = ph + (story ? 40 : 6);
    x.textBaseline = 'top';
    x.fillStyle = '#E9D9B0'; x.font = 'italic 500 ' + Math.round(38 * s) + 'px "Cormorant Garamond", serif';
    x.fillText('Event  ·  Dimension ∞ Zero', pad, y); y += Math.round(70 * s);
    var fs = Math.round(64 * s);
    x.fillStyle = '#FFFFFF'; x.font = '600 ' + fs + 'px "Shippori Mincho", serif';
    var lines = wrap(x, e.title, W - pad * 2);
    if (lines.length > 2) { lines = lines.slice(0, 2); lines[1] = lines[1].slice(0, -1) + '…'; }
    lines.forEach(function (l) { x.fillText(l, pad, y); y += fs * 1.35; });
    y += 16;
    x.fillStyle = '#E9D9B0'; x.fillRect(pad, y, 120, 3); y += Math.round(34 * s);
    x.fillStyle = '#FFFFFF'; x.font = '700 ' + Math.round(46 * s) + 'px "Zen Kaku Gothic New", sans-serif';
    x.fillText(ymd(e.date) + (e.start ? '　' + timeStr(e) : ''), pad, y); y += Math.round(66 * s);
    x.fillStyle = 'rgba(255,255,255,.9)'; x.font = '500 ' + Math.round(36 * s) + 'px "Zen Kaku Gothic New", sans-serif';
    var venue = wrap(x, (e.venue || '') + (e.address ? '　' + e.address : ''), W - pad * 2);
    venue.slice(0, story ? 2 : 1).forEach(function (l, i, arr) {
      var t = (!story && venue.length > 1 && i === arr.length - 1) ? l.slice(0, -1) + '…' : l;
      x.fillText(t, pad, y); y += Math.round(36 * s * 1.45);
    });
    if (e.fee) { x.fillText('参加費　' + e.fee, pad, y); y += Math.round(36 * s * 1.45); }
    x.fillStyle = 'rgba(233,217,176,.95)'; x.font = '700 ' + Math.round(32 * s) + 'px "Zen Kaku Gothic New", sans-serif';
    x.fillText('お申し込みは公式LINE・サイトから', pad, H - pad - Math.round(70 * s));
    x.fillStyle = 'rgba(255,255,255,.75)'; x.font = '500 ' + Math.round(28 * s) + 'px "Zen Kaku Gothic New", sans-serif';
    x.fillText('一般財団法人ディメンション・ゼロ', pad, H - pad - Math.round(26 * s));
  }
  d.addEventListener('click', function (ev) {
    var b = ev.target.closest('[data-dl]');
    if (!b) return;
    var c = $(b.getAttribute('data-dl'));
    c.toBlob(function (blob) {
      var a = d.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = '告知_' + ($('prEvent').value || 'event') + '_' + (c.height > c.width ? '縦長' : '正方形') + '.png';
      d.body.appendChild(a); a.click();
      setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
    }, 'image/png');
  });


  /* ================= ここから：イベントを打ちやすくする道具（2026-09-20 追加） ================= */

  /* ---------- ひな形 ---------- */
  var TEMPLATES = {
    ohanashi: {
      title: '開発者ZAKのオハナシ会', dur: '120', fee: '3,000円', capacity: '30名',
      org: '一般財団法人ディメンション・ゼロ',
      notes: 'ゆったりした服装でお越しください。お飲み物はご用意しています。',
      body: 'ディメンションシステムを開発したZAKが、水と振動のこと、これまでの歩みについてお話しします。\n\nはじめての方も、いつもお世話になっている方も、どうぞお気軽にお越しください。お話のあとに、ご質問の時間をとっています。\n\n【当日の流れ】\n・開場（15分前から）\n・オハナシ会\n・質問の時間\n・おわりのご案内'
    },
    taiken: {
      title: 'ディメンションサロン体験会', dur: '180', fee: '無料', capacity: '各回4名',
      org: 'ディメンションサロン',
      notes: '体験の時間は、お一人およそ35分です。時間の指定がある方は、お申し込みのときにお知らせください。',
      body: 'サロン専用機「ディメンション・プロ」を体験していただける日です。\n\n音と光に包まれる、およそ35分。はじめての方には、仕組みのご説明もあわせてさせていただきます。\n\n【こんな方へ】\n・ディメンションを一度試してみたい方\n・ご家庭用デバイスを考えている方'
    },
    open: {
      title: '◯◯サロン オープン記念イベント', dur: '240', fee: '無料', capacity: '',
      org: 'ディメンションサロン',
      notes: 'ご予約なしでもお立ち寄りいただけます。',
      body: 'このたび、◯◯に新しいディメンションサロンがオープンしました。\n\nオープンを記念して、体験の会を開きます。お近くの方は、ぜひのぞいてみてください。\n\n【当日できること】\n・ディメンション・プロの体験\n・ご家庭用デバイスのご紹介\n・サロンオーナーとのおはなし'
    },
    setsumei: {
      title: 'サロン開業の説明会', dur: '90', fee: '無料', capacity: '10名',
      org: '一般財団法人ディメンション・ゼロ',
      notes: '個別のご相談をご希望の方は、お申し込みのときにその旨をお書きください。',
      body: 'ディメンションサロンを開くことを考えている方に向けた説明会です。\n\n販売店契約の仕組み、開業までの流れ、導入にかかるもの、開業後のサポートについてご説明します。すでにサロンを開いている方のお話も聞いていただけます。\n\n【対象】\n・自宅の一室から始めたい方\n・いまのお店に取り入れたい方'
    }
  };
  function addDays(ds, n) {
    if (!ds) return '';
    var p = ds.split('-'), t = new Date(+p[0], +p[1] - 1, +p[2]);
    t.setDate(t.getDate() + n);
    return t.getFullYear() + '-' + pad(t.getMonth() + 1) + '-' + pad(t.getDate());
  }
  function applyEnd() {
    var st = $('evStart').value, du = $('evDur').value;
    if (!st || !du) return;
    var h = +st.split(':')[0], m = +st.split(':')[1] + (+du);
    h += Math.floor(m / 60); m = m % 60; h = h % 24;
    $('evEnd').value = pad(h) + ':' + pad(m);
    evPreview();
  }
  $('evStart').addEventListener('change', applyEnd);
  $('evDur').addEventListener('change', applyEnd);

  d.addEventListener('click', function (ev) {
    var t = ev.target.closest('[data-tmpl]');
    if (!t) return;
    var k = t.getAttribute('data-tmpl'), tp = TEMPLATES[k];
    if (!tp) return;
    if ($('evTitle').value.trim() && !confirm('いま書いている内容を、ひな形で置き換えますか？')) return;
    evClear();
    $('evTitle').value = tp.title; $('evFee').value = tp.fee; $('evCapacity').value = tp.capacity;
    $('evOrg').value = tp.org; $('evNotes').value = tp.notes; $('evBody').value = tp.body;
    $('evDur').value = tp.dur;
    $('evDate').value = addDays(today(), 21);
    $('evStart').value = k === 'taiken' ? '10:00' : '13:30';
    $('evDeadline').value = addDays($('evDate').value, -2);
    applyEnd(); evPreview();
    $('evTitle').focus();
  });

  /* ---------- 前回のイベントを複製 ---------- */
  $('evDup').addEventListener('click', function () {
    var evs = allItems().filter(function (x) { return x.type === 'event'; })
      .sort(function (a, b) { return a.date < b.date ? 1 : -1; });
    if (!evs.length) { alert('複製できるイベントがまだありません。'); return; }
    var t0 = today();
    var past = evs.filter(function (x) { return x.date < t0; });
    var last = past.length ? past[0] : evs[evs.length - 1];
    if ($('evTitle').value.trim() && !confirm('いま書いている内容を、前回のイベントで置き換えますか？')) return;
    evClear();
    $('evTitle').value = last.title || ''; $('evVenue').value = last.venue || ''; $('evAddress').value = last.address || '';
    $('evFee').value = last.fee || ''; $('evCapacity').value = last.capacity || ''; $('evOrg').value = last.organizer || '';
    $('evApply').value = last.applyUrl || ''; $('evBody').value = last.body || '';
    $('evNotes').value = last.notes || ''; $('evContact').value = last.contact || '';
    $('evStart').value = last.start || ''; $('evEnd').value = last.end || '';
    $('evDate').value = addDays(today(), 21);
    $('evDeadline').value = addDays($('evDate').value, -2);
    evPreview();
    $('evSaved').hidden = false;
    $('evSaved').textContent = '「' + (last.title || '前回のイベント') + '」をもとに、日付だけ入れ替えました。中身を直して保存してください。';
    $('evDate').focus();
  });

  /* ---------- カレンダー(.ics)と、まとめてコピー ---------- */
  function icsTime(ds, ts, fallbackH) {
    var p = (ds || today()).split('-'), t = (ts || '').split(':');
    return p[0] + p[1] + p[2] + 'T' + pad(t[0] ? +t[0] : fallbackH) + pad(t[1] ? +t[1] : 0) + '00';
  }
  function makeIcs(e) {
    var end = e.end || (e.start ? null : null);
    var lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Dimension Zero//JP', 'CALSCALE:GREGORIAN',
      'BEGIN:VEVENT', 'UID:' + e.id + '@dimension-zero', 'DTSTAMP:' + icsTime(today(), '00:00', 0) + 'Z',
      'DTSTART;TZID=Asia/Tokyo:' + icsTime(e.date, e.start, 13),
      'DTEND;TZID=Asia/Tokyo:' + icsTime(e.date, end || (e.start ? null : null) || '', 15),
      'SUMMARY:' + (e.title || 'イベント'),
      'LOCATION:' + ((e.venue || '') + (e.address ? ' ' + e.address : '')),
      'DESCRIPTION:' + String(e.body || '').replace(/\n/g, '\\n').slice(0, 900) + '\\n\\n申込：' + (e.applyUrl || siteUrl(e)),
      'END:VEVENT', 'END:VCALENDAR'];
    return lines.join('\r\n');
  }
  $('prIcs').addEventListener('click', function () {
    var e = curPromoEvent(); if (!e) return;
    var blob = new Blob([makeIcs(e)], { type: 'text/calendar;charset=utf-8' });
    var a = d.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = (e.date || '') + '_' + (e.title || 'event').replace(/[\\/:*?"<>|]/g, '') + '.ics';
    a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
  });
  $('prAll').addEventListener('click', function () {
    var e = curPromoEvent(); if (!e) return;
    var all = texts(e).map(function (t) { return '───── ' + t[0] + ' ─────\n' + t[1]; }).join('\n\n');
    var ta = d.createElement('textarea');
    ta.value = all; ta.style.position = 'fixed'; ta.style.opacity = '0';
    d.body.appendChild(ta); ta.select();
    try { d.execCommand('copy'); this.textContent = 'コピーしました'; var b = this; setTimeout(function () { b.textContent = '告知文をまとめてコピー'; }, 1600); } catch (err) {}
    d.body.removeChild(ta);
  });
  function curPromoEvent() {
    var id = $('prEvent').value;
    return allItems().filter(function (x) { return x.id === id; })[0];
  }

  /* ---------- 段取り（開催日から逆算したチェックリスト） ---------- */
  var PLAN_KEY = 'dz_plan_v1';
  function planState() { try { return JSON.parse(localStorage.getItem(PLAN_KEY) || '{}'); } catch (e) { return {}; } }
  function planSave(o) { try { localStorage.setItem(PLAN_KEY, JSON.stringify(o)); } catch (e) {} }
  var PLAN = [
    ['-21', '日にち・会場・参加費を決める', '会場の予約と、担当（当日いる人）を決めます。'],
    ['-21', '申込ページをつくる', 'Select Type で申込・決済のページをつくり、URLをイベントに入れます。'],
    ['-14', 'サイトに載せる', 'この投稿画面の「イベントを載せる」から保存します。'],
    ['-14', '公式LINEで1回目の配信', '「告知をつくる」のLINE用の文をそのまま貼ります。'],
    ['-14', 'Instagram・Facebookに投稿', '告知画像（正方形）と文をそのまま使えます。'],
    ['-14', 'Googleビジネスプロフィールに投稿', '「イベント」の投稿として出します。'],
    ['-10', 'サロンさんへ共有する', '近くのサロンさんに、そのまま転載できる文を送ります。'],
    ['-7', '公式LINEで2回目の配信', '「残席わずか」「締切まで◯日」を添えます。'],
    ['-3', '申込者の確認', '人数、お名前、連絡先。必要なら会場へ最終連絡。'],
    ['-1', '前日のリマインド', '申込者へ、日時・場所・持ち物をもう一度お送りします。'],
    ['0', '当日：受付と写真', '受付表を用意。次の告知に使える写真を3枚以上撮ります。'],
    ['1', 'お礼の配信と投稿', '当日の写真を添えて、公式LINEとSNSへ。ブログにも残します。'],
    ['3', '次の一手', '参加された方に、お近くのサロンのご案内。感想をいただけたら「お客様の声」へ。']
  ];
  function renderPlanSelect() {
    var cur = $('plEvent').value, evs = eventsForPromo();
    $('plEvent').innerHTML = evs.map(function (e) {
      return '<option value="' + esc(e.id) + '">' + esc(e.date) + '　' + esc(e.title) + '</option>';
    }).join('');
    if (cur && evs.some(function (e) { return e.id === cur; })) $('plEvent').value = cur;
    renderPlan();
  }
  function renderPlan() {
    var id = $('plEvent').value;
    var e = allItems().filter(function (x) { return x.id === id; })[0];
    if (!e) {
      $('plList').innerHTML = '<p class="hint">イベントがありません。先に「イベントを載せる」から保存してください。</p>';
      $('plNum').innerHTML = ''; $('plNext').innerHTML = ''; return;
    }
    var st = planState(), mine = st[e.id] || {};
    var t = today(), left = daysBetween(t, e.date);
    $('plList').innerHTML = PLAN.map(function (row, i) {
      var when = addDays(e.date, +row[0]);
      var done = !!mine[i];
      var late = !done && when < t;
      var soon = !done && !late && daysBetween(t, when) <= 3;
      return '<label class="plan-it' + (done ? ' done' : '') + (late ? ' late' : '') + '">' +
        '<input type="checkbox" data-plan="' + i + '"' + (done ? ' checked' : '') + '>' +
        '<span class="pl-d">' + esc(md(when)) + '<small>' + (+row[0] === 0 ? '当日' : (+row[0] < 0 ? (-row[0]) + '日前' : row[0] + '日後')) + '</small></span>' +
        '<span class="pl-t"><b>' + esc(row[1]) + '</b><small>' + esc(row[2]) + '</small></span>' +
        '<span class="pl-s">' + (done ? '済' : (late ? '遅れています' : (soon ? 'まもなく' : ''))) + '</span></label>';
    }).join('');
    var doneN = PLAN.filter(function (r, i) { return mine[i]; }).length;
    $('plNum').innerHTML = '<div class="pn"><b>' + (left >= 0 ? left : 0) + '</b><span>' + (left >= 0 ? '日後に開催' : '開催は終わりました') + '</span></div>' +
      '<div class="pn"><b>' + doneN + ' / ' + PLAN.length + '</b><span>段取りの進み</span></div>' +
      (e.deadline ? '<div class="pn"><b>' + esc(md(e.deadline)) + '</b><span>申込の締切</span></div>' : '') +
      (e.capacity ? '<div class="pn"><b>' + esc(e.capacity) + '</b><span>定員</span></div>' : '');
    var next = null;
    for (var i = 0; i < PLAN.length; i++) { if (!mine[i]) { next = [i, PLAN[i]]; break; } }
    $('plNext').innerHTML = next
      ? '<p><b>' + esc(next[1][1]) + '</b><br><small>' + esc(md(addDays(e.date, +next[1][0]))) + 'まで　／　' + esc(next[1][2]) + '</small></p>' +
        '<p style="margin-top:10px"><a class="btn small primary" href="#promo" data-go-promo="' + esc(e.id) + '">告知の文と画像をつくる</a></p>'
      : '<p>ぜんぶ終わりました。おつかれさまでした。</p>';
  }
  function daysBetween(a, b) {
    if (!a || !b) return 0;
    var pa = a.split('-'), pb = b.split('-');
    return Math.round((new Date(+pb[0], +pb[1] - 1, +pb[2]) - new Date(+pa[0], +pa[1] - 1, +pa[2])) / 86400000);
  }
  $('plEvent').addEventListener('change', renderPlan);
  d.addEventListener('change', function (ev) {
    var c = ev.target.closest('[data-plan]');
    if (!c) return;
    var id = $('plEvent').value, st = planState();
    st[id] = st[id] || {};
    st[id][c.getAttribute('data-plan')] = c.checked;
    planSave(st); renderPlan();
  });
  /* ================= ここまで ================= */

  /* ---------- はじめ ---------- */
  fetch('data/posts.json').then(function (r) { return r.json(); }).then(function (j) { seed = j; }).catch(function () { seed = []; }).then(function () {
    $('poDate').value = today();
    evPreview();
    poPreview();
    var h = location.hash.replace('#', '');
    if (['event', 'post', 'list', 'promo', 'plan'].indexOf(h) >= 0) show(h);
  });
})();
