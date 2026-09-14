/* 表現チェックの辞書と、印を付ける関数。サイト表示と投稿画面の両方で使う。
   赤＝身体への作用・病気・安全の保証など、薬機法上先に直したい言葉
   黄＝効果の示唆・根拠の要る断定・不安をあおる言葉（文脈しだいで言い換え） */
(function () {
  'use strict';
  var W = [
    ['自己治癒力', 'red', '病気を治す力に働きかけると読める言葉です。', '「くつろぎの時間」など、体感の言葉に'],
    ['治療', 'red', '病気を治す行為を示す言葉です。', '「ケア」「整える時間」'],
    ['完治', 'red', '病気が治ると約束する言葉です。', '削除'],
    ['治る', 'red', '病気や症状が治ると読めます。', '体感を語る言葉に'],
    ['治す', 'red', '病気や症状を治すと読めます。', '体感を語る言葉に'],
    ['改善', 'red', '症状や体の状態がよくなると約束する形になります。', '「リフレッシュ」「気分が変わった」'],
    ['効能', 'red', '医薬品の言葉です。', '削除'],
    ['病気', 'red', '病気に関わる話はサイトに載せないのが安全です。', '削除'],
    ['疾患', 'red', '病気に関わる言葉です。', '削除'],
    ['症状', 'red', '症状への作用と読めます。', '削除'],
    ['痛み', 'red', '痛みへの効き目をうたう形になります。', '「こわばった気分がほぐれる時間」など体感に'],
    ['こり', 'red', 'こりへの効き目をうたう形になります。', '「リラックス」'],
    ['細胞', 'red', '体の中への作用を示す医学的な言葉です。', '削除'],
    ['活性化', 'red', '体の働きを高めると読めます。', '「心地よい」「すっきり」'],
    ['免疫', 'red', '体の働きへの作用を示す言葉です。', '削除'],
    ['自律神経', 'red', '体の働きへの作用を示す言葉です。', '「気持ちが落ち着く時間」'],
    ['神経', 'red', '体の働きへの作用を示す言葉です。', '削除'],
    ['血流', 'red', '体の働きへの作用を示す言葉です。', '「ぽかぽかした感じ」など体感に'],
    ['血行', 'red', '体の働きへの作用を示す言葉です。', '体感の言葉に'],
    ['副作用', 'red', '医薬品の言葉で、安全の保証にもなります。', '削除'],
    ['副反応', 'red', '医薬品の言葉で、安全の保証にもなります。', '削除'],
    ['若返', 'red', '体が若返ると約束する形です。', '「お手入れの時間」'],
    ['デトックス', 'red', '体から毒素が出ると読めます。', '「リフレッシュ」'],
    ['予防', 'red', '病気を防ぐと読めます。', '削除'],
    ['がん', 'red', '病気に関わる言葉です。', '削除'],
    ['癌', 'red', '病気に関わる言葉です。', '削除'],
    ['うつ', 'red', '病気に関わる言葉です。', '削除'],
    ['効果', 'yellow', '「効果」の言葉は、断定しなくても効き目の示唆になります。', '「体感」「時間」'],
    ['期待でき', 'yellow', '効き目の示唆になります。', '削除、または体感の言葉に'],
    ['安心して', 'yellow', '安全の保証と読まれることがあります。', '「どなたでもお気軽に」'],
    ['安全', 'yellow', '安全の保証には根拠が要ります。', '「体調に不安のある方はご相談ください」'],
    ['世界初', 'yellow', '根拠資料が求められる表現です（景品表示法）。', '「独自開発の」'],
    ['必ず', 'yellow', '結果を約束する言い方です。', '削除'],
    ['絶対', 'yellow', '結果を約束する言い方です。', '削除'],
    ['劇的', 'yellow', '結果を強く約束する言い方です。', '削除'],
    ['奇跡', 'yellow', '結果を強く約束する言い方です。', '削除'],
    ['電磁波', 'yellow', '害を示して不安をあおる形になりやすい言葉です。', '削除'],
    ['回復', 'yellow', '体の状態が戻ると読めます。', '「すっきり」'],
    ['根本', 'yellow', '体質を根本から変えると読めます。', '削除'],
    ['浄化', 'yellow', '体や心に作用すると読めます。', '「空間を心地よく」'],
    ['ストレス', 'yellow', 'ストレスを減らす効き目と読まれることがあります。', '「くつろぐ時間」'],
    ['健康', 'yellow', '文脈によっては健康効果の約束になります。', '「毎日の心地よさ」']
  ];
  var MAP = {};
  W.forEach(function (w) { MAP[w[0]] = w; });
  var RE = new RegExp(W.slice().sort(function (a, b) { return b[0].length - a[0].length; }).map(function (w) {
    return w[0].replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }).join('|'), 'g');

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  /* text の中の言葉を数える（投稿画面の警告用） */
  function scan(text) {
    var counts = {};
    String(text || '').replace(RE, function (m) { counts[m] = (counts[m] || 0) + 1; return m; });
    return Object.keys(counts).map(function (k) {
      var w = MAP[k];
      return { word: k, lv: w[1], why: w[2], fix: w[3], count: counts[k] };
    }).sort(function (a, b) { return (a.lv === b.lv) ? 0 : (a.lv === 'red' ? -1 : 1); });
  }
  /* エスケープ済みの文字列に印を付ける */
  function mark(escaped) {
    return String(escaped).replace(RE, function (m) {
      var w = MAP[m];
      return '<mark class="rk rk-' + w[1] + '" tabindex="0" data-note="' + esc(w[2] + '　例：' + w[3]) + '">' + m + '</mark>';
    });
  }
  function ensureLegend() {
    if (document.getElementById('rkLegend')) return;
    var box = document.createElement('div');
    box.className = 'rk-legend';
    box.id = 'rkLegend';
    box.innerHTML = '<b>表現チェック</b><span class="rk-red">赤＝先に直す</span><span class="rk-yellow">黄＝言い換え推奨</span><small>文字にカーソルを合わせると理由と言い換え例</small><button type="button" id="rkToggle">印を消す</button>';
    document.body.appendChild(box);
    var b = document.body, t = box.querySelector('#rkToggle');
    function set(off) {
      b.classList.toggle('rk-off', off);
      t.textContent = off ? '印を表示' : '印を消す';
      try { localStorage.setItem('rkoff', off ? '1' : ''); } catch (e) {}
    }
    var off = false;
    try { off = localStorage.getItem('rkoff') === '1'; } catch (e) {}
    set(off);
    t.onclick = function () { set(!b.classList.contains('rk-off')); };
  }
  document.addEventListener('DOMContentLoaded', function () {
    if (!document.body.classList.contains('adm') && document.querySelector('mark.rk')) ensureLegend();
  });
  window.DZRisk = { words: W, scan: scan, mark: mark, esc: esc, ensureLegend: ensureLegend };
})();
