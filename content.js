/* イベントとブログの表示。
   サンプルでは data/posts.json（ビルド時に window.DZ_SEED として埋め込み）と、
   投稿画面で保存した内容（このブラウザの localStorage）を合わせて表示する。
   本番ではここを、財団の方が投稿する管理画面のデータに差し替える。 */
(function () {
  'use strict';
  var d = document, R = window.DZRisk;
  var KEY = 'dz_posts_v1';
  var LINE = 'https://lin.ee/uV9wFms';
  function local() {
    try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch (e) { return []; }
  }
  var byId = {};
  (window.DZ_SEED || []).forEach(function (p) { byId[p.id] = p; });
  local().forEach(function (p) { p.local = true; byId[p.id] = p; });
  var all = Object.keys(byId).map(function (k) { return byId[k]; }).filter(function (p) { return !p.hidden; });
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  var now = new Date();
  var today = now.getFullYear() + '-' + pad(now.getMonth() + 1) + '-' + pad(now.getDate());
  var events = all.filter(function (p) { return p.type === 'event'; }).sort(function (a, b) { return a.date < b.date ? -1 : 1; });
  var posts = all.filter(function (p) { return p.type === 'post'; }).sort(function (a, b) { return a.date < b.date ? 1 : -1; });
  var upcoming = events.filter(function (e) { return e.date >= today; });
  var past = events.filter(function (e) { return e.date < today; }).reverse();
  var WD = ['日', '月', '火', '水', '木', '金', '土'];

  function esc(s) { return R ? R.esc(s) : String(s == null ? '' : s); }
  function inline(t) { var e = esc(t); return R ? R.mark(e) : e; }
  function rich(t) {
    return String(t || '').split(/\n{2,}/).map(function (par) {
      return '<p>' + inline(par).replace(/\n/g, '<br>') + '</p>';
    }).join('');
  }
  function jpDate(s) {
    if (!s) return '';
    var p = s.split('-'), dt = new Date(+p[0], +p[1] - 1, +p[2]);
    return p[0] + '年' + (+p[1]) + '月' + (+p[2]) + '日（' + WD[dt.getDay()] + '）';
  }
  function dot(s) { return String(s || '').replace(/-/g, '.'); }
  function pic(p, cls) {
    var src = p.image || (p.type === 'event' ? 'img/tex-water.jpg' : 'img/hero-sunset.jpg');
    return '<div class="' + cls + '"><img src="' + esc(src) + '" alt="" loading="lazy"></div>';
  }
  function tags(p) {
    return (p.sample ? ' <span class="tagsm">サンプル</span>' : '') + (p.local ? ' <span class="tagsm new">投稿画面から追加</span>' : '');
  }
  function eventCard(e) {
    return '<a class="evc" href="event.html?id=' + encodeURIComponent(e.id) + '">' + pic(e, 'evc-img') +
      '<div class="evc-body"><div class="evc-date">' + esc(jpDate(e.date)) + (e.start ? '　' + esc(e.start) + '〜' : '') + tags(e) + '</div>' +
      '<h3>' + inline(e.title) + '</h3><div class="evc-meta">' + esc(e.venue || '') + (e.address ? '（' + esc(e.address) + '）' : '') + '</div>' +
      (e.fee ? '<div class="evc-meta">参加費 ' + esc(e.fee) + '</div>' : '') + '<span class="more">くわしく見る →</span></div></a>';
  }
  function eventRow(e) {
    return '<a class="evr" href="event.html?id=' + encodeURIComponent(e.id) + '"><b>' + esc(dot(e.date)) + '</b><span>' + inline(e.title) + tags(e) + '</span><small>' + esc(e.address || e.venue || '') + '</small></a>';
  }
  function postCard(p) {
    var ex = String(p.body || '').replace(/\s+/g, ' ').slice(0, 64);
    return '<a class="blc" href="post.html?id=' + encodeURIComponent(p.id) + '">' + pic(p, 'blc-img') +
      '<div class="blc-body"><div class="evc-date">' + esc(dot(p.date)) + '　' + esc(p.author || '') + tags(p) + '</div><h3>' + inline(p.title) + '</h3><p>' + inline(ex) + '…</p></div></a>';
  }
  function fill(sel, html) { d.querySelectorAll(sel).forEach(function (el) { el.innerHTML = html; }); }

  fill('[data-events-upcoming]', upcoming.length ? upcoming.map(eventCard).join('') : '<p class="empty">いま決まっているイベントはありません。公式LINEで先にお知らせします。</p>');
  fill('[data-events-past]', past.map(eventRow).join(''));
  fill('[data-blog-list]', posts.length ? posts.map(postCard).join('') : '<p class="empty">まだ記事がありません。</p>');
  fill('[data-home-events]', (upcoming[0] ? eventCard(upcoming[0]) : '') + '<div class="ev-rows">' + past.slice(0, 3).map(eventRow).join('') + '</div><p style="margin-top:14px"><a class="more" href="events.html">イベントをすべて見る →</a></p>');

  var q = new URLSearchParams(location.search), id = q.get('id');

  /* イベントの詳しいページ */
  var ed = d.querySelector('[data-event-detail]');
  if (ed) {
    var e = byId[id] || upcoming[0] || events[events.length - 1];
    if (e) {
      d.title = e.title + '｜イベント｜一般財団法人ディメンション・ゼロ';
      var isPast = e.date < today;
      var rows = [['日時', jpDate(e.date) + (e.start ? '　' + e.start + (e.end ? '〜' + e.end : '') : '')], ['会場', e.venue], ['住所', e.address], ['参加費', e.fee], ['定員', e.capacity], ['主催', e.organizer]]
        .filter(function (r) { return r[1]; });
      ed.innerHTML = '<div class="crumb"><a href="index.html">ホーム</a> / <a href="events.html">イベント</a> / ' + esc(e.title) + '</div>' +
        '<div class="evd">' + pic(e, 'evd-img') + '<div class="evd-text"><div class="evc-date">' + esc(jpDate(e.date)) + (isPast ? ' <span class="tagsm">終了しました</span>' : '') + tags(e) + '</div>' +
        '<h1>' + inline(e.title) + '</h1><table class="info">' + rows.map(function (r) {
          return '<tr><th>' + r[0] + '</th><td>' + esc(r[1]) + (r[0] === '住所' ? '　<a class="more" target="_blank" rel="noopener" href="https://www.google.com/maps/search/' + encodeURIComponent(r[1] + ' ' + (e.venue || '')) + '">地図</a>' : '') + '</td></tr>';
        }).join('') + '</table><div class="pd-cta">' +
        (!isPast && e.applyUrl ? '<a class="btn primary rip" href="' + esc(e.applyUrl) + '" target="_blank" rel="noopener">申し込む</a>' : '') +
        '<a class="btn line" href="' + LINE + '" target="_blank" rel="noopener">公式LINEで次のお知らせを受け取る</a></div></div></div>' +
        (e.body ? '<div class="evd-body">' + rich(e.body) + '</div>' : '');
      var ld = {
        '@context': 'https://schema.org', '@type': 'Event', name: e.title,
        startDate: e.date + (e.start ? 'T' + e.start : ''), endDate: e.end ? e.date + 'T' + e.end : undefined,
        eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode', eventStatus: 'https://schema.org/EventScheduled',
        location: { '@type': 'Place', name: e.venue || '', address: e.address || '' },
        organizer: { '@type': 'Organization', name: '一般財団法人ディメンション・ゼロ' }
      };
      if (e.applyUrl) ld.offers = { '@type': 'Offer', url: e.applyUrl, priceCurrency: 'JPY', price: String(e.fee || '').replace(/[^\d]/g, '') || undefined };
      var s = d.createElement('script');
      s.type = 'application/ld+json';
      s.textContent = JSON.stringify(ld);
      d.head.appendChild(s);
    }
  }

  /* ブログ記事のページ */
  var pd = d.querySelector('[data-post-detail]');
  if (pd) {
    var p = byId[id] || posts[0];
    if (p) {
      d.title = p.title + '｜ブログ｜一般財団法人ディメンション・ゼロ';
      var i = posts.indexOf(p), newer = posts[i - 1], older = posts[i + 1];
      pd.innerHTML = '<div class="crumb"><a href="index.html">ホーム</a> / <a href="blog.html">ブログ</a> / ' + esc(p.title) + '</div>' +
        '<div class="evc-date">' + esc(jpDate(p.date)) + '　' + esc(p.author || '') + tags(p) + '</div><h1 class="post-title">' + inline(p.title) + '</h1>' +
        (p.image ? pic(p, 'post-img') : '') + '<div class="post-body">' + rich(p.body) + '</div>' +
        '<div class="post-nav">' + (older ? '<a class="btn small ghost" href="post.html?id=' + encodeURIComponent(older.id) + '">← 前の記事</a>' : '<span></span>') +
        (newer ? '<a class="btn small ghost" href="post.html?id=' + encodeURIComponent(newer.id) + '">次の記事 →</a>' : '') + '</div>';
    }
  }
})();
