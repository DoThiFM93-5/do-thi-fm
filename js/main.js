/* ==========================================================================
   ĐÔ THỊ FM – main.js
   Phần dùng chung cho mọi trang: header, footer, ticker, lịch phát sóng,
   tin giao thông, bản đồ, trang giới thiệu, form liên hệ.
   Nội dung lấy từ js/config.js – nhóm không cần sửa file này khi đổi nội dung.
   ========================================================================== */
(function () {
  'use strict';

  var CFG = window.DTFM_CONFIG || {};
  var STATION = CFG.STATION || {};
  var TZ = typeof CFG.TIMEZONE_OFFSET === 'number' ? CFG.TIMEZONE_OFFSET : 7;

  /* ---------------- Tiện ích dùng chung ---------------- */
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  /* Định dạng giây → mm:ss (hoặc h:mm:ss) */
  function fmt(t, withHours) {
    t = Math.max(0, Math.floor(Number(t) || 0));
    var h = Math.floor(t / 3600), m = Math.floor((t % 3600) / 60), s = t % 60;
    if (h || withHours) return h + ':' + pad(m) + ':' + pad(s);
    return pad(m) + ':' + pad(s);
  }
  /* 'mm:ss' hoặc 'h:mm:ss' → giây */
  function parseDur(str) {
    if (typeof str === 'number') return str;
    var p = String(str || '').split(':').map(Number);
    if (p.some(isNaN)) return 0;
    return p.reduce(function (acc, v) { return acc * 60 + v; }, 0);
  }
  /* Giờ hiện tại theo giờ Việt Nam (không phụ thuộc múi giờ máy người xem) */
  function vnNow() {
    var d = new Date(Date.now() + TZ * 3600000);
    return { y: d.getUTCFullYear(), mo: d.getUTCMonth(), d: d.getUTCDate(), h: d.getUTCHours(), mi: d.getUTCMinutes(), s: d.getUTCSeconds(), dow: d.getUTCDay() };
  }
  /* Giờ Việt Nam → mốc thời gian (ms) */
  function vnEpoch(y, mo, d, h, mi) { return Date.UTC(y, mo, d, h, mi || 0) - TZ * 3600000; }
  function toMin(hhmm) { var p = String(hhmm).split(':'); return (Number(p[0]) || 0) * 60 + (Number(p[1]) || 0); }
  function fmtDate(iso) {
    var p = String(iso || '').split('-');
    return p.length === 3 ? p[2] + '/' + p[1] + '/' + p[0] : String(iso || '');
  }

  /* ---------------- Biểu tượng SVG ---------------- */
  var ICONS = {
    play: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.6v12.8a1 1 0 0 0 1.52.85l10.2-6.4a1 1 0 0 0 0-1.7L9.52 4.75A1 1 0 0 0 8 5.6z" fill="currentColor"/></svg>',
    pause: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="6" y="5" width="4.4" height="14" rx="1.2" fill="currentColor"/><rect x="13.6" y="5" width="4.4" height="14" rx="1.2" fill="currentColor"/></svg>',
    back10: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12a8 8 0 1 0 2.4-5.7" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M4 3.8v4.6h4.6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><text x="12.4" y="15.6" text-anchor="middle" font-size="7.6" font-weight="800" fill="currentColor" font-family="Be Vietnam Pro, Arial, sans-serif">10</text></svg>',
    fwd10: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 12a8 8 0 1 1-2.4-5.7" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M20 3.8v4.6h-4.6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><text x="11.6" y="15.6" text-anchor="middle" font-size="7.6" font-weight="800" fill="currentColor" font-family="Be Vietnam Pro, Arial, sans-serif">10</text></svg>',
    close: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>',
    menu: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h10" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
    pin: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="9.5" r="2.5" fill="currentColor"/></svg>',
    clock: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8.5" fill="none" stroke="currentColor" stroke-width="2"/><path d="M12 7.5V12l3 2" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
    calendar: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="5.5" width="16" height="14" rx="2" fill="none" stroke="currentColor" stroke-width="2"/><path d="M4 10h16M8.5 3.5v4M15.5 3.5v4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
    phone: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6.6 3.5h2.6l1.4 4-2 1.5a11 11 0 0 0 6.4 6.4l1.5-2 4 1.4v2.6a2 2 0 0 1-2.2 2A16.5 16.5 0 0 1 4.6 5.7a2 2 0 0 1 2-2.2z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>',
    mail: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3.5" y="5.5" width="17" height="13" rx="2" fill="none" stroke="currentColor" stroke-width="2"/><path d="M4 7l8 6 8-6" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>',
    radio: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="2.2" fill="currentColor"/><path d="M8.2 8.2a5.4 5.4 0 0 0 0 7.6M15.8 8.2a5.4 5.4 0 0 1 0 7.6M5.4 5.4a9.3 9.3 0 0 0 0 13.2M18.6 5.4a9.3 9.3 0 0 1 0 13.2" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
    info: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2"/><path d="M12 11v6M12 7.5v.5" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>',
    arrow: '<svg viewBox="0 0 24 24" aria-hidden="true" width="16" height="16"><path d="M5 12h13M13 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    // Nhãn loại tin
    jam: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="9" width="7" height="6" rx="1.5" fill="currentColor"/><rect x="11.5" y="9" width="5" height="6" rx="1.5" fill="currentColor" opacity=".7"/><rect x="18" y="9" width="3" height="6" rx="1" fill="currentColor" opacity=".45"/></svg>',
    crash: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3.5l9 16H3z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M12 10v4.5M12 17v.4" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>',
    split: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21v-7l-6-6M12 14l6-6M6 4v4h4M18 4v4h-4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    bell: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 16V11a6 6 0 1 1 12 0v5l1.5 2h-15z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M10 20.5h4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>'
  };

  /* Logo tự vẽ: biểu tượng con đường dẫn tới điểm phát sóng */
  function logoSVG(cls) {
    return '<svg class="' + (cls || '') + '" viewBox="0 0 40 40" aria-hidden="true">' +
      '<rect width="40" height="40" rx="10" fill="#FFB21E"/>' +
      '<path d="M8.5 40 L18 21.5 h4 L31.5 40 Z" fill="#0A1628"/>' +
      '<path d="M20 24.5v3M20 30.5v3.6M20 37v3" stroke="#FFB21E" stroke-width="1.7"/>' +
      '<path d="M13.6 15.5a6.4 6.4 0 0 1 12.8 0" fill="none" stroke="#0A1628" stroke-width="2.4" stroke-linecap="round"/>' +
      '<path d="M9.2 15.5a10.8 10.8 0 0 1 21.6 0" fill="none" stroke="#0A1628" stroke-width="2.4" stroke-linecap="round" opacity=".5"/>' +
      '<circle cx="20" cy="15.8" r="2.6" fill="#0A1628"/>' +
      '</svg>';
  }

  /* Ảnh bìa: nếu item có cover thì dùng ảnh, không thì tự vẽ SVG */
  var coverSeq = 0;
  function cover(item, i) {
    if (item && item.cover) return '<img src="' + esc(item.cover) + '" alt="" loading="lazy">';
    i = Math.abs(Number(i) || 0);
    var pal = [['#FFB21E', '#FF7A45'], ['#2ED3B7', '#147C8C'], ['#FF6B7F', '#B4294D'], ['#5AA9FF', '#1D4B8C'], ['#FFC857', '#2ED3B7']];
    var c = pal[i % pal.length];
    var id = 'cv' + (coverSeq++);
    var ink = '#0A1628';
    var art = '';
    switch (i % 5) {
      case 0: // con đường
        art = '<path d="M0 74h320" stroke="' + ink + '" stroke-opacity=".25" stroke-width="2"/>' +
          '<path d="M118 180 L154 74 h12 L202 180 Z" fill="' + ink + '" opacity=".88"/>' +
          '<path d="M160 82v10M160 102v16M160 130v22M160 164v16" stroke="' + c[0] + '" stroke-width="4"/>' +
          '<circle cx="250" cy="44" r="18" fill="' + ink + '" opacity=".18"/>';
        break;
      case 1: // sóng phát thanh
        art = [24, 48, 72, 96, 120].map(function (r, k) {
          return '<circle cx="250" cy="70" r="' + r + '" fill="none" stroke="' + ink + '" stroke-width="5" opacity="' + (0.75 - k * 0.13).toFixed(2) + '"/>';
        }).join('') + '<circle cx="250" cy="70" r="9" fill="' + ink + '"/>';
        break;
      case 2: // dạng sóng âm
        for (var k = 0; k < 30; k++) {
          var h = 14 + Math.abs(Math.sin(k * 0.62) * Math.cos(k * 0.21)) * 96;
          art += '<rect x="' + (18 + k * 9.8).toFixed(1) + '" y="' + (78 - h / 2).toFixed(1) + '" width="5" height="' + h.toFixed(1) + '" rx="2.5" fill="' + ink + '" opacity=".8"/>';
        }
        break;
      case 3: // vạch kẻ đường
        for (var j = -2; j < 9; j++) {
          art += '<path d="M' + (j * 44) + ' 180 L' + (j * 44 + 120) + ' 0" stroke="' + ink + '" stroke-width="12" stroke-dasharray="26 18" opacity=".32"/>';
        }
        art += '<rect x="196" y="28" width="96" height="40" rx="8" fill="' + ink + '" opacity=".85"/><text x="244" y="54" text-anchor="middle" font-family="Be Vietnam Pro, Arial, sans-serif" font-weight="800" font-size="16" fill="' + c[0] + '">ON AIR</text>';
        break;
      default: // ô phố
        for (var x = 0; x < 6; x++) for (var y = 0; y < 3; y++) {
          art += '<rect x="' + (14 + x * 52) + '" y="' + (12 + y * 44) + '" width="40" height="32" rx="5" fill="' + ink + '" opacity="' + ((x + y) % 3 === 0 ? 0.75 : 0.3) + '"/>';
        }
        art += '<path d="M0 100 H120 V56 H230 V148 H320" fill="none" stroke="#fff" stroke-width="5" stroke-dasharray="10 8" opacity=".8"/>';
    }
    return '<svg viewBox="0 0 320 180" preserveAspectRatio="xMidYMid slice" aria-hidden="true">' +
      '<defs><linearGradient id="' + id + '" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="' + c[0] + '"/><stop offset="1" stop-color="' + c[1] + '"/></linearGradient></defs>' +
      '<rect width="320" height="180" fill="url(#' + id + ')"/>' + art +
      '<text x="18" y="164" font-family="Be Vietnam Pro, Arial, sans-serif" font-weight="800" font-size="13" letter-spacing="1" fill="' + ink + '" opacity=".85">' + esc((STATION.name || '').toUpperCase() + ' ' + (STATION.frequency || '')) + '</text>' +
      '</svg>';
  }

  window.DTFM = {
    config: CFG,
    icons: ICONS,
    util: { pad: pad, esc: esc, fmt: fmt, parseDur: parseDur, vnNow: vnNow, vnEpoch: vnEpoch, toMin: toMin, fmtDate: fmtDate, cover: cover, logo: logoSVG }
  };

  function $(sel, root) { return (root || document).querySelector(sel); }

  /* ---------------- Lịch phát sóng: tra cứu ---------------- */
  var DAY_NAMES = ['Chủ nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
  var DAY_SHORT = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
  function dayList(dow) {
    var S = CFG.SCHEDULE || {};
    var key = dow === 0 ? 'sunday' : (dow === 6 ? 'saturday' : 'weekday');
    return (S[key] || S.weekday || []).slice().sort(function (a, b) { return toMin(a.start) - toMin(b.start); });
  }
  function nowIndex(list, nowMin) {
    for (var i = 0; i < list.length; i++) {
      if (nowMin >= toMin(list[i].start) && nowMin < toMin(list[i].end)) return i;
    }
    return -1;
  }
  function slotHTML(it, o) {
    o = o || {};
    var cls = 'slot' + (o.now ? ' is-now' : '') + (it.featured ? ' is-featured' : '') + (o.past ? ' is-past' : '');
    var s = toMin(it.start), e = toMin(it.end);
    var prog = o.now ? Math.round(((o.nowMin - s) / Math.max(1, e - s)) * 100) : 0;
    return '<li class="' + cls + '">' +
      '<div class="slot__time">' + esc(it.start) + '<small>đến ' + esc(it.end) + '</small></div>' +
      '<div>' +
        '<div class="slot__title">' + esc(it.title) +
          (o.now ? ' <span class="tag-now"><span class="onair-dot"></span>ĐANG PHÁT</span>' : '') +
          (it.featured ? ' <span class="tag-ours">Nổi bật</span>' : '') +
        '</div>' +
        '<p class="slot__desc">' + esc(it.desc || '') + '</p>' +
        (it.featured && o.showLink ? '<p style="margin-top:8px"><a class="section__link" href="index.html#live-player">Nghe bản tin sáng ' + ICONS.arrow + '</a></p>' : '') +
        (o.now ? '<div class="slot__bar" aria-hidden="true"><span style="width:' + prog + '%"></span></div>' : '') +
      '</div></li>';
  }

  /* ---------------- Header ---------------- */
  var NAV = [
    { href: 'index.html', label: 'Trang chủ', page: 'home' },
    { href: 'lich-phat-song.html', label: 'Lịch phát sóng', page: 'schedule' },
    { href: 'tin-giao-thong.html', label: 'Tin giao thông', page: 'news' },
    { href: 'ban-do.html', label: 'Bản đồ', page: 'map' },
    { href: 'gioi-thieu.html', label: 'Giới thiệu', page: 'about' },
    { href: 'lien-he.html', label: 'Liên hệ', page: 'contact' }
  ];
  var PAGE = document.body.getAttribute('data-page') || '';

  function brandName() {
    var n = esc(STATION.name || 'Đô Thị FM');
    return n.replace(/\s(FM)$/, ' <b>$1</b>');
  }

  function renderHeader() {
    var el = document.getElementById('site-header');
    if (!el) return;
    el.innerHTML =
      '<div class="container header__bar">' +
        '<a class="brand" href="index.html" aria-label="' + esc((STATION.name || '') + ' ' + (STATION.frequencyLabel || '')) + ' – Trang chủ">' +
          logoSVG('brand__mark') +
          '<span class="brand__text"><span class="brand__name">' + brandName() + '</span>' +
          '<span class="brand__freq">' + esc(STATION.frequency || '') + ' MHz</span></span>' +
        '</a>' +
        '<nav class="nav" id="site-nav" aria-label="Điều hướng chính"><ul class="nav__list">' +
          NAV.map(function (n) {
            return '<li><a class="nav__link" href="' + n.href + '"' + (n.page === PAGE ? ' aria-current="page"' : '') + '>' + n.label + '</a></li>';
          }).join('') +
        '</ul></nav>' +
        '<a class="onair-chip" href="lich-phat-song.html" aria-label="Đang phát theo lịch">' +
          '<span class="onair-dot"></span><span class="onair-chip__tag">ON AIR</span><strong data-onair-title>…</strong></a>' +
        '<button type="button" class="menu-toggle" aria-expanded="false" aria-controls="site-nav" aria-label="Mở menu">' + ICONS.menu + '</button>' +
      '</div>';

    var btn = $('.menu-toggle', el), nav = $('#site-nav', el);
    function setOpen(open) {
      nav.classList.toggle('is-open', open);
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      btn.setAttribute('aria-label', open ? 'Đóng menu' : 'Mở menu');
      btn.innerHTML = open ? ICONS.close : ICONS.menu;
    }
    btn.addEventListener('click', function () { setOpen(!nav.classList.contains('is-open')); });
    nav.addEventListener('click', function (e) { if (e.target.closest('a')) setOpen(false); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && nav.classList.contains('is-open')) { setOpen(false); btn.focus(); }
    });
    updateOnAir();
    setInterval(updateOnAir, 30000);
  }

  function updateOnAir() {
    var el = document.querySelector('[data-onair-title]');
    if (!el) return;
    var n = vnNow();
    var list = dayList(n.dow);
    var i = nowIndex(list, n.h * 60 + n.mi);
    el.textContent = i >= 0 ? list[i].title : (STATION.onAirHours || '');
  }

  /* ---------------- Footer ---------------- */
  function renderFooter() {
    var el = document.getElementById('site-footer');
    if (!el) return;
    var tel = STATION.hotlineTel ? '<a href="tel:' + esc(STATION.hotlineTel) + '">' + esc(STATION.hotline) + '</a>' : esc(STATION.hotline || '');
    el.innerHTML =
      '<div class="container">' +
        '<div class="footer__grid">' +
          '<div>' +
            '<a class="brand" href="index.html">' + logoSVG('brand__mark') +
              '<span class="brand__text"><span class="brand__name">' + brandName() + '</span><span class="brand__freq">' + esc(STATION.frequencyLabel || '') + '</span></span></a>' +
            '<p class="footer__tagline">' + esc(STATION.tagline || '') + '. Thông tin giao thông, đô thị và đời sống người dân TP.HCM.</p>' +
          '</div>' +
          '<div><p class="footer__title">Chuyên mục</p><ul class="footer__links">' +
            NAV.map(function (n) { return '<li><a href="' + n.href + '">' + n.label + '</a></li>'; }).join('') +
          '</ul></div>' +
          '<div><p class="footer__title">Liên hệ</p><div class="footer__contact">' +
            '<span>Hotline: <strong>' + tel + '</strong></span>' +
            '<span>Email: <a href="mailto:' + esc(STATION.email || '') + '">' + esc(STATION.email || '') + '</a></span>' +
            '<span>' + esc(STATION.address || '') + ' · <a href="ban-do.html#tru-so">Xem bản đồ</a></span>' +
            '<span>' + esc(STATION.onAirHours || '') + ' trên ' + esc(STATION.frequencyLabel || '') + '</span>' +
          '</div></div>' +
        '</div>' +
        '<div class="footer__bottom">' +
          '<span>© ' + esc(STATION.year || '') + ' ' + esc(STATION.name || '') + ' – kênh phát thanh giả định. Tần số và số liệu mang tính minh họa.</span>' +
          '<span>Sản phẩm cuối kì môn ' + esc(STATION.course || '') + ' · ' + esc(STATION.className || '') + ' · ' + esc(STATION.school || '') + '</span>' +
        '</div>' +
      '</div>';
  }

  /* ---------------- Ticker tin nhanh ---------------- */
  function renderTicker() {
    var el = document.getElementById('ticker');
    var items = CFG.TICKER || [];
    if (!el || !items.length) { if (el) el.hidden = true; return; }
    var row = items.map(function (t) { return '<span class="ticker__item">' + esc(t) + '</span>'; }).join('');
    var chars = items.join('').length;
    el.innerHTML =
      '<div class="ticker__label"><span class="onair-dot"></span>Tin nhanh</div>' +
      '<div class="ticker__viewport" tabindex="0" aria-label="Tin nhanh – rê chuột hoặc chọn để dừng chạy chữ">' +
        '<div class="ticker__track" aria-hidden="true">' + row + row + '</div>' +
      '</div>' +
      '<button type="button" class="ticker__toggle" aria-pressed="false" aria-label="Tạm dừng tin nhanh">' + ICONS.pause + '</button>' +
      '<ul class="sr-only">' + items.map(function (t) { return '<li>' + esc(t) + '</li>'; }).join('') + '</ul>';
    $('.ticker__track', el).style.setProperty('--ticker-dur', Math.max(30, Math.round(chars * 0.22)) + 's');
    // Nút tạm dừng / chạy tiếp chữ chạy
    var tg = $('.ticker__toggle', el);
    tg.addEventListener('click', function () {
      var paused = !el.classList.contains('is-paused');
      el.classList.toggle('is-paused', paused);
      tg.setAttribute('aria-pressed', paused ? 'true' : 'false');
      tg.setAttribute('aria-label', paused ? 'Chạy tiếp tin nhanh' : 'Tạm dừng tin nhanh');
      tg.innerHTML = paused ? ICONS.play : ICONS.pause;
    });
  }

  /* ---------------- Trang chủ: lịch hôm nay (rút gọn) ---------------- */
  function renderToday() {
    var el = document.getElementById('today-schedule');
    if (!el) return;
    function draw() {
      var n = vnNow();
      var nowMin = n.h * 60 + n.mi;
      var list = dayList(n.dow);
      var i = Math.max(0, nowIndex(list, nowMin));
      el.innerHTML = list.slice(i, i + 5).map(function (it, k) {
        return slotHTML(it, { now: k === 0 && nowIndex(list, nowMin) >= 0, nowMin: nowMin, showLink: true });
      }).join('');
      var lbl = document.getElementById('today-label');
      if (lbl) lbl.textContent = DAY_NAMES[n.dow] + ', ' + pad(n.d) + '/' + pad(n.mo + 1) + ' · giờ Việt Nam';
    }
    draw();
    setInterval(draw, 30000);
  }

  /* ---------------- Trang chủ: chương trình đã phát ---------------- */
  function epCardHTML(it, i) {
    return '<article class="card ep">' +
      '<div class="ep__cover">' + cover(it, i) + (it.tag ? '<span class="chip ep__tag">' + esc(it.tag) + '</span>' : '') + '</div>' +
      '<div class="ep__body">' +
        '<div class="ep__meta"><span>' + ICONS.calendar + fmtDate(it.date) + '</span><span>' + ICONS.clock + esc(it.duration || '') + '</span></div>' +
        '<h3 class="ep__title">' + esc(it.title) + '</h3>' +
        '<p class="ep__desc">' + esc(it.description || '') + '</p>' +
        '<div class="ep__actions">' +
          '<button type="button" class="btn btn--primary" data-replay-id="' + esc(it.id) + '" aria-label="Nghe lại: ' + esc(it.title) + '">' +
            ICONS.play + '<span class="eq" aria-hidden="true"><span></span><span></span><span></span><span></span></span><span class="btn__label">Nghe lại</span></button>' +
        '</div>' +
      '</div></article>';
  }
  function renderArchive() {
    var el = document.getElementById('archive-grid');
    if (!el) return;
    var list = CFG.ARCHIVE || [];
    el.innerHTML = list.length ? list.map(epCardHTML).join('') : '<p class="empty">Chưa có chương trình nào.</p>';
  }

  /* ---------------- Tin giao thông ---------------- */
  var NEWS_TYPES = {
    'un-tac': { label: 'Ùn tắc', icon: ICONS.jam },
    'tai-nan': { label: 'Tai nạn', icon: ICONS.crash },
    'phan-luong': { label: 'Phân luồng', icon: ICONS.split },
    'canh-bao': { label: 'Cảnh báo', icon: ICONS.bell }
  };
  function newsHTML(n) {
    var t = NEWS_TYPES[n.type] || { label: n.type, icon: '' };
    return '<article class="card news t-' + esc(n.type) + '">' +
      '<div class="news__top"><span class="type-label">' + t.icon + esc(t.label) + '</span><span class="news__time">' + esc(n.time || '') + '</span></div>' +
      '<h3 class="news__title">' + esc(n.title) + '</h3>' +
      '<p class="news__place">' + ICONS.pin + esc(n.place || '') + '</p>' +
      '<p class="news__desc">' + esc(n.desc || '') + '</p>' +
      '</article>';
  }
  function sortedNews() {
    return (CFG.NEWS || []).slice().sort(function (a, b) { return toMin(b.time) - toMin(a.time); });
  }
  function renderLatestNews() {
    var el = document.getElementById('latest-news');
    if (!el) return;
    el.innerHTML = sortedNews().slice(0, 3).map(newsHTML).join('');
  }
  function renderNewsPage() {
    var list = document.getElementById('news-list');
    var bar = document.getElementById('news-filters');
    if (!list || !bar) return;
    var all = sortedNews();
    var current = 'all';
    var keys = ['all'].concat(Object.keys(NEWS_TYPES));
    bar.innerHTML = keys.map(function (k) {
      var count = k === 'all' ? all.length : all.filter(function (n) { return n.type === k; }).length;
      var label = k === 'all' ? 'Tất cả' : NEWS_TYPES[k].label;
      return '<button type="button" class="filter' + (k !== 'all' ? ' t-' + k : '') + '" data-filter="' + k + '" aria-pressed="' + (k === current) + '">' +
        (k !== 'all' ? '<span class="filter__dot" style="background:var(--type-color)"></span>' : '') +
        label + '<span class="filter__count">' + count + '</span></button>';
    }).join('');
    function draw() {
      var items = current === 'all' ? all : all.filter(function (n) { return n.type === current; });
      list.innerHTML = items.length ? items.map(newsHTML).join('') : '<p class="empty">Không có tin nào thuộc loại này.</p>';
      var st = document.getElementById('news-status');
      if (st) st.textContent = 'Đang hiển thị ' + items.length + ' tin' + (current === 'all' ? '' : ' loại ' + NEWS_TYPES[current].label.toLowerCase());
    }
    bar.addEventListener('click', function (e) {
      var b = e.target.closest('[data-filter]');
      if (!b) return;
      current = b.getAttribute('data-filter');
      bar.querySelectorAll('[data-filter]').forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
      draw();
    });
    draw();
  }

  /* ---------------- Trang lịch phát sóng ---------------- */
  function renderSchedulePage() {
    var tabs = document.getElementById('day-tabs');
    var panel = document.getElementById('schedule-list');
    if (!tabs || !panel) return;
    var n = vnNow();
    var offset = (n.dow + 6) % 7;               // tuần bắt đầu từ Thứ Hai
    var base = Date.UTC(n.y, n.mo, n.d) - offset * 86400000;
    var days = [];
    for (var k = 0; k < 7; k++) {
      var d = new Date(base + k * 86400000);
      days.push({ dow: d.getUTCDay(), date: pad(d.getUTCDate()) + '/' + pad(d.getUTCMonth() + 1), today: k === offset });
    }
    var selected = offset;
    tabs.setAttribute('role', 'tablist');
    tabs.setAttribute('aria-label', 'Chọn ngày trong tuần');
    tabs.innerHTML = days.map(function (d, i) {
      return '<button type="button" role="tab" class="day-tab' + (d.today ? ' is-today' : '') + '" id="day-tab-' + i + '" aria-controls="schedule-list" aria-selected="' + (i === selected) + '" tabindex="' + (i === selected ? 0 : -1) + '">' +
        '<strong>' + DAY_SHORT[d.dow] + '</strong><span>' + (d.today ? 'Hôm nay' : d.date) + '</span></button>';
    }).join('');
    panel.setAttribute('role', 'tabpanel');

    function draw() {
      var d = days[selected];
      var now = vnNow();
      var nowMin = now.h * 60 + now.mi;
      var list = dayList(d.dow);
      var idx = d.today ? nowIndex(list, nowMin) : -1;
      panel.setAttribute('aria-labelledby', 'day-tab-' + selected);
      panel.innerHTML = list.map(function (it, i) {
        return slotHTML(it, { now: i === idx, past: d.today && toMin(it.end) <= nowMin, nowMin: nowMin, showLink: true });
      }).join('');
      var note = document.getElementById('schedule-day');
      if (note) note.textContent = DAY_NAMES[d.dow] + ' ' + d.date + (d.today ? ' (hôm nay)' : '') + ' · giờ Việt Nam';
    }
    function select(i, focus) {
      selected = (i + 7) % 7;
      tabs.querySelectorAll('[role="tab"]').forEach(function (b, j) {
        b.setAttribute('aria-selected', j === selected ? 'true' : 'false');
        b.tabIndex = j === selected ? 0 : -1;
        if (j === selected && focus) b.focus();
      });
      draw();
    }
    tabs.addEventListener('click', function (e) {
      var b = e.target.closest('[role="tab"]');
      if (b) select(Number(b.id.replace('day-tab-', '')));
    });
    tabs.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight') { e.preventDefault(); select(selected + 1, true); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); select(selected - 1, true); }
    });
    draw();
    setInterval(draw, 30000);
    var cur = tabs.querySelector('[aria-selected="true"]');
    if (cur && cur.scrollIntoView) cur.scrollIntoView({ block: 'nearest', inline: 'center' });
  }

  /* ---------------- Trang bản đồ ---------------- */
  var LEVELS = {
    'thong-thoang': 'Thông thoáng',
    'dong': 'Đông xe',
    'un-tac': 'Ùn tắc'
  };
  function renderMapPage() {
    var mapEl = document.getElementById('map');
    var listEl = document.getElementById('hotspot-list');
    var bar = document.getElementById('map-filters');
    if (!mapEl || !listEl) return;
    var spots = (CFG.HOTSPOTS || []).map(function (h, i) { h._i = i; return h; });
    var order = { 'un-tac': 0, 'dong': 1, 'thong-thoang': 2 };
    spots.sort(function (a, b) { return (order[a.level] - order[b.level]) || a.name.localeCompare(b.name, 'vi'); });
    var current = 'all';
    var markers = {};
    var map = null;
    var activeId = null;
    var st = STATION.location && typeof STATION.location.lat === 'number' ? STATION.location : null;
    var stMarker = null;

    function stationPopup() {
      return '<strong>' + esc(STATION.name || '') + ' – ' + esc(STATION.frequencyLabel || '') + '</strong><br>' +
        esc(STATION.address || '') + '<br>Hotline: <strong>' + esc(STATION.hotline || '') + '</strong>';
    }
    function focusStation() {
      if (!map || !stMarker) return;
      map.flyTo([st.lat, st.lng], 16, { duration: 0.8 });
      stMarker.openPopup();
    }
    // Thẻ trụ sở kênh phía trên danh sách
    var stCard = document.getElementById('station-card');
    if (stCard && st) {
      stCard.innerHTML = '<button type="button" class="station-item" id="tru-so">' + logoSVG() +
        '<span><small>Trụ sở kênh</small><strong>' + esc(STATION.name || '') + ' · ' + esc(STATION.frequencyLabel || '') + '</strong>' +
        '<span>' + esc(STATION.address || '') + '</span></span></button>';
      stCard.firstChild.addEventListener('click', function () {
        focusStation();
        if (window.matchMedia('(max-width: 959px)').matches) mapEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      });
    }

    function popupHTML(h) {
      return '<strong>' + esc(h.name) + '</strong><br><span style="color:var(--text-2)">' + esc(h.road) + '</span><br>' +
        '<span class="lv-' + h.level + '" style="color:var(--lv);font-weight:700">● ' + LEVELS[h.level] + '</span> · cập nhật ' + esc(h.updated || '') +
        (h.note ? '<br>' + esc(h.note) : '');
    }

    if (window.L) {
      map = window.L.map(mapEl, { scrollWheelZoom: false, zoomControl: true }).setView([10.79, 106.69], 12);
      /* Nền bản đồ:
         - Khi đưa lên hosting (http/https): dùng OpenStreetMap, làm tối bằng CSS cho hợp tông trang.
         - Khi mở trực tiếp từ file (file:///...): máy chủ OSM chặn và trả về ảnh 403 "Access blocked"
           (do trình duyệt không gửi địa chỉ trang). Lúc đó dùng nền tối của Esri (không cần đăng ký). */
      var isLocalFile = window.location.protocol === 'file:';
      if (!isLocalFile) {
        mapEl.classList.add('map--dim');
        window.L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        }).addTo(map);
      } else {
        var esri = 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/';
        window.L.tileLayer(esri + 'World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}', {
          maxZoom: 16, attribution: 'Nền bản đồ &copy; Esri, HERE, Garmin, &copy; OpenStreetMap contributors'
        }).addTo(map);
        window.L.tileLayer(esri + 'World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}', { maxZoom: 16 }).addTo(map);
      }
      map.on('focus click', function () { map.scrollWheelZoom.enable(); });
      map.on('blur mouseout', function () { map.scrollWheelZoom.disable(); });
      spots.forEach(function (h) {
        var m = window.L.marker([h.lat, h.lng], {
          title: h.name + ' – ' + LEVELS[h.level],
          alt: h.name,
          icon: window.L.divIcon({ className: 'hs-marker lv-' + h.level, html: '<span></span>', iconSize: [24, 24], iconAnchor: [12, 12], popupAnchor: [0, -12] })
        }).bindPopup(popupHTML(h));
        m.on('click', function () { setActive(h._i, false); });
        m.addTo(map);
        markers[h._i] = m;
      });
      var pts = spots.map(function (h) { return [h.lat, h.lng]; });
      if (st) {
        stMarker = window.L.marker([st.lat, st.lng], {
          title: (STATION.name || '') + ' – trụ sở kênh', alt: STATION.name, zIndexOffset: 1000,
          icon: window.L.divIcon({ className: 'st-marker', html: '<span class="st-pin">' + logoSVG() + esc(STATION.name || '') + '</span>', iconSize: [120, 36], iconAnchor: [17, 42], popupAnchor: [0, -40] })
        }).bindPopup(stationPopup()).addTo(map);
        pts.push([st.lat, st.lng]);
      }
      if (pts.length) map.fitBounds(pts, { padding: [30, 30] });
    } else {
      mapEl.innerHTML = '<div class="map-fallback"><p>Không tải được bản đồ (cần kết nối Internet).<br>Danh sách điểm nóng vẫn hiển thị bên dưới.</p></div>';
    }

    function setActive(i, fly) {
      activeId = i;
      listEl.querySelectorAll('.hs-item').forEach(function (b) { b.classList.toggle('is-active', Number(b.getAttribute('data-i')) === i); });
      var h = spots.filter(function (s) { return s._i === i; })[0];
      if (map && h && fly) {
        map.flyTo([h.lat, h.lng], 15, { duration: 0.8 });
        markers[i].openPopup();
      }
    }

    function draw() {
      var items = current === 'all' ? spots : spots.filter(function (h) { return h.level === current; });
      listEl.innerHTML = items.map(function (h) {
        return '<li><button type="button" class="hs-item lv-' + h.level + (h._i === activeId ? ' is-active' : '') + '" data-i="' + h._i + '">' +
          '<span class="lv-dot"></span>' +
          '<span><strong>' + esc(h.name) + '</strong><small>' + esc(h.road) + '</small>' + (h.note ? '<p>' + esc(h.note) + '</p>' : '') + '</span>' +
          '<span><span class="hs-level">' + LEVELS[h.level] + '</span><span class="hs-time">' + esc(h.updated || '') + '</span></span>' +
          '</button></li>';
      }).join('') || '<li class="empty">Không có điểm nào.</li>';
      if (map) {
        spots.forEach(function (h) {
          var show = current === 'all' || h.level === current;
          var m = markers[h._i];
          if (show && !map.hasLayer(m)) m.addTo(map);
          if (!show && map.hasLayer(m)) map.removeLayer(m);
        });
      }
    }
    listEl.addEventListener('click', function (e) {
      var b = e.target.closest('.hs-item');
      if (!b) return;
      setActive(Number(b.getAttribute('data-i')), true);
      if (window.matchMedia('(max-width: 959px)').matches) mapEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
    if (bar) {
      var keys = ['all', 'un-tac', 'dong', 'thong-thoang'];
      bar.innerHTML = keys.map(function (k) {
        var count = k === 'all' ? spots.length : spots.filter(function (h) { return h.level === k; }).length;
        return '<button type="button" class="filter' + (k !== 'all' ? ' lv-' + k : '') + '" data-filter="' + k + '" aria-pressed="' + (k === current) + '">' +
          (k !== 'all' ? '<span class="filter__dot" style="background:var(--lv)"></span>' : '') +
          (k === 'all' ? 'Tất cả' : LEVELS[k]) + '<span class="filter__count">' + count + '</span></button>';
      }).join('');
      bar.addEventListener('click', function (e) {
        var b = e.target.closest('[data-filter]');
        if (!b) return;
        current = b.getAttribute('data-filter');
        bar.querySelectorAll('[data-filter]').forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
        draw();
      });
    }
    draw();
    // Mở từ link "Xem trên bản đồ" (ban-do.html#tru-so) → bay tới trụ sở kênh
    if (window.location.hash === '#tru-so') setTimeout(focusStation, 400);
  }

  /* ---------------- Trang giới thiệu ---------------- */
  function renderAbout() {
    var steps = document.getElementById('program-structure');
    if (steps) {
      var secs = (CFG.SECTIONS || []).slice().sort(function (a, b) { return a.start - b.start; });
      var total = (CFG.LIVE && CFG.LIVE.durationFallback) || 0;
      steps.innerHTML = secs.map(function (s, i) {
        var end = i + 1 < secs.length ? secs[i + 1].start : total;
        var isSong = /bài hát/i.test(s.name);
        return '<li class="card step' + (isSong ? ' step--song' : '') + '">' +
          '<span class="step__num">' + esc(s.code) + '</span>' +
          '<div><h3>' + esc(s.name) + (s.vi && s.vi !== s.name ? '<small>' + esc(s.vi) + '</small>' : '') + '</h3>' +
          '<p>' + esc(s.desc || '') + '</p>' +
          '<span class="step__time">' + fmt(s.start) + ' – ' + fmt(end) + ' (dự kiến)</span></div></li>';
      }).join('');
    }
    var team = document.getElementById('team-list');
    if (team) {
      team.innerHTML = (CFG.TEAM || []).map(function (m) {
        var words = String(m.name || '').trim().split(/\s+/);
        var initials = (words[0] ? words[0][0] : '') + (words.length > 1 ? words[words.length - 1][0] : '');
        return '<li class="card member"><span class="member__avatar" aria-hidden="true">' + esc(initials.toUpperCase()) + '</span>' +
          '<div><strong>' + esc(m.name) + '</strong><span class="member__role">' + esc(m.role || '') + '</span>' +
          (m.task ? '<p>' + esc(m.task) + '</p>' : '') + '</div></li>';
      }).join('');
    }
  }

  /* ---------------- Gắn chữ từ config vào trang ----------------
     <span data-cfg="STATION.hotline"></span> sẽ được điền nội dung tương ứng. */
  function bindConfigText() {
    document.querySelectorAll('[data-cfg]').forEach(function (el) {
      var path = el.getAttribute('data-cfg').split('.');
      var v = CFG;
      for (var i = 0; i < path.length && v != null; i++) v = v[path[i]];
      if (v != null && typeof v !== 'object') el.textContent = v;
    });
    document.querySelectorAll('[data-cfg-mail]').forEach(function (el) {
      if (STATION.email) el.setAttribute('href', 'mailto:' + STATION.email);
    });
    document.querySelectorAll('[data-cfg-tel]').forEach(function (el) {
      if (STATION.hotlineTel) el.setAttribute('href', 'tel:' + STATION.hotlineTel);
      else el.removeAttribute('href');
    });
    if (STATION.name) document.title = document.title.replace('Đô Thị FM', STATION.name);
  }

  /* ---------------- Trang liên hệ: form phản ánh ----------------
     LƯU Ý: form này CHỈ LÀM PHẦN GIAO DIỆN. Dữ liệu chưa được gửi đi đâu cả
     (không có máy chủ, không lưu lại). Bấm "Gửi" chỉ hiện thông báo minh họa.
     TODO: nhóm cập nhật nếu muốn nhận phản ánh thật (ví dụ nối với Google Forms). */
  function setupContactForm() {
    var form = document.getElementById('report-form');
    if (!form) return;
    var status = document.getElementById('form-status');
    var whenInput = form.querySelector('#f-when');
    if (whenInput && !whenInput.value) {
      var n = vnNow();
      whenInput.value = pad(n.h) + ':' + pad(n.mi);
    }
    form.addEventListener('submit', function (e) {
      e.preventDefault(); // không gửi đi đâu
      var firstBad = null;
      form.querySelectorAll('[required]').forEach(function (f) {
        var bad = f.type === 'checkbox' ? !f.checked : !String(f.value).trim();
        f.setAttribute('aria-invalid', bad ? 'true' : 'false');
        if (bad && !firstBad) firstBad = f;
      });
      if (firstBad) {
        status.className = 'form__status is-err';
        status.textContent = 'Bạn vui lòng điền đủ các mục có dấu *.';
        firstBad.focus();
        return;
      }
      var name = String(form.querySelector('#f-name').value).trim();
      status.className = 'form__status is-ok';
      status.textContent = 'Cảm ơn ' + name + '! Phản ánh của bạn đã được ghi nhận (bản minh họa – chưa gửi tới tòa soạn).';
      form.reset();
      form.querySelectorAll('[aria-invalid]').forEach(function (f) { f.removeAttribute('aria-invalid'); });
    });
    form.addEventListener('input', function (e) {
      if (e.target.getAttribute('aria-invalid') === 'true' && String(e.target.value).trim()) e.target.setAttribute('aria-invalid', 'false');
    });
  }

  /* ---------------- Khởi động ---------------- */
  renderHeader();
  renderFooter();
  bindConfigText();
  renderTicker();
  renderToday();
  renderArchive();
  renderLatestNews();
  renderNewsPage();
  renderSchedulePage();
  renderAbout();
  setupContactForm();
  // Bản đồ cần Leaflet (tải qua CDN) – chạy sau khi trang tải xong
  if (document.getElementById('map')) {
    if (document.readyState === 'complete') renderMapPage();
    else window.addEventListener('load', renderMapPage);
  }
})();
